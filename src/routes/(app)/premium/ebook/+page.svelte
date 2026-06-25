<script lang="ts">
  import { onMount } from 'svelte';
  import { isPremium, showPremiumPaymentModal } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { 
    BookOpen, 
    ArrowLeft, 
    Volume2, 
    Sparkles, 
    Award, 
    Compass, 
    Crown, 
    Info, 
    ChevronRight, 
    BookMarked,
    CheckCircle2,
    GraduationCap,
    Lock,
    Video,
    Play
  } from '@lucide/svelte';

  let activeTab = $state<'makhraj' | 'tajwid' | 'explorer' | 'video'>('makhraj');
  let selectedLetter = $state<string>('Alif');
  let activeTajwidSection = $state<string>('nun-sukun');

  import { fetchSurahs, fetchSurahDetail, type Surah } from '$lib/api';

  let surahList = $state<Surah[]>([]);
  let selectedSurah = $state<number>(78); // default to Surah An-Naba
  let selectedRule = $state<'ghunnah' | 'qalqalah' | 'mad' | 'tanwin'>('qalqalah');
  let scannerLoading = $state(false);
  let scannedExamples = $state<{ ayahNum: number; textArab: string; textLatin: string; translation: string; highlighted: string }[]>([]);

  onMount(async () => {
    try {
      surahList = await fetchSurahs();
    } catch (e) {
      console.error(e);
    }
  });

  async function scanSurah() {
    if (!selectedSurah) return;
    scannerLoading = true;
    try {
      const detail = await fetchSurahDetail(selectedSurah);
      const results = [];
      
      for (const ayah of detail.ayat) {
        let hasMatch = false;
        let highlighted = ayah.teksArab;
        
        if (selectedRule === 'ghunnah') {
          // Nun/Mim with Tasydid
          hasMatch = ayah.teksArab.includes('نّ') || ayah.teksArab.includes('مّ') || ayah.teksArab.includes('\u0646\u0651') || ayah.teksArab.includes('\u0645\u0651');
          highlighted = ayah.teksArab.replace(/([ن\u0646]ّ|م\u0651|[م\u0645]ّ)/g, '<span class="tajwid-ghunnah">$1</span>');
        } else if (selectedRule === 'qalqalah') {
          // Qalqalah letters: ب ج د ط ق
          const regex = /([بجدطق]ْ|[بجدطق]\u0652)/g;
          hasMatch = regex.test(ayah.teksArab);
          highlighted = ayah.teksArab.replace(regex, '<span class="tajwid-qalqalah">$1</span>');
        } else if (selectedRule === 'mad') {
          // Mad letters: ٰ or Alif/Wau/Ya with sukun
          const regex = /(\u0670|ٰ)/g;
          hasMatch = regex.test(ayah.teksArab);
          highlighted = ayah.teksArab.replace(regex, '<span class="tajwid-mad">$1</span>');
        } else if (selectedRule === 'tanwin') {
          // Tanwin: ً ٍ ٌ
          const regex = /([\u064b\u064c\u064dًٌٍ])/g;
          hasMatch = regex.test(ayah.teksArab);
          highlighted = ayah.teksArab.replace(regex, '<span class="tajwid-ikhfa">$1</span>');
        }
        
        if (hasMatch) {
          results.push({
            ayahNum: ayah.nomorAyat,
            textArab: ayah.teksArab,
            textLatin: ayah.teksLatin,
            translation: ayah.teksIndonesia,
            highlighted: highlighted
          });
        }
      }
      scannedExamples = results;
    } catch (e) {
      console.error(e);
    } finally {
      scannerLoading = false;
    }
  }

  // Unified effect triggers scan only when surahList and dependencies are ready, avoiding duplicate calls
  $effect(() => {
    if (surahList.length > 0 && selectedSurah && selectedRule) {
      scanSurah();
    }
  });

  // Makharij Data
  interface MakhrajLetter {
    letter: string;
    arabic: string;
    transliteration: string;
    makhrajName: string;
    description: string;
    category: 'Rongga Mulut (Al-Jawf)' | 'Tenggorokan (Al-Halq)' | 'Lidah (Al-Lisan)' | 'Dua Bibir (Al-Syafatayn)' | 'Rongga Hidung (Al-Khayshum)';
    tips: string;
    soundSample: string;
    pronunciation: string;
  }

  const makhrajLetters: MakhrajLetter[] = [
    {
      letter: 'Alif',
      arabic: 'أ',
      transliteration: 'A / Hamzah',
      makhrajName: 'Pangkal Tenggorokan (Aqsahl Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Huruf keluar dari bagian tenggorokan yang paling dekat dengan dada.',
      tips: 'Ucapkan dengan mantap tanpa menutup saluran nafas sepenuhnya. Suara harus terdengar bersih.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'أَ إِ أُ'
    },
    {
      letter: 'Ha',
      arabic: 'هـ',
      transliteration: 'Ha (Tipis)',
      makhrajName: 'Pangkal Tenggorokan (Aqsahl Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Sama seperti Hamzah, keluar dari tenggorokan bagian bawah.',
      tips: 'Ucapkan seperti hembusan nafas yang dalam dan rileks, tanpa ada gesekan keras di tenggorokan.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'هَ هِ هُ'
    },
    {
      letter: 'Ain',
      arabic: 'ع',
      transliteration: "'Ain",
      makhrajName: 'Tengah Tenggorokan (Wasthul Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Huruf keluar dari bagian tengah tenggorokan (daerah epiglotis).',
      tips: 'Tekan sedikit bagian tengah tenggorokan agar udara terjepit, menghasilkan suara khas yang bersih dan teratur.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'عَ عِ عُ'
    },
    {
      letter: 'Ha\'',
      arabic: 'ح',
      transliteration: 'Haa (Pedas)',
      makhrajName: 'Tengah Tenggorokan (Wasthul Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Keluar dari tengah tenggorokan bersamaan dengan hembusan nafas bersih.',
      tips: 'Ucapkan dengan hembusan angin yang bersih seperti saat Anda meniup kaca kacamata untuk membersihkannya.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'حَ حِ حُ'
    },
    {
      letter: 'Ghoin',
      arabic: 'غ',
      transliteration: 'Ghoin',
      makhrajName: 'Ujung Tenggorokan (Adnal Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Huruf keluar dari bagian tenggorokan paling atas dekat dengan amandel.',
      tips: 'Ucapkan dengan getaran halus seperti berkumur (gargling) namun tidak terlalu basah.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'غَ غِ غُ'
    },
    {
      letter: 'Kho',
      arabic: 'خ',
      transliteration: 'Kho',
      makhrajName: 'Ujung Tenggorokan (Adnal Halq)',
      category: 'Tenggorokan (Al-Halq)',
      description: 'Keluar dari ujung tenggorokan atas dengan suara gesekan yang agak kasar.',
      tips: 'Ucapkan seperti mendengkur halus atau gesekan kering di langit-langit mulut atas.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'خَ خِ خُ'
    },
    {
      letter: 'Qof',
      arabic: 'ق',
      transliteration: 'Qof',
      makhrajName: 'Pangkal Lidah (Aqsahl Lisan)',
      category: 'Lidah (Al-Lisan)',
      description: 'Pangkal lidah menempel pada langit-langit lunak bagian atas.',
      tips: 'Ucapkan dengan tekanan kuat yang memantul (qalqalah) saat sukun. Suara terdengar tebal/berat.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'قَ قِ قُ'
    },
    {
      letter: 'Kaf',
      arabic: 'ك',
      transliteration: 'Kaf',
      makhrajName: 'Pangkal Lidah Bawah (Aqsahl Lisan)',
      category: 'Lidah (Al-Lisan)',
      description: 'Pangkal lidah bagian depan menempel pada langit-langit keras di bawah makhraj Qof.',
      tips: 'Ucapkan dengan meniupkan sedikit udara (hams) saat melafalkannya, menghasilkan suara yang ringan.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'كَ كِ كُ'
    },
    {
      letter: 'Jim',
      arabic: 'ج',
      transliteration: 'Jim',
      makhrajName: 'Tengah Lidah (Wasthul Lisan)',
      category: 'Lidah (Al-Lisan)',
      description: 'Tengah lidah ditekan rapat pada langit-langit keras bagian atas.',
      tips: 'Jangan mengucapkan seperti huruf "J" Indonesia yang mendesah. Harus terdengar kokoh dan bersih tanpa hembusan nafas.',
      soundSample: 'https://download.quranicaudio.com/verses/001001.mp3',
      pronunciation: 'جَ جِ جُ'
    }
  ];

  let selectedMakhrajData = $derived(
    makhrajLetters.find(l => l.letter === selectedLetter) || makhrajLetters[0]
  );

  // Play pronunciation sound using native browser Web Speech API
  let isPlaying = $state(false);

  function playLetterSound(arabicChar: string) {
    if (typeof window === 'undefined') return;
    isPlaying = true;
    
    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(arabicChar);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.55;
      
      utterance.onend = () => {
        isPlaying = false;
      };
      utterance.onerror = () => {
        isPlaying = false;
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
      isPlaying = false;
    }
  }

  // Tajwid Data
  interface TajwidRule {
    title: string;
    subtitle: string;
    description: string;
    examples: { arabic: string; latin: string; rule: string }[];
    colorClass: string;
  }

  const tajwidData: Record<string, TajwidRule[]> = {
    'nun-sukun': [
      {
        title: 'Izhar Halqi',
        subtitle: 'Dibaca Jelas & Terang',
        description: 'Bila Nun Sukun (نْ) atau Tanwin (ً ٍ ٌ) bertemu dengan salah satu huruf tenggorokan (ا, هـ, ع, ح, غ, خ). Cara membacanya jelas tanpa mendengung.',
        colorClass: 'border-emerald-500 bg-emerald-500/5 text-emerald-400',
        examples: [
          { arabic: 'مِنْ حَيْثُ', latin: 'Min haitsu', rule: 'Nun Sukun bertemu Ha' },
          { arabic: 'أَنْعَمْتَ', latin: 'An\'amta', rule: 'Nun Sukun bertemu \'Ain' }
        ]
      },
      {
        title: 'Idgham Bighunnah',
        subtitle: 'Dibaca Melebur dengan Mendengung',
        description: 'Bila Nun Sukun (نْ) atau Tanwin bertemu dengan huruf (ي, ن, م, و). Suara nun/tanwin dimasukkan to huruf berikutnya disertai dengung 2-3 harakat.',
        colorClass: 'border-indigo-500 bg-indigo-500/5 text-indigo-400',
        examples: [
          { arabic: 'مَنْ يَقُولُ', latin: 'May yaquulu', rule: 'Nun Sukun bertemu Ya' },
          { arabic: 'مِنْ وَAL', latin: 'Miw waalin', rule: 'Nun Sukun bertemu Wau' }
        ]
      },
      {
        title: 'Iqlab',
        subtitle: 'Dibaca Mengubah Menjadi Suara Mim',
        description: 'Bila Nun Sukun (نْ) atau Tanwin bertemu dengan huruf Ba (ب). Suara nun/tanwin dirubah menjadi suara mim disertai dengung halus.',
        colorClass: 'border-purple-500 bg-purple-500/5 text-purple-400',
        examples: [
          { arabic: 'مِنْ بَعْدِ', latin: 'Mim ba\'di', rule: 'Nun Sukun bertemu Ba' },
          { arabic: 'سَمِيعٌ بَصِIR', latin: 'Samii\'um bashiir', rule: 'Tanwin bertemu Ba' }
        ]
      },
      {
        title: 'Ikhfa Haqiqi',
        subtitle: 'Dibaca Menyamarkan',
        description: 'Bila Nun Sukun (نْ) atau Tanwin bertemu dengan salah satu dari 15 huruf sisa tajwid. Suara dibaca samar antara jelas dan mendengung.',
        colorClass: 'border-blue-500 bg-blue-500/5 text-blue-400',
        examples: [
          { arabic: 'مِنْ دُونِ', latin: 'Min(g) duuni', rule: 'Nun Sukun bertemu Dal' },
          { arabic: 'عَنْ صَلَاتِهِمْ', latin: '\'An(g) shalaatihim', rule: 'Nun Sukun bertemu Shad' }
        ]
      }
    ],
    'mim-sukun': [
      {
        title: 'Ikhfa Syafawi',
        subtitle: 'Samar di Bibir',
        description: 'Apabila Mim Sukun (مْ) bertemu dengan huruf Ba (ب). Cara membacanya dibaca samar-samar di bibir disertai dengan dengung 2 harakat.',
        colorClass: 'border-blue-400 bg-blue-400/5 text-blue-350',
        examples: [
          { arabic: 'تَرْمِيهِمْ بِحِجَارَةٍ', latin: 'Tarmiihim bihijaaratin', rule: 'Mim sukun bertemu Ba' },
          { arabic: 'أَمْ بِهِ جِنَّةٌ', latin: 'Am bihii jinnatun', rule: 'Mim sukun bertemu Ba' }
        ]
      },
      {
        title: 'Idgham Syafawi / Mimi',
        subtitle: 'Melebur ke Mim',
        description: 'Apabila Mim Sukun (مْ) bertemu dengan sesama huruf Mim (م). Cara membacanya adalah meleburkan mim pertama ke mim kedua dengan dengung rapat.',
        colorClass: 'border-indigo-400 bg-indigo-400/5 text-indigo-350',
        examples: [
          { arabic: 'عَلَيْهِمْ مُؤْصَدَةٌ', latin: '\'Alaihim mu\'shadatun', rule: 'Mim sukun bertemu Mim' },
          { arabic: 'فِي قُلُوبِهِمْ مَرَضٌ', latin: 'Fii quluubihim maradhun', rule: 'Mim sukun bertemu Mim' }
        ]
      },
      {
        title: 'Izhar Syafawi',
        subtitle: 'Jelas Tanpa Dengung',
        description: 'Apabila Mim Sukun (مْ) bertemu dengan semua huruf hijaiyah selain Ba (ب) dan Mim (م). Cara membacanya jelas di bibir tanpa dengung sama sekali.',
        colorClass: 'border-emerald-500 bg-emerald-500/5 text-emerald-400',
        examples: [
          { arabic: 'لَمْ يَلِدْ', latin: 'Lam yalid', rule: 'Mim sukun bertemu Ya' },
          { arabic: 'عَلَيْهِمْ غَيْرِ', latin: '\'Alaihim ghairi', rule: 'Mim sukun bertemu Ghoin' }
        ]
      }
    ],
    'qalqalah': [
      {
        title: 'Qalqalah Sugra',
        subtitle: 'Pantulan Kecil/Ringan',
        description: 'Bila salah satu huruf Qalqalah (ق, ط, b, j, d) berharakat sukun asli berada di tengah kata. Pantulannya dibaca tipis/kecil.',
        colorClass: 'border-rose-500 bg-rose-500/5 text-rose-400',
        examples: [
          { arabic: 'يَقْطَعُونَ', latin: 'Yaq-tha\'uuna', rule: 'Huruf Qof mati di tengah kata' },
          { arabic: 'يَجْعَلُونَ', latin: 'Yaj-\'aluuna', rule: 'Huruf Jim mati di tengah kata' }
        ]
      },
      {
        title: 'Qalqalah Kubra',
        subtitle: 'Pantulan Besar/Kuat',
        description: 'Bila salah satu huruf Qalqalah mati karena diwaqafkan (dihentikan) di akhir kalimat. Pantulannya dibaca tebal/kuat.',
        colorClass: 'border-red-500 bg-red-500/5 text-red-400',
        examples: [
          { arabic: 'قُل| هُوَ اللَّهُ أَحَدٌ', latin: 'Ahad(b)', rule: 'Huruf Dal mati di akhir ayat' },
          { arabic: 'مِنْ شَرِّ مَا خَلَقَ', latin: 'Khalaq(q)', rule: 'Huruf Qof mati di akhir ayat' }
        ]
      }
    ],
    'idgham': [
      {
        title: 'Idgham Mutamatsilain',
        subtitle: 'Pertemuan Dua Huruf Sama',
        description: 'Pertemuan dua huruf yang sama makhraj dan sifatnya, huruf pertama sukun dan kedua berharakat. Dibaca melebur sempurna.',
        colorClass: 'border-indigo-400 bg-indigo-400/5 text-indigo-350',
        examples: [
          { arabic: 'اِذْهَبْ بِكِتَابِي', latin: 'Idzhab bikitaabii', rule: 'Ba sukun bertemu Ba' },
          { arabic: 'يُدْرِكْكُمُ الْمَوْتُ', latin: 'Yudrik-kumul maut', rule: 'Kaf sukun bertemu Kaf' }
        ]
      },
      {
        title: 'Idgham Mutajanisain',
        subtitle: 'Sama Makhraj Beda Sifat',
        description: 'Pertemuan dua huruf yang sama makhrajnya (tempat keluar) tetapi berbeda sifatnya (seperti Dal bertemu Ta, Ta bertemu Thola).',
        colorClass: 'border-purple-400 bg-purple-400/5 text-purple-350',
        examples: [
          { arabic: 'قَدْ تَبَيَّنَ', latin: 'Qat tabayyana', rule: 'Dal sukun bertemu Ta' },
          { arabic: 'آمَنَتْ طَائِفَةٌ', latin: 'Aamanat thaa\'ifatun', rule: 'Ta sukun bertemu Tha' }
        ]
      },
      {
        title: 'Idgham Mutaqaribain',
        subtitle: 'Makhraj & Sifat Berdekatan',
        description: 'Pertemuan dua huruf yang makhraj dan sifatnya berdekatan, seperti Qof sukun bertemu Kaf atau Lam sukun bertemu Ra.',
        colorClass: 'border-indigo-400 bg-indigo-400/5 text-indigo-350',
        examples: [
          { arabic: 'أَلَمْ نَخْلُقْكُمْ', latin: 'Alam nakhluk-kum', rule: 'Qof sukun bertemu Kaf' },
          { arabic: 'وَقُلْ رَبِّ', latin: 'Waqur rabbi', rule: 'Lam sukun bertemu Ra' }
        ]
      }
    ],
    'mad': [
      {
        title: 'Mad Asli (Thabi\'i)',
        subtitle: 'Panjang 2 Harakat',
        description: 'Hukum mad dasar apabila ada Alif setelah Fathah, Ya mati setelah Kasrah, atau Wau mati setelah Dammah. Dibaca sepanjang 2 harakat (ketukan).',
        colorClass: 'border-teal-400 bg-teal-400/5 text-teal-350',
        examples: [
          { arabic: 'كِتَابٌ', latin: 'Kitaabun', rule: 'Alif setelah fathah' },
          { arabic: 'يَقُولُ', latin: 'Yaquulu', rule: 'Wau sukun setelah dammah' }
        ]
      },
      {
        title: 'Mad Wajib Muttasil',
        subtitle: 'Wajib 4-5 Harakat',
        description: 'Apabila Mad Asli bertemu dengan huruf Hamzah (ء) dalam satu kata/kalimat bersambung. Dibaca sepanjang 4 sampai 5 harakat.',
        colorClass: 'border-rose-600 bg-rose-600/5 text-rose-450',
        examples: [
          { arabic: 'جَاءَ', latin: 'Jaaa-a', rule: 'Mad asli bertemu Hamzah satu kata' },
          { arabic: 'السَّمَاءِ', latin: 'As-samaaa-i', rule: 'Mad asli bertemu Hamzah satu kata' }
        ]
      },
      {
        title: 'Mad Jaiz Munfasil',
        subtitle: 'Boleh 2-5 Harakat',
        description: 'Apabila Mad Asli bertemu dengan Hamzah (ء) namun di lain kata/terpisah. Dibaca boleh 2, 4, atau 5 harakat.',
        colorClass: 'border-pink-500 bg-pink-500/5 text-pink-400',
        examples: [
          { arabic: 'إِنَّا أَنْزَلْنَاهُ', latin: 'Innaaa anzalnaahu', rule: 'Mad asli bertemu Hamzah beda kata' },
          { arabic: 'يَا أَيُّهَا', latin: 'Yaaa ayyuhaa', rule: 'Mad asli bertemu Hamzah beda kata' }
        ]
      },
      {
        title: 'Mad Arid Lissukun',
        subtitle: 'Dibaca 2, 4, atau 6 Harakat',
        description: 'Apabila ada Mad Asli bertemu dengan huruf hidup di akhir kalimat/ayat yang dibaca waqaf (mati). Panjangnya boleh 2, 4, atau 6 harakat.',
        colorClass: 'border-cyan-500 bg-cyan-500/5 text-cyan-400',
        examples: [
          { arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', latin: 'Al-\'aalamiin', rule: 'Mad asli bertemu huruf hidup dibaca waqaf' },
          { arabic: 'مَالِكِ يَوْMِ الدِّينِ', latin: 'Ad-diin', rule: 'Mad asli bertemu huruf hidup dibaca waqaf' }
        ]
      },
      {
        title: 'Mad Layyin / Lin',
        subtitle: 'Lembut & Lentur saat Waqaf',
        description: 'Apabila ada wau sukun (وْ) atau ya sukun (يْ) sebelumnya berharakat fathah, dan setelahnya ada huruf hidup dibaca waqaf. Dibaca lembut sepanjang 2, 4, atau 6 harakat.',
        colorClass: 'border-violet-400 bg-violet-400/5 text-violet-350',
        examples: [
          { arabic: 'قُرَيْشٍ', latin: 'Quraisy(i)', rule: 'Ya sukun didahului fathah dibaca waqaf' },
          { arabic: 'لِإِيلَافِ قُرَيْشٍ إِILAAFIM', latin: 'Wash-shaif(i)', rule: 'Ya sukun didahului fathah dibaca waqaf' }
        ]
      },
      {
        title: 'Mad Iwad',
        subtitle: 'Mengganti Tanwin Fathatain',
        description: 'Apabila ada huruf berharakat fathatain (ً) di akhir kalimat/ayat dibaca waqaf (kecuali Ta Marbuthah). Fathatain dirubah menjadi fathah biasa dibaca sepanjang 2 harakat.',
        colorClass: 'border-orange-400 bg-orange-400/5 text-orange-350',
        examples: [
          { arabic: 'عَلِيمًا حَكِيمًا', latin: 'Hakiimaa', rule: 'Fathatain di akhir ayat dibaca waqaf' },
          { arabic: 'أَفْوَاجًا', latin: 'Afwaajaa', rule: 'Fathatain di akhir ayat dibaca waqaf' }
        ]
      }
    ],
    'alif-lam': [
      {
        title: 'Alif Lam Qamariyah',
        subtitle: 'Dibaca Jelas (Izhar)',
        description: 'Apabila Alif Lam (ال) bertemu dengan salah satu dari 14 huruf Qamariyah (ا b g h j k w kh f \' q y m h). Alif lam dibaca jelas dan tegas.',
        colorClass: 'border-teal-500 bg-teal-500/5 text-teal-400',
        examples: [
          { arabic: 'الْحَمْدُ', latin: 'Al-hamdu', rule: 'Alif Lam bertemu Ha' },
          { arabic: 'الْقَارِعَةُ', latin: 'Al-qaari\'atu', rule: 'Alif Lam bertemu Qof' }
        ]
      },
      {
        title: 'Alif Lam Syamsiyah',
        subtitle: 'Melebur Tanpa Dibaca \'L\'',
        description: 'Apabila Alif Lam (ال) bertemu salah satu dari 14 huruf Syamsiyah. Huruf Lam tidak dibaca melainkan langsung dimasukkan (di-idghamkan) ke huruf setelahnya.',
        colorClass: 'border-indigo-500 bg-indigo-500/5 text-indigo-400',
        examples: [
          { arabic: 'الشَّمْسُ', latin: 'Asy-syamsu', rule: 'Alif Lam bertemu Syin' },
          { arabic: 'الرَّحْمَنُ', latin: 'Ar-rahman', rule: 'Alif Lam bertemu Ra' }
        ]
      }
    ],
    'hukum-ra': [
      {
        title: 'Ra Tafkhim',
        subtitle: 'Dibaca Tebal',
        description: 'Huruf Ra (ر) dibaca tebal (mulut agak mencucu) bila berharakat Fathah, Dammah, sukun didahului Fathah/Dammah, atau sukun karena waqaf didahului huruf mati selain Ya.',
        colorClass: 'border-rose-500 bg-rose-500/5 text-rose-450',
        examples: [
          { arabic: 'رَبَّنَا', latin: 'Rabbanaa', rule: 'Ra berharakat Fathah' },
          { arabic: 'قُرْآنٌ', latin: 'Qur\'aan', rule: 'Ra sukun didahului Dammah' }
        ]
      },
      {
        title: 'Ra Tarqiq',
        subtitle: 'Dibaca Tipis',
        description: 'Huruf Ra (ر) dibaca tipis (bibir agak ditarik tersenyum) bila berharakat Kasrah, sukun didahului Kasrah asli, atau sukun karena waqaf didahului Ya sukun.',
        colorClass: 'border-cyan-400 bg-cyan-400/5 text-cyan-350',
        examples: [
          { arabic: 'رِجَالٌ', latin: 'Rijaalun', rule: 'Ra berharakat Kasrah' },
          { arabic: 'خَبِيرٌ', latin: 'Khabiir(r)', rule: 'Ra sukun waqaf didahului Ya sukun' }
        ]
      },
      {
        title: 'Jawazul Wajhain',
        subtitle: 'Boleh Tebal / Tipis',
        description: 'Keadaan dimana huruf Ra boleh dibaca tebal (Tafkhim) atau tipis (Tarqiq). Terjadi jika Ra sukun didahului kasrah dan setelahnya ada huruf Isti\'la berharakat kasrah.',
        colorClass: 'border-purple-400 bg-purple-400/5 text-purple-350',
        examples: [
          { arabic: 'كُلُّ فِرْقٍ', latin: 'Firqin', rule: 'Ra sukun didahului Kasrah, diikuti Qof kasrah' }
        ]
      }
    ]
  };
</script>

{#if !$isPremium}
  <!-- LOCK SCREEN FOR NON-PREMIUM -->
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="glass border border-indigo-500/30 p-8 rounded-3xl text-center max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden premium-theme">
      <div class="absolute inset-0 opacity-5 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      
      <div class="relative z-10 space-y-4">
        <div class="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto animate-pulse-slow">
          <Lock class="w-8 h-8 text-indigo-400" />
        </div>
        
        <div>
          <h2 class="text-2xl font-black text-white tracking-wide">E-Book Tajwid & Makharij</h2>
          <span class="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block mt-1">Eksklusif Fitur Royal Premium</span>
          <p class="text-xs text-zinc-400 mt-3.5 leading-relaxed font-semibold">
            Buka e-book interaktif pembelajaran Tajwid lengkap dan diagram cara melafalkan huruf hijaiyah (Makhorijul Huruf) secara tepat dengan visual mewah.
          </p>
        </div>

        <div class="bg-indigo-950/15 border border-indigo-500/10 rounded-2xl p-4 text-left space-y-2">
          <span class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Yang Akan Anda Dapatkan:</span>
          <ul class="space-y-1.5 text-xs text-zinc-300">
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✦</span>
              <span>Visual makhraj interaktif per huruf</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✦</span>
              <span>Audio pelafalan makhraj orisinil</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✦</span>
              <span>Panduan hukum tajwid terlengkap</span>
            </li>
          </ul>
        </div>

        <div class="pt-2 space-y-2.5">
          <button 
            onclick={() => showPremiumPaymentModal.set(true)}
            class="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-300 text-black font-black text-xs py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Crown class="w-4 h-4 text-black fill-black" />
            <span>Yuu Langganan Sekarang (Rp 150rb)</span>
          </button>
          
          <button 
            onclick={() => goto('/')}
            class="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 font-semibold text-xs py-3 rounded-2xl border border-white/5"
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- PREMIUM E-BOOK VIEW -->
  <div class="space-y-6 relative pb-10">
    
    <!-- TOP BAR NAVIGATION -->
    <div class="flex items-center justify-between pb-2 border-b border-white/5">
      <a href="/" class="inline-flex items-center gap-2.5 text-zinc-400 hover:text-zinc-200 group">
        <div class="w-9 h-9 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:border-indigo-500/20">
          <ArrowLeft class="w-4.5 h-4.5" />
        </div>
        <span class="text-xs font-bold">Kembali ke Home</span>
      </a>
      
      <div class="flex items-center gap-2 text-indigo-400 font-black text-xs bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
        <Crown class="w-3.5 h-3.5 fill-indigo-400" />
        <span>Royal Premium E-Book</span>
      </div>
    </div>

    <!-- BOOK COVER & INTRO HEADER -->
    <div class="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-tr from-emerald-950/80 via-stone-950 to-indigo-950/70 border border-indigo-500/25 shadow-xl text-center space-y-4">
      <div class="absolute inset-0 opacity-5 bg-repeat bg-[size:30px] pointer-events-none islamic-bg"></div>
      
      <!-- Sparkle animations -->
      <div class="absolute top-4 left-6 w-1.5 h-1.5 rounded-full bg-indigo-400 premium-sparkle"></div>
      <div class="absolute bottom-6 right-8 w-2 h-2 rounded-full bg-violet-300 premium-sparkle" style="animation-delay: 1.5s"></div>

      <div class="relative z-10 max-w-2xl mx-auto space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <GraduationCap class="w-6 h-6" />
        </div>
        
        <h2 class="text-2xl lg:text-3xl font-extrabold text-white tracking-wide">E-Book Belajar Tajwid & Makharij</h2>
        <p class="text-xs lg:text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto font-medium">
          Panduan praktis, mewah, dan komprehensif untuk menyempurnakan bacaan Al-Qur'an Anda sesuai kaidah makhorijul huruf dan hukum tajwid standar internasional.
        </p>

        <!-- BOOK SEGMENT TABS -->
        <div class="flex flex-wrap justify-center p-1 rounded-xl glass border border-indigo-500/20 w-fit mx-auto mt-4 gap-1">
          <button 
            onclick={() => activeTab = 'makhraj'}
            class="px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
              {activeTab === 'makhraj' ? 'bg-indigo-500 text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            <Compass class="w-4 h-4" />
            <span>1. Makhorijul Huruf</span>
          </button>
          <button 
            onclick={() => activeTab = 'tajwid'}
            class="px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
              {activeTab === 'tajwid' ? 'bg-indigo-500 text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            <BookOpen class="w-4 h-4" />
            <span>2. Hukum Tajwid</span>
          </button>
          <button 
            onclick={() => activeTab = 'explorer'}
            class="px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
              {activeTab === 'explorer' ? 'bg-indigo-500 text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            <Sparkles class="w-4 h-4" />
            <span>3. Bank Contoh (30 Juz)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN SECTION VIEWER -->
    {#if activeTab === 'makhraj'}
      <!-- MAKHORIJUL HURUF SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- LEFT: Letter Grid Selector -->
        <div class="lg:col-span-2 glass border border-white/5 rounded-3xl p-6 space-y-4">
          <div>
            <h3 class="font-bold text-sm text-zinc-300">Pilih Huruf Hijaiyah</h3>
            <p class="text-[10px] text-zinc-500 font-semibold mt-0.5">Klik salah satu huruf di bawah untuk mempelajari makhrajnya</p>
          </div>

          <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {#each makhrajLetters as l (l.letter)}
              <!-- Changed from nested glass to solid transparent buttons to prevent ghost layer blur bugs -->
              <button 
                onclick={() => selectedLetter = l.letter}
                class="aspect-square bg-white/5 border rounded-2xl p-3 flex flex-col justify-between items-center transition-all duration-300 active:scale-95 text-center
                  {selectedLetter === l.letter 
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' 
                    : 'border-white/10 hover:border-white/20 hover:bg-white/10 text-zinc-400'}"
              >
                <span class="text-3xl font-arabic-utsmani font-bold">{l.arabic}</span>
                <div class="space-y-0.5">
                  <span class="text-[10px] font-bold block">{l.letter}</span>
                  <span class="text-[8px] text-zinc-500 font-semibold block">{l.transliteration}</span>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- RIGHT: Letter Details Card & YouTube Video Guide -->
        <div class="flex flex-col gap-6">
          
          <!-- Letter Details Card -->
          <div class="glass border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between space-y-6 bg-gradient-to-b from-indigo-950/10 to-transparent relative">
            <div class="space-y-5">
              <!-- Big Letter Avatar -->
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-4xl font-arabic-utsmani font-black text-indigo-400">
                  {selectedMakhrajData.arabic}
                </div>
                <div>
                  <h4 class="font-black text-lg text-white">{selectedMakhrajData.letter}</h4>
                  <span class="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">{selectedMakhrajData.category}</span>
                </div>
              </div>

              <!-- Makhraj point details -->
              <div class="space-y-3.5 border-t border-white/5 pt-4">
                <div>
                  <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Nama Makhraj</span>
                  <p class="text-xs text-zinc-200 font-extrabold mt-0.5">{selectedMakhrajData.makhrajName}</p>
                </div>

                <div>
                  <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Deskripsi Artikulasi</span>
                  <p class="text-xs text-zinc-400 leading-relaxed font-semibold mt-1">{selectedMakhrajData.description}</p>
                </div>

                <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span class="text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Info class="w-3.5 h-3.5" />
                    Tips Pelafalan Benar
                  </span>
                  <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold mt-1.5">{selectedMakhrajData.tips}</p>
                </div>
              </div>
            </div>

            <!-- Sound Player Trigger -->
            <button 
              onclick={() => playLetterSound(selectedMakhrajData.pronunciation)}
              class="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              {#if isPlaying}
                <div class="w-3 h-3 rounded-full border-2 border-t-black border-black/20 animate-spin"></div>
                <span>Memutar Lafadz...</span>
              {:else}
                <Volume2 class="w-4.5 h-4.5" />
                <span>Dengarkan Suara Huruf</span>
              {/if}
            </button>
          </div>

        </div>
      </div>
    {:else if activeTab === 'tajwid'}
      <!-- HUKUM TAJWID SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Sidebar Rule Navs -->
        <div class="glass border border-white/5 rounded-3xl p-5 flex flex-col gap-2 h-fit">
          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2.5 pb-2 border-b border-white/5">Hukum Bacaan</span>
          
          <button 
            onclick={() => activeTajwidSection = 'nun-sukun'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'nun-sukun' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Nun Sukun & Tanwin</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'mim-sukun'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'mim-sukun' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Mim Sukun</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'qalqalah'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'qalqalah' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Qalqalah</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'idgham'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'idgham' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Idgham</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'mad'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'mad' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Mad</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'alif-lam'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'alif-lam' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Alif Lam</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button 
            onclick={() => activeTajwidSection = 'hukum-ra'}
            class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-300
              {activeTajwidSection === 'hukum-ra' 
                ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
          >
            <span>Hukum Ra</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Right Content Details -->
        <div class="lg:col-span-3 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each tajwidData[activeTajwidSection] || [] as rule (rule.title)}
              <div class="glass border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h4 class="font-extrabold text-sm text-white">{rule.title}</h4>
                    <span class="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md {rule.colorClass}">
                      {rule.subtitle}
                    </span>
                  </div>
                  <p class="text-xs text-zinc-400 leading-relaxed font-semibold pt-1">
                    {rule.description}
                  </p>
                </div>

                <!-- Examples area -->
                <div class="space-y-2 border-t border-white/5 pt-4">
                  <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Contoh Ayat & Hukum</span>
                  <div class="grid grid-cols-1 gap-2">
                    {#each rule.examples as ex, i (ex.arabic + '-' + i)}
                      <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/5">
                        <div class="text-left">
                          <span class="text-xs text-zinc-200 font-bold block">{ex.latin}</span>
                          <span class="text-[9px] text-zinc-500 font-bold block">{ex.rule}</span>
                        </div>
                        <span class="text-lg font-arabic-utsmani font-bold text-white tracking-wide">{ex.arabic}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>
    {:else if activeTab === 'explorer'}
      <!-- 3. BANK CONTOH TAJWID 30 JUZ -->
      <div class="glass border border-white/5 rounded-3xl p-6 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 class="font-extrabold text-base text-white flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-indigo-400 animate-pulse-slow" />
              Bank Contoh Tajwid Otomatis (30 Juz)
            </h3>
            <p class="text-xs text-zinc-500 font-semibold mt-1">Sistem memindai seluruh ayat dalam Al-Qur'an secara real-time untuk menghasilkan ribuan contoh tajwid.</p>
          </div>

          <!-- Selector controls -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Select Surah -->
            <div class="flex flex-col gap-1 text-left">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Pilih Surah</span>
              <select 
                bind:value={selectedSurah}
                class="py-2 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 bg-zinc-950"
              >
                {#each surahList as s (s.nomor)}
                  <option value={s.nomor} class="bg-zinc-950 text-white">{s.nomor}. {s.namaLatin} ({s.jumlahAyat} Ayat)</option>
                {/each}
              </select>
            </div>

            <!-- Select Rule -->
            <div class="flex flex-col gap-1 text-left">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Hukum Tajwid</span>
              <select 
                bind:value={selectedRule}
                class="py-2 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 bg-zinc-950"
              >
                <option value="qalqalah" class="bg-zinc-950 text-white">Hukum Qalqalah</option>
                <option value="ghunnah" class="bg-zinc-950 text-white">Hukum Ghunnah</option>
                <option value="mad" class="bg-zinc-950 text-white">Hukum Mad</option>
                <option value="tanwin" class="bg-zinc-950 text-white">Hukum Ikhfa / Tanwin</option>
              </select>
            </div>
          </div>
        </div>

        {#if scannerLoading}
          <div class="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-t-indigo-400 border-indigo-500/20 animate-spin"></div>
            <span class="text-xs text-zinc-500 font-bold animate-pulse">Memindai seluruh ayat untuk mencari contoh tajwid...</span>
          </div>
        {:else if scannedExamples.length === 0}
          <div class="py-20 text-center space-y-3">
            <Info class="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 class="font-bold text-sm text-zinc-400">Tidak menemukan contoh hukum tajwid ini</h4>
            <p class="text-xs text-zinc-500 max-w-xs mx-auto">Silakan coba pilih surah lain atau hukum tajwid yang berbeda.</p>
          </div>
        {:else}
          <div class="space-y-4">
            <div class="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>Menemukan <strong>{scannedExamples.length} contoh</strong> hukum tajwid</span>
              <span class="text-indigo-400 font-bold">Terverifikasi Sistem Pintar AI</span>
            </div>

            <!-- List scrollable -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
              {#each scannedExamples as ex (ex.ayahNum)}
                <!-- Removed .glass class to prevent nested glassmorphism rendering ghost layers -->
                <div class="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3 relative hover:border-indigo-500/20 hover:bg-white/10 transition-all text-left">
                  <div class="flex items-center justify-between pb-2 border-b border-white/5">
                    <span class="text-[9px] text-zinc-500 font-bold">Ayat {ex.ayahNum}</span>
                    <span class="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">Hukum Cocok</span>
                  </div>

                  <!-- Arabic text with highlighted matching parts -->
                  <div class="text-right leading-loose py-1">
                    <p class="text-white font-arabic-utsmani text-xl" dir="rtl">
                      {@html ex.highlighted}
                    </p>
                  </div>

                  <!-- Latin & Translation -->
                  <div class="space-y-1 pt-1.5 border-t border-white/5">
                    <p class="text-[11px] text-emerald-400/90 font-medium italic leading-relaxed">{ex.textLatin}</p>
                    <p class="text-[11px] text-zinc-400 leading-relaxed font-semibold">{ex.translation}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

  </div>
{/if}

<style>
  :global(.tajwid-ghunnah) {
    color: #f59e0b !important; /* indigo-500 */
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    font-weight: bold;
  }
  :global(.tajwid-qalqalah) {
    color: #06b6d4 !important; /* cyan-500 */
    text-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
    font-weight: bold;
  }
  :global(.tajwid-mad) {
    color: #ec4899 !important; /* pink-500 */
    text-shadow: 0 0 8px rgba(236, 72, 153, 0.4);
    font-weight: bold;
  }
  :global(.tajwid-ikhfa) {
    color: #10b981 !important; /* emerald-500 */
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    font-weight: bold;
  }
</style>
