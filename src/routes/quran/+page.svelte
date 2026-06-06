<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchSurahs, type Surah } from '$lib/api';
  import { Search, BookOpen, Compass, Bookmark, Clock, ArrowRight, Heart, Download, X, Smartphone } from '@lucide/svelte';
  import { favorites, lastRead } from '$lib/stores';

  let surahs = $state<Surah[]>([]);
  let favoritedSurahIds = $derived(new Set($favorites.map(f => f.surahNumber)));
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let activeTab = $state<'surah' | 'juz'>('surah');

  // PWA Install states
  let deferredPrompt = $state<any>(null);
  let showInstallButton = $state(false);
  let isIOS = $state(false);
  let isAlreadyInstalled = $state(false);
  let showIOSInstructions = $state(false);
  let userDismissed = $state(false);
  let showStoreNotification = $state(false);

  onMount(async () => {
    // Check if dismissed previously
    try {
      userDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    } catch (e) {
      console.warn(e);
    }

    if (typeof window !== 'undefined') {
      isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton = true;
      });

      window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        showInstallButton = false;
        isAlreadyInstalled = true;
      });
    }

    try {
      surahs = await fetchSurahs();
    } catch (e) {
      error = "Gagal memuat daftar Surah. Silakan periksa koneksi internet Anda.";
    } finally {
      loading = false;
    }
  });

  async function handleInstallClick() {
    if (isIOS) {
      showIOSInstructions = true;
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showInstallButton = false;
      }
      deferredPrompt = null;
    }
  }

  function dismissInstall() {
    userDismissed = true;
    try {
      localStorage.setItem('pwa_install_dismissed', 'true');
    } catch (e) {
      console.warn(e);
    }
  }

  // Filter surahs based on search query
  let filteredSurahs = $derived(
    surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.arti.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nomor.toString() === searchQuery
    )
  );

  // Group surahs into Juz
  // In reality, Juz maps to specific verses of Surahs. 
  // Let's create a standard mapping of 30 Juz to represent the Juz structure dynamically.
  // Below is a standard mapping of Juz to start surah/ayah for reference.
  const juzList = Array.from({ length: 30 }, (_, i) => {
    const juzNum = i + 1;
    // Basic Indonesian Juz names/description
    const juzData: Record<number, { name: string, start: string }> = {
      1: { name: 'Al-Fatihah', start: 'QS. Al-Fatihah: 1' },
      2: { name: 'Al-Baqarah (Lanjutan)', start: 'QS. Al-Baqarah: 142' },
      3: { name: 'Al-Baqarah (Lanjutan II)', start: 'QS. Al-Baqarah: 253' },
      4: { name: 'Ali \'Imran', start: 'QS. Ali \'Imran: 93' },
      5: { name: 'An-Nisa', start: 'QS. An-Nisa: 24' },
      6: { name: 'An-Nisa (Lanjutan)', start: 'QS. An-Nisa: 148' },
      7: { name: 'Al-Ma\'idah', start: 'QS. Al-Ma\'idah: 82' },
      8: { name: 'Al-An\'am', start: 'QS. Al-An\'am: 111' },
      9: { name: 'Al-A\'raf', start: 'QS. Al-A\'raf: 88' },
      10: { name: 'Al-Anfal', start: 'QS. Al-Anfal: 41' },
      11: { name: 'At-Taubah', start: 'QS. At-Taubah: 93' },
      12: { name: 'Hud', start: 'QS. Hud: 6' },
      13: { name: 'Yusuf', start: 'QS. Yusuf: 53' },
      14: { name: 'Al-Hijr', start: 'QS. Al-Hijr: 1' },
      15: { name: 'Al-Isra', start: 'QS. Al-Isra: 1' },
      16: { name: 'Al-Kahf', start: 'QS. Al-Kahf: 75' },
      17: { name: 'Al-Anbiya', start: 'QS. Al-Anbiya: 1' },
      18: { name: 'Al-Mu\'minun', start: 'QS. Al-Mu\'minun: 1' },
      19: { name: 'Al-Furqan', start: 'QS. Al-Furqan: 21' },
      20: { name: 'An-Naml', start: 'QS. An-Naml: 56' },
      21: { name: 'Al-\'Ankabut', start: 'QS. Al-\'Ankabut: 46' },
      22: { name: 'Al-Ahzab', start: 'QS. Al-Ahzab: 31' },
      23: { name: 'Ya-Sin', start: 'QS. Ya-Sin: 28' },
      24: { name: 'Az-Zumar', start: 'QS. Az-Zumar: 32' },
      25: { name: 'Fussilat', start: 'QS. Fussilat: 47' },
      26: { name: 'Al-Ahqaf', start: 'QS. Al-Ahqaf: 1' },
      27: { name: 'Adz-Dzariyat', start: 'QS. Adz-Dzariyat: 31' },
      28: { name: 'Al-Mujadilah', start: 'QS. Al-Mujadilah: 1' },
      29: { name: 'Al-Mulk', start: 'QS. Al-Mulk: 1' },
      30: { name: 'An-Naba', start: 'QS. An-Naba: 1' }
    };
    return {
      juz: juzNum,
      name: `Juz ${juzNum}`,
      description: juzData[juzNum]?.name || 'Detail Juz',
      start: juzData[juzNum]?.start || 'Mulai Ayat'
    };
  });

  // Helper mapping for Juz route redirection: redirect to the approximate starting surah
  const juzRouteMap: Record<number, number> = {
    1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
    11: 9, 12: 11, 13: 12, 14: 15, 15: 17, 16: 18, 17: 21, 18: 23, 19: 25, 20: 27,
    21: 29, 22: 33, 23: 36, 24: 39, 25: 41, 26: 46, 27: 51, 28: 58, 29: 67, 30: 78
  };
</script>

<div class="space-y-6">

  <!-- PAGE HEADER & TABS -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-extrabold text-white tracking-wide flex flex-wrap items-center gap-2">
        <BookOpen class="w-6 h-6 text-emerald-400" />
        <span>Daftar Al-Qur'an</span>
        <button 
          onclick={() => showStoreNotification = true}
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[9px] font-extrabold tracking-wider uppercase hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          title="Unduh Aplikasi Mobile"
        >
          <Smartphone class="w-3 h-3 text-emerald-400" />
          <span>Dapatkan Aplikasi</span>
        </button>
      </h2>
      <p class="text-xs text-zinc-500 font-semibold mt-1">Silahkan pilih Surah atau Juz yang ingin dibaca</p>
    </div>

    <!-- Tab switcher -->
    <div class="flex p-1 rounded-2xl glass border border-white/5 w-fit self-start md:self-auto">
      <button 
        onclick={() => activeTab = 'surah'} 
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
          {activeTab === 'surah' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
      >
        Daftar Surah
      </button>
      <button 
        onclick={() => activeTab = 'juz'} 
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
          {activeTab === 'juz' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
      >
        Daftar Juz
      </button>
    </div>
  </div>

  <!-- PWA INSTALL BANNER -->
  {#if (showInstallButton || (isIOS && !isAlreadyInstalled)) && !userDismissed}
    <div class="relative overflow-hidden rounded-2xl p-4.5 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-zinc-950/80 border border-emerald-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
      <div class="absolute inset-0 opacity-5 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      <div class="relative z-10 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Download class="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-white">Unduh Aplikasi Creative Qur'an</h4>
          <p class="text-[10px] text-zinc-400 font-semibold mt-0.5">
            Pasang di layar utama HP/PC Anda, atau dapatkan di 
            <button onclick={() => showStoreNotification = true} class="text-emerald-400 underline hover:text-emerald-300 font-bold transition-all cursor-pointer bg-transparent border-none p-0 inline">Play Store / App Store</button>.
          </p>
        </div>
      </div>
      
      <div class="relative z-10 flex items-center gap-2.5 self-end sm:self-auto">
        <button 
          onclick={dismissInstall}
          class="px-3.5 py-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"
        >
          Nanti Saja
        </button>
        <button 
          onclick={handleInstallClick}
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[10px] rounded-xl shadow-lg transition-all cursor-pointer"
        >
          {isIOS ? 'Petunjuk Pasang' : 'Instal Sekarang'}
        </button>
      </div>
    </div>
  {/if}

  <!-- SEARCH BAR (Surah only) -->
  {#if activeTab === 'surah'}
    <div class="sticky top-[72px] md:top-6 z-30 pb-4 bg-[#0f172a]/90 light-mode:bg-[#f8fafc]/90 backdrop-blur-md transition-colors duration-300">
      <div class="relative w-full">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Cari nama surah, terjemahan, atau nomor surah..." 
          class="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-white/5 bg-transparent text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white transition-all placeholder:text-zinc-500"
        />
        {#if searchQuery}
          <button 
            onclick={() => searchQuery = ''} 
            class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 hover:text-white"
          >
            Bersihkan
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- CONTENT CONTAINER -->
  {#if loading}
    <!-- Loading skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(9) as _, i (i)}
        <div class="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between animate-pulse">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 shrink-0"></div>
            <div class="space-y-2">
              <div class="h-4 bg-white/5 rounded w-24"></div>
              <div class="h-3 bg-white/5 rounded w-16"></div>
            </div>
          </div>
          <div class="h-6 bg-white/5 rounded w-12"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="glass border border-white/5 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
      <p class="text-sm text-zinc-400 font-medium">{error}</p>
      <button 
        onclick={async () => { loading = true; error = null; surahs = await fetchSurahs().catch(e => { error = e.message; return []; }); loading = false; }} 
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
      >
        Coba Lagi
      </button>
    </div>
  {:else}
    <!-- Lists -->
    {#if activeTab === 'surah'}
      <!-- SURAH GRID -->
      {#if filteredSurahs.length === 0}
        <div class="text-center py-12 text-zinc-500">
          <p class="text-sm font-semibold">Surah "{searchQuery}" tidak ditemukan.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each filteredSurahs as surah (surah.nomor)}
            {@const isLastReadSurah = $lastRead && $lastRead.surahNumber === surah.nomor}
            {@const isFavorited = favoritedSurahIds.has(surah.nomor)}
            <a 
              href="/quran/{surah.nomor}" 
              class="md3-card md3-ripple p-5 flex items-center justify-between hover:border-emerald-500/20 group cursor-pointer relative overflow-hidden"
            >
              {#if isLastReadSurah}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
              {/if}
              <div class="flex items-center gap-4 min-w-0">
                <!-- Surah index number container -->
                <div class="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  {surah.nomor}
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-zinc-200 truncate group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    <span>{surah.namaLatin}</span>
                    {#if isFavorited}
                      <Heart class="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                    {/if}
                    {#if isLastReadSurah}
                      <span class="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-wide shrink-0">Terakhir</span>
                    {/if}
                  </h3>
                  <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">{surah.tempatTurun} • {surah.jumlahAyat} Ayat</p>
                </div>
              </div>

              <!-- Arabic text name -->
              <div class="text-right shrink-0">
                <span class="font-arabic-utsmani text-lg font-bold text-emerald-400 dark:text-emerald-500 block">{surah.nama}</span>
                <span class="text-[10px] text-zinc-500 font-medium truncate max-w-[100px] block mt-0.5">{surah.arti}</span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    {:else}
      <!-- JUZ GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each juzList as item (item.juz)}
          <a 
            href="/quran/{juzRouteMap[item.juz]}" 
            class="md3-card md3-ripple p-5 flex items-center justify-between hover:border-emerald-500/20 group cursor-pointer relative overflow-hidden"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center font-extrabold text-xs text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                {item.juz}
              </div>
              <div>
                <h3 class="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{item.name}</h3>
                <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Mulai: {item.start}</p>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </a>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- iOS INSTALL INSTRUCTIONS MODAL -->
  {#if showIOSInstructions}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative">
        <button 
          onclick={() => showIOSInstructions = false} 
          class="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>

        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <Download class="w-6 h-6 text-emerald-400" />
          </div>
          <h3 class="font-extrabold text-sm text-white tracking-wide">Cara Pasang di iOS</h3>
          <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold">Ikuti langkah mudah ini untuk menambahkan aplikasi ke Layar Utama perangkat Apple Anda:</p>
        </div>

        <ol class="space-y-3 text-xs text-zinc-300 bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left font-semibold">
          <li class="flex gap-2">
            <span class="text-emerald-400 font-extrabold">1.</span>
            <span>Buka situs ini di browser <strong>Safari</strong> bawaan iOS.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-emerald-400 font-extrabold">2.</span>
            <span>Ketuk tombol <strong>Bagikan (Share)</strong> <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] border border-zinc-700">⎋</span> di bilah navigasi Safari.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-emerald-400 font-extrabold">3.</span>
            <span>Gulir ke bawah dan ketuk pilihan <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</span>
          </li>
        </ol>

        <button 
          onclick={() => showIOSInstructions = false}
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl active:scale-95 transition-all cursor-pointer"
        >
          Saya Mengerti
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
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Smartphone class="w-6 h-6 text-amber-400" />
          </div>
          <h3 class="font-extrabold text-sm text-white tracking-wide">Segera Hadir di Play Store & App Store</h3>
          <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold">
            Aplikasi resmi Creative Qur'an Indonesia saat ini sedang dalam proses peninjauan oleh tim Google dan Apple.
          </p>
        </div>

        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 text-xs text-zinc-300 font-semibold">
          <p>
            Untuk pengalaman terbaik saat ini, Anda dapat langsung memasang versi <strong>PWA (Progressive Web App)</strong> kami melalui tombol instalasi di atas.
          </p>
          <p class="text-[10px] text-emerald-400">
            ✓ Hemat Memori • ✓ Update Otomatis • ✓ Responsif & Ringan
          </p>
        </div>

        <button 
          onclick={() => showStoreNotification = false}
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl active:scale-95 transition-all cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  {/if}

</div>
