"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const links = [
  { href: "/admin/services", label: "Services", icon: CalendarDays },
  { href: "/admin/equipe", label: "Équipe", icon: Users },
  { href: "/admin/spirituel", label: "Spirituel", icon: BookOpen },
];

type Profile = {
  preferred_name?: string | null;
  full_name: string;
  avatar_url?: string | null;
};

export default function AdminNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = profile.preferred_name || profile.full_name;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Mobile : slim top bar ── */}
      <header className="md:hidden bg-white/85 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-12">
          <span className="font-display font-bold text-lg text-slate-900">Crew</span>
          <div className="flex items-center gap-3">
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-warmth-100 text-warmth-700 font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleLogout}
              className="text-slate-400 active:text-slate-600"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile : bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/85 backdrop-blur-2xl border-t border-slate-100/80">
          <div
            className="flex items-stretch justify-around max-w-lg mx-auto px-1"
            style={{ height: "64px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
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

      {/* ── Desktop : full top nav ── */}
      <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-display font-bold text-lg text-slate-900">Crew</span>

          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-warmth-50 text-warmth-600"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-warmth-50 text-warmth-600">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
