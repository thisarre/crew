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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/85 backdrop-blur-2xl border-t border-slate-100/80">
        <div
          className="flex items-stretch justify-around max-w-lg mx-auto px-1"
          style={{ height: "64px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-7 rounded-xl transition-all duration-200",
                    active ? "bg-warmth-100" : ""
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[22px] h-[22px] transition-all duration-200",
                      active ? "text-warmth-600 stroke-[2.5]" : "text-slate-400"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide transition-colors duration-200",
                    active ? "text-warmth-600" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
