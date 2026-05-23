import { redirect } from 'next/navigation';

import { MemberDashboard, type NextAssignmentInfo } from '@/components/member/dashboard';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getNextMemberAssignment, loadMemberDashboard } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/');
  const profileId = session.profileId;

  const supabase = createClient();
  const [data, next] = await Promise.all([
    loadMemberDashboard(supabase, profileId),
    getNextMemberAssignment(supabase, profileId),
  ]);

  const nextAssignment: NextAssignmentInfo = next
    ? { id: next.assignmentId, dateLabel: next.dateLabel, skillName: next.skillName }
    : null;

  return <MemberDashboard data={data} nextAssignment={nextAssignment} />;
}
