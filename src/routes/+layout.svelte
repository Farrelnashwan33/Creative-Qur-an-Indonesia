<script lang="ts">
  import './layout.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { settings, lastRead, type LastRead, adzanVoice, activeAlarms, savedLocation, isPremium, showPremiumPaymentModal, isAdmin, userEmail } from '$lib/stores';
  import { fetchPrayerTimes, fetchPrayerTimesByCity, type PrayerTimes } from '$lib/api';
  import { 
    Home, 
    BookOpen, 
    Search as SearchIcon, 
    Compass, 
    Settings as SettingsIcon,
    Moon, 
    Sun, 
    Bookmark, 
    User,
    BookMarked,
    Volume2,
    Bell,
    VolumeX,
    Crown
  } from '@lucide/svelte';

  let { children } = $props();

  let mounted = $state(false);
  let activeTab = $derived($page.url.pathname);
  
  // Theme derived state from store
  let themeMode = $derived(
    $settings.theme === 'dark' || 
    ($settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) 
      ? 'dark' 
      : 'light'
  );

  let toastMessage = $state<string | null>(null);
  let showToast = $state(false);

  const ALLOWED_ADMIN_EMAILS = [
    'yadiiitea73@gmail.com',
    'akhmadfarrelnashwan42@gmail.com',
    'r9n9harmadi@gmail.com'
  ];

  function triggerToast(msg: string) {
    toastMessage = msg;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 2500);
  }

  // Alarm states
  let todayPrayerTimes = $state<PrayerTimes | null>(null);
  let adzanAudioPlayer: HTMLAudioElement | null = null;
  let showAdzanModal = $state(false);
  let activeAdzanName = $state('');

  const adzanUrls = {
    makkah: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    madinah: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    aqsa: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    yusuf: 'https://www.islamcan.com/audio/adhan/azan4.mp3'
  };

  async function loadTodayPrayerTimes() {
    let lat = -6.2088;
    let lon = 106.8456;
    let cityName = 'Jakarta';

    // Get current location settings from store
    const loc = $savedLocation;
    if (loc) {
      lat = loc.latitude;
      lon = loc.longitude;
      cityName = loc.cityName;
    }

    try {
      const data = await fetchPrayerTimes(lat, lon);
      todayPrayerTimes = data.timings;
    } catch (e) {
      try {
        const data = await fetchPrayerTimesByCity(cityName);
        todayPrayerTimes = data.timings;
      } catch (err) {
        console.error("Failed to load today prayer times for adzan check", err);
      }
    }
  }

  let lastCheckedTime = '';

  function checkAdzan() {
    if (!todayPrayerTimes) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (timeStr === lastCheckedTime) return; // check once per minute change
    lastCheckedTime = timeStr;

    const prayerKeys = [
      { name: 'Subuh', key: 'Fajr' },
      { name: 'Dzuhur', key: 'Dhuhr' },
      { name: 'Ashar', key: 'Asr' },
      { name: 'Maghrib', key: 'Maghrib' },
      { name: 'Isya', key: 'Isha' }
    ];

    for (const p of prayerKeys) {
      const pTime = todayPrayerTimes[p.key as keyof PrayerTimes];
      if (!pTime) continue;

      const cleanPTime = pTime.split(' ')[0]; // extract "11:50" from "11:50 (WIB)"

      if (cleanPTime === timeStr) {
        if ($activeAlarms[p.key as keyof typeof $activeAlarms]) {
          triggerAdzan(p.name);
        }
      }
    }
  }

  function triggerAdzan(prayerName: string) {
    if (adzanAudioPlayer) {
      adzanAudioPlayer.pause();
    }

    const url = adzanUrls[$adzanVoice as keyof typeof adzanUrls] || adzanUrls.makkah;
    adzanAudioPlayer = new Audio(url);
    adzanAudioPlayer.play().catch(e => {
      console.warn("Autoplay adzan blocked by browser policy. Interaction needed.", e);
    });

    activeAdzanName = prayerName;
    showAdzanModal = true;
  }

  function stopAdzan() {
    if (adzanAudioPlayer) {
      adzanAudioPlayer.pause();
      adzanAudioPlayer = null;
    }
    showAdzanModal = false;
  }

  let layoutWakeLock: any = null;

  async function requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        layoutWakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn("Screen wake lock request failed", err);
      }
    }
  }

  function releaseWakeLock() {
    if (layoutWakeLock) {
      layoutWakeLock.release().then(() => {
        layoutWakeLock = null;
      });
    }
  }

  // ResizeObserver for modern layout query sizing
  let containerWidth = $state(1024);
  let layoutContainer = $state<HTMLElement | null>(null);

  $effect(() => {
    if (typeof window !== 'undefined' && layoutContainer) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerWidth = entry.contentRect.width;
        }
      });
      observer.observe(layoutContainer);
      return () => {
        observer.disconnect();
      };
    }
  });

  onMount(() => {
    mounted = true;
    
    // Detect Samsung devices/browsers to apply CSS fallback class (to prevent backdrop-filter rendering bugs)
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      const isSamsungBrowser = /SamsungBrowser/i.test(ua);
      const isSamsungDevice = /Samsung/i.test(ua) || /SM-[A-Z0-9]+/i.test(ua);
      let isMali = false;
      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as any;
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_ID_GI || 37446);
            if (renderer && (/Mali/i.test(renderer) || /Samsung/i.test(renderer))) {
              isMali = true;
            }
          }
        }
      } catch (e) {}

      let isSamsungUAData = false;
      const nav = navigator as any;
      if (nav.userAgentData && nav.userAgentData.brands) {
        isSamsungUAData = nav.userAgentData.brands.some((b: any) => /Samsung/i.test(b.brand));
      }

      const isChromeAndroid = /Chrome/i.test(ua) && /Android/i.test(ua);

      if (isSamsungBrowser || isSamsungDevice || isSamsungUAData || isMali || isChromeAndroid) {
        document.documentElement.classList.add('samsung-device');
      }
    }
    
    loadTodayPrayerTimes();

    // Check clock time every 10 seconds
    const intervalId = setInterval(checkAdzan, 10000);

    return () => {
      clearInterval(intervalId);
      releaseWakeLock();
      if (adzanAudioPlayer) adzanAudioPlayer.pause();
    };
  });

  // Reactive theme and screen keep awake logic
  $effect(() => {
    if (mounted) {
      applyTheme($settings.theme);
      if ($settings.keepScreenOn) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    }
  });

  // Role-based admin access control
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

  function applyTheme(theme: 'system' | 'light' | 'dark') {
    if (typeof window === 'undefined') return;
    
    let isDark = true;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
    }
  }

  function isActive(path: string) {
    if (path === '/') {
      return activeTab === '/';
    }
    return activeTab.startsWith(path);
  }

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Qur\'an', path: '/quran', icon: BookOpen },
    { name: 'Search', path: '/search', icon: SearchIcon },
    { name: 'Sholat', path: '/sholat', icon: Compass },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];
</script>

<svelte:head>
  <title>Creative Qur'an Indonesia</title>
  <meta name="description" content="Aplikasi Al-Qur'an Digital Modern Indonesia dengan Fitur Baca Qur'an, Jadwal Sholat, Arah Kiblat, Audio Murottal, dan Tafsir." />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content={themeMode === 'dark' ? '#030712' : '#f8fafc'} />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</svelte:head>

{#if mounted}
<div bind:this={layoutContainer} class="min-h-screen flex flex-col md:flex-row islamic-bg soft-gradient {$isPremium ? 'premium-theme' : ''}">
  
  <!-- DESKTOP SIDEBAR -->
  <aside class="desktop-sidebar hidden md:flex flex-col w-64 lg:w-72 glass border-r border-white/5 p-6 h-screen sticky top-0 shrink-0 z-20 justify-between {$isPremium ? 'premium-border' : ''}">
    <div class="flex flex-col gap-8">
      <!-- App Logo & Brand -->
      <div class="flex items-center gap-3 px-2">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300
          {$isPremium 
            ? 'bg-linear-to-tr from-amber-500 to-yellow-300 shadow-amber-950/20' 
            : 'bg-linear-to-tr from-emerald-600 to-emerald-400 shadow-emerald-950/20'}">
          {#if $isPremium}
            <Crown class="w-5.5 h-5.5 text-black fill-black" />
          {:else}
            <BookOpen class="w-5 h-5 text-white" />
          {/if}
        </div>
        <div>
          <h1 class="font-bold text-sm lg:text-base tracking-wide flex items-center gap-1 transition-all duration-300
            {$isPremium ? 'premium-gold-text' : 'text-emerald-500 dark:text-emerald-400'}">
            CREATIVE QUR'AN
          </h1>
          <span class="text-[10px] font-extrabold tracking-widest uppercase transition-all duration-300 block -mt-0.5
            {$isPremium ? 'premium-gold-text' : 'text-zinc-500'}">
            {$isPremium ? 'PREMIUM' : 'INDONESIA'}
          </span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex flex-col gap-2">
        {#each menuItems as item (item.path)}
          {@const Icon = item.icon}
          <a 
            href={item.path} 
            class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
              {isActive(item.path) 
                ? ($isPremium 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-md shadow-amber-950/10' 
                  : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/10') 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}"
          >
            <!-- Hover highlight element -->
            <div class="absolute inset-0 bg-linear-to-r transition-opacity duration-300
              {$isPremium ? 'from-amber-500/5' : 'from-emerald-600/5'} to-transparent opacity-0 group-hover:opacity-100"></div>
            <Icon class="w-5 h-5 transition-transform duration-300 group-hover:scale-110 
              {isActive(item.path) 
                ? ($isPremium ? 'text-amber-400' : 'text-emerald-400') 
                : 'text-zinc-400 group-hover:text-zinc-200'}" />
            <span>{item.name}</span>
            {#if isActive(item.path)}
              <div class="absolute left-0 w-1 h-6 rounded-r-full {$isPremium ? 'bg-amber-400' : 'bg-emerald-500'}"></div>
            {/if}
          </a>
        {/each}

        {#if !$isPremium}
          <button 
            onclick={handleActivatePremium}
            class="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 mt-2 shadow-sm cursor-pointer animate-fade-in"
          >
            <Crown class="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse-slow" />
            <span>Aktifkan Premium</span>
          </button>
        {:else}
          <a 
            href="/premium/ebook"
            class="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 mt-2 shadow-sm cursor-pointer animate-fade-in"
          >
            <BookMarked class="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse-slow" />
            <span>Buka E-Book Tajwid</span>
          </a>
        {/if}
      </nav>
    </div>

    <!-- Quick Last Read Info & Quick Settings -->
    <div class="flex flex-col gap-4">
      {#if $lastRead}
        <a 
          href="/quran/{$lastRead.surahNumber}" 
          class="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 group cursor-pointer {$isPremium ? 'premium-border' : ''}"
        >
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300 shrink-0">
            <BookMarked class="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Terakhir Baca</p>
            <h4 class="text-xs font-bold text-zinc-200 truncate">{$lastRead.surahName}</h4>
            <p class="text-[10px] text-emerald-400 font-medium">Ayat {$lastRead.ayahNumber}</p>
          </div>
        </a>
      {/if}

      <!-- Quick footer -->
      <div class="flex items-center justify-between px-2 pt-2 border-t border-white/5 text-[11px] text-zinc-600 font-medium">
        <span class={$isPremium ? 'premium-gold-text font-black' : ''}>{$isPremium ? 'v1.0.0 Premium' : 'v1.0.0 Free'}</span>
        <span class="text-zinc-500 hover:text-emerald-400 transition-colors">CQI © 2026</span>
      </div>
    </div>
  </aside>

  <!-- MOBILE TOP BAR -->
  <header class="flex md:hidden items-center justify-between px-5 py-4 glass border-b border-white/5 sticky top-0 z-30 backdrop-blur-md {$isPremium ? 'premium-border' : ''}">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center
        {$isPremium ? 'bg-linear-to-tr from-amber-500 to-yellow-300' : 'bg-linear-to-tr from-emerald-600 to-emerald-400'}">
        {#if $isPremium}
          <Crown class="w-4.5 h-4.5 text-black fill-black" />
        {:else}
          <BookOpen class="w-4.5 h-4.5 text-white" />
        {/if}
      </div>
      <div>
        <h1 class="font-bold text-xs tracking-wider flex items-center gap-1
          {$isPremium ? 'premium-gold-text' : 'text-emerald-500 dark:text-emerald-400'}">
          CREATIVE QUR'AN
        </h1>
        <span class="text-[8px] font-bold uppercase tracking-widest block -mt-0.5 transition-all duration-300
          {$isPremium ? 'premium-gold-text' : 'text-zinc-500'}">
          {$isPremium ? 'PREMIUM' : 'INDONESIA'}
        </span>
      </div>
    </div>

    <!-- Premium Action Button in Mobile Header -->
    <div class="flex items-center gap-2">
      {#if !$isPremium}
        <button 
          onclick={handleActivatePremium}
          class="p-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-fade-in"
        >
          <Crown class="w-4 h-4 fill-amber-400 animate-pulse-slow" />
          <span class="text-[10px] font-extrabold tracking-wider uppercase">Premium</span>
        </button>
      {:else}
        <a 
          href="/premium/ebook"
          class="p-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-fade-in"
        >
          <BookMarked class="w-4.5 h-4.5 text-amber-400" />
          <span class="text-[10px] font-extrabold tracking-wider uppercase">E-Book</span>
        </a>
      {/if}
    </div>
  </header>

  <!-- MAIN APP CONTAINER -->
  <main class="flex-1 min-w-0 pb-[120px] md:pb-6 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
    {@render children()}
  </main>

  <!-- MOBILE BOTTOM NAVIGATION -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-2 py-3 pb-safe-bottom flex justify-around items-center z-40 backdrop-blur-lg {$isPremium ? 'premium-border' : ''}">
    {#each menuItems as item (item.path)}
      {@const Icon = item.icon}
      <a 
        href={item.path} 
        class="flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-300 relative group
          {isActive(item.path) ? ($isPremium ? 'text-amber-400' : 'text-emerald-400') : 'text-zinc-500'}"
      >
        <div class="p-1 rounded-xl transition-all duration-300 
          {isActive(item.path) ? ($isPremium ? 'bg-amber-500/10 scale-110 text-amber-400' : 'bg-emerald-500/10 scale-110 text-emerald-400') : ''}">
          <Icon class="w-5.5 h-5.5" />
        </div>
        <span class="text-[9px] font-bold tracking-wide">{item.name}</span>
        {#if isActive(item.path)}
          <span class="absolute -top-1.5 w-1 h-1 rounded-full {$isPremium ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
        {/if}
      </a>
    {/each}
  </nav>

  <!-- ADZAN ALERT POPUP OVERLAY -->
  {#if showAdzanModal}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div class="glass-emerald border border-emerald-500/30 p-8 rounded-3xl text-center max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 bg-repeat bg-size-[30px] pointer-events-none islamic-bg"></div>
        
        <div class="relative z-10 space-y-3">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
            <Volume2 class="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          
          <div>
            <span class="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">Panggilan Sholat</span>
            <h3 class="text-2xl font-black text-white tracking-wide mt-1">Waktu Sholat {activeAdzanName}</h3>
            <p class="text-xs text-zinc-400 mt-2 font-medium">Marilah menuju sholat, marilah menuju kemenangan.</p>
          </div>
        </div>

        <div class="relative z-10 pt-2 space-y-2">
          <button 
            onclick={stopAdzan}
            class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-950/20"
          >
            <VolumeX class="w-4 h-4" />
            <span>Matikan Adzan</span>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- PREMIUM MEMBERSHIP GO-PAY MODAL -->
  {#if $showPremiumPaymentModal}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div class="glass border border-amber-500/30 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden">
        <!-- Background pattern overlay -->
        <div class="absolute inset-0 opacity-5 bg-repeat bg-size-[30px] pointer-events-none islamic-bg"></div>

        <button 
          onclick={() => $showPremiumPaymentModal = false} 
          class="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-white"
        >
          Tutup
        </button>

        <div class="text-center space-y-2">
          <Crown class="w-12 h-12 text-amber-400 mx-auto fill-amber-400 animate-pulse-slow" />
          <h3 class="text-xl font-extrabold text-white tracking-wide">Akses Royal Premium</h3>
          <span class="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider block">Creative Qur'an Indonesia</span>
        </div>

        <!-- Fitur Premium List -->
        <div class="border border-white/10 rounded-2xl p-4.5 bg-amber-950/10 text-left space-y-2.5">
          <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fitur Premium Yang Didapatkan:</p>
          <ul class="space-y-2 text-xs text-zinc-300">
            <li class="flex items-start gap-2">
              <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
              <span>Bisa akses e-book lengkap belajar tajwid</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
              <span>Pengoreksi makhraj huruf menggunakan sistem pintar <strong>AI Islamic Correction</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
              <span>Tampilan jadwal sholat yang lebih bagus</span>
            </li>
          </ul>
        </div>

        <div class="border border-white/10 rounded-2xl p-4 space-y-3.5 bg-amber-950/15">
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 font-semibold">Metode Pembayaran</span>
            <span class="font-extrabold text-emerald-400">GoPay (Instan)</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 font-semibold">Nomor GoPay</span>
            <span class="font-extrabold select-all text-amber-300">081224079173</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 font-semibold">Jumlah Transfer</span>
            <span class="font-extrabold text-amber-400">Rp 150.000</span>
          </div>
        </div>

        <div class="text-[11px] text-zinc-400 leading-relaxed space-y-2">
          <p class="font-semibold text-center">Langkah Aktivasi:</p>
          <ol class="list-decimal pl-4 space-y-1">
            <li>Buka aplikasi GoPay / E-Wallet Anda.</li>
            <li>Kirim saldo sebesar **Rp 150.000** ke nomor GoPay di atas.</li>
            <li>Tekan tombol **Konfirmasi & Aktifkan** di bawah untuk langsung memverifikasi simulasi pembayaran Anda secara instan.</li>
          </ol>
        </div>

        <div class="space-y-2 pt-2">
          <button 
            onclick={() => {
              $isPremium = true;
              $showPremiumPaymentModal = false;
              triggerToast("Selamat! Royal Gold Premium Berhasil Diaktifkan.");
            }}
            class="w-full inline-flex items-center justify-center gap-2 bg-linear-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-black font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-amber-950/20 active:scale-95 transition-all"
          >
            <Crown class="w-4 h-4 text-black fill-black" />
            <span>Konfirmasi & Aktifkan (Simulasi)</span>
          </button>

          <button 
            onclick={() => $showPremiumPaymentModal = false}
            class="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 font-bold text-xs py-3 rounded-2xl border border-white/5"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- TOAST ALERTS -->
  {#if showToast}
    <div class="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3.5 bg-amber-600 border border-amber-500/30 text-white text-xs font-bold rounded-2xl shadow-xl z-[200] animate-fade-in flex items-center gap-2">
      <Crown class="w-4 h-4 text-amber-100 fill-amber-100" />
      <span>{toastMessage}</span>
    </div>
  {/if}

</div>
{:else}
  <!-- Global Loading / Skeleton Loader prior to Mount -->
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-zinc-400 gap-4">
    <div class="w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center animate-bounce">
      <BookOpen class="w-8 h-8 text-emerald-400 animate-pulse" />
    </div>
    <div class="text-center">
      <h2 class="font-bold text-lg text-emerald-400 tracking-wide">Creative Qur'an</h2>
      <p class="text-xs text-zinc-600 mt-1">Menyiapkan halaman spiritual...</p>
    </div>
  </div>
{/if}
