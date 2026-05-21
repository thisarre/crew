import { ServicesList } from '@/components/admin/services-list';
import { createClient } from '@/lib/supabase/server';
import { buildServicesList, loadAdminContext } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);
  const services = buildServicesList(ctx);
  return <ServicesList services={services} />;
}
