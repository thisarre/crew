import { redirect } from 'next/navigation';

import { ValidationView } from '@/components/member/validation/validation-view';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { fetchValidationsForMonth, getReferenceToday } from '@/lib/queries/admin';
import { loadMemberValidationData } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

export default async function ValidationPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/');
  const profileId = session.profileId;

  const today = getReferenceToday();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;

  const supabase = createClient();
  const [data, validations] = await Promise.all([
    loadMemberValidationData(supabase, profileId, { year, month }),
    fetchValidationsForMonth(supabase, year, month),
  ]);

  const alreadyValidated = validations.some(v => v.profile_id === profileId);

  return <ValidationView data={data} year={year} month={month} alreadyValidated={alreadyValidated} />;
}
