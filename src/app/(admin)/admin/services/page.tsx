import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, CheckCircle, Clock } from "lucide-react";
import CreateServiceButton from "@/components/admin/CreateServiceButton";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: services } = await supabase
    .from("services")
    .select(`
      id, title, service_date, start_time, location, status, spiritual_theme,
      assignments(id, status)
    `)
    .neq("status", "cancelled")
    .gte("service_date", today)
    .order("service_date", { ascending: true });

  const statusLabel: Record<string, string> = {
    planned: "Planifié",
    confirmed: "Confirmé",
    past: "Passé",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Services</h1>
        <CreateServiceButton />
      </div>

      {services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map(s => {
            const assignments = s.assignments as { id: string; status: string }[];
            const confirmed = assignments.filter(a => a.status === "confirmed").length;
            const total = assignments.length;
            const pending = assignments.filter(a => a.status === "pending").length;

            return (
              <Link key={s.id} href={`/admin/services/${s.id}`}>
                <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-slate-900 capitalize">
                          {format(new Date(s.service_date), "EEEE d MMMM", { locale: fr })}
                          <span className="text-slate-500 font-normal ml-2">
                            {s.start_time?.slice(0, 5).replace(":", "h")}
                          </span>
                        </p>
                        {s.spiritual_theme && (
                          <p className="text-slate-500 text-sm">🙏 {s.spiritual_theme}</p>
                        )}
                        {s.location && (
                          <p className="text-slate-400 text-xs">📍 {s.location}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className={`rounded-full text-xs ${s.status === "confirmed" ? "bg-spirit-50 text-spirit-600" : ""}`}
                        >
                          {s.status ? (statusLabel[s.status] ?? s.status) : "—"}
                        </Badge>
                        {total > 0 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            {pending > 0 ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-3 h-3" />
                                {pending} en attente
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-spirit-600">
                                <CheckCircle className="w-3 h-3" />
                                {confirmed}/{total} confirmés
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-slate-400">Pas de service prévu pour l&apos;instant</p>
            <p className="text-slate-300 text-sm">Crée le prochain service pour commencer</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
