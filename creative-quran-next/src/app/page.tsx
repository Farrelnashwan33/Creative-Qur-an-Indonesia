"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Flame, PlayCircle, Star, Target } from "lucide-react";

export default function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Assalamu'alaikum, Hamba Allah</h1>
        <p className="text-muted-foreground">Selamat datang di perjalanan spiritualmu hari ini.</p>
      </section>

      {/* Daily Streak & Target */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-colors" />
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Daily Streak</p>
            <p className="text-2xl font-bold">12 Hari</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Target Khatam</p>
            <p className="text-2xl font-bold">Juz 13</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Level Spiritual</p>
            <p className="text-2xl font-bold">Mukmin</p>
          </div>
        </div>
      </section>

      {/* Last Read & Jadwal Sholat */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Terakhir Dibaca
            </h2>
          </div>
          
          <Link href="/surah/36" className="block">
            <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                      Lanjutkan Membaca
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">Ya Sin</h3>
                  <p className="text-muted-foreground">Juz 22 • Ayat 12</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Jadwal Sholat
            </h2>
          </div>
          
          <div className="glass rounded-3xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Menuju Maghrib</p>
              <p className="text-4xl font-bold tracking-tight font-mono text-emerald-500">02:15:43</p>
            </div>
            
            <div className="space-y-3 relative z-10">
              {[
                { name: "Subuh", time: "04:30" },
                { name: "Dzuhur", time: "11:54" },
                { name: "Ashar", time: "15:15" },
                { name: "Maghrib", time: "18:00", active: true },
                { name: "Isya", time: "19:12" },
              ].map((s) => (
                <div key={s.name} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${s.active ? 'bg-emerald-500/20 font-bold text-emerald-600 dark:text-emerald-400' : 'hover:bg-secondary/50'}`}>
                  <span>{s.name}</span>
                  <span>{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Harian */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-accent-foreground" />
          Misi Hari Ini
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Baca Al-Kahfi", desc: "Sunnah Jumat", progress: "Selesai", bg: "bg-blue-500/10", color: "text-blue-500" },
            { title: "Hafalan Baru", desc: "An-Naba 1-10", progress: "0/10", bg: "bg-purple-500/10", color: "text-purple-500" },
            { title: "Dzikir Pagi", desc: "Rutinitas", progress: "Selesai", bg: "bg-orange-500/10", color: "text-orange-500" },
            { title: "Tebak Surat", desc: "Game Edukasi", progress: "Mainkan", bg: "bg-pink-500/10", color: "text-pink-500" },
          ].map((misi, i) => (
            <div key={i} className="glass rounded-2xl p-5 hover:scale-[1.03] transition-transform cursor-pointer border border-border/50 hover:border-primary/30">
              <h3 className="font-bold mb-1">{misi.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{misi.desc}</p>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${misi.bg} ${misi.color}`}>
                {misi.progress}
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
