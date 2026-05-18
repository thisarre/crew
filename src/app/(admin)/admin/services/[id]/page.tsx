import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AssignmentColumn from "@/components/admin/AssignmentColumn";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  // Pôles de l'organisation
  const { data: skills } = await supabase
    .from("skills")
    .select("id, name, icon, display_order")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("display_order");

  // Assignations du service
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, status, skill_id, profile_id, profiles(id, preferred_name, full_name, avatar_url)")
    .eq("service_id", id);

  // Membres disponibles (pas d'indispo ce jour-là)
  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, preferred_name, full_name, avatar_url")
    .eq("organization_id", profile?.organization_id ?? "")
    .eq("is_active", true);

  const serviceDate = service.service_date;
  const { data: unavailable } = await supabase
    .from("unavailabilities")
    .select("profile_id")
    .lte("start_date", serviceDate)
    .gte("end_date", serviceDate);

  const unavailableIds = new Set((unavailable ?? []).map(u => u.profile_id));
  const availableMembers = (allMembers ?? []).filter(m => !unavailableIds.has(m.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/services" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-slate-900 capitalize">
            {format(new Date(service.service_date), "EEEE d MMMM", { locale: fr })}
            <span className="text-slate-500 font-normal ml-2 text-base">
              {service.start_time?.slice(0, 5).replace(":", "h")}
            </span>
          </h1>
          {service.spiritual_theme && (
            <p className="text-slate-500 text-sm">🙏 {service.spiritual_theme}</p>
          )}
        </div>
        <Link
          href={`/service/${id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mode Service Day
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(skills ?? []).map(skill => {
          const skillAssignments = (assignments ?? []).filter(a => a.skill_id === skill.id);
          return (
            <AssignmentColumn
              key={skill.id}
              skill={skill}
              assignments={skillAssignments as any}
              availableMembers={availableMembers}
              serviceId={id}
            />
          );
        })}
      </div>
    </div>
  );
}
