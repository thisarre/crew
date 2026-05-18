import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InviteMemberButton from "@/components/admin/InviteMemberButton";

export default async function AdminEquipePage() {
  const supabase = await createClient();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();
  const profile = profileRaw as { organization_id: string } | null;

  type Member = {
    id: string; full_name: string; preferred_name: string | null;
    email: string | null; role: string; avatar_url: string | null;
    is_active: boolean;
    member_skills: { level: string; skills: { name: string; icon: string | null } | null }[];
  };

  const { data: membersRaw } = await supabase
    .from("profiles")
    .select(`
      id, full_name, preferred_name, email, role, avatar_url, is_active, joined_at,
      member_skills(level, skills(name, icon))
    `)
    .eq("organization_id", profile?.organization_id ?? "")
    .order("full_name");
  const members = membersRaw as Member[] | null;

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    leader: "Leader",
    member: "Membre",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Équipe</h1>
        <InviteMemberButton organizationId={profile?.organization_id ?? ""} />
      </div>

      <div className="space-y-3">
        {(members ?? []).map(m => {
          const name = m.preferred_name || m.full_name;
          const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          const skills = m.member_skills;

          return (
            <Card key={m.id} className={`rounded-2xl ${!m.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={m.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-warmth-50 text-warmth-600 font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{name}</p>
                    <Badge variant="secondary" className="rounded-full text-xs shrink-0">
                      {roleLabel[m.role] ?? m.role}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs truncate">{m.email}</p>
                  {skills && skills.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {skills.map((ms, i) => (
                        <span key={i} className="text-xs text-slate-500">
                          {ms.skills?.icon} {ms.skills?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
