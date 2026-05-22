import { AdminCalendar, type AdminCalendarEvent } from '@/components/admin/admin-calendar';
import { createClient } from '@/lib/supabase/server';
import { getReferenceToday, loadAdminContext } from '@/lib/queries/admin';

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

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const today = getReferenceToday();
  const fallback = { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
  const period = parseMonthParam(searchParams.m) ?? fallback;

  const supabase = createClient();
  const ctx = await loadAdminContext(supabase);

  const services: AdminCalendarEvent[] = ctx.services.map(s => ({
    id: s.id,
    date: s.service_date,
    eventType: s.event_type,
    status: s.status ?? 'draft',
    startTime: s.start_time,
  }));

  return <AdminCalendar services={services} year={period.year} month={period.month} />;
}
