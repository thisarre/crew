import Link from 'next/link';
import type { Route } from 'next';

export type AdminCalendarEvent = {
  id: string;
  date: string; // yyyy-mm-dd
  eventType: string;
  status: string;
  startTime: string | null;
};

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const eventTypeShort = (t: string) =>
  t === 'midweek_service' ? 'Semaine' : t === 'team_call' ? 'Call' : t === 'special_event' ? 'Spécial' : 'Culte';

const statusBadge = (s: string): { text: string; cls: string } => {
  if (s === 'cancelled') return { text: 'Annulé', cls: 'bg-[var(--color-error-bg)] text-[var(--color-error-fg)]' };
  if (s === 'published') return { text: 'Publié', cls: 'bg-[var(--color-sage)] text-ink' };
  if (s === 'completed') return { text: 'Passé', cls: 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]' };
  return { text: 'Brouillon', cls: 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]' };
};

const pad = (n: number) => String(n).padStart(2, '0');

export function AdminCalendar({
  services,
  year,
  month,
}: {
  services: AdminCalendarEvent[];
  year: number;
  month: number; // 1-12
}) {
  const monthEvents = services
    .filter(e => {
      const d = new Date(e.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=dim
  const offset = (firstDow + 6) % 7; // grille lundi -> dimanche

  const daysWithEvents = new Map<number, AdminCalendarEvent[]>();
  for (const e of monthEvents) {
    const day = new Date(e.date).getUTCDate();
    const arr = daysWithEvents.get(day) ?? [];
    arr.push(e);
    daysWithEvents.set(day, arr);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Console admin
          </p>
          <p className="mt-1 text-[24px] font-bold tracking-[-0.4px] text-ink capitalize">
            {MONTHS_FR[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/calendar?m=${prev.y}-${pad(prev.m)}` as Route}
            aria-label="Mois précédent"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[15px] font-bold text-ink"
          >
            ‹
          </Link>
          <Link
            href={`/admin/calendar?m=${next.y}-${pad(next.m)}` as Route}
            aria-label="Mois suivant"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[15px] font-bold text-ink"
          >
            ›
          </Link>
        </div>
      </header>

      {/* Grille du mois */}
      <section className="rounded-[22px] bg-white p-4">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="text-center text-[11px] font-bold text-[var(--color-text-secondary)]">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
            const evts = daysWithEvents.get(day) ?? [];
            const hasCancelled = evts.some(e => e.status === 'cancelled');
            const hasActive = evts.some(e => e.status !== 'cancelled');
            return (
              <div
                key={day}
                className="relative flex aspect-square flex-col items-center justify-center rounded-[12px] bg-[var(--color-bg)]"
              >
                <span className="text-[13px] font-semibold text-ink">{day}</span>
                {evts.length > 0 && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    {hasActive && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
                    {hasCancelled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-fg)]" />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Liste des services du mois */}
      <section className="space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
          Services du mois
        </p>
        {monthEvents.length === 0 && (
          <p className="rounded-[18px] bg-white p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
            Aucun service ce mois-ci.
          </p>
        )}
        {monthEvents.map(e => {
          const badge = statusBadge(e.status);
          const day = new Date(e.date).getUTCDate();
          return (
            <Link
              key={e.id}
              href={`/admin/services/${e.id}` as Route}
              className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 transition active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-bg)]">
                <span className="text-[15px] font-bold leading-none text-ink">{day}</span>
                <span className="text-[9px] font-semibold uppercase text-[var(--color-text-secondary)]">
                  {MONTHS_FR[month - 1].slice(0, 3)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-ink">{eventTypeShort(e.eventType)}</p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  {e.startTime ? e.startTime.slice(0, 5).replace(':', 'h') : 'Heure à définir'}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.cls}`}>
                {badge.text}
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
