"use client";

import { useState, useTransition } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday, parseISO
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Unavailability = { id: string; start_date: string; end_date: string; reason: string | null };

type Props = {
  profileId: string;
  initialUnavailabilities: Unavailability[];
};

export default function DisposCalendar({ profileId, initialUnavailabilities }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(initialUnavailabilities);
  const [isPending, startTransition] = useTransition();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Décale pour que la semaine commence le lundi
  const startPadding = (getDay(monthStart) + 6) % 7;

  const isUnavailable = (day: Date) =>
    unavailabilities.some(u => {
      const start = parseISO(u.start_date);
      const end = parseISO(u.end_date);
      return day >= start && day <= end;
    });

  const getUnavailabilityId = (day: Date) => {
    const u = unavailabilities.find(u => {
      const start = parseISO(u.start_date);
      const end = parseISO(u.end_date);
      return day >= start && day <= end;
    });
    return u?.id ?? null;
  };

  async function toggleDay(day: Date) {
    const supabase = createClient();
    const dateStr = format(day, "yyyy-MM-dd");
    const existingId = getUnavailabilityId(day);

    startTransition(async () => {
      if (existingId) {
        await supabase.from("unavailabilities").delete().eq("id", existingId);
        setUnavailabilities(prev => prev.filter(u => u.id !== existingId));
      } else {
        const { data } = await supabase
          .from("unavailabilities")
          .insert({ profile_id: profileId, start_date: dateStr, end_date: dateStr })
          .select()
          .single();
        if (data) setUnavailabilities(prev => [...prev, data]);
      }
    });
  }

  // Prochaines indispos (futures)
  const today = new Date();
  const upcoming = unavailabilities
    .filter(u => parseISO(u.end_date) >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="space-y-6">
      {/* Navigation mois */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h2 className="font-semibold text-slate-800 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Cases jours */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => {
            const unavail = isUnavailable(day);
            const todayDay = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => toggleDay(day)}
                disabled={isPending}
                className={cn(
                  "aspect-square w-full rounded-xl text-sm font-medium transition-all",
                  unavail
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "hover:bg-slate-100 text-slate-700",
                  todayDay && !unavail && "ring-2 ring-warmth-500 ring-offset-1",
                  isPending && "opacity-50"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton raccourci */}
      {upcoming.length === 0 && (
        <div className="flex items-center gap-2 text-spirit-600 text-sm bg-spirit-50 rounded-2xl px-4 py-3">
          <ThumbsUp className="w-4 h-4" />
          Tu es dispo tout le mois, super 🌟
        </div>
      )}

      {/* Liste prochaines indispos */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-slate-500 text-sm font-medium">Prochaines indispos</p>
          {upcoming.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm text-slate-700 font-medium">
                  {u.start_date === u.end_date
                    ? format(parseISO(u.start_date), "d MMMM", { locale: fr })
                    : `${format(parseISO(u.start_date), "d")} – ${format(parseISO(u.end_date), "d MMMM", { locale: fr })}`}
                </p>
                {u.reason && <p className="text-xs text-slate-400">{u.reason}</p>}
              </div>
              <button
                onClick={() => {
                  const supabase = createClient();
                  supabase.from("unavailabilities").delete().eq("id", u.id);
                  setUnavailabilities(prev => prev.filter(x => x.id !== u.id));
                }}
                className="text-slate-300 hover:text-red-400 transition-colors text-xs"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
