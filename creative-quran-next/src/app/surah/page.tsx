import Link from "next/link";
import { Search } from "lucide-react";

async function getSurahList() {
  const res = await fetch("https://equran.id/api/v2/surat", {
    next: { revalidate: 86400 } // Cache for 24 hours
  });
  
  if (!res.ok) {
    throw new Error("Gagal mengambil data surat");
  }
  
  return res.json();
}

export default async function SurahPage() {
  const data = await getSurahList();
  const surahs = data.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Surat</h1>
          <p className="text-muted-foreground">Baca Al-Qur'an dan pahami maknanya.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Cari surat..." 
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surahs.map((surah: any) => (
          <Link key={surah.nomor} href={`/surah/${surah.nomor}`}>
            <div className="glass p-5 rounded-2xl flex items-center justify-between group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="relative z-10 font-bold text-primary">{surah.nomor}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">{surah.namaLatin}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{surah.arti} • {surah.jumlahAyat} Ayat</p>
                </div>
              </div>
              <div className="text-2xl font-arabic text-primary font-bold group-hover:scale-110 transition-transform">
                {surah.nama}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
