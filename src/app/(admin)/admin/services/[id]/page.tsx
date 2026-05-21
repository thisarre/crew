import { notFound } from 'next/navigation';

import { ServiceDetail } from '@/components/admin/service-detail';
import { createClient } from '@/lib/supabase/server';
import { buildServiceDetail, loadAdminContext } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminServiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);
  const data = buildServiceDetail(ctx, params.id);
  if (!data) notFound();
  return <ServiceDetail data={data} />;
}
