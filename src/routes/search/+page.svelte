<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchSurahs, type Surah } from '$lib/api';
  import { readingHistory } from '$lib/stores';
  import { Search as SearchIcon, ArrowRight, Clock, Star, BookOpen, Sparkles } from '@lucide/svelte';

  let surahs = $state<Surah[]>([]);
  let searchQuery = $state('');
  let loading = $state(true);
  
  // Recent searches saved to localStorage
  let recentSearches = $state<string[]>([]);

  onMount(async () => {
    try {
      surahs = await fetchSurahs();
      
      // Load recent searches
      const stored = localStorage.getItem('quran_recent_searches');
      if (stored) {
        recentSearches = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  // Save recent search
  function saveSearch(query: string) {
    if (!query.trim()) return;
    const clean = query.trim();
    recentSearches = [clean, ...recentSearches.filter(x => x !== clean)].slice(0, 5);
    try {
      localStorage.setItem('quran_recent_searches', JSON.stringify(recentSearches));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
  }

  function clearHistory() {
    recentSearches = [];
    try {
      localStorage.removeItem('quran_recent_searches');
    } catch (e) {
      console.warn("Failed to remove from localStorage:", e);
    }
  }

  // Filter surahs based on search query
  let filteredResults = $derived(
    searchQuery.trim() === ''
      ? []
      : surahs.filter(s => 
          s.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.arti.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.nomor.toString() === searchQuery.trim()
        )
  );

  const popularSearches = ['Yasin', 'Al-Mulk', 'Ar-Rahman', 'Al-Kahf', 'Waqi\'ah'];
</script>

<div class="space-y-6">
  
  <div>
    <h2 class="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
      <SearchIcon class="w-6 h-6 text-emerald-400" />
      Pencarian Surah
    </h2>
    <p class="text-xs text-zinc-500 font-semibold mt-1">Cari surah berdasarkan nama, terjemahan, atau nomor indeks</p>
  </div>

  <!-- Search Input Bar -->
  <div class="relative w-full">
    <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
    <input 
      type="text" 
      bind:value={searchQuery}
      onkeydown={(e) => {
        if (e.key === 'Enter') saveSearch(searchQuery);
      }}
      placeholder="Cari Surah (contoh: Yasin, Al-Mulk, 36)..." 
      class="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-white/5 bg-transparent text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all placeholder:text-zinc-500"
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

  <!-- SUGGESTIONS & HISTORY PANEL -->
  {#if searchQuery.trim() === ''}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      
      <!-- Popular Suggestions -->
      <div class="space-y-4">
        <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase px-1">Pencarian Populer</h3>
        <div class="flex flex-wrap gap-2">
          {#each popularSearches as item (item)}
            <button 
              onclick={() => { searchQuery = item; saveSearch(item); }}
              class="px-4 py-2.5 rounded-xl glass border border-white/5 hover:border-primary/20 text-xs font-bold text-zinc-300 hover:text-secondary transition-all duration-300"
            >
              {item}
            </button>
          {/each}
        </div>
      </div>

      <!-- Recent History -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase">Riwayat Terakhir</h3>
          {#if recentSearches.length > 0}
            <button onclick={clearHistory} class="text-[10px] font-bold text-rose-400/80 hover:text-rose-400">
              Hapus Semua
            </button>
          {/if}
        </div>

        {#if recentSearches.length === 0}
          <div class="glass border border-white/5 rounded-2xl p-6 text-center text-zinc-600">
            <Clock class="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p class="text-xs font-semibold">Belum ada riwayat pencarian.</p>
          </div>
        {:else}
          <div class="flex flex-col gap-2">
            {#each recentSearches as item (item)}
              <button 
                onclick={() => searchQuery = item}
                class="flex items-center justify-between p-3.5 rounded-xl glass border border-white/5 hover:border-primary/20 text-left text-xs font-bold text-zinc-300 hover:text-white"
              >
                <div class="flex items-center gap-3">
                  <Clock class="w-4 h-4 text-zinc-500" />
                  <span>{item}</span>
                </div>
                <ArrowRight class="w-3.5 h-3.5 text-zinc-600" />
              </button>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  {:else}
    <!-- RESULTS GRID -->
    <div class="space-y-4">
      <h3 class="font-bold text-xs text-zinc-400 tracking-wider uppercase px-1">
        Hasil Pencarian ({filteredResults.length})
      </h3>

      {#if loading}
        <div class="space-y-3">
          {#each Array(3) as _, i (i)}
            <div class="glass border border-white/5 rounded-2xl p-5 h-16 animate-pulse"></div>
          {/each}
        </div>
      {:else}
        {#if filteredResults.length === 0}
          <div class="glass border border-white/5 rounded-2xl p-10 text-center text-zinc-500 max-w-md mx-auto space-y-2">
            <p class="text-sm font-bold">Surah tidak ditemukan</p>
            <p class="text-xs text-zinc-600">Silakan periksa kata kunci pencarian Anda atau gunakan filter nama yang valid.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each filteredResults as surah (surah.nomor)}
              <a 
                href="/quran/{surah.nomor}" 
                onclick={() => saveSearch(searchQuery)}
                class="glass border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-primary/20 group transition-all duration-300 shadow-md cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xs text-secondary group-hover:bg-primary group-hover:text-white transition-all">
                    {surah.nomor}
                  </div>
                  <div>
                    <h3 class="font-bold text-zinc-200 group-hover:text-secondary transition-colors">{surah.namaLatin}</h3>
                    <p class="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">{surah.tempatTurun} • {surah.jumlahAyat} Ayat</p>
                  </div>
                </div>

                <div class="text-right">
                  <span class="font-arabic-utsmani text-lg font-bold text-secondary block">{surah.nama}</span>
                  <span class="text-[10px] text-zinc-500 font-medium block mt-0.5">{surah.arti}</span>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}

</div>
