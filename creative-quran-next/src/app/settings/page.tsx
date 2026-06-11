"use client";

import { Moon, Sun, Monitor, User, Globe, Shield, HelpCircle, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Basic theme sync
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi akun dan aplikasi Anda.</p>
      </div>

      {/* Tampilan */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          Tampilan
        </h2>
        <div className="glass rounded-2xl p-2 flex gap-2">
          <button 
            onClick={() => toggleTheme("light")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl transition-colors ${theme === "light" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button 
            onClick={() => toggleTheme("dark")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
        </div>
      </section>

      {/* Preferences */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-500" />
          Akun & Preferensi
        </h2>
        <div className="glass rounded-2xl divide-y divide-border/50">
          <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span>Bahasa Terjemahan</span>
            </div>
            <span className="text-muted-foreground text-sm">Indonesia</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span>Privasi & Keamanan</span>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span>Bantuan & Dukungan</span>
            </div>
          </button>
        </div>
      </section>

      <button className="w-full py-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors font-medium border border-red-500/20">
        <LogOut className="w-5 h-5" />
        Keluar
      </button>
    </div>
  );
}
