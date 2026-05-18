import { createClient } from "@/lib/supabase/server";
import { getGreeting } from "@/lib/tone";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import ConfirmationButtons from "@/components/member/ConfirmationButtons";
import { Heart, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, preferred_name, full_name, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const name = profile.preferred_name || profile.full_name.split(" ")[0];
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: nextAssignment } = await supabase
    .from("assignments")
    .select(`
      id, status,
      services (id, title, service_date, start_time, arrival_time, location, spiritual_theme),
      skills (name, icon)
    `)
    .eq("profile_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte("services.service_date", today)
    .order("services.service_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let teammates: { profiles: { preferred_name: string | null; full_name: string } | null; skills: { name: string; icon: string | null } | null }[] = [];
  if (nextAssignment?.services) {
    const svc = nextAssignment.services as { id: string };
    const { data } = await supabase
      .from("assignments")
      .select("profiles!assignments_profile_id_fkey(preferred_name, full_name), skills(name, icon)")
      .eq("service_id", svc.id)
      .neq("profile_id", user.id)
      .eq("status", "confirmed");
    teammates = data ?? [];
  }

  const { data: spiritualContent } = await supabase
    .from("spiritual_content")
    .select("title, content, reference, type")
    .eq("organization_id", profile.organization_id ?? "")
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAppreciations } = await supabase
    .from("appreciations")
    .select("message, from_profile_id, profiles!appreciations_from_profile_id_fkey(preferred_name, full_name)")
    .eq("to_profile_id", user.id)
    .gte("created_at", oneWeekAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: stats } = await supabase
    .from("member_stats")
    .select("services_this_month, services_this_year")
    .eq("profile_id", user.id)
    .maybeSingle();

  const service = nextAssignment?.services as {
    id: string; title: string; service_date: string;
    start_time: string; arrival_time: string | null;
    location: string | null; spiritual_theme: string | null;
  } | null;

  const skill = nextAssignment?.skills as { name: string; icon: string | null } | null;

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Header */}
      <div className="px-4 pt-8 pb-2">
        <h1 className="font-display text-3xl font-bold text-slate-900 leading-tight">
          {getGreeting(name)}
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          {stats?.services_this_month
            ? `${stats.services_this_month} service${stats.services_this_month > 1 ? "s" : ""} ce mois`
            : "Prêt à servir 🙌"}
        </p>
      </div>

      {/* Pensée spirituelle */}
      {spiritualContent && (
        <div className="mx-4 rounded-2xl bg-spirit-50 border border-spirit-100 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-spirit-600 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            {spiritualContent.type === "verse" ? "Verset de la semaine" : "Pensée de la semaine"}
          </div>
          <p className="text-slate-700 text-sm leading-relaxed italic">
            &ldquo;{spiritualContent.content}&rdquo;
          </p>
          {spiritualContent.reference && (
            <p className="text-spirit-600 text-xs font-semibold">— {spiritualContent.reference}</p>
          )}
        </div>
      )}

      {/* Prochain service */}
      <div className="px-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Prochain service
        </p>

        {service ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex gap-4">
              {/* Date tile */}
              <div className="flex-shrink-0 w-[58px] rounded-2xl bg-warmth-500 flex flex-col items-center justify-center py-3 gap-0.5">
                <span className="text-white/70 text-[11px] font-bold uppercase tracking-widest leading-none">
                  {format(parseISO(service.service_date), "EEE", { locale: fr })}
                </span>
                <span className="text-white text-[32px] font-bold leading-tight">
                  {format(parseISO(service.service_date), "d")}
                </span>
                <span className="text-white/70 text-[11px] font-semibold uppercase leading-none">
                  {format(parseISO(service.service_date), "MMM", { locale: fr })}
                </span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0 space-y-2 py-0.5">
                <div>
                  <p className="text-slate-900 font-bold text-xl leading-none">
                    {service.start_time?.slice(0, 5).replace(":", "h")}
                  </p>
                  {service.arrival_time && (
                    <p className="text-slate-400 text-sm mt-0.5">
                      Arrivée {service.arrival_time.slice(0, 5).replace(":", "h")}
                    </p>
                  )}
                </div>

                {service.location && (
                  <p className="text-slate-500 text-sm">📍 {service.location}</p>
                )}

                {skill && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-warmth-50 text-warmth-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {skill.icon} {skill.name}
                    </span>
                    {teammates.length > 0 && (
                      <span className="text-slate-400 text-xs">
                        avec{" "}
                        {teammates
                          .map((t) => {
                            const p = t.profiles;
                            return p ? p.preferred_name || p.full_name.split(" ")[0] : "";
                          })
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                )}

                {service.spiritual_theme && (
                  <p className="text-slate-400 text-xs">🙏 {service.spiritual_theme}</p>
                )}
              </div>
            </div>

            <div className="px-4 pb-4">
              <ConfirmationButtons
                assignmentId={nextAssignment!.id}
                currentStatus={nextAssignment!.status ?? "pending"}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
            <p className="text-2xl mb-2">😌</p>
            <p className="text-slate-600 font-medium text-sm">Pas de service prévu</p>
            <p className="text-slate-400 text-xs mt-1">Profite du repos bien mérité</p>
          </div>
        )}
      </div>

      {/* Appréciations */}
      {recentAppreciations && recentAppreciations.length > 0 && (
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Heart className="w-3 h-3" /> Reçu cette semaine
          </p>
          <div className="space-y-2">
            {recentAppreciations.map((a, i) => {
              const from = a.profiles as { preferred_name: string | null; full_name: string } | null;
              const fromName = from ? (from.preferred_name || from.full_name.split(" ")[0]) : "Quelqu'un";
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <p className="text-slate-700 text-sm leading-relaxed">&ldquo;{a.message}&rdquo;</p>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">— {fromName}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
