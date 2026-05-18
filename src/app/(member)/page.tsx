import { createClient } from "@/lib/supabase/server";
import { getGreeting, getServiceCountMessage, formatServiceDate } from "@/lib/tone";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import ConfirmationButtons from "@/components/member/ConfirmationButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, BarChart2, BookOpen } from "lucide-react";

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

  // Prochain service avec assignation de ce membre
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

  // Co-équipiers du même service
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

  // Pensée de la semaine
  const { data: spiritualContent } = await supabase
    .from("spiritual_content")
    .select("title, content, reference, type")
    .eq("organization_id", profile.organization_id ?? "")
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Appréciations reçues cette semaine
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAppreciations } = await supabase
    .from("appreciations")
    .select("message, from_profile_id, profiles!appreciations_from_profile_id_fkey(preferred_name, full_name)")
    .eq("to_profile_id", user.id)
    .gte("created_at", oneWeekAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(3);

  // Stats du mois
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
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Salutation */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {getGreeting(name)}
        </h1>
      </div>

      {/* Pensée de la semaine */}
      {spiritualContent && (
        <Card className="rounded-2xl border-spirit-500/20 bg-spirit-50">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-spirit-600 text-xs font-medium mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              {spiritualContent.type === "verse" ? "Verset de la semaine" : "Pensée de la semaine"}
            </div>
            <p className="text-slate-800 text-sm leading-relaxed italic">
              &ldquo;{spiritualContent.content}&rdquo;
            </p>
            {spiritualContent.reference && (
              <p className="text-spirit-600 text-xs font-medium">— {spiritualContent.reference}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prochain service */}
      <div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
          <Calendar className="w-4 h-4" />
          Prochain service
        </div>
        {service ? (
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 capitalize">
                  {formatServiceDate(new Date(`${service.service_date}T${service.start_time}`))}
                </p>
                {service.arrival_time && (
                  <p className="text-slate-500 text-sm">
                    Arrivée à {service.arrival_time.slice(0, 5).replace(":", "h")}
                  </p>
                )}
                {service.location && (
                  <p className="text-slate-500 text-sm">📍 {service.location}</p>
                )}
              </div>

              {skill && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {skill.icon} {skill.name}
                  </Badge>
                  {teammates.length > 0 && (
                    <span className="text-slate-500 text-xs">
                      avec {teammates.map(t => {
                        const p = t.profiles;
                        return p ? (p.preferred_name || p.full_name.split(" ")[0]) : "";
                      }).filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              )}

              {service.spiritual_theme && (
                <p className="text-slate-500 text-sm">
                  🙏 Thème : <span className="text-slate-700 font-medium">{service.spiritual_theme}</span>
                </p>
              )}

              <ConfirmationButtons
                assignmentId={nextAssignment!.id}
                currentStatus={nextAssignment!.status ?? "pending"}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-5 text-center text-slate-400 text-sm">
              Pas de service prévu — repose-toi bien 😌
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appréciations reçues */}
      {recentAppreciations && recentAppreciations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Heart className="w-4 h-4" />
            Reçu cette semaine
          </div>
          <div className="space-y-2">
            {recentAppreciations.map((a, i) => {
              const from = a.profiles as { preferred_name: string | null; full_name: string } | null;
              const fromName = from ? (from.preferred_name || from.full_name.split(" ")[0]) : "Quelqu'un";
              return (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-slate-700 text-sm">&ldquo;{a.message}&rdquo;</p>
                    <p className="text-slate-400 text-xs mt-1">— {fromName}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats du mois */}
      <div className="flex items-center gap-2 pt-2 pb-4">
        <BarChart2 className="w-4 h-4 text-slate-400" />
        <p className="text-slate-400 text-xs">
          Ce mois : <span className="text-slate-600 font-medium">{stats?.services_this_month ?? 0} service{(stats?.services_this_month ?? 0) > 1 ? "s" : ""}</span>
          {stats?.services_this_month ? ` · ${getServiceCountMessage(stats.services_this_month).replace(/^\d+e service ce mois, /, "")}` : ""}
        </p>
      </div>
    </div>
  );
}
