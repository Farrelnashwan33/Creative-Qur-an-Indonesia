import Link from "next/link";
import { ArrowLeft, Play, Settings2 } from "lucide-react";

async function getSurahDetail(id: string) {
  const res = await fetch(`https://equran.id/api/v2/surat/${id}`, {
    next: { revalidate: 86400 } // Cache for 24 hours
  });
  
  if (!res.ok) {
    throw new Error("Gagal mengambil data ayat");
  }
  
  return res.json();
}

export default async function SurahDetailPage({ params }: { params: { id: string } }) {
  const data = await getSurahDetail(params.id);
  const surah = data.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header Surah */}
      <div className="sticky top-16 md:top-0 z-30 glass -mx-4 px-4 py-4 md:mx-0 md:rounded-2xl border-b border-border md:border shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/surah" className="p-2 hover:bg-secondary rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">{surah.namaLatin}</h1>
              <p className="text-xs text-muted-foreground">{surah.arti} • {surah.jumlahAyat} Ayat</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
              <Settings2 className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
              <Play className="w-4 h-4 fill-current" />
              Putar
            </button>
          </div>
        </div>
      </div>

      {/* Bismillah */}
      {surah.nomor !== 1 && surah.nomor !== 9 && (
        <div className="py-8 text-center text-3xl font-arabic text-primary leading-loose">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}

      {/* Daftar Ayat */}
      <div className="space-y-8">
        {surah.ayat.map((ayat: any) => (
          <div key={ayat.nomorAyat} className="group relative">
            {/* Pembatas Ayat (opsional) */}
            <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
            
            <div className="pl-4 md:pl-6 space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-muted-foreground">
                  {ayat.nomorAyat}
                </div>
                
                <div className="flex-1 text-right">
                  <p className="text-3xl md:text-4xl leading-[2.5] md:leading-[2.5] font-arabic" dir="rtl">
                    {ayat.teksArab}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm md:text-base text-primary/80 font-medium">
                  {ayat.teksLatin}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {ayat.teksIndonesia}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-border/50">
                <button className="text-xs font-medium text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Tafsir</button>
                <button className="text-xs font-medium text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Bookmark</button>
                <button className="text-xs font-medium text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Putar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
