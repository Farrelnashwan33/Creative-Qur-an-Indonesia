"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Home, LayoutDashboard, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Al-Qur'an", href: "/surah", icon: BookOpen },
  { name: "Jelajah", href: "/explore", icon: Compass },
  { name: "Ibadah", href: "/ibadah", icon: LayoutDashboard },
  { name: "Profil", href: "/profile", icon: User },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 glass border-r border-border">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl">
            Q
          </div>
          <span className="font-bold text-xl tracking-tight">Creative Qur'an</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-foreground">Target Khatam</p>
          <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-primary h-full w-[45%]" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Juz 13 / 30</p>
        </div>
      </div>
    </aside>
  );
}
