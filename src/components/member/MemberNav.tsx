"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarOff, TrendingUp, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/dispos", label: "Dispos", icon: CalendarOff },
  { href: "/parcours", label: "Parcours", icon: TrendingUp },
  { href: "/annonces", label: "Annonces", icon: Megaphone },
];

export default function MemberNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors",
                active ? "text-warmth-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
