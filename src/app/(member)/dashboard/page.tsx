import { MemberDashboard } from '@/components/member/dashboard';
import { getMemberDashboardData } from '@/data/member-dashboard';
import { PROFILE_IDS } from '@/data/seed';

export default function DashboardPage() {
  const data = getMemberDashboardData(PROFILE_IDS.isaac);

  return <MemberDashboard data={data} />;
}
