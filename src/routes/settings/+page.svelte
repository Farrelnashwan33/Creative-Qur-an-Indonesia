<script lang="ts">
  import { onMount } from 'svelte';
  import { settings, defaultSettings, type AppSettings, adzanVoice, lastRead, isPremium, showPremiumPaymentModal, isAdmin, userEmail } from '$lib/stores';
  import { 
    Settings, 
    Book, 
    Volume2, 
    Sun, 
    Moon, 
    Monitor, 
    RotateCcw, 
    Check, 
    Share2, 
    Shield, 
    Info, 
    Star,
    Bell,
    Crown,
    Smartphone,
    X,
    ChevronLeft,
    ChevronRight,
    Search,
    HelpCircle,
    Globe
  } from '@lucide/svelte';

  let mounted = $state(false);
  let wakeLockActive = $state(false);
  let wakeLock: any = null;

  const ALLOWED_ADMIN_EMAILS = [
    'yadiiitea73@gmail.com',
    'akhmadfarrelnashwan42@gmail.com',
    'r9n9harmadi@gmail.com'
  ];

  let searchQuery = $state('');

  onMount(() => {
    mounted = true;
    const handleFullscreenChange = () => {
      updateSetting('fullscreen', !!document.fullscreenElement);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }
    };
  });

  // Sync mode admin automatically when $userEmail changes
  $effect(() => {
    const cleanEmail = ($userEmail || '').trim().toLowerCase();
    if (!cleanEmail || !ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
      if ($isAdmin) {
        $isAdmin = false;
      }
    }
  });

  function handleActivatePremium() {
    if ($isAdmin) {
      $isPremium = true;
      triggerToast("Selamat! Royal Gold Premium Berhasil Diaktifkan.");
    } else {
      $showPremiumPaymentModal = true;
    }
  }

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    $settings[key] = value;
    
    // Side effect for theme changes
    if (key === 'theme') {
      applyTheme(value as 'light' | 'dark');
    }
  }

  function applyTheme(theme: 'light' | 'dark') {
    if (typeof window === 'undefined') return;
    let isDark = theme === 'dark';
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
    }
  }

  function handleSystemTheme() {
    if (typeof window === 'undefined') return;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const targetTheme = systemDark ? 'dark' : 'light';
    updateSetting('theme', targetTheme);
    triggerToast("Mengikuti tema sistem perangkat.");
  }

  function resetSettings() {
    $settings = { ...defaultSettings };
    applyTheme($settings.theme);
    triggerToast("Pengaturan telah di-reset ke bawaan.");
  }

  // Fullscreen support
  function toggleFullscreen() {
    if (typeof window === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
      updateSetting('fullscreen', true);
    } else {
      document.exitFullscreen();
      updateSetting('fullscreen', false);
    }
  }

  // Wake lock support
  async function toggleWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      triggerToast("Wake Lock API tidak didukung di browser ini.");
      return;
    }

    try {
      if (!$settings.keepScreenOn) {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        updateSetting('keepScreenOn', true);
        triggerToast("Layar akan tetap aktif saat membaca!");
        wakeLock.addEventListener('release', () => {
          updateSetting('keepScreenOn', false);
        });
      } else {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
        updateSetting('keepScreenOn', false);
        triggerToast("Layar kembali normal.");
      }
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  // Qori details
  const qoris = [
    { id: 'afasy', name: 'Al-Afasy' },
    { id: 'sudais', name: 'As-Sudais' },
    { id: 'aldosari', name: 'Al-Dosari' },
    { id: 'juhany', name: 'Al-Juhany' },
    { id: 'qasim', name: 'Al-Qasim' },
    { id: 'dossari', name: 'Ibrahim' }
  ];

  // Muazins
  const muazins = [
    { id: 'makkah', name: 'Makkah' },
    { id: 'madinah', name: 'Madinah' },
    { id: 'aqsa', name: 'Aqsa' },
    { id: 'yusuf', name: 'Yusuf' }
  ];

  // Sharing & Rating states
  let showRatingModal = $state(false);
  let showPrivacyModal = $state(false);
  let showStoreNotification = $state(false);
  let showWebsiteModal = $state(false);
  let ratingStars = $state(5);
  let ratingComment = $state('');

  let toastMessage = $state<string | null>(null);
  let showToast = $state(false);

  function triggerToast(msg: string) {
    toastMessage = msg;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 2500);
  }

  function shareApp() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Creative Qur\'an Indonesia',
        text: 'Aplikasi Al-Qur\'an digital modern, elegan dengan terjemahan dan jadwal sholat terintegrasi.',
        url: window.location.origin
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.origin);
      triggerToast("Tautan disalin ke clipboard!");
    }
  }

  function submitRating() {
    showRatingModal = false;
    triggerToast(`Terima kasih atas penilaian Bintang ${ratingStars} Anda!`);
    ratingComment = '';
  }

  // Row filtering matches
  function match(label: string, keywords: string[]): boolean {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return label.toLowerCase().includes(q) || keywords.some(k => k.toLowerCase().includes(q));
  }
</script>

{#if mounted}
<div class="ios-settings-container mx-auto">
  
  <!-- PAGE HEADER -->
  <header class="ios-header border-b border-white/5 pb-3 pt-2">
    <div class="flex items-center justify-between px-2 py-1.5">
      <div class="flex items-center gap-1.5">
        <button
          onclick={() => history.back()}
          class="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all"
          title="Kembali"
          aria-label="Kembali"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <Settings class="w-4 h-4 text-emerald-400" />
        <span class="text-sm font-bold text-zinc-200">Pengaturan</span>
      </div>

      <button 
        onclick={resetSettings}
        class="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all"
        title="Reset ke Bawaan"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
    </div>

    <!-- Search Settings input -->
    <div class="px-2 mt-1">
      <div class="relative flex items-center">
        <Search class="absolute left-3 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Cari pengaturan..." 
          class="w-full pl-9 pr-8 py-2 bg-stone-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-semibold"
        />
        {#if searchQuery}
          <button 
            onclick={() => searchQuery = ''}
            class="absolute right-2.5 p-1 rounded-full text-zinc-500 hover:text-white"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- SETTINGS SECTIONS -->
  <div class="mt-4 px-2 space-y-4 pb-24">

    <!-- SECTION 7: PREMIUM CARD (Top Priority but compact) -->
    {#if match("Creative Qur'an Premium", ["premium", "royal gold", "langganan", "tajwid", "makhraj", "ai"])}
      <div class="premium-setting-card {$isPremium ? 'premium-border' : ''}">
        <div class="flex items-center justify-between border-b border-white/5 pb-2">
          <div class="flex items-center gap-2">
            <Crown class="w-4.5 h-4.5 {$isPremium ? 'text-amber-400' : 'text-emerald-400'}" />
            <h3 class="font-bold text-xs text-zinc-200">Creative Qur'an Premium</h3>
          </div>
          
          {#if $userEmail && ALLOWED_ADMIN_EMAILS.includes($userEmail.trim().toLowerCase())}
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Khusus Admin </span>
              <button 
                onclick={() => {
                  $isAdmin = !$isAdmin;
                  triggerToast(!$isAdmin ? "Mode Admin Dinonaktifkan." : "Mode Admin Diaktifkan.");
                }}
                class="ios-switch-small {$isAdmin ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Mode Admin"
              >
                <span class="ios-switch-small-handle {$isAdmin ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}
        </div>

        <!-- Email Selector -->
        <div class="flex items-center justify-between gap-4 py-1.5">
          <span class="text-[10px] text-zinc-400 font-bold uppercase">Email Akun</span>
          <div class="relative min-w-44">
            <select 
              bind:value={$userEmail}
              class="w-full bg-stone-900/60 border border-white/5 text-white text-[11px] rounded-lg py-1.5 pl-2.5 pr-8 outline-none focus:border-emerald-500/50 font-semibold cursor-pointer appearance-none"
            >
              <option value="" disabled class="bg-stone-950 text-zinc-500">Pilih email...</option>
              {#each ALLOWED_ADMIN_EMAILS as email (email)}
                <option value={email} class="bg-stone-950 text-white">{email}</option>
              {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
              <ChevronRight class="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>
        </div>

        {#if $isPremium}
          <div class="pt-2 flex items-center justify-between gap-3">
            <span class="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Crown class="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Premium Kamu Aktif
            </span>
            <button 
              onclick={() => {
                $isPremium = false;
                triggerToast("Premium dinonaktifkan.");
              }}
              class="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-lg transition-all"
            >
              Nonaktifkan
            </button>
          </div>
        {:else}
          <div class="pt-2 flex items-center justify-between gap-3 border-t border-white/5 mt-1.5">
            <span class="text-[10px] text-zinc-400 font-semibold"> Segera  AI Correction & Buku Tajwid</span>
            <button 
              onclick={handleActivatePremium}
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Beli Rp 24.000 rb
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- SECTION 1: AL-QUR'AN -->
    {#if match("📖 Al-Qur'an", []) && (
      match("Jenis Mushaf", ["mushaf", "utsmani", "indopak"]) || 
      match("Ukuran Font Arab", ["font", "arab", "ukuran", "huruf", "size"]) || 
      match("Tajwid Berwarna", ["tajwid", "berwarna", "warna"]) || 
      match("Nomor Ayat Arab", ["nomor", "ayat", "arab"])
    )}
      <div class="ios-section">
        <h3 class="ios-section-title">📖 Al-Qur'an</h3>
        <div class="ios-group">
          
          <!-- Jenis Mushaf -->
          {#if match("Jenis Mushaf", ["mushaf", "utsmani", "indopak"])}
            <div class="ios-row">
              <span class="text-xs font-bold text-zinc-200">Jenis Mushaf</span>
              <div class="ios-segmented-control">
                <button 
                  onclick={() => updateSetting('arabicScript', 'utsmani')}
                  class="ios-segment-btn {$settings.arabicScript === 'utsmani' ? 'ios-segment-btn-active' : ''}"
                >
                  Utsmani
                </button>
                <button 
                  onclick={() => updateSetting('arabicScript', 'indopak')}
                  class="ios-segment-btn {$settings.arabicScript === 'indopak' ? 'ios-segment-btn-active' : ''}"
                >
                  Quran Lokalk
                </button>
              </div>
            </div>
          {/if}

          <!-- Ukuran Font Arab -->
          {#if match("Ukuran Font Arab", ["font", "arab", "ukuran", "huruf", "size"])}
            <div class="ios-row flex-col items-stretch gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-200">Ukuran Font Arab</span>
                <span class="text-[11px] font-bold text-emerald-400">{$settings.arabicFontSize}px</span>
              </div>
              <div class="ios-slider-container">
                <input 
                  type="range" 
                  min="24" 
                  max="48" 
                  value={$settings.arabicFontSize} 
                  oninput={(e) => updateSetting('arabicFontSize', Number((e.target as HTMLInputElement).value))}
                  class="ios-slider"
                />
              </div>
            </div>
          {/if}

          <!-- Tajwid Berwarna -->
          {#if match("Tajwid Berwarna", ["tajwid", "berwarna", "warna"])}
            <div class="ios-row">
              <div>
                <span class="text-xs font-bold text-zinc-200 block">Tajwid Berwarna</span>
                <span class="text-[10px] text-zinc-400">Panduan warna hukum tajwid</span>
              </div>
              <button 
                onclick={() => updateSetting('tajwidColored', !$settings.tajwidColored)}
                class="ios-switch-small {$settings.tajwidColored ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Tajwid Berwarna"
              >
                <span class="ios-switch-small-handle {$settings.tajwidColored ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}

          <!-- Nomor Ayat Arab -->
          {#if match("Nomor Ayat Arab", ["nomor", "ayat", "arab"])}
            <div class="ios-row">
              <div>
                <span class="text-xs font-bold text-zinc-200 block">Nomor Ayat Arab</span>
                <span class="text-[10px] text-zinc-400">Tampilkan nomor di dalam ayat</span>
              </div>
              <button 
                onclick={() => updateSetting('arabicNumberVisible', !$settings.arabicNumberVisible)}
                class="ios-switch-small {$settings.arabicNumberVisible ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Nomor Ayat Arab"
              >
                <span class="ios-switch-small-handle {$settings.arabicNumberVisible ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}

        </div>
      </div>
    {/if}

    <!-- SECTION 2: LATIN & TERJEMAHAN -->
    {#if match("🔤 Latin & Terjemahan", []) && (
      match("Transliterasi (Latin)", ["latin", "transliterasi"]) || 
      match("Ukuran Font Latin", ["latin", "font", "ukuran"]) || 
      match("Terjemahan Indonesia", ["terjemahan", "indonesia"]) || 
      match("Ukuran Font Terjemahan", ["terjemahan", "font", "ukuran"]) || 
      match("Tafsir Ringkas", ["tafsir", "ringkas"]) || 
      match("Terjemahan Per Kata", ["per kata", "kata"])
    )}
      <div class="ios-section">
        <h3 class="ios-section-title">🔤 Latin & Terjemahan</h3>
        <div class="ios-group">
          
          <!-- Latin Toggle -->
          {#if match("Transliterasi (Latin)", ["latin", "transliterasi"])}
            <div class="ios-row">
              <div>
                <span class="text-xs font-bold text-zinc-200 block">Transliterasi (Latin)</span>
                <span class="text-[10px] text-zinc-400">Teks latin ejaan bacaan</span>
              </div>
              <button 
                onclick={() => updateSetting('latinEnabled', !$settings.latinEnabled)}
                class="ios-switch-small {$settings.latinEnabled ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Transliterasi Latin"
              >
                <span class="ios-switch-small-handle {$settings.latinEnabled ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}

          <!-- Latin Size -->
          {#if $settings.latinEnabled && match("Ukuran Font Latin", ["latin", "font", "ukuran"])}
            <div class="ios-row flex-col items-stretch gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-200">Ukuran Font Latin</span>
                <span class="text-[11px] font-bold text-emerald-400">{$settings.latinFontSize}px</span>
              </div>
              <div class="ios-slider-container">
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  value={$settings.latinFontSize} 
                  oninput={(e) => updateSetting('latinFontSize', Number((e.target as HTMLInputElement).value))}
                  class="ios-slider"
                />
              </div>
            </div>
          {/if}

          <!-- Translation Toggle -->
          {#if match("Terjemahan Indonesia", ["terjemahan", "indonesia"])}
            <div class="ios-row">
              <div>
                <span class="text-xs font-bold text-zinc-200 block">Terjemahan Indonesia</span>
                <span class="text-[10px] text-zinc-400">Arti bahasa Kemenag RI</span>
              </div>
              <button 
                onclick={() => updateSetting('translationEnabled', !$settings.translationEnabled)}
                class="ios-switch-small {$settings.translationEnabled ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Terjemahan Indonesia"
              >
                <span class="ios-switch-small-handle {$settings.translationEnabled ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}

          <!-- Translation Size -->
          {#if $settings.translationEnabled && match("Ukuran Font Terjemahan", ["terjemahan", "font", "ukuran"])}
            <div class="ios-row flex-col items-stretch gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-200">Ukuran Font Terjemahan</span>
                <span class="text-[11px] font-bold text-emerald-400">{$settings.translationFontSize}px</span>
              </div>
              <div class="ios-slider-container">
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  value={$settings.translationFontSize} 
                  oninput={(e) => updateSetting('translationFontSize', Number((e.target as HTMLInputElement).value))}
                  class="ios-slider"
                />
              </div>
            </div>
          {/if}

          <!-- Per Kata Toggle -->
          {#if match("Terjemahan Per Kata", ["per kata", "kata"])}
            <div class="ios-row">
              <div>
                <span class="text-xs font-bold text-zinc-200 block">Terjemahan Per Kata</span>
                <span class="text-[10px] text-zinc-400">Arti per kata di bawah lafal Arab</span>
              </div>
              <button 
                onclick={() => updateSetting('perKataEnabled', !$settings.perKataEnabled)}
                class="ios-switch-small {$settings.perKataEnabled ? 'ios-switch-small-active' : ''}"
                aria-label="Toggle Terjemahan Per Kata"
              >
                <span class="ios-switch-small-handle {$settings.perKataEnabled ? 'ios-switch-small-handle-active' : ''}"></span>
              </button>
            </div>
          {/if}

          <!-- Per Kata Font Size -->
          {#if $settings.perKataEnabled && match("Ukuran Font Tafsir Per Kata", ["per kata", "font", "ukuran"])}
            <div class="ios-row flex-col items-stretch gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-200">Ukuran Font Tafsir Per Kata</span>
                <span class="text-[11px] font-bold text-emerald-400">{$settings.perKataFontSize || 16}px</span>
              </div>
              <div class="ios-slider-container">
                <input 
                  type="range" 
                  min="12" 
                  max="28" 
                  value={$settings.perKataFontSize || 16} 
                  oninput={(e) => updateSetting('perKataFontSize', Number((e.target as HTMLInputElement).value))}
                  class="ios-slider"
                />
              </div>
            </div>
          {/if}

          <!-- Tafsir Font Size -->
          {#if match("Tafsir Ringkas", ["tafsir", "ringkas", "font", "ukuran"])}
            <div class="ios-row flex-col items-stretch gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-200">Ukuran Font Tafsir Ringkas</span>
                <span class="text-[11px] font-bold text-emerald-400">{$settings.tafsirFontSize || 14}px</span>
              </div>
              <div class="ios-slider-container">
                <input 
                  type="range" 
                  min="12" 
                  max="28" 
                  value={$settings.tafsirFontSize || 14} 
                  oninput={(e) => updateSetting('tafsirFontSize', Number((e.target as HTMLInputElement).value))}
                  class="ios-slider"
                />
              </div>
            </div>
          {/if}

        </div>

        <!-- PREVIEW TEXT UNDERNEATH -->
        <div class="mt-2.5 px-3 py-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <span class="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block">Pratinjau Tampilan</span>
          
          <p class="font-arabic-utsmani text-right text-white leading-relaxed" style="font-size: {$settings.arabicFontSize * 0.75}px">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {#if $settings.latinEnabled}
            <p class="text-emerald-400 font-medium font-sans" style="font-size: {$settings.latinFontSize}px">
              Bismillāhir-raḥmānir-raḥīm(i)
            </p>
          {/if}

          {#if $settings.translationEnabled}
            <p class="text-zinc-300 font-sans leading-relaxed" style="font-size: {$settings.translationFontSize}px">
              Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
            </p>
          {/if}
        </div>
      </div>
    {/if}

    <!-- SECTION 3: AUDIO MUROTTAL -->
    {#if match("🎧 Audio Murottal", []) && (
      match("Qori Utama", ["qori", "murottal", "suara"]) || 
      match("Suara Adzan Alarm Sholat", ["adzan", "muazin", "alarm"])
    )}
      <div class="ios-section">
        <h3 class="ios-section-title">🎧 Audio Murottal</h3>
        <div class="ios-group">
          
          <!-- Qori Radio Style Selection -->
          {#if match("Qori Utama", ["qori", "murottal", "suara"])}
            <div class="ios-row flex-col items-stretch gap-2">
              <span class="text-xs font-bold text-zinc-200">Pilih Qori</span>
              <div class="grid grid-cols-3 gap-1.5">
                {#each qoris as qori (qori.id)}
                  <button 
                    onclick={() => updateSetting('qori', qori.id as any)}
                    class="py-2.5 px-1 rounded-xl border text-center text-[10px] font-bold transition-all relative
                      {$settings.qori === qori.id 
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                        : 'border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200'}"
                  >
                    {qori.name}
                    {#if $settings.qori === qori.id}
                      <Check class="w-3 h-3 absolute top-1 right-1 text-emerald-400" />
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Alarm Adzan Muazin selection -->
          {#if match("Suara Adzan Alarm Sholat", ["adzan", "muazin", "alarm"])}
            <div class="ios-row flex-col items-stretch gap-2">
              <span class="text-xs font-bold text-zinc-200">Suara Adzan Alarm Sholat</span>
              <div class="grid grid-cols-2 gap-1.5">
                {#each muazins as adz (adz.id)}
                  <button 
                    onclick={() => adzanVoice.set(adz.id)}
                    class="py-2.5 px-2 rounded-xl border text-left text-[10px] font-bold transition-all flex items-center justify-between
                      {$adzanVoice === adz.id 
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                        : 'border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200'}"
                  >
                    <span>Adzan {adz.name}</span>
                    {#if $adzanVoice === adz.id}
                      <Check class="w-3.5 h-3.5 text-emerald-400" />
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

        </div>
      </div>
    {/if}

    <!-- SECTION 4: TAMPILAN -->
    {#if match("🎨 Tampilan", ["tema", "tampilan", "terang", "gelap", "sistem"])}
      <div class="ios-section">
        <h3 class="ios-section-title">🎨 Tampilan</h3>
        <div class="ios-group p-4 space-y-3">
          
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-200">Mode Tema</span>
            <div class="ios-segmented-control">
              <button 
                onclick={handleSystemTheme}
                class="ios-segment-btn"
              >
                Ikuti Sistem
              </button>
              <button 
                onclick={() => updateSetting('theme', 'light')}
                class="ios-segment-btn {$settings.theme === 'light' ? 'ios-segment-btn-active' : ''}"
              >
                Terang
              </button>
              <button 
                onclick={() => updateSetting('theme', 'dark')}
                class="ios-segment-btn {$settings.theme === 'dark' ? 'ios-segment-btn-active' : ''}"
              >
                Gelap
              </button>
            </div>
          </div>


        </div>
      </div>
    {/if}

    <!-- SECTION 5: INTERAKSI -->
    {#if match("⚙️ Interaksi", ["klik", "tekan", "lama", "interaksi"])}
      <div class="ios-section">
        <h3 class="ios-section-title">⚙️ Interaksi</h3>
        <div class="ios-group">
          
          <!-- Klik Ayat action -->
          <div class="ios-row">
            <div>
              <span class="text-xs font-bold text-zinc-200 block">Klik Ayat</span>
              <span class="text-[10px] text-zinc-400">Aksi saat menekan ayat</span>
            </div>
            <div class="ios-segmented-control">
              <button 
                onclick={() => $settings.clickAction = 'audio'}
                class="ios-segment-btn {$settings.clickAction === 'audio' ? 'ios-segment-btn-active' : ''}"
              >
                Murottal
              </button>
              <button 
                onclick={() => $settings.clickAction = 'tafsir'}
                class="ios-segment-btn {$settings.clickAction === 'tafsir' ? 'ios-segment-btn-active' : ''}"
              >
                Tafsir
              </button>
              <button 
                onclick={() => $settings.clickAction = 'detail'}
                class="ios-segment-btn {$settings.clickAction === 'detail' ? 'ios-segment-btn-active' : ''}"
              >
                Detail
              </button>
            </div>
          </div>

          <!-- Tekan Lama action -->
          <div class="ios-row">
            <div>
              <span class="text-xs font-bold text-zinc-200 block">Tekan Lama</span>
              <span class="text-[10px] text-zinc-400">Aksi menahan sentuhan</span>
            </div>
            <div class="ios-segmented-control">
              <button 
                onclick={() => $settings.longPressAction = 'copy'}
                class="ios-segment-btn {$settings.longPressAction === 'copy' ? 'ios-segment-btn-active' : ''}"
              >
                Salin
              </button>
              <button 
                onclick={() => $settings.longPressAction = 'share'}
                class="ios-segment-btn {$settings.longPressAction === 'share' ? 'ios-segment-btn-active' : ''}"
              >
                Bagikan
              </button>
              <button 
                onclick={() => $settings.longPressAction = 'favorite'}
                class="ios-segment-btn {$settings.longPressAction === 'favorite' ? 'ios-segment-btn-active' : ''}"
              >
                Favorit
              </button>
            </div>
          </div>

        </div>
      </div>
    {/if}

    <!-- SECTION 6: TAMPILAN LAYAR -->
    {#if match("📱 Tampilan Layar", ["layar", "menyala", "penuh", "fullscreen", "wake", "lock"])}
      <div class="ios-section">
        <h3 class="ios-section-title">📱 Tampilan Layar</h3>
        <div class="ios-group">
          
          <!-- Keep screen awake -->
          <div class="ios-row">
            <div>
              <span class="text-xs font-bold text-zinc-200 block">Biarkan Layar Menyala</span>
              <span class="text-[10px] text-zinc-400">Mencegah layar padam saat membaca</span>
            </div>
            <button 
              onclick={toggleWakeLock}
              class="ios-switch-small {$settings.keepScreenOn ? 'ios-switch-small-active' : ''}"
              aria-label="Toggle Layar Tetap Aktif"
            >
              <span class="ios-switch-small-handle {$settings.keepScreenOn ? 'ios-switch-small-handle-active' : ''}"></span>
            </button>
          </div>

          <!-- Fullscreen mode -->
          <div class="ios-row">
            <div>
              <span class="text-xs font-bold text-zinc-200 block">Mode Layar Penuh</span>
              <span class="text-[10px] text-zinc-400">Sembunyikan panel bar browser</span>
            </div>
            <button 
              onclick={toggleFullscreen}
              class="ios-switch-small {$settings.fullscreen ? 'ios-switch-small-active' : ''}"
              aria-label="Toggle Mode Layar Penuh"
            >
              <span class="ios-switch-small-handle {$settings.fullscreen ? 'ios-switch-small-handle-active' : ''}"></span>
            </button>
          </div>

        </div>
      </div>
    {/if}

    <!-- SECTION 8: INFORMASI -->
    {#if match("ℹ️ Informasi", []) && (
      match("Beri Rating Bintang 5", ["rating", "bintang", "nilai", "ulasan"]) || 
      match("Informasi Website", ["informasi", "website", "quran", "tentang"]) || 
      match("Kebijakan Privasi", ["privasi", "kebijakan", "keamanan", "data"]) || 
      match("Website Lain", ["website", "lain", "developer", "kreatif"]) || 
      match("Bagikan Aplikasi", ["bagikan", "share", "tautan"])
    )}
      <div class="ios-section">
        <h3 class="ios-section-title">ℹ️ Informasi & Bantuan</h3>
        <div class="ios-group">
          
          <!-- Bagikan Aplikasi -->
          {#if match("Bagikan Aplikasi", ["bagikan", "share", "tautan"])}
            <button 
              onclick={shareApp}
              class="ios-row ios-row-interactive text-left w-full"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Share2 class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Bagikan Aplikasi</span>
                  <span class="text-[10px] text-zinc-400">Ajak kerabat membaca Al-Qur'an</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </button>
          {/if}

          <!-- Beri Rating -->
          {#if match("Beri Rating Bintang 5", ["rating", "bintang", "nilai", "ulasan"])}
            <button 
              onclick={() => showRatingModal = true}
              class="ios-row ios-row-interactive text-left w-full"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Star class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Beri Rating Aplikasi</span>
                  <span class="text-[10px] text-zinc-400">Berikan penilaian bintang 5 Anda</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </button>
          {/if}

          <!-- Pasang App Store -->
          {#if match("Pasang di Play Store / App Store", ["pasang", "play store", "app store"])}
            <button 
              onclick={() => showStoreNotification = true}
              class="ios-row ios-row-interactive text-left w-full"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Smartphone class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Pasang di App Store / Play Store</span>
                  <span class="text-[10px] text-zinc-400">Dapatkan aplikasi seluler resmi</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </button>
          {/if}

          <!-- Informasi Website -->
          {#if match("Informasi Website", ["informasi", "website", "quran", "tentang"])}
            <button 
              onclick={() => showWebsiteModal = true}
              class="ios-row ios-row-interactive text-left w-full"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Info class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Informasi Website</span>
                  <span class="text-[10px] text-zinc-400">Tentang Creative Qur'an Indonesia</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </button>
          {/if}

          <!-- Kebijakan Privasi -->
          {#if match("Kebijakan Privasi", ["privasi", "kebijakan", "keamanan", "data"])}
            <button 
              onclick={() => showPrivacyModal = true}
              class="ios-row ios-row-interactive text-left w-full"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <Shield class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Kebijakan Privasi</span>
                  <span class="text-[10px] text-zinc-400">Keamanan data & privasi pengguna</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </button>
          {/if}

          <!-- Website Lain -->
          {#if match("Website Lain", ["website", "lain", "developer"])}
            <a 
              href="https://creativequran.id" 
              target="_blank"
              rel="noopener noreferrer"
              class="ios-row ios-row-interactive text-left w-full flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Globe class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-zinc-200 block">Website Lain</span>
                  <span class="text-[10px] text-zinc-400">Kunjungi situs pengembang</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-zinc-500" />
            </a>
          {/if}

        </div>
      </div>
    {/if}

  </div>

</div>

<!-- TOAST ALERTS -->
{#if showToast}
  <div class="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3.5 bg-emerald-600 border border-emerald-500/30 text-white text-xs font-bold rounded-2xl shadow-xl z-[200] animate-fade-in flex items-center gap-2">
    <Check class="w-4 h-4 text-emerald-100" />
    <span>{toastMessage}</span>
  </div>
{/if}

<!-- RATING DIALOG MODAL -->
{#if showRatingModal}
  <div class="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl text-center max-w-sm w-full space-y-6 shadow-2xl relative">
      <button 
        onclick={() => showRatingModal = false} 
        class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white"
      >
        Tutup
      </button>

      <div class="space-y-2">
        <Star class="w-12 h-12 text-amber-400 mx-auto fill-amber-400" />
        <h3 class="text-lg font-extrabold text-white">Beri Nilai Aplikasi</h3>
        <p class="text-xs text-zinc-400">Bagikan masukan berharga Anda untuk pengembangan Creative Qur'an Indonesia.</p>
      </div>

      <!-- Star Picker -->
      <div class="flex justify-center gap-2 py-1">
        {#each Array.from({ length: 5 }, (_, i) => i + 1) as star (star)}
          <button 
            onclick={() => ratingStars = star}
            class="text-zinc-650 hover:text-amber-400 transition-colors duration-200"
          >
            <Star 
              class="w-7 h-7 {star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}" 
            />
          </button>
        {/each}
      </div>

      <textarea 
        bind:value={ratingComment}
        placeholder="Tulis ulasan Anda di sini (opsional)..."
        class="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 h-20 placeholder:text-zinc-500 bg-emerald-950/20"
      ></textarea>

      <button 
        onclick={submitRating}
        class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-3 rounded-2xl shadow-lg shadow-emerald-950/20"
      >
        Kirim Penilaian
      </button>
    </div>
  </div>
{/if}

<!-- PRIVACY POLICY MODAL -->
{#if showPrivacyModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative max-h-[80vh] overflow-y-auto">
      <button 
        onclick={() => showPrivacyModal = false} 
        class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white"
      >
        Tutup
      </button>

      <div class="border-b border-white/5 pb-2 text-center">
        <h3 class="text-base font-extrabold text-white">Kebijakan Privasi</h3>
        <span class="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block mt-0.5">Creative Qur'an Indonesia</span>
      </div>

      <div class="space-y-4 text-[11px] text-zinc-400 leading-relaxed overflow-y-auto max-h-[45vh] pr-1">
        <p>Aplikasi **Creative Qur'an Indonesia** berkomitmen menjaga privasi dan keamanan data para pengguna. Harap baca rangkuman kebijakan berikut:</p>
        
        <div class="space-y-1">
          <h4 class="font-bold text-zinc-200 text-xs">1. Penyimpanan Data Lokal (Offline First)</h4>
          <p>Semua data berupa bookmark ayat, surah terakhir dibaca, pengaturan jenis tulisan, ukuran huruf, alarm waktu sholat, dan riwayat membaca disimpan secara lokal di dalam browser Anda menggunakan penyimpanan *LocalStorage* dan *IndexedDB*.</p>
        </div>

        <div class="space-y-1">
          <h4 class="font-bold text-zinc-200 text-xs">2. Tidak Ada Pengumpulan Data di Server</h4>
          <p>Kami tidak mengumpulkan, mengirim, membagikan, atau menyimpan data pribadi Anda ke server eksternal mana pun. Seluruh preferensi Anda sepenuhnya berada di bawah kendali perangkat Anda sendiri.</p>
        </div>

        <div class="space-y-1">
          <h4 class="font-bold text-zinc-200 text-xs">3. Izin Lokasi (GPS)</h4>
          <p>Aplikasi meminta izin GPS untuk menghitung jadwal sholat hari ini dan menentukan arah kiblat. Koordinat ini disimpan hanya di browser perangkat Anda untuk kenyamanan kalkulasi dan tidak pernah dibagikan ke pihak ketiga.</p>
        </div>
      </div>

      <button 
        onclick={() => showPrivacyModal = false}
        class="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-xs py-3 rounded-2xl border border-white/10"
      >
        Saya Mengerti & Setuju
      </button>
    </div>
  </div>
{/if}

<!-- WEBSITE INFO MODAL -->
{#if showWebsiteModal}
  <div class="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative text-center">
      <button 
        onclick={() => showWebsiteModal = false} 
        class="absolute top-4 right-4 text-zinc-400 hover:text-white"
      >
        <X class="w-4 h-4" />
      </button>

      <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
        <Info class="w-6 h-6 text-emerald-400" />
      </div>

      <h3 class="font-extrabold text-sm text-white">Creative Qur'an Indonesia</h3>
      <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold">
        Aplikasi mushaf Al-Qur'an digital modern karya bangsa Indonesia. Dirancang agar ringan, indah, dan nyaman dibaca setiap hari.
      </p>

      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-[10px] text-zinc-300 font-semibold space-y-1 text-left">
        <p>✓ Lisensi Bebas Iklan Selamanya</p>
        <p>✓ Menggunakan data API Kemenag RI</p>
        <p>✓ Fitur Murattal Audio Kualitas Tinggi</p>
      </div>

      <button 
        onclick={() => showWebsiteModal = false}
        class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
      >
        Tutup
      </button>
    </div>
  </div>
{/if}

<!-- STORE COMING SOON MODAL -->
{#if showStoreNotification}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative text-center">
      <button 
        onclick={() => showStoreNotification = false} 
        class="absolute top-4 right-4 text-zinc-400 hover:text-white"
      >
        <X class="w-4 h-4" />
      </button>

      <div class="space-y-2">
        <div class="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <Smartphone class="w-5.5 h-5.5 text-amber-400" />
        </div>
        <h3 class="font-extrabold text-sm text-white tracking-wide">Segera Hadir di Play Store & App Store</h3>
        <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold">
          Aplikasi resmi Creative Qur'an Indonesia saat ini sedang dalam proses peninjauan oleh Google Play dan Apple App Store.
        </p>
      </div>

      <button 
        onclick={() => showStoreNotification = false}
        class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
      >
        Tutup
      </button>
    </div>
  </div>
{/if}

{/if}

<style>
  /* Premium Native iOS Settings Redesign Styles */
  .ios-settings-container {
    max-width: 540px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .ios-header {
    background: rgba(15, 23, 42, 0.7);
  }
  :global(.light-mode) .ios-header {
    background: rgba(248, 250, 252, 0.75);
  }

  .ios-section {
    margin-bottom: 18px;
  }

  .ios-section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    margin-left: 14px;
    margin-bottom: 6px;
    text-align: left;
  }
  :global(.light-mode) .ios-section-title {
    color: #52525b;
  }

  .ios-group {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  :global(.light-mode) .ios-group {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  }

  .ios-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 48px;
    transition: background-color 0.2s ease;
  }
  .ios-row:last-child {
    border-bottom: none;
  }
  :global(.light-mode) .ios-row {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  .ios-row-interactive:active {
    background-color: rgba(255, 255, 255, 0.08);
  }
  :global(.light-mode) .ios-row-interactive:active {
    background-color: rgba(0, 0, 0, 0.04);
  }

  /* Compact segmented controls */
  .ios-segmented-control {
    display: flex;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 9px;
    padding: 2px;
    gap: 2px;
  }
  :global(.light-mode) .ios-segmented-control {
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.02);
  }

  .ios-segment-btn {
    font-size: 10px;
    font-weight: 700;
    color: #a1a1aa;
    padding: 4px 9px;
    border-radius: 7px;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  :global(.light-mode) .ios-segment-btn {
    color: #71717a;
  }

  .ios-segment-btn-active {
    background: #1e7a5c;
    color: #ffffff !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Compact switches */
  .ios-switch-small {
    position: relative;
    display: inline-block;
    width: 42px;
    height: 24px;
    background-color: rgba(120, 120, 128, 0.3);
    border-radius: 12px;
    transition: background-color 0.2s ease;
    cursor: pointer;
    border: none;
    padding: 0;
  }
  .ios-switch-small-active {
    background-color: #34c759 !important;
  }
  .ios-switch-small-handle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
  }
  .ios-switch-small-handle-active {
    transform: translateX(18px);
  }

  /* Compact M3 sliders */
  .ios-slider-container {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 4px 0;
  }
  .ios-slider {
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: rgba(16, 185, 129, 0.15);
    outline: none;
    appearance: none;
    cursor: pointer;
    accent-color: #10b981;
  }
  :global(.light-mode) .ios-slider {
    background: rgba(30, 122, 92, 0.12);
  }

  /* Premium Golden Card */
  .premium-setting-card {
    background: rgba(251, 191, 36, 0.05);
    border: 1px solid rgba(251, 191, 36, 0.15);
    border-radius: 18px;
    padding: 12px 14px;
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.03);
  }
  :global(.light-mode) .premium-setting-card {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(251, 191, 36, 0.25);
  }

  /* Android & Samsung Material Design 3 overrides */
  :global(.android-device) .ios-group,
  :global(.samsung-device) .ios-group {
    border-radius: 28px !important;
    background-color: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15), 0px 2px 1px rgba(0, 0, 0, 0.1) !important;
  }
  :global(.light-mode.android-device) .ios-group,
  :global(.light-mode.samsung-device) .ios-group {
    background-color: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
  }
  :global(.android-device:not(.light-mode)) .ios-group,
  :global(.samsung-device:not(.light-mode)) .ios-group {
    background-color: #0c0c0e !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }

  :global(.android-device) .ios-switch-small,
  :global(.samsung-device) .ios-switch-small {
    width: 52px;
    height: 32px;
    border-radius: 100px;
    background-color: rgba(120, 120, 128, 0.2);
    border: 2px solid rgba(120, 120, 128, 0.4);
  }
  :global(.android-device) .ios-switch-small-active,
  :global(.samsung-device) .ios-switch-small-active {
    background-color: #2bae85 !important;
    border-color: #2bae85;
  }
  :global(.android-device) .ios-switch-small-handle,
  :global(.samsung-device) .ios-switch-small-handle {
    width: 24px;
    height: 24px;
    top: 2px;
    left: 2px;
    border-radius: 50%;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  :global(.android-device) .ios-switch-small-handle-active,
  :global(.samsung-device) .ios-switch-small-handle-active {
    transform: translateX(20px);
  }

  :global(.android-device) .ios-segmented-control,
  :global(.samsung-device) .ios-segmented-control {
    background: transparent;
    border: none;
    gap: 8px;
  }
  :global(.android-device) .ios-segment-btn,
  :global(.samsung-device) .ios-segment-btn {
    border-radius: 100px;
    padding: 6px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 11px;
  }
  :global(.android-device) .ios-segment-btn-active,
  :global(.samsung-device) .ios-segment-btn-active {
    background: #2bae85;
    color: #ffffff !important;
    border-color: #2bae85;
  }

  :global(.android-device) .premium-setting-card,
  :global(.samsung-device) .premium-setting-card {
    border-radius: 28px !important;
  }
</style>
