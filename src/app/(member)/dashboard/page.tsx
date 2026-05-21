import { MemberDashboard, type NextAssignmentInfo } from '@/components/member/dashboard';
import { getMemberDashboardData } from '@/data/member-dashboard';
import { PROFILE_IDS } from '@/data/seed';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { fetchValidationsForMonth, getReferenceToday } from '@/lib/queries/admin';
import { getNextMemberAssignment } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = getSessionFromCookies();
  const profileId = session?.profileId ?? PROFILE_IDS.isaac;

  // Le mois et l'année courants pour la validation, dérivés de la date de référence.
  const today = getReferenceToday();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;

  const supabase = createClient();
  let monthValidated = false;
  let nextAssignment: NextAssignmentInfo = null;
  try {
    const [validations, next] = await Promise.all([
      fetchValidationsForMonth(supabase, year, month),
      getNextMemberAssignment(supabase, profileId),
    ]);
    monthValidated = validations.some(v => v.profile_id === profileId);
    nextAssignment = next ? { id: next.assignmentId, dateLabel: next.dateLabel, skillName: next.skillName } : null;
  } catch {
    // En cas d'erreur (DB indispo), on garde les valeurs par défaut
  }

  const data = getMemberDashboardData(profileId, { monthValidated });

  return <MemberDashboard data={data} nextAssignment={nextAssignment} />;
}
