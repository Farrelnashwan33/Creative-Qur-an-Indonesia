<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchSurahDetail, fetchTafsir, fetchSurahs, fetchPrayerTimes, fetchPrayerTimesByCity, type SurahDetail, type TafsirDetail, type Ayah, type Surah } from '$lib/api';
  import { settings, lastRead, favorites, readingHistory, readingStats, defaultSettings, type AppSettings, type FavoriteAyah, isPremium, showPremiumPaymentModal, murotal } from '$lib/stores';
  import { 
    ArrowLeft, 
    Play, 
    Pause, 
    BookOpen, 
    Heart, 
    Share2, 
    Copy, 
    Book, 
    Settings as SettingsIcon,
    ChevronDown,
    ChevronUp,
    Volume2,
    ChevronsUpDown,
    Check,
    ListRestart,
    Download,
    List,
    ChevronsDown,
    Calendar,
    Compass,
    Languages,
    Crown
  } from '@lucide/svelte';

  const surahId = $derived(Number($page.params.id));
  
  let surah = $state<SurahDetail | null>(null);
  let tafsir = $state<TafsirDetail | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Track active verse details for audio playback
  let mounted = $state(false);
  let isCurrentSurahPlaying = $derived($murotal.isPlaying && $murotal.surah?.nomor === surahId);
  
  // Auto scroll to active verse
  $effect(() => {
    if (mounted && $murotal.activeAyahNum !== null && $murotal.surah?.nomor === surahId) {
      scrollToVerse($murotal.activeAyahNum);
    }
  });
  let expandedTafsirAyah = $state<number | null>(null);
  let expandedPerKataAyah = $state<number | null>(null);
  let perKataCache = $state<Record<number, any[]>>({});
  let loadingPerKata = $state(false);
  let loadingAllPerKata = $state(false);

  async function loadAllPerKata(id: number) {
    if (!$settings.perKataEnabled) return;
    loadingAllPerKata = true;
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${id}?language=id&words=true&word_fields=text_uthmani&per_page=300`);
      if (res.ok) {
        const data = await res.json();
        if (data.verses) {
          const cache: Record<number, any[]> = {};
          data.verses.forEach((v: any) => {
            cache[v.verse_number] = v.words.filter((w: any) => w.char_type_name === 'word');
          });
          perKataCache = cache;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch all word-by-word data:", e);
    } finally {
      loadingAllPerKata = false;
    }
  }

  $effect(() => {
    if ($settings.perKataEnabled && surah && Object.keys(perKataCache).length === 0) {
      loadAllPerKata(surah.nomor);
    }
  });

  // Premium Quick Jump states
  let showQuickJump = $state(false);
  let quickJumpSearch = $state('');

  async function togglePerKata(ayahNumber: number) {
    if (expandedPerKataAyah === ayahNumber) {
      expandedPerKataAyah = null;
      return;
    }
    
    expandedPerKataAyah = ayahNumber;
    
    if (perKataCache[ayahNumber]) return;
    
    loadingPerKata = true;
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${surahId}:${ayahNumber}?words=true&word_fields=text_uthmani&language=id`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.verse && data.verse.words) {
          perKataCache[ayahNumber] = data.verse.words.filter((w: any) => w.char_type_name === 'word');
        }
      }
    } catch (e) {
      console.error("Error fetching word-by-word:", e);
    } finally {
      loadingPerKata = false;
    }
  }

  // Copy success indicator
  let copiedAyah = $state<number | null>(null);
  let sharedAyah = $state<number | null>(null);

  // Toast notifications
  let toastMessage = $state<string | null>(null);
  let showToast = $state(false);

  function triggerToast(msg: string) {
    toastMessage = msg;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 2500);
  }

  // Madani Mushaf page numbers list for all 114 surahs
  const SURAH_START_PAGES = [
    1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 
    221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 
    322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 
    411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 
    477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 
    520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 
    551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 
    570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 
    586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 
    595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 
    600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 
    603, 604, 604, 604
  ];

  // Toolbar states
  let allSurahs = $state<Surah[]>([]);
  let showNavigationModal = $state(false);
  let showAgendaModal = $state(false);
  let selectedSurahNum = $state(0);
  let selectedAyahNumInput = $state(1);
  let selectedHalamanNum = $state(26);

  // Search/Input queries for Premium wheel picker
  let searchSuratQuery = $state('');
  let searchAyatQuery = $state('');
  let searchHalamanQuery = $state('');

  // Scroll sync flag to prevent loop conflicts
  let isProgrammaticScrolling = false;
  let scrollTimeouts: Record<string, any> = {};

  // Derived states
  let filteredSurahs = $derived(allSurahs.filter(s => s.namaLatin.toLowerCase().includes(searchSuratQuery.toLowerCase())));
  let totalAyahsOfSelectedSurah = $derived(allSurahs.find(s => s.nomor === selectedSurahNum)?.jumlahAyat || 7);

  // Mappings
  function getHalamanFromSurahAyah(surahNum: number, ayahNum: number): number {
    if (surahNum < 1 || surahNum > 114) return 1;
    const startPage = SURAH_START_PAGES[surahNum - 1];
    const endPage = surahNum === 114 ? 604 : SURAH_START_PAGES[surahNum];
    const totalPagesForSurah = endPage - startPage;
    const surahObj = allSurahs.find(s => s.nomor === surahNum);
    const totalAyahs = surahObj ? surahObj.jumlahAyat : 7;
    
    if (totalPagesForSurah === 0) return startPage;
    
    const interpolated = startPage + Math.floor(((ayahNum - 1) / totalAyahs) * totalPagesForSurah);
    return Math.min(604, Math.max(1, interpolated));
  }

  function getSurahAyahFromHalaman(page: number): { surahNum: number, ayahNum: number } {
    if (page < 1) page = 1;
    if (page > 604) page = 604;
    
    let surahNum = 1;
    for (let i = 0; i < 114; i++) {
      if (SURAH_START_PAGES[i] <= page) {
        surahNum = i + 1;
      } else {
        break;
      }
    }
    
    const startPage = SURAH_START_PAGES[surahNum - 1];
    const endPage = surahNum === 114 ? 604 : SURAH_START_PAGES[surahNum];
    const totalPagesForSurah = endPage - startPage;
    
    const surahObj = allSurahs.find(s => s.nomor === surahNum);
    const totalAyahs = surahObj ? surahObj.jumlahAyat : 7;
    
    let ayahNum = 1;
    if (totalPagesForSurah > 0) {
      const ratio = (page - startPage) / totalPagesForSurah;
      ayahNum = Math.min(totalAyahs, Math.max(1, Math.round(ratio * totalAyahs) + 1));
    }
    
    return { surahNum, ayahNum };
  }

  // Scroll centering
  function scrollToSelected(behavior: 'smooth' | 'auto' = 'smooth') {
    if (typeof document === 'undefined') return;
    isProgrammaticScrolling = true;
    
    const surahEl = document.getElementById(`scroll-surat-${selectedSurahNum}`);
    if (surahEl) surahEl.scrollIntoView({ block: 'center', behavior });
    
    const ayahEl = document.getElementById(`scroll-ayah-${selectedAyahNumInput}`);
    if (ayahEl) ayahEl.scrollIntoView({ block: 'center', behavior });
    
    const pageEl = document.getElementById(`scroll-halaman-${selectedHalamanNum}`);
    if (pageEl) pageEl.scrollIntoView({ block: 'center', behavior });

    setTimeout(() => {
      isProgrammaticScrolling = false;
    }, behavior === 'smooth' ? 300 : 50);
  }

  // Scroll interaction selection
  function handleScrollStop(container: HTMLElement, type: 'surat' | 'ayah' | 'halaman') {
    if (isProgrammaticScrolling) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    let closestElement: HTMLElement | null = null;
    let closestDistance = Infinity;
    
    const children = container.querySelectorAll('button');
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.top + childRect.height / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = child;
      }
    }
    
    if (closestElement) {
      const idAttr = closestElement.id;
      const parts = idAttr.split('-');
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) {
        if (type === 'surat') {
          if (selectedSurahNum !== num) {
            selectSurahFromPicker(num);
          }
        } else if (type === 'ayah') {
          if (selectedAyahNumInput !== num) {
            selectAyatFromPicker(num);
          }
        } else if (type === 'halaman') {
          if (selectedHalamanNum !== num) {
            selectHalamanFromPicker(num);
          }
        }
      }
    }
  }

  function onScrollContainer(e: Event, type: 'surat' | 'ayah' | 'halaman') {
    if (isProgrammaticScrolling) return;
    if (scrollTimeouts[type]) clearTimeout(scrollTimeouts[type]);
    scrollTimeouts[type] = setTimeout(() => {
      handleScrollStop(e.currentTarget as HTMLElement, type);
    }, 150);
  }

  // Selection handlers
  function selectSurahFromPicker(num: number) {
    selectedSurahNum = num;
    const total = allSurahs.find(s => s.nomor === num)?.jumlahAyat || 7;
    if (selectedAyahNumInput > total) {
      selectedAyahNumInput = 1;
    }
    selectedHalamanNum = getHalamanFromSurahAyah(num, selectedAyahNumInput);
    searchSuratQuery = ''; // reset search to show all surahs centered
    searchAyatQuery = String(selectedAyahNumInput);
    searchHalamanQuery = String(selectedHalamanNum);
    setTimeout(() => scrollToSelected('smooth'), 50);
  }

  function selectAyatFromPicker(num: number) {
    selectedAyahNumInput = num;
    selectedHalamanNum = getHalamanFromSurahAyah(selectedSurahNum, num);
    searchAyatQuery = String(num);
    searchHalamanQuery = String(selectedHalamanNum);
    setTimeout(() => scrollToSelected('smooth'), 50);
  }

  function selectHalamanFromPicker(num: number) {
    selectedHalamanNum = num;
    const res = getSurahAyahFromHalaman(num);
    selectedSurahNum = res.surahNum;
    selectedAyahNumInput = res.ayahNum;
    searchAyatQuery = String(res.ayahNum);
    searchHalamanQuery = String(num);
    setTimeout(() => scrollToSelected('smooth'), 50);
  }

  // Reactively initialize states when page/route changes
  $effect(() => {
    if (surahId) {
      selectedSurahNum = surahId;
      selectedAyahNumInput = 1;
      selectedHalamanNum = getHalamanFromSurahAyah(surahId, 1);
      searchAyatQuery = '1';
      searchHalamanQuery = String(selectedHalamanNum);
    }
  });

  // Keep search inputs updated when modal is opened, and scroll centered
  $effect(() => {
    if (showNavigationModal) {
      searchSuratQuery = '';
      searchAyatQuery = String(selectedAyahNumInput);
      searchHalamanQuery = String(selectedHalamanNum);
      setTimeout(() => scrollToSelected('auto'), 120);
    }
  });

  // Watch typing in inputs
  $effect(() => {
    const parsed = parseInt(searchAyatQuery);
    const total = allSurahs.find(s => s.nomor === selectedSurahNum)?.jumlahAyat || 7;
    if (!isNaN(parsed) && parsed >= 1 && parsed <= total) {
      if (selectedAyahNumInput !== parsed) {
        selectedAyahNumInput = parsed;
        selectedHalamanNum = getHalamanFromSurahAyah(selectedSurahNum, parsed);
        searchHalamanQuery = String(selectedHalamanNum);
        setTimeout(() => scrollToSelected('smooth'), 50);
      }
    }
  });

  $effect(() => {
    const parsed = parseInt(searchHalamanQuery);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 604) {
      if (selectedHalamanNum !== parsed) {
        selectedHalamanNum = parsed;
        const res = getSurahAyahFromHalaman(parsed);
        selectedSurahNum = res.surahNum;
        selectedAyahNumInput = res.ayahNum;
        searchAyatQuery = String(res.ayahNum);
        setTimeout(() => scrollToSelected('smooth'), 50);
      }
    }
  });

  // Auto scroll states
  let autoScrollActive = $state(false);
  let autoScrollIntervalId: any = null;

  // Agenda / Sholat states
  let prayerTimesData = $state<any>(null);

  async function loadAgendaPrayerTimes() {
    let lat = -6.2088;
    let lon = 106.8456;
    let cityName = 'Jakarta';
    
    try {
      const stored = localStorage.getItem('quran_location');
      if (stored) {
        const loc = JSON.parse(stored);
        lat = loc.latitude;
        lon = loc.longitude;
        cityName = loc.cityName;
      }
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
    
    try {
      const data = await fetchPrayerTimes(lat, lon);
      prayerTimesData = data.timings;
    } catch (e) {
      try {
        const data = await fetchPrayerTimesByCity(cityName);
        prayerTimesData = data.timings;
      } catch (err) {
        console.error(err);
      }
    }
  }

  function toggleAutoScroll() {
    autoScrollActive = !autoScrollActive;
    if (autoScrollActive) {
      autoScrollIntervalId = setInterval(() => {
        if (typeof window !== 'undefined') {
          window.scrollBy({ top: 1, behavior: 'auto' });
        }
      }, 40);
    } else {
      if (autoScrollIntervalId) {
        clearInterval(autoScrollIntervalId);
        autoScrollIntervalId = null;
      }
    }
  }

  function jumpToAyah(tafsirMode = false) {
    showNavigationModal = false;
    if (selectedSurahNum !== surahId) {
      goto(`/quran/${selectedSurahNum}`).then(() => {
        setTimeout(() => {
          const el = document.getElementById(`ayah-${selectedAyahNumInput}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (tafsirMode) {
            expandedTafsirAyah = selectedAyahNumInput;
          }
        }, 800);
      });
    } else {
      const el = document.getElementById(`ayah-${selectedAyahNumInput}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (tafsirMode) {
        expandedTafsirAyah = selectedAyahNumInput;
      }
    }
  }

  // Load surah details reactively whenever surahId changes (handles SvelteKit param navigation)
  $effect(() => {
    if (surahId) {
      loadSurahData(surahId);
    }
  });

  async function loadSurahData(id: number) {
    loading = true;
    error = null;

    expandedTafsirAyah = null;
    expandedPerKataAyah = null;

    try {
      const [detailData, tafsirData] = await Promise.all([
        fetchSurahDetail(id),
        fetchTafsir(id)
      ]);
      
      surah = detailData;
      tafsir = tafsirData;

      // Update Last Read
      lastRead.set({
        surahNumber: detailData.nomor,
        ayahNumber: 1,
        surahName: detailData.namaLatin,
        surahTranslation: detailData.arti,
        timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });

      // Update history list
      readingHistory.update(list => {
        const item = {
          id: `${detailData.nomor}-1-${Date.now()}`,
          surahNumber: detailData.nomor,
          ayahNumber: 1,
          surahName: detailData.namaLatin,
          timestamp: new Date().toLocaleDateString('id-ID')
        };
        const filtered = list.filter(x => x.surahNumber !== detailData.nomor);
        return [item, ...filtered].slice(0, 20);
      });

      // Update reading statistics count for today
      updateStats();

      if ($settings.perKataEnabled) {
        loadAllPerKata(id);
      }
    } catch (e) {
      error = "Gagal memuat detail surah atau tafsir.";
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    mounted = true;
    try {
      const surahsList = await fetchSurahs();
      allSurahs = surahsList;
    } catch (e) {
      console.warn("Gagal memuat daftar surah:", e);
    }

    // Load agenda prayer times
    loadAgendaPrayerTimes();
  });

  function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    readingStats.update(list => {
      const idx = list.findIndex(s => s.date === today);
      if (idx !== -1) {
        list[idx].count += 1; // Count reading session
        return [...list];
      } else {
        return [...list, { date: today, count: 1 }];
      }
    });
  }

  // Play a specific verse
  function playVerse(ayah: Ayah) {
    if (!surah) return;
    if ($murotal.activeAyahNum === ayah.nomorAyat && $murotal.isPlaying && $murotal.surah?.nomor === surahId) {
      murotal.pause();
    } else if ($murotal.activeAyahNum === ayah.nomorAyat && !$murotal.isPlaying && $murotal.surah?.nomor === surahId) {
      murotal.resume();
    } else {
      murotal.play(surah, ayah.nomorAyat, $settings.qori);
    }
  }

  function togglePlayAll() {
    if (!surah) return;
    if (isCurrentSurahPlaying) {
      murotal.pause();
    } else {
      const startAyahNum = ($murotal.surah?.nomor === surahId && $murotal.activeAyahNum)
        ? $murotal.activeAyahNum
        : 1;
      murotal.play(surah, startAyahNum, $settings.qori);
    }
  }

  function scrollToVerse(num: number) {
    setTimeout(() => {
      const el = document.getElementById(`ayah-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // Clipboard functionality
  function copyAyah(ayah: Ayah) {
    const textToCopy = `${ayah.teksArab}\n\n${ayah.teksLatin}\n\nTerjemahan: ${ayah.teksIndonesia} (QS. ${surah?.namaLatin}: ${ayah.nomorAyat})`;
    navigator.clipboard.writeText(textToCopy);
    copiedAyah = ayah.nomorAyat;
    triggerToast("Ayat berhasil disalin!");
    setTimeout(() => {
      copiedAyah = null;
    }, 2000);
  }

  // Favorites toggling
  function toggleFavorite(ayah: Ayah) {
    if (!surah) return;
    const exists = $favorites.some(f => f.surahNumber === surahId && f.ayahNumber === ayah.nomorAyat);
    
    if (exists) {
      favorites.update(list => list.filter(f => !(f.surahNumber === surahId && f.ayahNumber === ayah.nomorAyat)));
      triggerToast("Ayat dihapus dari Favorit.");
    } else {
      const item: FavoriteAyah = {
        surahNumber: surahId,
        ayahNumber: ayah.nomorAyat,
        surahName: surah.namaLatin,
        arabicText: ayah.teksArab,
        translation: ayah.teksIndonesia,
        timestamp: new Date().toLocaleDateString('id-ID')
      };
      favorites.update(list => [...list, item]);
      triggerToast("Ayat ditambahkan ke Favorit.");
    }
  }

  function isFavorite(ayahNum: number): boolean {
    return $favorites.some(f => f.surahNumber === surahId && f.ayahNumber === ayahNum);
  }

  // Share functionality
  function shareAyah(ayah: Ayah) {
    if (navigator.share) {
      navigator.share({
        title: `Creative Qur'an - QS. ${surah?.namaLatin} Ayat ${ayah.nomorAyat}`,
        text: `QS. ${surah?.namaLatin} Ayat ${ayah.nomorAyat}\n\n${ayah.teksArab}\n\n${ayah.teksIndonesia}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      copyAyah(ayah);
      triggerToast("Tautan / teks disalin untuk dibagikan!");
    }
  }

  function getTafsirText(ayahNum: number): string {
    if (!tafsir) return "Tafsir tidak tersedia.";
    const match = tafsir.tafsir.find(t => t.ayat === ayahNum);
    return match ? match.teks : "Tafsir untuk ayat ini tidak ditemukan.";
  }

  // Highlights Tajwid dynamically
  function processTajwid(text: string, enabled: boolean): string {
    if (!enabled) return text;
    return text
      .replace(/ّ/g, '<span class="tajwid-ghunnah">ّ</span>')
      .replace(/ْ/g, '<span class="tajwid-qalqalah">ْ</span>')
      .replace(/ٰ/g, '<span class="tajwid-mad">ٰ</span>')
      .replace(/ً/g, '<span class="tajwid-ikhfa">ً</span>');
  }
</script>

<div class="space-y-6 relative pb-20">

  <!-- TOAST ALERTS -->
  {#if showToast}
    <div class="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3.5 bg-emerald-600 border border-emerald-500/30 text-white text-xs font-bold rounded-2xl shadow-xl z-[200] animate-fade-in flex items-center gap-2">
      <Check class="w-4 h-4 text-emerald-100" />
      <span>{toastMessage}</span>
    </div>
  {/if}

  <!-- TOP BAR BACK NAVIGATION -->
  <div class="sticky top-[72px] md:top-6 z-30 py-3 px-1 -mx-1 bg-[#0f172a]/95 light-mode:bg-[#f8fafc]/95 backdrop-blur-md transition-all duration-300 border-b border-white/5 flex items-center justify-between">
    <a href="/quran" class="inline-flex items-center gap-2.5 text-zinc-400 hover:text-zinc-200 group">
      <div class="w-9 h-9 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:border-emerald-500/20">
        <ArrowLeft class="w-4.5 h-4.5" />
      </div>
      <span class="text-xs font-bold hidden sm:inline">Kembali ke Daftar</span>
    </a>

    <!-- Premium Quick Surah Jump Selector -->
    <div class="relative">
      {#if $isPremium}
        <button 
          onclick={() => showQuickJump = !showQuickJump}
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 font-bold text-xs hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Crown class="w-3.5 h-3.5 fill-amber-400" />
          <span>Lompat Surah</span>
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
        
        {#if showQuickJump}
          <div class="absolute top-11 left-1/2 -translate-x-1/2 w-60 bg-zinc-950/95 border border-amber-500/25 rounded-2xl shadow-2xl p-2.5 z-50 animate-slide-up">
            <div class="bg-zinc-950 pb-2 border-b border-white/5 mb-1.5">
              <input 
                type="text" 
                bind:value={quickJumpSearch}
                placeholder="Cari surah..." 
                class="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg py-1.5 px-2.5 outline-none focus:border-amber-500/50 font-semibold"
              />
            </div>
            <div class="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
              {#each allSurahs.filter(s => s.namaLatin.toLowerCase().includes(quickJumpSearch.toLowerCase())) as s (s.nomor)}
                <a 
                  href={`/quran/${s.nomor}`}
                  onclick={() => showQuickJump = false}
                  class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-zinc-300 hover:bg-amber-500/10 hover:text-amber-400 transition-all
                    {s.nomor === surahId ? 'bg-amber-500/10 text-amber-400 font-bold' : ''}"
                >
                  <span>{s.nomor}. {s.namaLatin}</span>
                  <span class="text-[9px] text-zinc-500 font-bold">{s.jumlahAyat} Ayat</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <!-- Show locked option for non-premium to upsell -->
        <button 
          onclick={() => showPremiumPaymentModal.set(true)}
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/5 bg-white/5 text-zinc-400 font-bold text-xs hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <Crown class="w-3.5 h-3.5 text-zinc-500" />
          <span>Lompat Surah</span>
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
      {/if}
    </div>
    
    <a href="/settings" class="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200">
      <SettingsIcon class="w-4.5 h-4.5" />
      <span class="text-xs font-semibold">Tampilan</span>
    </a>
  </div>

  {#if loading}
    <!-- Reader Skeleton -->
    <div class="space-y-6">
      <div class="glass border border-white/5 rounded-3xl p-6 lg:p-8 animate-pulse space-y-4">
        <div class="h-6 bg-white/5 rounded w-1/3 mx-auto"></div>
        <div class="h-4 bg-white/5 rounded w-1/4 mx-auto"></div>
        <div class="h-10 bg-white/5 rounded w-2/3 mx-auto"></div>
      </div>

      <div class="space-y-4">
        {#each Array(3) as _, i (i)}
          <div class="glass border border-white/5 rounded-2xl p-5 space-y-4 animate-pulse">
            <div class="flex justify-between items-center">
              <div class="w-8 h-8 rounded-full bg-white/5"></div>
              <div class="w-20 h-8 bg-white/5 rounded-lg"></div>
            </div>
            <div class="h-12 bg-white/5 rounded w-3/4 ml-auto"></div>
            <div class="h-4 bg-white/5 rounded w-1/2"></div>
          </div>
        {/each}
      </div>
    </div>
  {:else if error || !surah}
    <div class="glass border border-white/5 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4">
      <p class="text-sm text-zinc-400 font-medium">{error || 'Gagal memuat surah.'}</p>
      <a href="/quran" class="inline-block px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg">
        Kembali
      </a>
    </div>
  {:else}
    <!-- SURAH HEADER CARD -->
    <div class="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-tr from-emerald-950/70 to-emerald-900/60 border border-emerald-500/20 shadow-xl text-center space-y-4">
      <div class="absolute inset-0 opacity-5 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      
      <div class="relative z-10">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
          {surah.tempatTurun} • {surah.jumlahAyat} Ayat
        </span>
        <h2 class="text-3xl font-extrabold text-white tracking-wide mt-3">{surah.namaLatin}</h2>
        <p class="text-sm text-zinc-300 font-medium">{surah.arti}</p>
        
        <!-- Bismillah Header -->
        {#if surahId !== 1 && surahId !== 9}
          <div class="pt-6 pb-2">
            <span class="font-arabic-utsmani text-2xl text-white font-medium block">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span class="text-[10px] text-zinc-500 font-semibold block mt-1">Dengan nama Allah Yang Maha Pengasih, Maha Penyayang</span>
          </div>
        {/if}
      </div>

      <!-- Header actions -->
      <div class="relative z-10 pt-4 flex items-center justify-center gap-3">
        <button 
          onclick={togglePlayAll}
          class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-emerald-950/30"
        >
          {#if isCurrentSurahPlaying}
            <Pause class="w-4 h-4 text-white" />
            <span>Pause Murottal</span>
          {:else}
            <Play class="w-4 h-4 text-white" />
            <span>Putar Audio Surah</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- AYAH LIST -->
    <div class="space-y-4">
      {#each surah.ayat as ayah (ayah.nomorAyat)}
        {@const isActive = $murotal.activeAyahNum === ayah.nomorAyat && $murotal.surah?.nomor === surahId}
        <div 
          id={`ayah-${ayah.nomorAyat}`}
          class="glass border rounded-3xl p-5 lg:p-6 transition-all duration-300 flex flex-col gap-6 relative
            {isActive 
              ? 'border-emerald-500/30 bg-emerald-950/10 shadow-lg shadow-emerald-500/5' 
              : 'border-white/5 hover:border-white/10 bg-white/[0.02]'}"
        >
          <!-- Verse Control Bar -->
          <div class="flex items-center justify-between pb-3 border-b border-white/5">
            <!-- Verse number marker -->
            <div class="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-xs text-emerald-400">
              {ayah.nomorAyat}
            </div>

            <!-- Verse Action Buttons -->
            <div class="flex items-center gap-1">
              <!-- Play Murottal per Ayah -->
              <button 
                onclick={() => playVerse(ayah)}
                class="p-2 rounded-xl text-zinc-500 hover:text-emerald-400 hover:bg-white/5 active:scale-90"
                title="Putar Murottal"
              >
                {#if isActive && $murotal.isPlaying}
                  <Pause class="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                {:else}
                  <Play class="w-4.5 h-4.5" />
                {/if}
              </button>

              <!-- Bookmark/Fav -->
              <button 
                onclick={() => toggleFavorite(ayah)}
                class="p-2 rounded-xl active:scale-90 {isFavorite(ayah.nomorAyat) ? 'text-rose-500 hover:text-rose-400' : 'text-zinc-500 hover:text-rose-500'}"
                title="Simpan Favorit"
              >
                <Heart class="w-4.5 h-4.5" fill={isFavorite(ayah.nomorAyat) ? 'currentColor' : 'none'} />
              </button>

              <!-- Share -->
              <button 
                onclick={() => shareAyah(ayah)}
                class="p-2 rounded-xl text-zinc-500 hover:text-blue-400 hover:bg-white/5 active:scale-90"
                title="Bagikan"
              >
                <Share2 class="w-4.5 h-4.5" />
              </button>

              <!-- Copy -->
              <button 
                onclick={() => copyAyah(ayah)}
                class="p-2 rounded-xl text-zinc-500 hover:text-emerald-400 hover:bg-white/5 active:scale-90"
                title="Salin Ayat"
              >
                <Copy class="w-4.5 h-4.5" />
              </button>

              <!-- Tafsir Toggle -->
              <button 
                onclick={() => {
                  expandedPerKataAyah = null; // Close per kata if open
                  expandedTafsirAyah = expandedTafsirAyah === ayah.nomorAyat ? null : ayah.nomorAyat;
                }}
                class="p-2 rounded-xl text-zinc-500 hover:text-amber-500 hover:bg-white/5 active:scale-90 {expandedTafsirAyah === ayah.nomorAyat ? 'text-amber-400 bg-white/5' : ''}"
                title="Buka Tafsir"
              >
                <Book class="w-4.5 h-4.5" />
              </button>

              <!-- Tafsir Per Kata (Word-by-word) Toggle -->
              <button 
                onclick={() => {
                  expandedTafsirAyah = null; // Close main tafsir if open
                  togglePerKata(ayah.nomorAyat);
                }}
                class="p-2 rounded-xl text-zinc-500 hover:text-emerald-400 hover:bg-white/5 active:scale-90 {expandedPerKataAyah === ayah.nomorAyat ? 'text-emerald-400 bg-white/5' : ''}"
                title="Tafsir Per Kata"
              >
                <Languages class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- ARABIC TEXT -->
          <div class="text-center py-2 leading-loose">
            {#if ($settings.perKataEnabled || expandedPerKataAyah === ayah.nomorAyat)}
              {#if loadingPerKata && !perKataCache[ayah.nomorAyat]}
                <div class="flex flex-col items-center justify-center py-6 gap-2">
                  <div class="w-8 h-8 rounded-full border-3 border-t-emerald-400 border-emerald-500/20 animate-spin"></div>
                  <span class="text-xs text-zinc-500 font-semibold animate-pulse">Memuat arti kata...</span>
                </div>
              {:else if perKataCache[ayah.nomorAyat]}
                <!-- Flowing word-by-word text block directly integrated -->
                <div class="flex flex-wrap gap-x-6 gap-y-8 justify-center py-3" dir="rtl">
                  {#each perKataCache[ayah.nomorAyat] as word, i (word.position || word.text_uthmani + '-' + i)}
                    <div class="flex flex-col items-center justify-start text-center space-y-2 min-w-[70px] max-w-[150px]">
                      <!-- Arabic Word -->
                      <span 
                        style="font-size: {$settings.arabicFontSize}px; font-family: {$settings.arabicScript === 'utsmani' ? 'var(--font-arabic-utsmani)' : 'var(--font-arabic-indopak)'};" 
                        class="text-white select-none leading-none mb-1"
                      >
                        {word.text_uthmani || word.text}
                      </span>
                      <!-- Transliteration -->
                      {#if word.transliteration && word.transliteration.text}
                        <span 
                          style="font-size: {($settings.perKataFontSize || 16) * 0.75}px" 
                          class="text-emerald-400/90 font-medium italic select-none leading-tight" 
                          dir="ltr"
                        >
                          {word.transliteration.text}
                        </span>
                      {/if}
                      <!-- Indonesian Translation -->
                      <span 
                        style="font-size: {($settings.perKataFontSize || 16) * 0.85}px" 
                        class="text-zinc-300 font-bold leading-tight select-none" 
                        dir="ltr"
                      >
                        {word.translation ? word.translation.text : ''}
                      </span>
                    </div>
                  {/each}
                  {#if $settings.arabicNumberVisible}
                    <div class="flex items-center align-middle self-start mt-2 mr-2">
                      <span class="inline-flex items-center justify-center font-sans text-xs border border-emerald-500/30 text-emerald-400 w-6.5 h-6.5 rounded-full select-none" dir="ltr">
                        {ayah.nomorAyat}
                      </span>
                    </div>
                  {/if}
                </div>
              {:else}
                <p 
                  class="text-white font-arabic-utsmani text-center" 
                  style="font-size: {$settings.arabicFontSize}px; font-family: {$settings.arabicScript === 'utsmani' ? 'var(--font-arabic-utsmani)' : 'var(--font-arabic-indopak)'}; line-height: 2.2;"
                  dir="rtl"
                >
                  {@html processTajwid(ayah.teksArab, $settings.tajwidColored)}
                  {#if $settings.arabicNumberVisible}
                    <span class="inline-flex items-center justify-center font-sans text-xs border border-emerald-500/30 text-emerald-400 w-6.5 h-6.5 rounded-full mr-2 select-none" dir="ltr">
                      {ayah.nomorAyat}
                    </span>
                  {/if}
                </p>
              {/if}
            {:else}
              <p 
                class="text-white font-arabic-utsmani text-center" 
                style="font-size: {$settings.arabicFontSize}px; font-family: {$settings.arabicScript === 'utsmani' ? 'var(--font-arabic-utsmani)' : 'var(--font-arabic-indopak)'}; line-height: 2.2;"
                dir="rtl"
              >
                {@html processTajwid(ayah.teksArab, $settings.tajwidColored)}
                {#if $settings.arabicNumberVisible}
                  <span class="inline-flex items-center justify-center font-sans text-xs border border-emerald-500/30 text-emerald-400 w-6.5 h-6.5 rounded-full mr-2 select-none" dir="ltr">
                    {ayah.nomorAyat}
                  </span>
                {/if}
              </p>
            {/if}
          </div>

          <!-- INDONESIAN TRANSLATION -->
          {#if $settings.translationEnabled}
            <p 
              class="text-zinc-300 leading-relaxed font-normal"
              style="font-size: {$settings.translationFontSize}px"
            >
              {ayah.teksIndonesia}
            </p>
          {/if}

          <!-- TRANSLITERATION (LATIN) -->
          {#if $settings.latinEnabled}
            <p 
              class="text-emerald-400/90 font-medium italic leading-relaxed"
              style="font-size: {$settings.latinFontSize}px"
            >
              {ayah.teksLatin}
            </p>
          {/if}

          <!-- EXPANDABLE TAFSIR SECTION -->
          {#if expandedTafsirAyah === ayah.nomorAyat}
            <div class="mt-2 p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-3 animate-slide-up">
              <div class="flex items-center justify-between pb-2 border-b border-white/5">
                <span class="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Tafsir Ibnu Katsir</span>
                <button 
                  onclick={() => expandedTafsirAyah = null} 
                  class="text-[10px] font-bold text-zinc-500 hover:text-white"
                >
                  Tutup
                </button>
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed font-medium">
                {getTafsirText(ayah.nomorAyat)}
              </p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}


  <!-- BOTTOM READER TOOLBAR -->
  <div class="fixed bottom-0 left-0 right-0 glass border-t border-white/5 py-3 px-4 flex justify-around items-center z-40 backdrop-blur-lg md:max-w-md md:mx-auto md:bottom-4 md:rounded-2xl md:border">
    <!-- Isi (Index) -->
    <button 
      onclick={() => showNavigationModal = true}
      class="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-400 active:scale-95 transition-all"
    >
      <List class="w-5 h-5" />
      <span class="text-[9px] font-bold">Isi</span>
    </button>

    <!-- Scroll Otomatis -->
    <button 
      onclick={toggleAutoScroll}
      class="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all
        {autoScrollActive ? 'text-emerald-400 font-extrabold' : 'text-zinc-400 hover:text-emerald-400'}"
    >
      <ChevronsDown class="w-5 h-5 {autoScrollActive ? 'animate-bounce' : ''}" />
      <span class="text-[9px] font-bold">Scroll Otomatis</span>
    </button>

    <!-- Putar Audio (Murottal toggle) -->
    <button 
      onclick={togglePlayAll}
      class="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all
        {isCurrentSurahPlaying ? 'text-emerald-400 font-extrabold' : 'text-zinc-400 hover:text-emerald-400'}"
    >
      {#if isCurrentSurahPlaying}
        <Pause class="w-5 h-5 animate-pulse" />
      {:else}
        <Play class="w-5 h-5" />
      {/if}
      <span class="text-[9px] font-bold">Putar Audio</span>
    </button>

    <!-- Agenda (Jadwal Sholat popup) -->
    <button 
      onclick={() => showAgendaModal = true}
      class="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-400 active:scale-95 transition-all"
    >
      <Calendar class="w-5 h-5" />
      <span class="text-[9px] font-bold">Agenda</span>
    </button>
  </div>

  <!-- NAVIGATION INDEX MODAL (ISI) -->
  {#if showNavigationModal}
    <div class="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center p-4 z-[100] animate-fade-in">
      {#if $isPremium}
        <!-- PREMIUM SEPIA WHEEL PICKER -->
        <div class="bg-[#FDF6E2] text-[#4E3629] p-6 rounded-t-3xl md:rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative border border-[#E6DFCD]">
          <!-- Cancel button top-right -->
          <button 
            onclick={() => showNavigationModal = false} 
            class="absolute top-4 right-4 text-xs font-bold text-[#4E3629]/70 hover:text-[#4E3629] cursor-pointer"
          >
            Batal
          </button>

          <h3 class="font-extrabold text-sm text-[#4E3629] tracking-wide border-b border-[#E6DFCD] pb-2 text-center">Navigasi Al-Qur'an</h3>

          <!-- Input Row matching screenshot -->
          <div class="grid grid-cols-3 gap-3">
            <!-- Surat input -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-[#4E3629]/70 font-bold uppercase tracking-wider">Surat</span>
              <input 
                type="text" 
                placeholder="Aa.." 
                bind:value={searchSuratQuery}
                class="w-full py-2 px-2.5 rounded-xl border border-[#E6DFCD] bg-[#FFFDFC] text-xs font-semibold text-[#4E3629] outline-none focus:border-[#6B4F3E] text-left"
              />
            </div>

            <!-- Ayat input -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-[#4E3629]/70 font-bold uppercase tracking-wider">Ayat</span>
              <input 
                type="text" 
                placeholder="1, 2.." 
                bind:value={searchAyatQuery}
                class="w-full py-2 px-2 rounded-xl border border-[#E6DFCD] bg-[#FFFDFC] text-xs font-semibold text-[#4E3629] outline-none focus:border-[#6B4F3E] text-center"
              />
            </div>

            <!-- Halaman input -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-[#4E3629]/70 font-bold uppercase tracking-wider">Halaman</span>
              <input 
                type="text" 
                placeholder="1, 2.." 
                bind:value={searchHalamanQuery}
                class="w-full py-2 px-2 rounded-xl border border-[#E6DFCD] bg-[#FFFDFC] text-xs font-semibold text-[#4E3629] outline-none focus:border-[#6B4F3E] text-center"
              />
            </div>
          </div>

          <!-- Three-column scroll lists container -->
          <div class="grid grid-cols-[2.2fr_1fr_1fr] gap-1 h-52 relative overflow-hidden bg-[#FFFDFC]/30 rounded-2xl border border-[#E6DFCD]/60">
            <!-- Top and Bottom Fade Gradients for Wheel effect -->
            <div class="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#FDF6E2] via-[#FDF6E2]/70 to-transparent pointer-events-none z-10"></div>
            <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FDF6E2] via-[#FDF6E2]/70 to-transparent pointer-events-none z-10"></div>

            <!-- Column 1: Surat List -->
            <div 
              class="no-scrollbar overflow-y-auto h-full space-y-1 py-20 px-1" 
              id="scroll-surat-container"
              onscroll={(e) => onScrollContainer(e, 'surat')}
            >
              {#each filteredSurahs as s (s.nomor)}
                <button 
                  id="scroll-surat-{s.nomor}"
                  onclick={() => selectSurahFromPicker(s.nomor)}
                  class="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 block scroll-snap-align-center cursor-pointer
                    {selectedSurahNum === s.nomor 
                      ? 'bg-[#E2E6BD] text-[#2C351E] font-bold shadow-xs' 
                      : 'text-[#4E3629]/50 hover:text-[#4E3629] hover:bg-[#FFFDFC]/40'}"
                >
                  {s.nomor}. {s.namaLatin}
                </button>
              {/each}
              {#if filteredSurahs.length === 0}
                <div class="text-[10px] text-[#4E3629]/40 text-center py-4">Tidak ada surah</div>
              {/if}
            </div>

            <!-- Column 2: Ayat List -->
            <div 
              class="no-scrollbar overflow-y-auto h-full space-y-1 py-20 px-1 text-center border-l border-[#E6DFCD]/30" 
              id="scroll-ayah-container"
              onscroll={(e) => onScrollContainer(e, 'ayah')}
            >
              {#each Array.from({ length: totalAyahsOfSelectedSurah }, (_, i) => i + 1) as ayahNum}
                <button 
                  id="scroll-ayah-{ayahNum}"
                  onclick={() => selectAyatFromPicker(ayahNum)}
                  class="w-full text-center py-2 rounded-lg text-xs font-semibold transition-all duration-150 block scroll-snap-align-center cursor-pointer
                    {selectedAyahNumInput === ayahNum 
                      ? 'bg-[#E2E6BD] text-[#2C351E] font-bold shadow-xs' 
                      : 'text-[#4E3629]/50 hover:text-[#4E3629] hover:bg-[#FFFDFC]/40'}"
                >
                  {ayahNum}
                </button>
              {/each}
            </div>

            <!-- Column 3: Halaman List -->
            <div 
              class="no-scrollbar overflow-y-auto h-full space-y-1 py-20 px-1 text-center border-l border-[#E6DFCD]/30" 
              id="scroll-halaman-container"
              onscroll={(e) => onScrollContainer(e, 'halaman')}
            >
              {#each Array.from({ length: 604 }, (_, i) => i + 1) as pNum}
                <button 
                  id="scroll-halaman-{pNum}"
                  onclick={() => selectHalamanFromPicker(pNum)}
                  class="w-full text-center py-2 rounded-lg text-xs font-semibold transition-all duration-150 block scroll-snap-align-center cursor-pointer
                    {selectedHalamanNum === pNum 
                      ? 'bg-[#E2E6BD] text-[#2C351E] font-bold shadow-xs' 
                      : 'text-[#4E3629]/50 hover:text-[#4E3629] hover:bg-[#FFFDFC]/40'}"
                >
                  {pNum}
                </button>
              {/each}
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-[#E6DFCD] my-1"></div>

          <!-- Action Buttons matching screenshot exactly -->
          <div class="grid grid-cols-2 gap-4 pt-1">
            <button 
              onclick={() => jumpToAyah(true)}
              class="py-3.5 rounded-2xl bg-[#F5EBD4] border border-[#E6DFCD] text-xs font-bold text-[#4E3629] hover:bg-[#EEDCBE] active:scale-95 transition-all text-center cursor-pointer"
            >
              Ke Tafsir
            </button>
            
            <button 
              onclick={() => jumpToAyah(false)}
              class="py-3.5 rounded-2xl bg-[#543D31] hover:bg-[#432F25] text-white text-xs font-bold active:scale-95 transition-all text-center cursor-pointer"
            >
              Ke Surat
            </button>
          </div>
        </div>
      {:else}
        <!-- STANDARD NON-PREMIUM DIALOG WITH PREMIUM PROMO -->
        <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-t-3xl md:rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative">
          <!-- Close button top-right -->
          <button 
            onclick={() => showNavigationModal = false} 
            class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
          >
            Batal
          </button>

          <h3 class="font-extrabold text-sm text-white tracking-wide border-b border-white/5 pb-2 text-center">Navigasi Al-Qur'an</h3>
          
          <!-- Input Row -->
          <div class="grid grid-cols-3 gap-3">
            <!-- Surat column -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Surat</span>
              <select 
                bind:value={selectedSurahNum}
                class="w-full py-2.5 px-2 rounded-xl glass border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 bg-emerald-950"
              >
                {#each allSurahs as s (s.nomor)}
                  <option value={s.nomor} class="bg-zinc-950 text-white">{s.nomor}. {s.namaLatin}</option>
                {/each}
              </select>
            </div>

            <!-- Ayat column -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ayat</span>
              <input 
                type="number" 
                bind:value={selectedAyahNumInput}
                min="1" 
                max={allSurahs.find(s => s.nomor === selectedSurahNum)?.jumlahAyat || 286}
                class="w-full py-2 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white text-center focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Halaman column -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Halaman</span>
              <input 
                type="number" 
                bind:value={selectedHalamanNum}
                min="1" 
                max="604"
                class="w-full py-2 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- PREMIUM CALL TO ACTION -->
          <button 
            onclick={() => { showNavigationModal = false; showPremiumPaymentModal.set(true); }}
            class="w-full py-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-left text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <Crown class="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Buka Pemilih Premium Wheel 3-Kolom</span>
            </div>
            <span class="text-[10px] font-extrabold text-amber-300">UPGRADE</span>
          </button>

          <!-- Action Buttons matching screenshot exactly -->
          <div class="grid grid-cols-2 gap-4 pt-2">
            <button 
              onclick={() => jumpToAyah(true)}
              class="py-3.5 rounded-2xl glass border border-white/10 text-xs font-bold text-zinc-300 hover:text-white active:scale-95 transition-all text-center cursor-pointer"
            >
              Ke Tafsir
            </button>
            
            <button 
              onclick={() => jumpToAyah(false)}
              class="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all text-center cursor-pointer"
            >
              Ke Surat
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- AGENDA PRAYER TIMES MODAL -->
  {#if showAgendaModal}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
      <!-- Changed from glass-emerald to bg-zinc-950 solid border to avoid double blur and visual artifacts -->
      <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative">
        <button 
          onclick={() => showAgendaModal = false} 
          class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white"
        >
          Tutup
        </button>

        <h3 class="font-extrabold text-sm text-white tracking-wide border-b border-white/5 pb-2 text-center flex items-center justify-center gap-2">
          <Compass class="w-4 h-4 text-emerald-400" />
          Agenda Jadwal Sholat
        </h3>
        
        {#if prayerTimesData}
          <div class="divide-y divide-white/5 text-xs font-semibold">
            {#each [
              { label: 'Subuh', val: prayerTimesData.Fajr },
              { label: 'Dzuhur', val: prayerTimesData.Dhuhr },
              { label: 'Ashar', val: prayerTimesData.Asr },
              { label: 'Maghrib', val: prayerTimesData.Maghrib },
              { label: 'Isya', val: prayerTimesData.Isha }
            ] as shol (shol.label)}
              <div class="flex justify-between items-center py-2.5">
                <span class="text-zinc-400">{shol.label}</span>
                <span class="text-white font-bold">{shol.val} WIB</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-zinc-500 text-center py-4">Memuat jadwal sholat...</p>
        {/if}
      </div>
    </div>
  {/if}
  <!-- FLOATING JUMP TO AYAH FAB -->
  <div class="fixed bottom-6 right-4 z-40">
    <button 
      onclick={() => showNavigationModal = true}
      class="w-14 h-14 rounded-full bg-linear-to-tr from-emerald-600 to-emerald-400 shadow-xl shadow-emerald-500/30 flex items-center justify-center border border-emerald-400/50 cursor-pointer active:scale-90 transition-transform duration-200 relative group"
      aria-label="Lompat Ayat"
    >
      <span class="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></span>
      <Compass class="w-6 h-6 text-white relative z-10" />
    </button>
  </div>

</div>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
    scroll-snap-type: y mandatory;
  }
  .scroll-snap-align-center {
    scroll-snap-align: center;
  }
</style>
