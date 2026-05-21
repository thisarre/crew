import { MonthlyConsultation } from '@/components/member/monthly-consultation';
import { PROFILE_IDS } from '@/data/seed';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getReferenceToday } from '@/lib/queries/admin';
import { loadMemberMonthView } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

const parseMonthParam = (raw: string | undefined): { year: number; month: number } | null => {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const session = getSessionFromCookies();
  const profileId = session?.profileId ?? PROFILE_IDS.isaac;

  const today = getReferenceToday();
  const fallback = { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
  const period = parseMonthParam(searchParams.m) ?? fallback;

  const supabase = createClient();
  const data = await loadMemberMonthView(supabase, profileId, period);

  return <MonthlyConsultation data={data} />;
}
