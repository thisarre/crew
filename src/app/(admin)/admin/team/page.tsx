import { TeamList } from '@/components/admin/team-list';
import { createClient } from '@/lib/supabase/server';
import { buildMembersOverview, loadAdminContext } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);
  const members = buildMembersOverview(ctx);

  const stats = {
    total: members.length,
    autonomous: members.filter(m => m.skills.some(s => s.level === 'autonomous' || s.level === 'trainer')).length,
    learning: members.reduce((acc, m) => acc + m.skills.filter(s => s.level === 'learning').length, 0),
  };

  return <TeamList members={members} stats={stats} />;
}
