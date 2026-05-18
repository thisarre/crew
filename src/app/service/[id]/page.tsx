import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

export default async function ServiceDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) notFound();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, status, checked_in_at, profiles!assignments_profile_id_fkey(id, preferred_name, full_name, avatar_url), skills(name, icon)")
    .eq("service_id", id)
    .eq("status", "confirmed");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-bold text-slate-900 capitalize">
            {format(new Date(service.service_date), "EEEE d MMMM", { locale: fr })}
          </h1>
          {service.spiritual_theme && (
            <p className="text-spirit-600 text-sm">🙏 {service.spiritual_theme}</p>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          {service.arrival_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Arrivée : {service.arrival_time.slice(0, 5).replace(":", "h")}
            </div>
          )}
          {service.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              {service.location}
            </div>
          )}
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">L&apos;équipe du jour</p>
            {(assignments ?? []).map(a => {
              const member = a.profiles as { preferred_name: string | null; full_name: string } | null;
              const skill = a.skills as { name: string; icon: string | null } | null;
              const name = member ? (member.preferred_name || member.full_name.split(" ")[0]) : "?";
              return (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{skill?.icon}</span>
                    <span className="text-sm text-slate-700 font-medium">{name}</span>
                    <span className="text-xs text-slate-400">{skill?.name}</span>
                  </div>
                  {a.checked_in_at && (
                    <span className="text-xs text-spirit-600 font-medium">✓ Arrivé</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-center text-slate-400 text-xs">
          Le check-in arrive en Phase 2 🚀
        </p>
      </div>
    </div>
  );
}
