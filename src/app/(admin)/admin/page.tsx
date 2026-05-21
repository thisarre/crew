import { notFound } from 'next/navigation';

import { AdminDashboard } from '@/components/admin/dashboard';
import { createClient } from '@/lib/supabase/server';
import { buildAdminDashboard, loadAdminContext } from '@/lib/queries/admin';
import { PROFILE_IDS } from '@/data/seed';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);
  const adminProfile = ctx.profiles.find(p => p.id === PROFILE_IDS.alpha);
  if (!adminProfile) {
    notFound();
  }
  const data = buildAdminDashboard(ctx, adminProfile);
  return <AdminDashboard data={data} />;
}
