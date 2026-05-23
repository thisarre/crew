import { redirect } from 'next/navigation';

import { ServiceDayEmpty, ServiceDayView } from '@/components/member/service-day-view';
import { PROFILES_SEED } from '@/data/seed';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { loadServiceDayView } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

export default async function ServiceDayPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/');
  const profileId = session.profileId;

  const supabase = createClient();
  const data = await loadServiceDayView(supabase, profileId);

  if (!data) {
    const fallbackName = PROFILES_SEED.find(p => p.id === profileId)?.display_name ?? 'Membre';
    return <ServiceDayEmpty profileName={fallbackName} />;
  }

  return <ServiceDayView data={data} />;
}
