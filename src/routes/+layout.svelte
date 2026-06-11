<script lang="ts">
  import "./layout.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    settings,
    lastRead,
    type LastRead,
    adzanVoice,
    activeAlarms,
    savedLocation,
    isPremium,
    showPremiumPaymentModal,
    isAdmin,
    userName,
    userAvatar,
    userEmail,
    murotal,
  } from "$lib/stores";
  import {
    fetchPrayerTimes,
    fetchPrayerTimesByCity,
    type PrayerTimes,
  } from "$lib/api";
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
    Crown,
    Play,
    Pause,
    ListRestart,
    ChevronLeft,
    ChevronRight,
  } from "@lucide/svelte";

  let { children } = $props();

  let mounted = $state(false);
  let sidebarCollapsed = $state(false);
  let activeTab = $derived($page.url.pathname);
  let showPremiumBtn = $derived(activeTab === "/");
  let isReaderPage = $derived(
    activeTab.startsWith("/quran/") && activeTab !== "/quran",
  );
  let surahId = $derived(Number($page.params.id));

  // Theme derived state from store
  let themeMode = $derived($settings.theme === "dark" ? "dark" : "light");

  let toastMessage = $state<string | null>(null);
  let showToast = $state(false);

  const ALLOWED_ADMIN_EMAILS = [
    "yadiiitea73@gmail.com",
    "akhmadfarrelnashwan42@gmail.com",
    "r9n9harmadi@gmail.com",
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
  let activeAdzanName = $state("");

  const adzanUrls = {
    makkah: "https://www.islamcan.com/audio/adhan/azan1.mp3",
    madinah: "https://www.islamcan.com/audio/adhan/azan2.mp3",
    aqsa: "https://www.islamcan.com/audio/adhan/azan3.mp3",
    yusuf: "https://www.islamcan.com/audio/adhan/azan4.mp3",
  };

  async function loadTodayPrayerTimes() {
    let lat = -6.2088;
    let lon = 106.8456;
    let cityName = "Jakarta";

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

  let lastCheckedTime = "";

  function checkAdzan() {
    if (!todayPrayerTimes) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    if (timeStr === lastCheckedTime) return; // check once per minute change
    lastCheckedTime = timeStr;

    const prayerKeys = [
      { name: "Subuh", key: "Fajr" },
      { name: "Dzuhur", key: "Dhuhr" },
      { name: "Ashar", key: "Asr" },
      { name: "Maghrib", key: "Maghrib" },
      { name: "Isya", key: "Isha" },
    ];

    for (const p of prayerKeys) {
      const pTime = todayPrayerTimes[p.key as keyof PrayerTimes];
      if (!pTime) continue;

      const cleanPTime = pTime.split(" ")[0]; // extract "11:50" from "11:50 (WIB)"

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

    const url =
      adzanUrls[$adzanVoice as keyof typeof adzanUrls] || adzanUrls.makkah;
    adzanAudioPlayer = new Audio(url);
    adzanAudioPlayer.play().catch((e) => {
      console.warn(
        "Autoplay adzan blocked by browser policy. Interaction needed.",
        e,
      );
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
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        layoutWakeLock = await (navigator as any).wakeLock.request("screen");
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
    if (typeof window !== "undefined" && layoutContainer) {
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

    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const isAndroid = /Android/i.test(ua);
      if (isAndroid) {
        document.documentElement.classList.add("android-device");
      }
      const isSamsungBrowser = /SamsungBrowser/i.test(ua);
      const isSamsungDevice = /Samsung/i.test(ua) || /SM-[A-Z0-9]+/i.test(ua);
      let isMali = false;
      try {
        const canvas = document.createElement("canvas");
        const gl = (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")) as any;
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            const renderer = gl.getParameter(
              debugInfo.UNMASKED_RENDERER_ID_GI || 37446,
            );
            if (
              renderer &&
              (/Mali/i.test(renderer) || /Samsung/i.test(renderer))
            ) {
              isMali = true;
            }
          }
        }
      } catch (e) {}

      let isSamsungUAData = false;
      const nav = navigator as any;
      if (nav.userAgentData && nav.userAgentData.brands) {
        isSamsungUAData = nav.userAgentData.brands.some((b: any) =>
          /Samsung/i.test(b.brand),
        );
      }

      const isChromeAndroid = /Chrome/i.test(ua) && /Android/i.test(ua);

      if (
        isSamsungBrowser ||
        isSamsungDevice ||
        isSamsungUAData ||
        isMali ||
        isChromeAndroid
      ) {
        document.documentElement.classList.add("samsung-device");
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

  // Reactively switch Qori mid-playback when changed in Settings
  $effect(() => {
    if (mounted) {
      murotal.changeQori($settings.qori);
    }
  });

  // Role-based admin access control
  $effect(() => {
    const cleanEmail = ($userEmail || "").trim().toLowerCase();
    if (!cleanEmail || !ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
      if ($isAdmin) {
        $isAdmin = false;
      }
    }
  });

  let activationCode = $state("");
  let showProfileEditModal = $state(false);

  function handleAvatarUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          $userAvatar = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function verifyActivationCode() {
    const code = activationCode.trim();
    if (code.length > 0) {
      $isPremium = true;
      $showPremiumPaymentModal = false;
      triggerToast("Selamat! Royal Gold Premium Berhasil Diaktifkan.");
    } else {
      triggerToast("Kode aktivasi tidak boleh kosong.");
    }
  }

  function handleActivatePremium() {
    $showPremiumPaymentModal = true;
  }

  function applyTheme(theme: "light" | "dark") {
    if (typeof window === "undefined") return;

    let isDark = theme === "dark";

    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light-mode");
    } else {
      root.classList.add("light-mode");
    }
  }

  function isActive(path: string) {
    if (path === "/") {
      return activeTab === "/";
    }
    return activeTab.startsWith(path);
  }

  const menuItems = [
    { name: "Beranda", path: "/", icon: Home },
    { name: "Qur'an", path: "/quran", icon: BookOpen },
    { name: "Pencarian", path: "/search", icon: SearchIcon },
    { name: "Jadwal Sholat", path: "/sholat", icon: Compass },
    { name: "Pengaturan", path: "/settings", icon: SettingsIcon },
  ];
</script>

<svelte:head>
  <title>Creative Qur'an Indonesia</title>
  <meta
    name="description"
    content="Aplikasi Al-Qur'an Digital Modern Indonesia dengan Fitur Baca Qur'an, Jadwal Sholat, Arah Kiblat, Audio Murottal, dan Tafsir."
  />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
  />
  <meta
    name="theme-color"
    content={themeMode === "dark" ? "#030712" : "#f8fafc"}
  />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</svelte:head>

{#if mounted}
  <div
    bind:this={layoutContainer}
    class="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row islamic-bg soft-gradient {$isPremium
      ? 'premium-theme'
      : ''}"
  >
    <!-- DESKTOP SIDEBAR -->
    <aside
      class="desktop-sidebar hidden md:flex flex-col glass border-r border-white/5 p-6 h-screen sticky top-0 shrink-0 z-20 justify-between self-start transition-all duration-300 {sidebarCollapsed
        ? 'w-20'
        : 'w-64 lg:w-72'} {$isPremium ? 'premium-border' : ''}"
    >
      <div class="flex flex-col gap-8">
        <!-- App Logo & Brand & Toggle -->
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 shrink-0
            {$isPremium
                ? 'bg-linear-to-tr from-amber-500 to-yellow-300 shadow-amber-950/20'
                : 'bg-linear-to-tr from-emerald-600 to-emerald-400 shadow-emerald-950/20'}"
            >
              {#if $isPremium}
                <Crown class="w-5.5 h-5.5 text-black fill-black" />
              {:else}
                <BookOpen class="w-5 h-5 text-white" />
              {/if}
            </div>
            {#if !sidebarCollapsed}
              <div class="transition-all duration-300">
                <h1
                  class="font-bold text-sm lg:text-base tracking-wide flex items-center gap-1
                {$isPremium
                    ? 'premium-gold-text'
                    : 'text-emerald-500 dark:text-emerald-400'}"
                >
                  CREATIVE QUR'AN
                </h1>
                <span
                  class="text-[10px] font-extrabold tracking-widest uppercase block -mt-0.5
                {$isPremium ? 'premium-gold-text' : 'text-zinc-500'}"
                >
                  {$isPremium ? "PREMIUM" : "INDONESIA"}
                </span>
              </div>
            {/if}
          </div>

          <button
            onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
            class="hidden md:flex p-1.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all select-none"
          >
            {#if sidebarCollapsed}
              <ChevronRight class="w-4 h-4" />
            {:else}
              <ChevronLeft class="w-4 h-4" />
            {/if}
          </button>
        </div>

        <!-- Navigation Links Grouped -->
        <div class="flex flex-col gap-6 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar">
          <!-- MAIN GROUP -->
          <div class="flex flex-col gap-1">
            {#if !sidebarCollapsed}
              <h3 class="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-4 mb-1">Main</h3>
            {/if}
            {#each menuItems.slice(0, 3) as item (item.path)}
              {@const Icon = item.icon}
              <a
                href={item.path}
                class="flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                {sidebarCollapsed ? 'justify-center p-3.5' : 'gap-3.5 px-4 py-3'}
                {isActive(item.path)
                  ? $isPremium
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-md shadow-amber-950/10'
                    : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}"
                title={sidebarCollapsed ? item.name : ""}
              >
                <svelte:component
                  this={Icon}
                  class="w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0
                {isActive(item.path)
                    ? $isPremium ? 'text-amber-400' : 'text-emerald-400'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}"
                />
                {#if !sidebarCollapsed}
                  <span>{item.name}</span>
                {/if}
              </a>
            {/each}
          </div>

          <!-- FEATURES GROUP -->
          <div class="flex flex-col gap-1">
            {#if !sidebarCollapsed}
              <h3 class="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-4 mb-1">Features</h3>
            {/if}
            {#each menuItems.slice(3, 4) as item (item.path)}
              {@const Icon = item.icon}
              <a
                href={item.path}
                class="flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                {sidebarCollapsed ? 'justify-center p-3.5' : 'gap-3.5 px-4 py-3'}
                {isActive(item.path)
                  ? $isPremium
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-md shadow-amber-950/10'
                    : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}"
                title={sidebarCollapsed ? item.name : ""}
              >
                <svelte:component
                  this={Icon}
                  class="w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0
                {isActive(item.path)
                    ? $isPremium ? 'text-amber-400' : 'text-emerald-400'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}"
                />
                {#if !sidebarCollapsed}
                  <span>{item.name}</span>
                {/if}
              </a>
            {/each}
          </div>

          <!-- ACCOUNT GROUP -->
          <div class="flex flex-col gap-1">
            {#if !sidebarCollapsed}
              <h3 class="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-4 mb-1">Account</h3>
            {/if}
            {#each menuItems.slice(4) as item (item.path)}
              {@const Icon = item.icon}
              <a
                href={item.path}
                class="flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                {sidebarCollapsed ? 'justify-center p-3.5' : 'gap-3.5 px-4 py-3'}
                {isActive(item.path)
                  ? $isPremium
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-md shadow-amber-950/10'
                    : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}"
                title={sidebarCollapsed ? item.name : ""}
              >
                <svelte:component
                  this={Icon}
                  class="w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0
                {isActive(item.path)
                    ? $isPremium ? 'text-amber-400' : 'text-emerald-400'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}"
                />
                {#if !sidebarCollapsed}
                  <span>{item.name}</span>
                {/if}
              </a>
            {/each}
          </div>

          {#if showPremiumBtn}
            {#if !$isPremium}
              <button
                onclick={handleActivatePremium}
                class="flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 border border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 mt-2 shadow-sm cursor-pointer animate-fade-in
                {sidebarCollapsed
                  ? 'justify-center p-3.5'
                  : 'gap-3.5 px-4 py-3.5'}"
                title={sidebarCollapsed ? "Yuu Langganan" : ""}
              >
                <Crown
                  class="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse-slow shrink-0"
                />
                {#if !sidebarCollapsed}
                  <span>Yuu Langganan</span>
                {/if}
              </button>
            {:else}
              <a
                href="/premium/ebook"
                class="flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 border border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 mt-2 shadow-sm cursor-pointer animate-fade-in
                {sidebarCollapsed
                  ? 'justify-center p-3.5'
                  : 'gap-3.5 px-4 py-3.5'}"
                title={sidebarCollapsed ? "Buka E-Book Tajwid" : ""}
              >
                <BookMarked
                  class="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse-slow shrink-0"
                />
                {#if !sidebarCollapsed}
                  <span>Buka E-Book Tajwid</span>
                {/if}
              </a>
            {/if}
          {/if}
        </div>
      </div>

      <!-- User Profile at the bottom -->
      <div class="mt-auto pt-6 border-t border-black/5 dark:border-white/5">
        <button onclick={() => showProfileEditModal = true} class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'gap-3'} hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-2xl transition-colors cursor-pointer group text-left" title="Edit Profil">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 overflow-hidden group-hover:border-emerald-500/50 transition-colors">
            {#if $userAvatar}
              <img src={$userAvatar} alt="User Avatar" class="w-full h-full object-cover" />
            {:else}
              <User class="w-5 h-5 text-emerald-500" />
            {/if}
          </div>
          
          {#if !sidebarCollapsed}
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {$userName || 'Hamba Allah'}
              </h4>
              <p class="text-[10px] text-zinc-500 truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                {$userEmail || 'user@email.com'}
              </p>
            </div>
            <div class="p-2 rounded-full text-zinc-400 group-hover:text-emerald-500 transition-colors">
              <div class="flex flex-col gap-0.5 items-center">
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
              </div>
            </div>
          {/if}
        </button>
      </div>
    </aside>

    <!-- MOBILE TOP BAR -->
    {#if !isReaderPage}
      <header
        class="flex md:hidden items-center justify-between px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] glass border-b border-white/5 sticky top-0 z-30 backdrop-blur-md {$isPremium
          ? 'premium-border'
          : ''}"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center
          {$isPremium
              ? 'bg-linear-to-tr from-amber-500 to-yellow-300'
              : 'bg-linear-to-tr from-emerald-600 to-emerald-400'}"
          >
            {#if $isPremium}
              <Crown class="w-4.5 h-4.5 text-black fill-black" />
            {:else}
              <BookOpen class="w-4.5 h-4.5 text-white" />
            {/if}
          </div>
          <div>
            <h1
              class="font-bold text-xs tracking-wider flex items-center gap-1
            {$isPremium
                ? 'premium-gold-text'
                : 'text-emerald-500 dark:text-emerald-400'}"
            >
              CREATIVE QUR'AN
            </h1>
            <span
              class="text-[8px] font-bold uppercase tracking-widest block -mt-0.5 transition-all duration-300
            {$isPremium ? 'premium-gold-text' : 'text-zinc-500'}"
            >
              {$isPremium ? "PREMIUM" : "INDONESIA"}
            </span>
          </div>
        </div>
      </header>
    {/if}

    <!-- MAIN APP CONTAINER -->
    <main
      class="flex-1 min-w-0 pb-[120px] md:pb-6 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full"
    >
      {#if children}
        {@render children()}
      {/if}
    </main>

    <!-- MOBILE BOTTOM NAVIGATION -->
    {#if !isReaderPage}
      <nav
        class="md:hidden mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 px-2 pt-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,12px))] flex justify-around items-center z-40 {$isPremium
          ? 'border-t border-amber-500/20'
          : ''}"
      >
        {#each menuItems as item (item.path)}
          {@const Icon = item.icon}
          <a
            href={item.path}
            class="flex flex-col items-center justify-center gap-1 w-16 min-h-[44px] transition-all duration-300 relative group md3-ripple touch-manipulation
          {isActive(item.path)
              ? $isPremium
                ? 'text-amber-400 font-extrabold'
                : 'text-emerald-400 font-extrabold'
              : 'text-zinc-500'}"
          >
            <div
              class="p-1 rounded-xl transition-all duration-300
              {isActive(item.path)
                ? $isPremium
                  ? 'bg-amber-500/10 scale-110 text-amber-400'
                  : 'bg-emerald-500/10 scale-110 text-emerald-400'
                : 'group-hover:text-zinc-350'}"
            >
              <svelte:component this={Icon} class="w-5.5 h-5.5 transition-transform duration-300 active:scale-90" />
            </div>
            <span class="text-[9px] font-semibold tracking-wide">{item.name}</span>
            {#if isActive(item.path)}
              <span
                class="absolute -top-1.5 w-1 h-1 rounded-full {$isPremium
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'}"
              ></span>
            {/if}
          </a>
        {/each}
      </nav>
    {/if}

    <!-- ADZAN ALERT POPUP OVERLAY -->
    {#if showAdzanModal}
      <div
        class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in"
      >
        <div
          class="glass-emerald border border-emerald-500/30 p-8 rounded-3xl text-center max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div
            class="absolute inset-0 opacity-5 bg-repeat bg-size-[30px] pointer-events-none islamic-bg"
          ></div>

          <div class="relative z-10 space-y-3">
            <div
              class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce"
            >
              <Volume2 class="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>

            <div>
              <span
                class="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block"
                >Panggilan Sholat</span
              >
              <h3 class="text-2xl font-black text-white tracking-wide mt-1">
                Waktu Sholat {activeAdzanName}
              </h3>
              <p class="text-xs text-zinc-400 mt-2 font-medium">
                Marilah menuju sholat, marilah menuju kemenangan.
              </p>
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
      <div
        class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in"
      >
        <div
          class="glass border border-amber-500/30 p-6 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative"
        >
          <!-- Background pattern overlay -->
          <div
            class="absolute inset-0 opacity-5 bg-repeat bg-size-[30px] pointer-events-none islamic-bg"
          ></div>

          <button
            onclick={() => ($showPremiumPaymentModal = false)}
            class="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-white"
          >
            Tutup
          </button>

          <div class="text-center space-y-2">
            <Crown
              class="w-12 h-12 text-amber-400 mx-auto fill-amber-400 animate-pulse-slow"
            />
            <h3 class="text-xl font-extrabold text-white tracking-wide">
              Akses Royal Premium
            </h3>
            <span
              class="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider block"
              >Creative Qur'an Indonesia</span
            >
          </div>

          <!-- Fitur Premium List -->
          <div
            class="border border-white/10 rounded-2xl p-4.5 bg-amber-950/10 text-left space-y-2.5"
          >
            <p
              class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
            >
              Fitur Premium Yang Didapatkan:
            </p>
            <ul class="space-y-2 text-xs text-zinc-300">
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
                <span>Bisa akses e-book lengkap belajar tajwid</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
                <span
                  >Pengoreksi makhraj huruf menggunakan sistem pintar <strong
                    >AI Islamic Correction</strong
                  ></span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 text-[10px] mt-0.5">✦</span>
                <span>Tampilan jadwal sholat yang lebih bagus</span>
              </li>
            </ul>
          </div>

          <div
            class="border border-white/10 rounded-2xl p-4 space-y-3.5 bg-amber-950/15"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400 font-semibold">Metode Pembayaran</span>
              <span class="font-extrabold text-emerald-400">GoPay (Instan)</span
              >
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400 font-semibold">Nomor GoPay</span>
              <span class="font-extrabold select-all text-amber-300"
                >081224079173</span
              >
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400 font-semibold">Jumlah Transfer</span>
              <span class="font-extrabold text-amber-400">Rp 24.000</span>
            </div>
          </div>

          <div class="text-[11px] text-zinc-400 leading-relaxed space-y-2">
            <p class="font-semibold text-center">Langkah Aktivasi:</p>
            <ol class="list-decimal pl-4 space-y-1">
              <li>Buka aplikasi GoPay / E-Wallet Anda.</li>
              <li>
                Kirim saldo sebesar **Rp 24.000** ke nomor GoPay di atas.
              </li>
              <li>
                Kirim bukti transfer ke WhatsApp admin dengan menekan tombol
                hijau di bawah untuk mendapatkan kode aktivasi Anda.
              </li>
            </ol>
          </div>

          <div class="space-y-3 pt-2">
            <a
              href="https://wa.me/6285720387781?text=Halo%20Admin,%20saya%20sudah%20transfer%20Rp%2024.000%20ke%20GoPay%20081224079173%20untuk%20Creative%20Qur'an%20Premium.%20Mohon%20kirimkan%20kode%20aktivasi."
              target="_blank"
              class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-center"
            >
              <span>Hubungi Admin & Kirim Bukti Transfer</span>
            </a>

            <div class="border-t border-white/10 my-3 pt-3">
              <span
                class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5 text-left"
                >Masukkan Kode Aktivasi</span
              >
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={activationCode}
                  placeholder="Masukkan kode..."
                  class="flex-1 bg-stone-950/40 border border-white/10 text-white text-xs rounded-xl py-2.5 px-3 outline-none focus:border-amber-500/50 transition-all font-semibold uppercase"
                />
                <button
                  onclick={verifyActivationCode}
                  class="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-black font-black text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Aktifkan
                </button>
              </div>
            </div>

            <button
              onclick={() => ($showPremiumPaymentModal = false)}
              class="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 font-bold text-xs py-3 rounded-2xl border border-white/5 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- MOBILE FLOATING PREMIUM BUBBLE -->
    {#if showPremiumBtn}
      <div class="md:hidden fixed z-30 animate-float" style="bottom: calc(5rem + env(safe-area-inset-bottom, 0px)); right: 1rem;">
        {#if !$isPremium}
          <button
            onclick={handleActivatePremium}
            class="w-14 h-14 rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 shadow-xl shadow-amber-500/30 flex items-center justify-center border border-amber-400/50 cursor-pointer active:scale-90 transition-transform duration-200 relative group"
            aria-label="Aktivasi Premium"
          >
            <!-- Pulsing gold ring overlay -->
            <span
              class="absolute inset-0 rounded-full bg-amber-400/30 animate-ping"
            ></span>
            <Crown class="w-6 h-6 text-black fill-black relative z-10" />
          </button>
        {:else}
          <a
            href="/premium/ebook"
            class="w-14 h-14 rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 shadow-xl shadow-amber-500/30 flex items-center justify-center border border-amber-400/50 cursor-pointer active:scale-90 transition-transform duration-200 relative"
            aria-label="Buka E-Book"
          >
            <BookMarked class="w-6 h-6 text-black relative z-10" />
          </a>
        {/if}
      </div>
    {/if}

    <!-- EDIT PROFILE MODAL -->
    {#if showProfileEditModal}
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
        <div class="glass border border-emerald-500/30 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative">
          <button
            onclick={() => (showProfileEditModal = false)}
            class="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-white cursor-pointer"
          >
            Tutup
          </button>

          <div class="text-center space-y-2">
            <label for="avatarUpload" class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/30 cursor-pointer overflow-hidden group relative hover:border-emerald-500/60 transition-colors shadow-lg" title="Ganti Foto">
              {#if $userAvatar}
                <img src={$userAvatar} alt="User Avatar" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <User class="w-6 h-6 text-white" />
                </div>
              {:else}
                <User class="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
              {/if}
            </label>
            <input id="avatarUpload" type="file" accept="image/*" class="hidden" onchange={handleAvatarUpload} />
            <h3 class="text-xl font-extrabold text-white tracking-wide">
              Edit Profil
            </h3>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="userName" class="text-xs font-bold text-zinc-400">Nama</label>
              <input
                id="userName"
                type="text"
                bind:value={$userName}
                placeholder="Hamba Allah"
                class="w-full bg-stone-950/40 border border-white/10 text-white text-sm rounded-xl py-3 px-4 outline-none focus:border-emerald-500/50 transition-all font-semibold"
              />
            </div>
            
            <div class="space-y-1.5">
              <label for="userEmail" class="text-xs font-bold text-zinc-400">Email</label>
              <input
                id="userEmail"
                type="email"
                bind:value={$userEmail}
                placeholder="user@email.com"
                class="w-full bg-stone-950/40 border border-white/10 text-white text-sm rounded-xl py-3 px-4 outline-none focus:border-emerald-500/50 transition-all font-semibold"
              />
            </div>
          </div>

          <button
            onclick={() => (showProfileEditModal = false)}
            class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Simpan Profil
          </button>
        </div>
      </div>
    {/if}

    <!-- FLOATING PERSISTENT PLAYER -->
    {#if $murotal.activeAyahNum !== null && $murotal.surah && (!isReaderPage || $murotal.surah.nomor !== surahId)}
      <div
        class="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-[360px] glass-emerald border border-emerald-500/30 p-4 rounded-3xl z-40 shadow-2xl flex items-center gap-4 animate-slide-up"
      >
        <div
          class="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg text-white"
        >
          <Volume2 class="w-5.5 h-5.5 animate-bounce" />
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-white truncate">
            {$murotal.surah.namaLatin} • Ayah {$murotal.activeAyahNum}
          </h4>
          <span
            class="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5"
            >Qori: Sheik {$settings.qori}</span
          >
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Close Player -->
          <button
            onclick={() => murotal.stop()}
            class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
            title="Tutup Player"
          >
            <ListRestart class="w-4.5 h-4.5" />
          </button>

          <!-- Play/Pause Toggle -->
          <button
            onclick={() => {
              if ($murotal.isPlaying) {
                murotal.pause();
              } else {
                murotal.resume();
              }
            }}
            class="w-10 h-10 rounded-xl bg-white text-emerald-950 flex items-center justify-center hover:scale-105 active:scale-95 shadow-md"
            title="Mainkan/Jeda"
          >
            {#if $murotal.isPlaying}
              <Pause class="w-4.5 h-4.5 text-emerald-950" fill="currentColor" />
            {:else}
              <Play class="w-4.5 h-4.5 text-emerald-950" fill="currentColor" />
            {/if}
          </button>
        </div>
      </div>
    {/if}

    <!-- TOAST ALERTS -->
    {#if showToast}
      <div
        class="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3.5 bg-amber-600 border border-amber-500/30 text-white text-xs font-bold rounded-2xl shadow-xl z-[200] animate-fade-in flex items-center gap-2"
      >
        <Crown class="w-4 h-4 text-amber-100 fill-amber-100" />
        <span>{toastMessage}</span>
      </div>
    {/if}
  </div>
{:else}
  <!-- Global Loading / Skeleton Loader prior to Mount -->
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-zinc-400 gap-4"
  >
    <div
      class="w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center animate-bounce"
    >
      <BookOpen class="w-8 h-8 text-emerald-400 animate-pulse" />
    </div>
    <div class="text-center">
      <h2 class="font-bold text-lg text-emerald-400 tracking-wide">
        Creative Qur'an
      </h2>
      <p class="text-xs text-zinc-600 mt-1">sambil menunggu dzikir dulu yuu</p>
    </div>
  </div>
{/if}
