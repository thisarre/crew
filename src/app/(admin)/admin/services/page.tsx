import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { CheckCircle, Clock, ChevronRight } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Services</h1>
        <CreateServiceButton />
      </div>

      {services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((s) => {
            const assignments = s.assignments as { id: string; status: string }[];
            const confirmed = assignments.filter((a) => a.status === "confirmed").length;
            const total = assignments.length;
            const pending = assignments.filter((a) => a.status === "pending").length;
            const date = parseISO(s.service_date);
            const dayName = format(date, "EEE", { locale: fr });
            const dayNum = format(date, "d");
            const monthName = format(date, "MMM", { locale: fr });

            return (
              <Link key={s.id} href={`/admin/services/${s.id}`}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] flex items-stretch overflow-hidden">
                  {/* Date tile */}
                  <div className="flex-shrink-0 w-[60px] bg-warmth-500 flex flex-col items-center justify-center py-4 gap-0.5">
                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-none">
                      {dayName}
                    </span>
                    <span className="text-white text-2xl font-bold leading-tight">
                      {dayNum}
                    </span>
                    <span className="text-white/70 text-[10px] font-semibold uppercase leading-none">
                      {monthName}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-bold text-slate-900 text-[15px]">
                          {s.start_time?.slice(0, 5).replace(":", "h")}
                        </p>
                        {s.location && (
                          <p className="text-slate-400 text-xs truncate">📍 {s.location}</p>
                        )}
                      </div>
                      {s.spiritual_theme && (
                        <p className="text-slate-500 text-xs truncate">🙏 {s.spiritual_theme}</p>
                      )}
                      {total > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          {pending > 0 ? (
                            <span className="flex items-center gap-1 text-warmth-600 font-medium">
                              <Clock className="w-3 h-3" />
                              {pending} en attente
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-spirit-600 font-medium">
                              <CheckCircle className="w-3 h-3" />
                              {confirmed}/{total} confirmés
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-slate-600 font-medium text-sm">Pas de service prévu</p>
          <p className="text-slate-400 text-xs mt-1">Crée le prochain pour commencer</p>
        </div>
      )}
    </div>
  );
}
