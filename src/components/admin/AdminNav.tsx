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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
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
  );
}
