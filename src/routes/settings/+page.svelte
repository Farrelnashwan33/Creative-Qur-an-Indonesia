<script lang="ts">
  import { onMount } from 'svelte';
  import { settings, defaultSettings, type AppSettings, adzanVoice, lastRead, type LastRead, isPremium, showPremiumPaymentModal, isAdmin, userEmail } from '$lib/stores';
  import { 
    Settings, 
    Book, 
    Volume2, 
    Laptop, 
    Sun, 
    Moon, 
    Monitor, 
    RotateCcw, 
    Check, 
    Share2, 
    Heart, 
    Shield, 
    Info, 
    Star,
    Maximize2,
    Bell,
    ArrowLeft,
    Crown,
    Smartphone,
    X
  } from '@lucide/svelte';

  let mounted = $state(false);
  let wakeLockActive = $state(false);
  let wakeLock: any = null;

  const ALLOWED_ADMIN_EMAILS = [
    'yadiiitea73@gmail.com',
    'akhmadfarrelnashwan42@gmail.com',
    'r9n9harmadi@gmail.com'
  ];

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

  function resetSettings() {
    $settings = { ...defaultSettings };
    applyTheme($settings.theme);
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
    { id: 'afasy', name: 'Misyari Rasyid Al-Afasi' },
    { id: 'sudais', name: 'Abdurrahman As-Sudais' },
    { id: 'aldosari', name: 'Yasser Al-Dosari' },
    { id: 'juhany', name: 'Abdullah Al-Juhany' },
    { id: 'qasim', name: 'Abdul Muhsin Al-Qasim' },
    { id: 'dossari', name: 'Ibrahim Al-Dossari' }
  ];

  // Sharing & Rating states
  let showRatingModal = $state(false);
  let showPrivacyModal = $state(false);
  let showStoreNotification = $state(false);
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
</script>

{#if mounted}
<div class="space-y-6 max-w-4xl mx-auto">
  
  <!-- PAGE HEADER -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
        <Settings class="w-6 h-6 text-emerald-400" />
        Pengaturan
      </h2>
      <p class="text-xs text-zinc-500 font-semibold mt-1">Kelola preferensi membaca Al-Qur'an dan kustomisasi visual</p>
    </div>

    <div class="flex items-center gap-2">
      <a 
        href={$lastRead ? `/quran/${$lastRead.surahNumber}` : '/quran'}
        class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 active:scale-95 transition-all"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Kembali ke Qur'an</span>
      </a>

      <button 
        onclick={resetSettings}
        class="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/5 hover:border-rose-500/20 text-xs font-bold text-zinc-400 hover:text-rose-400 active:scale-95 transition-all"
      >
        <RotateCcw class="w-4 h-4" />
        <span>Reset Defaults</span>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

    <!-- ARABIC & TEXT WRAPPER -->
    <div class="space-y-6">
      
      <!-- ARABIC SETTINGS CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Book class="w-4.5 h-4.5 text-emerald-400" />
          Tulisan & Huruf Arab
        </h3>

        <!-- Font Script -->
        <div class="flex flex-col gap-2">
          <span class="text-xs text-zinc-500 font-semibold">Jenis Penulisan Arab</span>
          <!-- Changed from glass to solid transparent style to prevent nested blur ghosting -->
          <div class="flex p-1 rounded-xl bg-black/25 border border-white/5 w-full">
            <button 
              onclick={() => updateSetting('arabicScript', 'utsmani')}
              class="flex-1 py-2 rounded-lg text-xs font-bold transition-all
                {$settings.arabicScript === 'utsmani' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
            >
              Utsmani (Madinah)
            </button>
            <button 
              onclick={() => updateSetting('arabicScript', 'indopak')}
              class="flex-1 py-2 rounded-lg text-xs font-bold transition-all
                {$settings.arabicScript === 'indopak' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
            >
              IndoPak (Asia)
            </button>
          </div>
        </div>

        <!-- Font Size Slider -->
        <div class="flex flex-col gap-2 pt-2">
          <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span>Ukuran Font Arab</span>
            <span class="text-emerald-400">{$settings.arabicFontSize}px</span>
          </div>
          <input 
            type="range" 
            min="24" 
            max="48" 
            value={$settings.arabicFontSize} 
            oninput={(e) => updateSetting('arabicFontSize', Number((e.target as HTMLInputElement).value))}
            class="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <!-- Color Tajwid Checkbox -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Tajwid Berwarna</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Aktifkan warna panduan hukum tajwid</p>
          </div>
          <button 
            onclick={() => updateSetting('tajwidColored', !$settings.tajwidColored)}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.tajwidColored ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Tajwid Berwarna"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.tajwidColored ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

        <!-- Number Ayat Checkbox -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Nomor Ayat Arab</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Tampilkan nomor di dalam baris ayat</p>
          </div>
          <button 
            onclick={() => updateSetting('arabicNumberVisible', !$settings.arabicNumberVisible)}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.arabicNumberVisible ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Nomor Ayat Arab"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.arabicNumberVisible ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

      </div>

      <!-- TRANSLATION & LATIN CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Book class="w-4.5 h-4.5 text-emerald-400" />
          Latin & Terjemahan
        </h3>

        <!-- Latin Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Transliterasi (Latin)</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Tampilkan teks latin ejaan bacaan</p>
          </div>
          <button 
            onclick={() => updateSetting('latinEnabled', !$settings.latinEnabled)}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.latinEnabled ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Transliterasi Latin"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.latinEnabled ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

        <!-- Latin Size -->
        {#if $settings.latinEnabled}
          <div class="flex flex-col gap-2 pt-1 pb-2">
            <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Ukuran Font Latin</span>
              <span class="text-emerald-400">{$settings.latinFontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={$settings.latinFontSize} 
              oninput={(e) => updateSetting('latinFontSize', Number((e.target as HTMLInputElement).value))}
              class="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        {/if}

        <!-- Translation Toggle -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Terjemahan Indonesia</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Tampilkan makna terjemahan Kemenag RI</p>
          </div>
          <button 
            onclick={() => updateSetting('translationEnabled', !$settings.translationEnabled)}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.translationEnabled ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Terjemahan Indonesia"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.translationEnabled ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

        <!-- Translation Size -->
        {#if $settings.translationEnabled}
          <div class="flex flex-col gap-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Ukuran Font Terjemahan</span>
              <span class="text-emerald-400">{$settings.translationFontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={$settings.translationFontSize} 
              oninput={(e) => updateSetting('translationFontSize', Number((e.target as HTMLInputElement).value))}
              class="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        {/if}

        <!-- Per Kata Toggle -->
        <div class="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Terjemahan Per Kata (Langsung)</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Tampilkan arti per kata langsung di bawah lafal Arab</p>
          </div>
          <button 
            onclick={() => updateSetting('perKataEnabled', !$settings.perKataEnabled)}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.perKataEnabled ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Terjemahan Per Kata"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.perKataEnabled ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

        <!-- Per Kata Font Size Slider -->
        <div class="flex flex-col gap-2 pt-4 border-t border-white/5">
          <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span>Ukuran Font Tafsir Per Kata</span>
            <span class="text-emerald-400">{$settings.perKataFontSize || 16}px</span>
          </div>
          <input 
            type="range" 
            min="12" 
            max="28" 
            value={$settings.perKataFontSize || 16} 
            oninput={(e) => updateSetting('perKataFontSize', Number((e.target as HTMLInputElement).value))}
            class="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <!-- Tafsir Font Size Slider -->
        <div class="flex flex-col gap-2 pt-4 border-t border-white/5">
          <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span>Ukuran Font Tafsir Ringkas</span>
            <span class="text-emerald-400">{$settings.tafsirFontSize || 14}px</span>
          </div>
          <input 
            type="range" 
            min="12" 
            max="28" 
            value={$settings.tafsirFontSize || 14} 
            oninput={(e) => updateSetting('tafsirFontSize', Number((e.target as HTMLInputElement).value))}
            class="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

      </div>

    </div>

    <!-- AUDIO, THEME & SYSTEM WRAPPER -->
    <div class="space-y-6">
      
      <!-- MUROTTAL QORI CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Volume2 class="w-4.5 h-4.5 text-emerald-400" />
          Audio Murottal Qori
        </h3>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-zinc-500 font-semibold">Qori Utama</span>
          <div class="grid grid-cols-1 gap-2">
            {#each qoris as qori (qori.id)}
              <!-- Removed .glass class to prevent nested glassmorphism layers -->
              <button 
                onclick={() => updateSetting('qori', qori.id as any)}
                class="flex items-center justify-between p-3.5 rounded-xl border transition-all text-left text-xs font-bold
                  {$settings.qori === qori.id 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'}"
              >
                <span>{qori.name}</span>
                {#if $settings.qori === qori.id}
                  <Check class="w-4 h-4 text-emerald-400" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- SUARA ADZAN CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Bell class="w-4.5 h-4.5 text-emerald-400" />
          Suara Adzan Alarm Sholat
        </h3>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-zinc-500 font-semibold">Pilih Suara Muazin</span>
          <div class="grid grid-cols-1 gap-2">
            {#each [
              { id: 'makkah', name: 'Adzan Makkah (Masjidil Haram)' },
              { id: 'madinah', name: 'Adzan Madinah (Masjid Nabawi)' },
              { id: 'aqsa', name: 'Adzan Masjidil Aqsa' },
              { id: 'yusuf', name: 'Adzan Yusuf Islam (Merdu)' }
            ] as adz (adz.id)}
              <!-- Removed .glass class to prevent nested glassmorphism layers -->
              <button 
                onclick={() => adzanVoice.set(adz.id)}
                class="flex items-center justify-between p-3.5 rounded-xl border transition-all text-left text-xs font-bold
                  {$adzanVoice === adz.id 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'}"
              >
                <span>{adz.name}</span>
                {#if $adzanVoice === adz.id}
                  <Check class="w-4 h-4 text-emerald-400" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- THEME & SYSTEM CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Monitor class="w-4.5 h-4.5 text-emerald-400" />
          Tema & Sistem Perangkat
        </h3>

        <!-- Theme Mode -->
        <div class="flex flex-col gap-2">
          <span class="text-xs text-zinc-500 font-semibold">Tema Tampilan</span>
          <!-- Changed from glass to solid transparent style to prevent nested blur ghosting -->
          <div class="flex p-1 rounded-xl bg-black/25 border border-white/5 w-full">
            <button 
              onclick={() => updateSetting('theme', 'light')}
              class="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                {$settings.theme === 'light' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
            >
              <Sun class="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button 
              onclick={() => updateSetting('theme', 'dark')}
              class="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                {$settings.theme === 'dark' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
            >
              <Moon class="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        <!-- Keep screen awake -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Biarkan Layar Tetap Aktif</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Mencegah layar padam saat membaca Qur'an</p>
          </div>
          <button 
            onclick={toggleWakeLock}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.keepScreenOn ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Layar Tetap Aktif"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.keepScreenOn ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>

        <!-- Fullscreen toggler -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-xs font-bold text-zinc-300">Mode Layar Penuh</h4>
            <p class="text-xs font-bold text-zinc-400 mt-1">Sembunyikan bilah browser untuk fokus membaca</p>
          </div>
          <button 
            onclick={toggleFullscreen}
            class="w-11 h-6 rounded-full transition-colors relative
              {$settings.fullscreen ? 'bg-emerald-600' : 'bg-white/10'}"
            aria-label="Toggle Mode Layar Penuh"
          >
            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all {$settings.fullscreen ? 'left-6' : 'left-1'}"></span>
          </button>
        </div>
      </div>

      <!-- PREMIUM ACCESS CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4 {$isPremium ? 'premium-border' : ''}">
        <div class="flex items-center justify-between pb-1">
          <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
            <Crown class="w-4.5 h-4.5 {$isPremium ? 'text-amber-400' : 'text-emerald-400'}" />
            Creative Qur'an Premium
          </h3>
          <!-- Admin Mode Toggle Switch -->
          {#if $userEmail && ALLOWED_ADMIN_EMAILS.includes($userEmail.trim().toLowerCase())}
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mode Admin</span>
              <button 
                onclick={() => {
                  $isAdmin = !$isAdmin;
                  triggerToast(!$isAdmin ? "Mode Admin Dinonaktifkan (Pengguna Biasa)." : "Mode Admin Diaktifkan.");
                }}
                class="w-8 h-4.5 rounded-full transition-colors relative {!$isAdmin ? 'bg-zinc-700' : 'bg-emerald-600'}"
                aria-label="Toggle Mode Admin"
              >
                <span class="w-3 h-3 bg-white rounded-full absolute top-0.75 transition-all {$isAdmin ? 'left-4.25' : 'left-0.75'}"></span>
              </button>
            </div>
          {/if}
        </div>

        <!-- Email Verification Input Field -->
        <div class="space-y-1.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email Akun</span>
            {#if $userEmail && ALLOWED_ADMIN_EMAILS.includes($userEmail.trim().toLowerCase())}
              <span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">Terverifikasi Admin</span>
            {/if}
          </div>
          <div class="relative">
            <select 
              bind:value={$userEmail}
              class="w-full bg-stone-950/40 border border-white/10 text-white text-xs rounded-xl py-2.5 pl-3 pr-10 outline-none focus:border-emerald-500/50 transition-all font-semibold cursor-pointer appearance-none"
            >
              <option value="" disabled class="bg-stone-950 text-zinc-500">Pilih email terdaftar...</option>
              {#each ALLOWED_ADMIN_EMAILS as email (email)}
                <option value={email} class="bg-stone-950 text-white">{email}</option>
              {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="m9.293 12.95 .707 .707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {#if $isPremium}
          <div class="space-y-3">
            <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-2">
              <Crown class="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Status: Premium Aktif (Royal Gold)</span>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed font-bold">Terima kasih atas kontribusi Anda! Seluruh tema premium emas, performa lancar, dan badge Pro telah terbuka.</p>
            <button 
              onclick={() => {
                $isPremium = false;
                triggerToast("Premium dinonaktifkan.");
              }}
              class="w-full inline-flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-bold py-3 rounded-xl transition-all"
            >
              Kembali ke Fitur Gratis
            </button>
          </div>
        {:else}
          <div class="space-y-3">
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-bold">Nikmati berbagai fitur premium eksklusif untuk mendukung tilawah harian Anda:</p>
            <ul class="space-y-2 text-xs sm:text-sm text-zinc-200 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-left">
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-xs mt-0.5">✦</span>
                <span>Bisa akses e-book lengkap belajar tajwid</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-xs mt-0.5">✦</span>
                <span>Pengoreksi makhraj huruf menggunakan sistem pintar <strong>AI Islamic Correction</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-xs mt-0.5">✦</span>
                <span>Tampilan jadwal sholat yang lebih bagus</span>
              </li>
            </ul>
            <button 
              onclick={handleActivatePremium}
              class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Crown class="w-4 h-4 text-white fill-white" />
              <span>Yuu Langganan (Rp 150rb)</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- ADDITIONAL INFO CARD -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 class="font-bold text-sm text-zinc-300 flex items-center gap-2">
          <Info class="w-4.5 h-4.5 text-emerald-400" />
          Aplikasi & Dukungan
        </h3>

        <div class="flex flex-col gap-2">
          <!-- Changed from glass to bg-white/5 transparent buttons to prevent nested blur ghosting -->
          <button 
            onclick={shareApp}
            class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-white/10 text-left text-xs font-bold text-zinc-300 hover:text-white"
          >
            <Share2 class="w-4.5 h-4.5 text-zinc-500" />
            <span>Bagikan Aplikasi</span>
          </button>

          <button 
            onclick={() => showRatingModal = true}
            class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-white/10 text-left text-xs font-bold text-zinc-300 hover:text-white"
          >
            <Star class="w-4.5 h-4.5 text-zinc-500" />
            <span>Beri Rating Bintang 5</span>
          </button>

          <button 
            onclick={() => showStoreNotification = true}
            class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-white/10 text-left text-xs font-bold text-zinc-300 hover:text-white"
          >
            <Smartphone class="w-4.5 h-4.5 text-zinc-500" />
            <span>Pasang di Play Store / App Store</span>
          </button>

          <button 
            onclick={() => showPrivacyModal = true}
            class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-white/10 text-left text-xs font-bold text-zinc-300 hover:text-white"
          >
            <Shield class="w-4.5 h-4.5 text-zinc-500" />
            <span>Kebijakan Privasi</span>
          </button>
        </div>
      </div>

    </div>

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
  <div class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
    <!-- Changed from glass-emerald to bg-zinc-950 solid border to avoid double blur and visual artifacts -->
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl text-center max-w-sm w-full space-y-6 shadow-2xl relative">
      <button 
        onclick={() => showRatingModal = false} 
        class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white"
      >
        Tutup
      </button>

      <div class="space-y-2">
        <Star class="w-12 h-12 text-gold-500 mx-auto fill-gold-500 animate-pulse-slow" />
        <h3 class="text-xl font-extrabold text-white">Beri Nilai Aplikasi</h3>
        <p class="text-xs text-zinc-400">Bagikan masukan berharga Anda untuk pengembangan Creative Qur'an Indonesia.</p>
      </div>

      <!-- Star Picker -->
      <div class="flex justify-center gap-2 py-1">
        {#each Array.from({ length: 5 }, (_, i) => i + 1) as star (star)}
          <button 
            onclick={() => ratingStars = star}
            class="text-zinc-600 hover:text-gold-500 transition-colors duration-200"
          >
            <Star 
              class="w-8 h-8 {star <= ratingStars ? 'text-gold-500 fill-gold-500' : 'text-zinc-600'}" 
            />
          </button>
        {/each}
      </div>

      <!-- Comment Box -->
      <textarea 
        bind:value={ratingComment}
        placeholder="Tulis ulasan Anda di sini (opsional)..."
        class="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 h-20 placeholder:text-zinc-500 bg-emerald-950/20"
      ></textarea>

      <button 
        onclick={submitRating}
        class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-950/20"
      >
        Kirim Penilaian
      </button>
    </div>
  </div>
{/if}

<!-- PRIVACY POLICY MODAL -->
{#if showPrivacyModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
    <!-- Changed from glass-emerald to bg-zinc-950 solid border to avoid double blur and visual artifacts -->
    <div class="bg-zinc-950 border border-emerald-500/30 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
      <button 
        onclick={() => showPrivacyModal = false} 
        class="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-white"
      >
        Tutup
      </button>

      <div class="border-b border-white/5 pb-2 text-center">
        <h3 class="text-lg font-extrabold text-white">Kebijakan Privasi</h3>
        <span class="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block mt-0.5">Creative Qur'an Indonesia</span>
      </div>

      <div class="space-y-4 text-xs text-zinc-400 leading-relaxed overflow-y-auto max-h-[50vh] pr-1">
        <p>Aplikasi **Creative Qur'an Indonesia** berkomitmen menjaga privasi dan keamanan data para pengguna. Harap baca rangkuman kebijakan berikut:</p>
        
        <div class="space-y-1.5">
          <h4 class="font-bold text-zinc-200">1. Penyimpanan Data Lokal (Offline First)</h4>
          <p>Semua data berupa bookmark ayat, surah terakhir dibaca, pengaturan jenis tulisan, ukuran huruf, alarm waktu sholat, dan riwayat membaca disimpan secara lokal di dalam browser Anda menggunakan penyimpanan *LocalStorage* dan *IndexedDB*.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-bold text-zinc-200">2. Tidak Ada Pengumpulan Data di Server</h4>
          <p>Kami tidak mengumpulkan, mengirim, membagikan, atau menyimpan data pribadi Anda ke server eksternal mana pun. Seluruh preferensi Anda sepenuhnya berada di bawah kendali perangkat Anda sendiri.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-bold text-zinc-200">3. Izin Lokasi (GPS)</h4>
          <p>Aplikasi meminta izin GPS untuk menghitung jadwal sholat hari ini dan menentukan arah mata angin ke Ka'bah di Makkah (Kiblat). Koordinat ini disimpan hanya di browser perangkat Anda untuk kenyamanan kalkulasi dan tidak pernah dibagikan ke pihak ketiga.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-bold text-zinc-200">4. Perubahan Kebijakan</h4>
          <p>Kebijakan privasi ini dapat disesuaikan sewaktu-waktu seiring pembaruan fitur aplikasi. Versi terbaru akan selalu dapat diakses secara transparan melalui menu ini.</p>
        </div>
      </div>

      <button 
        onclick={() => showPrivacyModal = false}
        class="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-xs py-3.5 rounded-2xl border border-white/10"
      >
        Saya Mengerti & Setuju
      </button>
    </div>
  </div>
{/if}

{:else}
  <!-- Global Loading / Skeleton Loader prior to Mount -->
  <div class="space-y-6 max-w-4xl mx-auto animate-pulse">
    <div class="flex items-center justify-between pb-4">
      <div class="space-y-2">
        <div class="h-8 bg-white/5 rounded-xl w-48"></div>
        <div class="h-4 bg-white/5 rounded-lg w-72"></div>
      </div>
      <div class="h-10 bg-white/5 rounded-xl w-36"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="h-[400px] bg-white/5 rounded-3xl"></div>
      <div class="h-[400px] bg-white/5 rounded-3xl"></div>
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
          Untuk pengalaman terbaik saat ini, Anda dapat langsung memasang versi <strong>PWA (Progressive Web App)</strong> kami melalui tombol instalasi di halaman utama.
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

