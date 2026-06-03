import { writable } from 'svelte/store';

function createPersistentStore<T>(key: string, initialValue: T) {
  // Check if window is defined (browser side)
  const isBrowser = typeof window !== 'undefined';
  
  let value = initialValue;
  if (isBrowser) {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        try {
          value = JSON.parse(storedValue);
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
  qori: 'juhany' | 'qasim' | 'sudais' | 'dossari' | 'afasy' | 'aldosari';
  theme: 'light' | 'dark';
  keepScreenOn: boolean;
  fullscreen: boolean;
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
  qori: 'afasy',
  theme: 'dark',
  keepScreenOn: false,
  fullscreen: false
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


