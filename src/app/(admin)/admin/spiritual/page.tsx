import { SpiritualBoard } from '@/components/admin/spiritual';
import { createClient } from '@/lib/supabase/server';
import { fetchSpiritualContent } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSpiritualPage() {
  const supabase = createClient();
  const items = await fetchSpiritualContent(supabase);
  return <SpiritualBoard items={items} />;
}
