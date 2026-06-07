import { writable, get } from 'svelte/store';
import { fetchSurahDetail, type SurahDetail, type Ayah } from './api';

function createPersistentStore<T>(key: string, initialValue: T) {
  // Check if window is defined (browser side)
  const isBrowser = typeof window !== 'undefined';
  
  let value = initialValue;
  if (isBrowser) {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        try {
          let parsed = JSON.parse(storedValue);
          if (parsed !== null && parsed !== undefined) {
            // Repair corrupted arrays that were saved as objects by previous versions
            if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
              if (typeof parsed === 'object') {
                parsed = Object.values(parsed);
              } else {
                parsed = [];
              }
            }

            if (Array.isArray(initialValue)) {
              value = parsed as T;
            } else if (typeof initialValue === 'object' && initialValue !== null && typeof parsed === 'object') {
              value = { ...initialValue, ...parsed } as T;
            } else {
              value = parsed as T;
            }
          }
        } catch (e) {
          console.error(`Error parsing localStorage key "${key}":`, e);
        }
      }
    } catch (e) {
      console.warn(`LocalStorage read failed for key "${key}":`, e);
    }
  }


  const store = writable<T>(value);

  return {
    subscribe: store.subscribe,
    set: (newValue: T) => {
      store.set(newValue);
      if (isBrowser) {
        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch (e) {
          console.warn(`LocalStorage write failed for key "${key}":`, e);
        }
      }
    },
    update: (updater: (value: T) => T) => {
      store.update((oldValue) => {
        const newValue = updater(oldValue);
        if (isBrowser) {
          try {
            localStorage.setItem(key, JSON.stringify(newValue));
          } catch (e) {
            console.warn(`LocalStorage write failed for key "${key}":`, e);
          }
        }
        return newValue;
      });
    }
  };
}

// User Settings
export interface AppSettings {
  arabicScript: 'utsmani' | 'indopak';
  arabicFontSize: number; // 24 to 48
  tajwidColored: boolean;
  arabicNumberVisible: boolean;
  latinEnabled: boolean;
  latinFontSize: number; // 12 to 24
  translationEnabled: boolean;
  translationFontSize: number; // 12 to 24
  tafsirFontSize: number; // 12 to 28
  perKataFontSize: number; // 12 to 28
  perKataEnabled: boolean;
  qori: 'juhany' | 'qasim' | 'sudais' | 'dossari' | 'afasy' | 'aldosari';
  theme: 'light' | 'dark';
  keepScreenOn: boolean;
  fullscreen: boolean;
  clickAction: 'audio' | 'tafsir' | 'detail';
  longPressAction: 'copy' | 'share' | 'favorite';
}

export const defaultSettings: AppSettings = {
  arabicScript: 'utsmani',
  arabicFontSize: 32,
  tajwidColored: true,
  arabicNumberVisible: true,
  latinEnabled: true,
  latinFontSize: 16,
  translationEnabled: true,
  translationFontSize: 16,
  tafsirFontSize: 14,
  perKataFontSize: 16,
  perKataEnabled: false,
  qori: 'afasy',
  theme: 'dark',
  keepScreenOn: false,
  fullscreen: false,
  clickAction: 'audio',
  longPressAction: 'copy'
};

export const settings = createPersistentStore<AppSettings>('quran_settings', defaultSettings);

// Last Read info
export interface LastRead {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  surahTranslation: string;
  timestamp: string;
}

export const lastRead = createPersistentStore<LastRead | null>('quran_last_read', null);

// Reading History List (limit to 20 items)
export interface HistoryItem {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: string;
}
export const readingHistory = createPersistentStore<HistoryItem[]>('quran_history', []);

// Bookmarks / Favorites
export interface FavoriteAyah {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  arabicText: string;
  translation: string;
  timestamp: string;
}

export const favorites = createPersistentStore<FavoriteAyah[]>('quran_favorites', []);

// Reading Statistics (daily count of read verses)
export interface ReadingStat {
  date: string; // YYYY-MM-DD
  count: number;
}
export const readingStats = createPersistentStore<ReadingStat[]>('quran_stats', []);

// Cached Location for Prayer Times
export interface SavedLocation {
  latitude: number;
  longitude: number;
  cityName: string;
}
export const savedLocation = createPersistentStore<SavedLocation | null>('quran_location', null);

// Adzan Alarm & Voice configurations
export interface AlarmSettings {
  Fajr: boolean;
  Dhuhr: boolean;
  Asr: boolean;
  Maghrib: boolean;
  Isha: boolean;
}
export const activeAlarms = createPersistentStore<AlarmSettings>('quran_alarms', {
  Fajr: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true
});
export const adzanVoice = createPersistentStore<string>('quran_adzan_voice', 'makkah');

// Premium Membership status
export const isPremium = createPersistentStore<boolean>('quran_premium', false);

// Global store to trigger the payment modal
export const showPremiumPaymentModal = writable<boolean>(false);

// Admin Role status (for testing role-based premium access)
export const isAdmin = createPersistentStore<boolean>('quran_admin', false);

// Registered User Email for Premium/Admin verification
export const userEmail = createPersistentStore<string>('quran_user_email', '');

// Murotal playback store
export interface MurotalStore {
  isPlaying: boolean;
  activeAyahNum: number | null;
  surah: SurahDetail | null;
}

function createMurotalStore() {
  const store = writable<MurotalStore>({
    isPlaying: false,
    activeAyahNum: null,
    surah: null
  });

  // Dual-buffer audio untuk transisi mulus antar ayat (ping-pong buffering)
  let buffers: [HTMLAudioElement, HTMLAudioElement] | null = null;
  let activeIdx = 0; // indeks buffer yang sedang aktif diputar

  if (typeof window !== 'undefined') {
    buffers = [new Audio(), new Audio()];
    // Preconnect agar koneksi sudah siap
    buffers[0].preload = 'auto';
    buffers[1].preload = 'auto';
  }

  function getAudioUrl(ayah: Ayah, qori: string): string {
    const qoriMap = {
      'juhany': '01',
      'qasim': '02',
      'sudais': '03',
      'dossari': '04',
      'afasy': '05',
      'aldosari': '06'
    };
    const key = qoriMap[qori as keyof typeof qoriMap] || '05';
    return ayah.audio[key] || Object.values(ayah.audio)[0];
  }

  function currentAudio(): HTMLAudioElement | null {
    return buffers ? buffers[activeIdx] : null;
  }

  function nextAudio(): HTMLAudioElement | null {
    return buffers ? buffers[activeIdx ^ 1] : null;
  }

  /** Preload ayat berikutnya ke buffer idle agar transisi instan */
  function preloadNext(surahDetail: SurahDetail, currentAyahNum: number, qori: string) {
    if (!buffers) return;
    const nextAyahIdx = currentAyahNum; // nomorAyat adalah 1-based, jadi index = nomorAyat (current)
    if (nextAyahIdx < surahDetail.ayat.length) {
      const nextAyah = surahDetail.ayat[nextAyahIdx];
      const url = getAudioUrl(nextAyah, qori);
      const idle = nextAudio();
      if (idle && idle.src !== url) {
        idle.src = url;
        idle.load();
      }
    }
  }

  function stop() {
    if (buffers) {
      buffers.forEach(b => {
        b.onended = null;
        b.pause();
        b.src = "";
      });
    }
    store.set({ isPlaying: false, activeAyahNum: null, surah: null });
  }

  function pause() {
    const cur = currentAudio();
    if (cur) cur.pause();
    store.update(s => ({ ...s, isPlaying: false }));
  }

  /**
   * _playInternal: dipakai oleh auto-advance (playNext).
   * Manfaatkan swap buffer jika sudah preloaded, tanpa pause semua buffer.
   */
  function _playInternal(surahDetail: SurahDetail, ayahNum: number, qori: string) {
    if (typeof window === 'undefined') return;
    if (!buffers) {
      buffers = [new Audio(), new Audio()];
      buffers[0].preload = 'auto';
      buffers[1].preload = 'auto';
    }

    const ayah = surahDetail.ayat.find(a => a.nomorAyat === ayahNum);
    if (!ayah) return;

    const url = getAudioUrl(ayah, qori);
    const idle = nextAudio()!;

    // Hentikan buffer aktif saat ini
    const cur = currentAudio()!;
    cur.onended = null;
    cur.pause();

    if (idle.src === url && idle.readyState >= 3) {
      // Buffer idle sudah preloaded dan siap — swap langsung (transisi instan)
      activeIdx ^= 1;
      const swapped = currentAudio()!;
      swapped.currentTime = 0;
      swapped.play().catch(err => console.warn("Failed to play audio:", err));
    } else {
      // Buffer idle belum siap — pakai buffer aktif, set src baru
      cur.src = url;
      cur.play().catch(err => console.warn("Failed to play audio:", err));
    }

    store.set({
      isPlaying: true,
      activeAyahNum: ayahNum,
      surah: surahDetail
    });

    // Preload ayat berikutnya ke buffer idle
    preloadNext(surahDetail, ayahNum, qori);

    currentAudio()!.onended = () => {
      playNext(qori);
    };
  }

  /**
   * play: dipanggil user (klik ayat). Bersihkan semua buffer untuk fresh start.
   */
  function play(surahDetail: SurahDetail, ayahNum: number, qori: string) {
    if (typeof window === 'undefined') return;
    if (!buffers) {
      buffers = [new Audio(), new Audio()];
      buffers[0].preload = 'auto';
      buffers[1].preload = 'auto';
    }

    // Reset semua buffer (fresh start dari user)
    buffers.forEach(b => {
      b.onended = null;
      b.pause();
      b.src = '';
    });
    activeIdx = 0;

    const ayah = surahDetail.ayat.find(a => a.nomorAyat === ayahNum);
    if (!ayah) return;

    const url = getAudioUrl(ayah, qori);
    const cur = currentAudio()!;
    cur.src = url;
    cur.play().catch(err => console.warn("Failed to play audio:", err));

    store.set({
      isPlaying: true,
      activeAyahNum: ayahNum,
      surah: surahDetail
    });

    // Mulai preload ayat berikutnya segera
    preloadNext(surahDetail, ayahNum, qori);

    cur.onended = () => {
      playNext(qori);
    };
  }

  async function playNext(qori: string) {
    const currentStore = get(store);
    
    if (!currentStore || !currentStore.surah || currentStore.activeAyahNum === null) return;
    
    const nextIdx = currentStore.activeAyahNum; // 1-based → index berikutnya
    const surahDetail = currentStore.surah;

    if (nextIdx < surahDetail.ayat.length) {
      const nextAyah = surahDetail.ayat[nextIdx];
      _playInternal(surahDetail, nextAyah.nomorAyat, qori);
    } else {
      const nextSurahNum = surahDetail.nomor + 1;
      if (nextSurahNum <= 114) {
        try {
          const nextSurahDetail = await fetchSurahDetail(nextSurahNum);
          _playInternal(nextSurahDetail, 1, qori);
        } catch (e) {
          console.error("Failed to play next surah automatically:", e);
          stop();
        }
      } else {
        stop();
      }
    }
  }

  function resume() {
    const cur = currentAudio();
    if (cur) {
      cur.play().catch(err => console.warn("Failed to resume audio:", err));
      store.update(s => ({ ...s, isPlaying: true }));
    }
  }

  function changeQori(qori: string) {
    const currentStore = get(store);
    
    if (currentStore && currentStore.isPlaying && currentStore.activeAyahNum !== null && currentStore.surah) {
      const cur = currentAudio();
      if (!cur) return;
      const currentAyah = currentStore.surah.ayat.find(a => a.nomorAyat === currentStore.activeAyahNum);
      if (currentAyah) {
        const currentTime = cur.currentTime;
        cur.onended = null;
        cur.pause();
        
        const url = getAudioUrl(currentAyah, qori);
        cur.src = url;
        cur.load();
        cur.currentTime = currentTime;
        cur.play().catch(e => console.warn("Failed to automatically play new Qori audio", e));
        
        // Reset preload idle buffer untuk qori baru
        if (buffers) {
          const idle = nextAudio()!;
          idle.src = '';
        }

        cur.onended = () => {
          playNext(qori);
        };

        // Preload ayat berikutnya dengan qori baru
        preloadNext(currentStore.surah, currentStore.activeAyahNum, qori);
      }
    }
  }

  return {
    subscribe: store.subscribe,
    play,
    pause,
    resume,
    stop,
    playNext,
    changeQori
  };
}

export const murotal = createMurotalStore();


