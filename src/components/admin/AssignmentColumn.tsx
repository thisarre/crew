"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = { id: string; preferred_name: string | null; full_name: string; avatar_url: string | null };
type Assignment = {
  id: string; status: string; skill_id: string; profile_id: string;
  profiles: Member | null;
};
type Skill = { id: string; name: string; icon: string | null };

type Props = {
  skill: Skill;
  assignments: Assignment[];
  availableMembers: Member[];
  serviceId: string;
};

const statusIcon = { confirmed: Check, pending: Clock, declined: X };
const statusColor = {
  confirmed: "text-spirit-600",
  pending: "text-amber-500",
  declined: "text-slate-400",
};

export default function AssignmentColumn({ skill, assignments, availableMembers, serviceId }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const assignedIds = new Set(assignments.map(a => a.profile_id));
  const unassigned = availableMembers.filter(m => !assignedIds.has(m.id));

  async function addMember(memberId: string) {
    const supabase = createClient();
    await supabase.from("assignments").insert({
      service_id: serviceId,
      profile_id: memberId,
      skill_id: skill.id,
      status: "pending",
    });
    setShowAdd(false);
    startTransition(() => router.refresh());
  }

  async function removeAssignment(assignmentId: string) {
    const supabase = createClient();
    await supabase.from("assignments").delete().eq("id", assignmentId);
    startTransition(() => router.refresh());
  }

  return (
    <Card className={cn("rounded-2xl", isPending && "opacity-60")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{skill.icon}</span>
          <h3 className="font-semibold text-slate-800">{skill.name}</h3>
        </div>

        {assignments.length === 0 && (
          <p className="text-slate-400 text-sm">Personne d&apos;assigné</p>
        )}

        {assignments.map(a => {
          const member = a.profiles;
          if (!member) return null;
          const name = member.preferred_name || member.full_name.split(" ")[0];
          const initials = name.slice(0, 2).toUpperCase();
          const Icon = statusIcon[a.status as keyof typeof statusIcon] ?? Clock;
          const color = statusColor[a.status as keyof typeof statusColor] ?? "text-slate-400";

          return (
            <div key={a.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-slate-100">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700 font-medium">{name}</span>
                <Icon className={cn("w-3.5 h-3.5", color)} />
              </div>
              <button
                onClick={() => removeAssignment(a.id)}
                className="text-slate-300 hover:text-red-400 transition-colors"
                aria-label="Retirer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-warmth-600 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        ) : (
          <div className="space-y-1.5">
            {unassigned.length === 0 ? (
              <p className="text-slate-400 text-xs">Tous les membres dispos sont assignés</p>
            ) : (
              unassigned.map(m => {
                const name = m.preferred_name || m.full_name.split(" ")[0];
                return (
                  <button
                    key={m.id}
                    onClick={() => addMember(m.id)}
                    className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-warmth-50 hover:text-warmth-700 transition-colors"
                  >
                    {name}
                  </button>
                );
              })
            )}
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Annuler
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
