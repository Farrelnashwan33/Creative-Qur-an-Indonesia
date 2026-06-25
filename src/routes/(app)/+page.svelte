<script lang="ts">
  import { onMount } from 'svelte';
  import { lastRead, favorites, readingHistory, readingStats, savedLocation, type LastRead, type ReadingStat, isPremium, showPremiumPaymentModal } from '$lib/stores';
  import { fetchPrayerTimes, fetchPrayerTimesByCity, type PrayerData, type PrayerTimes } from '$lib/api';
  import { 
    BookMarked, 
    Compass, 
    Search, 
    BookOpen, 
    ArrowRight, 
    MapPin, 
    Volume2, 
    Clock, 
    Check, 
    Calendar,
    Sparkles,
    Crown,
    Lock,
    Heart
  } from '@lucide/svelte';

  // Derived counts from stores
  let favoritesCount = $derived($favorites.length);
  let historyCount = $derived($readingHistory.length);
  
  // Location info derived from savedLocation store
  let locationInfo = $derived(
    $savedLocation 
      ? { lat: $savedLocation.latitude, lon: $savedLocation.longitude, city: $savedLocation.cityName }
      : { lat: -6.2088, lon: 106.8456, city: 'Jakarta' }
  );
  
  let prayerData = $state<PrayerData | null>(null);
  let loadingPrayer = $state(true);
  let errorPrayer = $state<string | null>(null);
  
  let nextPrayerName = $state('');
  let nextPrayerTime = $state('');
  let nextPrayerCountdown = $state('');
  let countdownTimer = $state<any>(null);

  const islamicQuotes = [
    { text: "Sesungguhnya Al-Qur'an ini memberikan petunjuk kepada (jalan) yang lebih lurus...", surah: "QS. Al-Isra: 9" },
    { text: "Maka sesungguhnya bersama kesulitan ada kemudahan.", surah: "QS. Al-Insyirah: 5" },
    { text: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.", surah: "QS. Ar-Ra'd: 28" },
    { text: "Dan Kami turunkan dari Al-Qur'an (sesuatu) yang menjadi penawar dan rahmat bagi orang yang beriman...", surah: "QS. Al-Isra: 82" }
  ];
  let dailyQuote = $state(islamicQuotes[0]);

  // Greeting based on time
  let greeting = $state('Assalamu\'alaikum');
  function getGreeting() {
    const hours = new Date().getHours();
    if (hours < 10) return 'Assalamu\'alaikum, Selamat Pagi';
    if (hours < 15) return 'Assalamu\'alaikum, Selamat Siang';
    if (hours < 18) return 'Assalamu\'alaikum, Selamat Sore';
    return 'Assalamu\'alaikum, Selamat Malam';
  }

  onMount(() => {
    greeting = getGreeting();
    dailyQuote = islamicQuotes[Math.floor(Math.random() * islamicQuotes.length)];
    
    let stored = null;
    try {
      stored = localStorage.getItem('quran_location');
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
    if (!stored) {
      autoDetectLocation();
    }

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  });

  // Load prayer times whenever locationInfo changes
  $effect(() => {
    if (locationInfo) {
      loadPrayerTimes();
    }
  });

  async function autoDetectLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let cityName = 'Lokasi GPS';
        
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            cityName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Lokasi GPS';
          }
        } catch (e) {
          console.error("Error geocoding on mount:", e);
        }
        
        savedLocation.set({
          latitude: lat,
          longitude: lon,
          cityName
        });
      },
      (err) => {
        console.warn("Location permission not granted. Defaulting to Jakarta.", err);
      }
    );
  }

  async function loadPrayerTimes() {
    loadingPrayer = true;
    errorPrayer = null;
    try {
      // Try to load prayer times
      const data = await fetchPrayerTimes(locationInfo.lat, locationInfo.lon);
      prayerData = data;
      calculateNextPrayer(data.timings);
    } catch (e) {
      console.warn("Could not load prayer times with GPS coordinates, trying by city name...");
      try {
        const data = await fetchPrayerTimesByCity(locationInfo.city);
        prayerData = data;
        calculateNextPrayer(data.timings);
      } catch (err) {
        errorPrayer = "Gagal memuat jadwal sholat.";
      }
    } finally {
      loadingPrayer = false;
    }
  }

  function calculateNextPrayer(timings: PrayerTimes) {
    if (countdownTimer) clearInterval(countdownTimer);

    const prayerOrder = [
      { name: 'Subuh', key: 'Fajr' },
      { name: 'Dzuhur', key: 'Dhuhr' },
      { name: 'Ashar', key: 'Asr' },
      { name: 'Maghrib', key: 'Maghrib' },
      { name: 'Isya', key: 'Isha' }
    ];

    countdownTimer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();
      let foundNext = false;

      for (let i = 0; i < prayerOrder.length; i++) {
        const prayer = prayerOrder[i];
        const timeStr = timings[prayer.key as keyof PrayerTimes]; // e.g. "04:30"
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerTimeDate = new Date();
        prayerTimeDate.setHours(hours, minutes, 0, 0);

        if (prayerTimeDate.getTime() > nowMs) {
          nextPrayerName = prayer.name;
          nextPrayerTime = timeStr;
          
          const diffMs = prayerTimeDate.getTime() - nowMs;
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          nextPrayerCountdown = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
          foundNext = true;
          break;
        }
      }

      // If no prayer is left for today, the next one is tomorrow's Fajr
      if (!foundNext) {
        nextPrayerName = 'Subuh (Besok)';
        const timeStr = timings.Fajr;
        nextPrayerTime = timeStr;
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerTimeDate = new Date();
        prayerTimeDate.setDate(prayerTimeDate.getDate() + 1);
        prayerTimeDate.setHours(hours, minutes, 0, 0);

        const diffMs = prayerTimeDate.getTime() - nowMs;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        nextPrayerCountdown = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  // Get reading count for the last 7 days
  function getWeeklyStats() {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = $readingStats.find(s => s.date === dateStr);
      list.push({
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        count: match ? match.count : 0
      });
    }
    return list;
  }

  let weeklyStats = $derived(getWeeklyStats());
  let maxStatVal = $derived(Math.max(...weeklyStats.map(s => s.count), 5));

  let totalAyatDibaca = $derived($readingStats.reduce((sum, s) => sum + s.count, 0));
  let totalSurahDibaca = $derived(new Set($readingHistory.map(h => h.surahNumber)).size);
  
  function getDailyStreak() {
    let streak = 0;
    const sorted = [...$readingStats].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return 0;
    
    let expectedDate = new Date();
    const todayStr = expectedDate.toISOString().split('T')[0];
    
    let latest = sorted[0];
    let latestDate = new Date(latest.date);
    let today = new Date(todayStr);
    let diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return 0;
    }
    
    let cursor = latestDate;
    for (const stat of sorted) {
      let statDate = new Date(stat.date);
      let diff = Math.floor((cursor.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0 || diff === 1) {
        if (stat.count > 0) {
          streak++;
          cursor = statDate;
        }
      } else {
        break;
      }
    }
    return streak;
  }
  let streakHarian = $derived(getDailyStreak());
</script>

<div class="space-y-8 animate-fade-in pb-12">
  
  <!-- HERO GREETING & INTEGRATED CONTINUE READING BANNER -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-col justify-between min-h-[260px] transition-all duration-300
      {$isPremium 
        ? 'bg-gradient-to-tr from-emerald-950 via-indigo-950 to-stone-950 border border-indigo-500/35 shadow-indigo-950/20' 
        : 'bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-950 border border-emerald-500/20 shadow-emerald-900/10'} shadow-xl group">
      <!-- Islamic background pattern overlay -->
      <div class="absolute inset-0 opacity-10 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      
      {#if $isPremium}
        <!-- Golden particles/sparkles layout -->
        <div class="absolute inset-0 pointer-events-none opacity-20 flex justify-around items-center">
          <div class="w-1.5 h-1.5 rounded-full bg-indigo-400 premium-sparkle"></div>
          <div class="w-1 h-1 rounded-full bg-violet-300 premium-sparkle" style="animation-delay: 1s"></div>
          <div class="w-2 h-2 rounded-full bg-indigo-500 premium-sparkle" style="animation-delay: 2s"></div>
        </div>
      {/if}
      
      <div class="relative z-10 space-y-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider
          {$isPremium 
            ? 'bg-indigo-500/10 border border-indigo-400/30 text-indigo-400' 
            : 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400'}">
          {#if $isPremium}
            <Crown class="w-3.5 h-3.5 fill-indigo-400" />
            <span>Creative Qur'an Premium</span>
          {:else}
            <Sparkles class="w-3.5 h-3.5" />
            <span>Creative Qur'an Indonesia</span>
          {/if}
        </span>
        <h2 class="text-2xl lg:text-3xl font-extrabold text-white tracking-wide mt-2">{greeting}</h2>
        <p class="text-zinc-300 text-sm max-w-lg leading-relaxed mt-2 font-medium">
          "{dailyQuote.text}"
        </p>
        <span class="block text-xs font-bold mt-1 {$isPremium ? 'text-indigo-400' : 'text-emerald-400'}">{dailyQuote.surah}</span>
      </div>

      <!-- CONTINUE READING CARD (Inside Hero Section) -->
      <div class="relative z-10 mt-6 pt-6 border-t border-white/10">
        {#if $lastRead}
          <div class="flex items-center justify-between gap-4 p-4.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all duration-300">
            <div class="space-y-1">
              <span class="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Lanjutkan Bacaan</span>
              <h4 class="text-base font-extrabold text-white">{$lastRead.surahName}</h4>
              <p class="text-xs text-zinc-300 font-medium">Surah ke-{$lastRead.surahNumber} • Ayat Ke-{$lastRead.ayahNumber}</p>
            </div>
            
            <div class="flex items-center gap-4">
              <!-- Visual Progress Ring -->
              <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg class="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.06)" stroke-width="3.5" fill="transparent" />
                  <circle cx="24" cy="24" r="20" stroke="{$isPremium ? '#f4c542' : '#2bae85'}" stroke-width="3.5" fill="transparent" stroke-dasharray="125.66" stroke-dashoffset={125.66 * (1 - 74/100)} />
                </svg>
                <span class="absolute text-[10px] font-black text-white">74%</span>
              </div>

              <a 
                href="/quran/{$lastRead.surahNumber}" 
                class="inline-flex items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition-all shadow-md"
              >
                <ArrowRight class="w-4 h-4" />
              </a>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-between gap-4 p-4.5 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <h4 class="text-sm font-bold text-white">Belum ada riwayat bacaan</h4>
              <p class="text-xs text-zinc-400 font-medium">Mulailah membaca Al-Qur'an hari ini.</p>
            </div>
            <a 
              href="/quran" 
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition-all"
            >
              <span>Mulai</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </a>
          </div>
        {/if}
      </div>
    </div>

    <!-- PRAYER TIME COUNTDOWN CARD -->
    <div class="rounded-3xl p-6 flex flex-col justify-between min-h-[260px] relative overflow-hidden group shadow-xl transition-all duration-300
      {$isPremium 
        ? 'bg-gradient-to-bl from-stone-950 via-indigo-950 to-emerald-950 border border-indigo-500/35 shadow-indigo-950/20' 
        : 'bg-gradient-to-bl from-emerald-950 via-emerald-800 to-emerald-900 border border-emerald-500/20 shadow-emerald-900/10'}">
      <!-- Islamic background pattern overlay -->
      <div class="absolute inset-0 opacity-10 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      
      <div class="flex items-center justify-between relative z-10">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 animate-pulse-slow {$isPremium ? 'text-indigo-400' : 'text-emerald-400'}" />
          <h3 class="font-bold text-sm text-zinc-300">Waktu Sholat</h3>
        </div>
        <div class="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
          {$isPremium ? 'text-indigo-400 bg-indigo-500/10' : 'text-emerald-400 bg-emerald-500/10'}">
          <MapPin class="w-3.5 h-3.5" />
          <span>{locationInfo.city}</span>
        </div>
      </div>

      {#if loadingPrayer}
        <div class="py-4 space-y-2 animate-pulse relative z-10">
          <div class="h-8 bg-white/5 rounded-xl w-3/4"></div>
          <div class="h-4 bg-white/5 rounded-lg w-1/2"></div>
        </div>
      {:else}
        <div class="py-4 relative z-10">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Menuju Sholat {nextPrayerName}</span>
          <h4 class="text-4xl font-extrabold text-white tracking-wider mt-1">{nextPrayerCountdown}</h4>
          <p class="text-xs text-zinc-400 mt-1 font-semibold">Pukul {nextPrayerTime} WIB</p>
        </div>
      {/if}

      <div class="flex gap-2 relative z-10">
        <a href="/sholat" class="flex-1 inline-flex items-center justify-center gap-2 active:scale-95 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg transition-all
          {$isPremium 
            ? 'bg-indigo-500 hover:bg-indigo-400 text-black shadow-indigo-950/20' 
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'}">
          <Compass class="w-4 h-4" />
          <span>Jadwal & Arah Kiblat</span>
        </a>
      </div>
    </div>
  </section>

  <!-- DAILY QURAN VERSE CARD -->
  <section class="space-y-4">
    <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase px-1">Ayat Hari Ini</h3>
    <div class="glass border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-lg text-center space-y-4">
      <div class="absolute inset-0 opacity-5 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
        QS. Al-Baqarah: 255 (Ayat Kursi)
      </span>
      <p class="font-arabic-utsmani text-2xl lg:text-3xl text-white leading-relaxed text-center" dir="rtl">
        اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ
      </p>
      <p class="text-xs text-zinc-400 italic font-medium leading-relaxed max-w-2xl mx-auto">
        "Allah, tidak ada tuhan selain Dia. Yang Maha Hidup, yang terus-menerus mengurus (makhluk-Nya), tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi."
      </p>
    </div>
  </section>

  <!-- PREMIUM E-BOOK PROMO / QUICK ENTRY -->
  <section class="rounded-3xl p-5.5 glass border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md
    {$isPremium 
      ? 'border-indigo-500/25 bg-gradient-to-r from-emerald-950/40 to-indigo-950/30' 
      : 'border-white/5 bg-white/[0.01]'}"
  >
    <div class="flex items-center gap-4 text-left">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
        {$isPremium 
          ? 'bg-indigo-500/10 text-indigo-400' 
          : 'bg-zinc-800 text-zinc-500'}"
      >
        {#if $isPremium}
          <Crown class="w-6 h-6 fill-indigo-400" />
        {:else}
          <Lock class="w-5 h-5 text-zinc-500" />
        {/if}
      </div>
      <div>
        <h4 class="font-extrabold text-sm text-white flex items-center gap-2">
          E-Book Tajwid & Makhorijul Huruf
          <span class="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PREMIUM</span>
        </h4>
        <p class="text-xs text-zinc-400 leading-relaxed font-semibold mt-1">Pelajari kaidah tajwid lengkap beserta diagram interaktif makhorijul huruf dengan suara pelafalan.</p>
      </div>
    </div>
    <div class="w-full md:w-auto shrink-0">
      {#if $isPremium}
        <a 
          href="/premium/ebook" 
          class="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-300 text-black font-black text-xs px-5 py-3 rounded-xl active:scale-95 shadow-md transition-all"
        >
          <span>Buka E-Book</span>
          <ArrowRight class="w-4 h-4" />
        </a>
      {:else}
        <button 
          onclick={() => showPremiumPaymentModal.set(true)}
          class="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs px-5 py-3 rounded-xl border border-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <Crown class="w-4 h-4 text-indigo-400 fill-indigo-400" />
          <span>Yuu Langganan</span>
        </button>
      {/if}
    </div>
  </section>

  <!-- QUICK ACCESS MENU -->
  <section class="space-y-4">
    <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase px-1">Menu Utama</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <a href="/quran" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300 text-emerald-400">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Baca Qur'an</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Surah & Juz</p>
        </div>
      </a>

      <a href="/sholat" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300 text-emerald-400">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Jadwal Sholat</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Waktu Adzan</p>
        </div>
      </a>

      <a href="/sholat" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-300 text-indigo-400">
          <Compass class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Arah Kiblat</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Kompas Ka'bah</p>
        </div>
      </a>

      <a href="/sholat" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 text-blue-400">
          <Calendar class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Kalender Hijriah</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Kalender Islam</p>
        </div>
      </a>

      <a href="/quran" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all duration-300 text-red-400">
          <Heart class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Bookmark</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Ayat Favorit</p>
        </div>
      </a>

      <a href="#stats-section" class="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/20 group">
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-300 text-purple-400">
          <Sparkles class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-xs text-zinc-200">Statistik</h4>
          <p class="text-[9px] text-zinc-500 font-semibold mt-0.5">Grafik Tilawah</p>
        </div>
      </a>
    </div>
  </section>

  <!-- STATISTICS SECTION -->
  <section id="stats-section" class="space-y-6 scroll-mt-24">
    <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase px-1">Statistik Tilawah</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass border border-white/5 rounded-3xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Ayat Dibaca</span>
          <span class="text-xl font-extrabold text-white mt-0.5 block">{totalAyatDibaca} <span class="text-xs text-zinc-400 font-normal">Ayat</span></span>
        </div>
      </div>

      <div class="glass border border-white/5 rounded-3xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400">
          <BookMarked class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Surah Dibaca</span>
          <span class="text-xl font-extrabold text-white mt-0.5 block">{totalSurahDibaca} <span class="text-xs text-zinc-400 font-normal">Surah</span></span>
        </div>
      </div>

      <div class="glass border border-white/5 rounded-3xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Sparkles class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Streak Harian</span>
          <span class="text-xl font-extrabold text-white mt-0.5 block">{streakHarian} <span class="text-xs text-zinc-400 font-normal">Hari Aktif</span></span>
        </div>
      </div>
    </div>

    <!-- READING STATS GRAPH -->
    <div class="glass border border-white/5 rounded-3xl p-6 shadow-lg">
      <div class="flex items-center justify-between pb-4 border-b border-white/5">
        <h3 class="font-bold text-sm text-zinc-300">Grafik Aktivitas Qur'an</h3>
        <span class="text-xs font-semibold text-zinc-500">7 Hari Terakhir</span>
      </div>

      <!-- Mini graphic bar chart -->
      <div class="flex items-end justify-between h-44 pt-8 px-4">
        {#each weeklyStats as item (item.dayName)}
          {@const heightPercent = Math.min(100, Math.max(10, (item.count / maxStatVal) * 100))}
          <div class="flex flex-col items-center gap-2.5 w-12">
            <span class="text-[10px] font-bold text-emerald-400">{item.count > 0 ? `${item.count}a` : ''}</span>
            <div 
              style="height: {heightPercent}%; min-height: 8px;" 
              class="w-5 rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/10 group relative transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300"
            >
              <!-- Tooltip -->
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 glass border border-white/10 px-2 py-0.5 rounded text-[8px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {item.count} Ayat
              </div>
            </div>
            <span class="text-xs text-zinc-500 font-semibold">{item.dayName}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

</div>
