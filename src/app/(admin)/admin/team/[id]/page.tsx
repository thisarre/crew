import { notFound } from 'next/navigation';

import { MemberDetail } from '@/components/admin/member-detail';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { buildMemberDetail, loadAdminContext } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminMemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);
  const data = buildMemberDetail(ctx, params.id);
  if (!data) notFound();
  const allSkills = ctx.skills.map(s => ({ id: s.id, name: s.name }));
  const session = getSessionFromCookies();
  return (
    <MemberDetail data={data} allSkills={allSkills} currentProfileId={session?.profileId ?? null} />
  );
}
