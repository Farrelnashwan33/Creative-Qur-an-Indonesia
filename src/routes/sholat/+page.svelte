<script lang="ts">
  import { onMount } from 'svelte';
  import { savedLocation, activeAlarms, type AlarmSettings } from '$lib/stores';
  import { fetchPrayerTimes, fetchPrayerTimesByCity, type PrayerData } from '$lib/api';
  import { 
    Compass, 
    MapPin, 
    Calendar as CalendarIcon, 
    Navigation, 
    Locate, 
    AlertCircle,
    Bell,
    BellOff,
    Check,
    ArrowLeft
  } from '@lucide/svelte';

  let prayerData = $state<PrayerData | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Default coordinate setup (Jakarta)
  let latitude = $state(-6.2088);
  let longitude = $state(106.8456);
  let city = $state('Jakarta');
  
  // Interactive Compass
  let deviceHeading = $state(0);
  let qiblaAngle = $state(0);
  let supportsCompass = $state(false);

  // Reactive dependency on savedLocation to update local coordinates
  $effect(() => {
    if ($savedLocation) {
      latitude = $savedLocation.latitude;
      longitude = $savedLocation.longitude;
      city = $savedLocation.cityName;
      loadData();
    }
  });

  onMount(() => {
    // If savedLocation is not set, load default data
    if (!$savedLocation) {
      loadData();
    }
    setupCompass();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  });

  async function loadData() {
    loading = true;
    error = null;
    try {
      qiblaAngle = calculateQibla(latitude, longitude);
      const data = await fetchPrayerTimes(latitude, longitude);
      prayerData = data;
    } catch (e) {
      try {
        const data = await fetchPrayerTimesByCity(city);
        prayerData = data;
      } catch (err) {
        error = "Gagal memuat jadwal sholat. Silakan periksa koneksi atau pilih lokasi manual.";
      }
    } finally {
      loading = false;
    }
  }

  // Geolocation detector
  function detectLocation() {
    if (!navigator.geolocation) {
      error = "Geolokasi tidak didukung oleh browser Anda.";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
         latitude = pos.coords.latitude;
         longitude = pos.coords.longitude;
         let cityName = "Lokasi GPS";

         try {
           const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
           if (geoRes.ok) {
             const geoData = await geoRes.json();
             cityName = geoData.city || geoData.locality || geoData.principalSubdivision || "Lokasi GPS";
           }
         } catch (e) {
           console.error("Error geocoding in prayer times:", e);
         }

         city = cityName;
         
         // Save to store
         savedLocation.set({
           latitude,
           longitude,
           cityName: city
         });
      },
      (err) => {
         error = "Tidak dapat mengakses lokasi GPS. Menggunakan lokasi default (Jakarta).";
         loadData();
      }
    );
  }

  // Mathematical Qibla angle calculation (Mecca coordinate: 21.4225 N, 39.8262 E)
  function calculateQibla(lat: number, lon: number): number {
    const phi1 = lat * Math.PI / 180;
    const lambda1 = lon * Math.PI / 180;
    const phi2 = 21.4225 * Math.PI / 180;
    const lambda2 = 39.8262 * Math.PI / 180;

    const deltaLambda = lambda2 - lambda1;
    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = qiblaRad * 180 / Math.PI;
    return Math.round((qiblaDeg + 360) % 360);
  }

  // Compass orientation handlers
  function setupCompass() {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;
    
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation);
      supportsCompass = true;
    } else if ('ondeviceorientation' in win) {
      win.addEventListener('deviceorientation', handleOrientation);
      supportsCompass = true;
    }
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    const heading = (e as any).webkitCompassHeading || e.alpha;
    if (heading !== null && heading !== undefined) {
      deviceHeading = Math.round(heading);
    }
  }

  function toggleAlarm(key: string) {
    activeAlarms.update(val => {
      val[key as keyof AlarmSettings] = !val[key as keyof AlarmSettings];
      return { ...val };
    });
  }

  const prayers = [
    { label: 'Imsak', key: 'Imsak' },
    { label: 'Subuh', key: 'Fajr' },
    { label: 'Dzuhur', key: 'Dhuhr' },
    { label: 'Ashar', key: 'Asr' },
    { label: 'Maghrib', key: 'Maghrib' },
    { label: 'Isya', key: 'Isha' }
  ];
</script>

<div class="space-y-6">

  <!-- PAGE HEADER -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
        <Compass class="w-6 h-6 text-emerald-400" />
        Jadwal Sholat & Kiblat
      </h2>
      <p class="text-xs text-zinc-500 font-semibold mt-1">Jadwal sholat harian berdasarkan lokasi GPS aktif Anda</p>
    </div>

    <div class="flex items-center gap-2">
      <a 
        href="/"
        class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 active:scale-95 transition-all"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Kembali ke Home</span>
      </a>

      <button 
        onclick={detectLocation}
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 hover:border-emerald-500/20 text-xs font-bold text-emerald-400 active:scale-95 w-fit"
      >
        <Locate class="w-4 h-4" />
        <span>Deteksi Lokasi GPS</span>
      </button>
    </div>
  </div>

  <!-- MAIN SHOLAT GRID -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- SCHEDULE TIMETABLE -->
    <div class="lg:col-span-2 space-y-4">
      {#if loading}
        <!-- Loading Skeleton -->
        <div class="glass border border-white/5 rounded-3xl p-6 space-y-4 animate-pulse">
          <div class="h-6 bg-white/5 rounded w-1/3"></div>
          <div class="space-y-3">
            {#each Array(6) as _, i (i)}
              <div class="h-12 bg-white/5 rounded-xl"></div>
            {/each}
          </div>
        </div>
      {:else if error || !prayerData}
        <div class="glass border border-white/5 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle class="w-12 h-12 text-rose-500 mx-auto" />
          <p class="text-sm text-zinc-400 font-semibold">{error || 'Gagal memuat jadwal.'}</p>
          <button onclick={loadData} class="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg">
            Segarkan
          </button>
        </div>
      {:else}
        <!-- DATES AND HIJRI INFO -->
        <div class="glass border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CalendarIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-sm text-zinc-200">{prayerData.date.hijri.day} {prayerData.date.hijri.month.en} {prayerData.date.hijri.year} H</h3>
              <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">{prayerData.date.readable}</p>
            </div>
          </div>
          <div class="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            Kalkulasi Kemenag RI (Method: 20)
          </div>
        </div>

        <!-- PRAYER ROWS -->
        <div class="glass border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
          {#each prayers as prayer (prayer.key)}
            {@const time = prayerData.timings[prayer.key as keyof typeof prayerData.timings]}
            <div class="flex items-center justify-between p-4.5 hover:bg-white/[0.01] transition-colors">
              <div class="flex items-center gap-3">
                <span class="font-bold text-sm text-zinc-300">{prayer.label}</span>
              </div>

              <div class="flex items-center gap-4">
                <span class="text-base font-extrabold text-white tracking-wide">{time} WIB</span>
                
                {#if prayer.key !== 'Imsak'}
                  <!-- Alarm/Adzan Notification toggle -->
                  <button 
                    onclick={() => toggleAlarm(prayer.key)}
                    class="p-2 rounded-xl transition-all duration-300
                      {$activeAlarms[prayer.key as keyof AlarmSettings] 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : 'text-zinc-600 hover:text-zinc-400'}"
                    title="Nyalakan Notifikasi Adzan"
                  >
                    {#if $activeAlarms[prayer.key as keyof AlarmSettings]}
                      <Bell class="w-4 h-4" />
                    {:else}
                      <BellOff class="w-4 h-4" />
                    {/if}
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- KIBLAT COMPASS SIDEBAR -->
    <div class="glass border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[380px] shadow-lg">
      <div class="w-full text-center space-y-1">
        <h3 class="font-bold text-sm text-zinc-300">Arah Kiblat</h3>
        <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Derajat: {qiblaAngle}° Utara-Timur</p>
      </div>

      <!-- COMPASS DISC -->
      <div class="relative w-48 h-48 my-6 flex items-center justify-center">
        <!-- Outer Glowing Ring -->
        <div class="absolute inset-0 rounded-full border border-emerald-500/20 shadow-xl shadow-emerald-950/20 animate-pulse-slow"></div>
        
        <!-- Dial disc rotating with device heading to keep North pointing to true North -->
        <div 
          style="transform: rotate({-deviceHeading}deg);" 
          class="w-44 h-44 rounded-full border border-white/10 glass flex items-center justify-center transition-transform duration-500 absolute"
        >
          <!-- Cardinal directions indicator inside compass -->
          <span class="absolute top-2.5 text-[10px] font-black text-rose-500">U</span>
          <span class="absolute right-2.5 text-[10px] font-black text-zinc-500 font-semibold">T</span>
          <span class="absolute bottom-2.5 text-[10px] font-black text-zinc-500 font-semibold">S</span>
          <span class="absolute left-2.5 text-[10px] font-black text-zinc-500 font-semibold">B</span>
        </div>

        <!-- Separate Kiblat icon needle pointing to Mecca (rotated by Qibla Angle - device heading) -->
        <div 
          style="transform: rotate({qiblaAngle - deviceHeading}deg);" 
          class="w-44 h-44 rounded-full flex items-center justify-center transition-transform duration-500 absolute pointer-events-none"
        >
          <div class="relative w-full h-full flex items-center justify-center">
            <!-- Glow indicator on top -->
            <div class="absolute top-4 w-4 h-4 rounded-full bg-amber-500/30 animate-ping"></div>
            <!-- Needle line -->
            <div class="w-0.5 h-32 bg-gradient-to-b from-amber-400 via-emerald-500 to-transparent"></div>
            <!-- 3D SVG Kaaba Icon at the tip of the needle pointing to Kaaba -->
            <svg class="w-8 h-8 absolute -top-3.5 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Top roof -->
              <path d="M12 3L20 7.5L12 12L4 7.5L12 3Z" fill="#1C1917" />
              <!-- Left face -->
              <path d="M12 12L4 7.5V16.5L12 21V12Z" fill="#0C0A09" />
              <!-- Right face -->
              <path d="M12 12L20 7.5V16.5L12 21V12Z" fill="#2E2A24" />
              <!-- Kiswah Gold line left -->
              <path d="M4 10.5L12 15V15.8L4 11.3V10.5Z" fill="#fbbf24" />
              <!-- Kiswah Gold line right -->
              <path d="M20 10.5L12 15V15.8L20 11.3V10.5Z" fill="#fbbf24" />
              <!-- Door of Kaaba (gold) -->
              <path d="M14 13L17 14.7V18.2L14 16.5V13Z" fill="#f59e0b" />
            </svg>
          </div>
        </div>
      </div>

      <div class="w-full text-center space-y-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
          <Navigation class="w-3 h-3 rotate-45" />
          Ka'bah (Makkah): 21.42° N, 39.82° E
        </span>
        <p class="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
          {#if supportsCompass}
            Posisikan perangkat Anda mendatar. Kompas akan berputar otomatis mengikuti pergerakan Anda.
          {:else}
            Perangkat tidak mendukung sensor orientasi. Arah kompas ditampilkan secara manual.
          {/if}
        </p>
      </div>
    </div>

  </div>

</div>
