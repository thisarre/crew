import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import DisposCalendar from "@/components/member/DisposCalendar";

export default async function DisposPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: unavailabilities } = await supabase
    .from("unavailabilities")
    .select("id, start_date, end_date, reason")
    .eq("profile_id", user.id)
    .gte("end_date", format(monthStart, "yyyy-MM-dd"))
    .order("start_date", { ascending: true });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Mes indisponibilités</h1>
        <p className="text-slate-500 text-sm mt-1">Tape un jour pour le marquer comme indispo</p>
      </div>

      <DisposCalendar
        profileId={user.id}
        initialUnavailabilities={unavailabilities ?? []}
      />
    </div>
  );
}
