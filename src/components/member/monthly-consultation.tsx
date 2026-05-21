'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceTv,
  IconHeadphones,
  IconVideo,
  IconX,
} from '@tabler/icons-react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { MemberMonthView, MonthCalendarCell, MonthEvent } from '@/lib/queries/member';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};

const monthHref = (m: { year: number; month: number }) =>
  `/calendar?m=${m.year}-${String(m.month).padStart(2, '0')}` as Route;

const SkillIcon = ({ type, size = 28 }: { type: MonthEvent['type']; size?: number }) => {
  if (type === 'midweek_service') return <IconVideo size={size} stroke={2} className="text-ink" />;
  if (type === 'team_call') return <IconDeviceTv size={size} stroke={2} className="text-ink" />;
  return <IconHeadphones size={size} stroke={2} className="text-ink" />;
};

const typeBadge = (type: MonthEvent['type']) => {
  if (type === 'midweek_service') return { label: 'Semaine', color: 'bg-[var(--color-mint)]' };
  if (type === 'team_call') return { label: 'Call', color: 'bg-[var(--color-lilac)]' };
  return { label: 'Culte', color: 'bg-[var(--color-sage)]' };
};

export function MonthlyConsultation({ data }: { data: MemberMonthView }) {
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<MonthEvent | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelError(null);
    setCancelling(true);
    try {
      const res = await fetch(`/api/my/assignments/${cancelTarget.id}/cancel`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setCancelTarget(null);
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-6">
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Tu ne peux plus assurer ?"
        message={
          cancelTarget
            ? `Ton créneau du ${cancelTarget.dateLabel} (${cancelTarget.skillName}) sera libéré et l'équipe sera prévenue.`
            : undefined
        }
        confirmLabel="Oui, j'annule"
        cancelLabel="Garder"
        tone="danger"
        busy={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => {
          setCancelTarget(null);
          setCancelError(null);
        }}
      />
      {/* Header */}
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <IconArrowLeft size={18} stroke={2} className="text-ink" />
        </button>
        <p className="text-[16px] font-bold text-ink">Ton calendrier</p>
        <span className="h-9 w-9" aria-hidden="true" />
      </motion.header>

      {/* Nav mois */}
      <motion.section
        variants={fadeUp}
        className="flex items-center justify-between rounded-[18px] bg-white p-1.5"
      >
        <Link
          href={monthHref(data.prev)}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-xl"
        >
          <IconChevronLeft size={18} stroke={2} className="text-[var(--color-text-secondary)]" />
        </Link>
        <div className="flex-1 text-center">
          <p className="text-[17px] font-bold tracking-[-0.2px] text-ink capitalize">{data.monthLabel}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              data.validated
                ? 'bg-ink text-[var(--color-sage)]'
                : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]'
            }`}
          >
            {data.validated ? 'Validé' : 'À valider'}
          </span>
        </div>
        <Link
          href={monthHref(data.next)}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-xl"
        >
          <IconChevronRight size={18} stroke={2} className="text-[var(--color-text-secondary)]" />
        </Link>
      </motion.section>

      {/* Mini-calendrier */}
      <motion.section variants={fadeUp} className="rounded-[22px] bg-white p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {data.weekdays.map((d, i) => (
            <span key={`${d}-${i}`} className="text-[10px] font-semibold text-[var(--color-text-muted)]">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {data.calendar.map((cell, i) => (
            <CalendarCell key={i} cell={cell} />
          ))}
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section variants={fadeUp} className="grid grid-cols-3 gap-2">
        <StatTile value={data.stats.engagements} label="engagements" />
        <StatTile value={data.stats.present} label="présent" tone="sage" />
        <StatTile value={data.stats.absent} label="absent" tone="error" />
      </motion.section>

      {/* À venir */}
      {data.upcoming.length > 0 && (
        <>
          <motion.p variants={fadeUp} className="pt-1 text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            À venir
          </motion.p>
          <motion.div variants={container} className="space-y-3">
            {data.upcoming.map(evt => (
              <UpcomingCard key={evt.id} evt={evt} onCancel={() => setCancelTarget(evt)} />
            ))}
          </motion.div>
        </>
      )}

      {/* Passés */}
      {data.past.length > 0 && (
        <>
          <motion.p variants={fadeUp} className="pt-1 text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Passés
          </motion.p>
          <motion.div variants={container} className="space-y-2">
            {data.past.map(evt => (
              <motion.div
                key={evt.id}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 opacity-70"
              >
                {evt.status === 'present' ? (
                  <IconCheck size={18} stroke={2} className="text-[var(--color-sage)]" />
                ) : (
                  <IconX size={18} stroke={2} className="text-[var(--color-error-fg)]" />
                )}
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink">{evt.shortDateLabel}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                    {evt.skillName} · {evt.status === 'present' ? 'servi' : 'absent'}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {data.upcoming.length === 0 && data.past.length === 0 && (
        <motion.p variants={fadeUp} className="rounded-[22px] bg-white p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
          Aucun engagement ce mois-ci.
        </motion.p>
      )}
    </motion.div>
  );
}

function CalendarCell({ cell }: { cell: MonthCalendarCell }) {
  if (!cell.day) return <div className="aspect-square" aria-hidden="true" />;

  if (cell.isToday) {
    return (
      <div className="relative flex aspect-square items-center justify-center rounded-[10px] bg-ink">
        <span className="text-[11px] font-bold text-white">{cell.day}</span>
        <span className="absolute -right-[3px] -top-[3px] h-2 w-2 rounded-full border-[1.5px] border-white bg-[var(--color-sage)] animate-pulse-dot" />
      </div>
    );
  }

  // Jour avec engagement
  if (cell.status === 'cancelled') {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[10px] border-[1.5px] border-[#E24B4A] bg-[var(--color-error-bg)]/60">
        <span className="text-[11px] font-bold text-[var(--color-error-fg)] line-through">{cell.day}</span>
      </div>
    );
  }

  if (cell.status === 'present' && cell.type) {
    const bg =
      cell.type === 'midweek_service'
        ? 'bg-[var(--color-mint)]'
        : cell.type === 'team_call'
          ? 'bg-[var(--color-lilac)]'
          : 'bg-[var(--color-sage)]';
    return (
      <div className={`flex aspect-square items-center justify-center rounded-[10px] ${bg}`}>
        <span className="text-[11px] font-bold text-ink">{cell.day}</span>
      </div>
    );
  }

  // Jour normal
  return (
    <div className="flex aspect-square items-center justify-center">
      <span className="text-[11px] text-[var(--color-text-secondary)]">{cell.day}</span>
    </div>
  );
}

function UpcomingCard({ evt, onCancel }: { evt: MonthEvent; onCancel: () => void }) {
  const badge = typeBadge(evt.type);
  const canCancel = evt.status === 'present';
  const isHero = evt.status === 'present' && evt.type === 'sunday_service';

  if (!isHero) {
    return (
      <motion.div variants={fadeUp} className="rounded-[22px] bg-white px-[18px] py-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[15px] font-bold text-ink capitalize">{evt.dateLabel}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-ink ${badge.color}`}>{badge.label}</span>
        </div>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          {evt.startLabel}
          {evt.location && ` · ${evt.location}`}
          {evt.skillName && ` · ${evt.skillName}`}
        </p>
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2.5 flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] active:scale-95"
          >
            <IconX size={12} stroke={2} />
            Je ne peux plus assurer
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className="overflow-hidden rounded-[22px] border-2 border-ink bg-white">
      <div className="relative flex h-20 items-center justify-center bg-[var(--color-mint)]">
        <SkillIcon type={evt.type} />
        <span className="absolute left-3 top-2.5 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
          {evt.countdownLabel}
        </span>
        <span className="absolute right-3 top-2.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
          {evt.skillName}
        </span>
      </div>
      <div className="px-[18px] py-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[17px] font-bold text-ink capitalize">{evt.dateLabel}</p>
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-sage)] px-2 py-1">
            <IconCheck size={12} stroke={2.5} className="text-ink" />
            <span className="text-[11px] font-bold text-ink">Présent</span>
          </span>
        </div>
        <p className="mb-2.5 text-[12px] text-[var(--color-text-secondary)]">
          {evt.arrivalLabel && `Arrivée ${evt.arrivalLabel}`}
          {evt.location && ` · ${evt.location}`}
        </p>
        <div className="flex items-center gap-2">
          {evt.teammates.length > 0 && (
            <div className="flex items-center">
              {evt.teammates.slice(0, 3).map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-ink ${i > 0 ? '-ml-[7px]' : ''}`}
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
              ))}
            </div>
          )}
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            {evt.teammates.map(t => t.name).join(' & ')}
            {evt.theme && ` · Thème : ${evt.theme}`}
          </p>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white py-2.5 text-[12px] font-semibold text-[var(--color-text-secondary)] active:scale-[0.98]"
          >
            <IconX size={13} stroke={2} />
            Je ne peux plus assurer
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StatTile({ value, label, tone }: { value: number; label: string; tone?: 'sage' | 'error' }) {
  const bg = tone === 'sage' ? 'bg-[var(--color-sage)]' : 'bg-white';
  const border = tone === 'error' ? 'border border-[var(--color-error-bg)]' : '';
  const valueColor = tone === 'error' ? 'text-[var(--color-error-fg)]' : 'text-ink';
  return (
    <div className={`rounded-2xl px-2.5 py-3 text-center ${bg} ${border}`}>
      <p className={`text-[22px] font-bold leading-none tracking-[-0.5px] ${valueColor}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-medium ${tone === 'sage' ? 'text-ink' : 'text-[var(--color-text-secondary)]'}`}>
        {label}
      </p>
    </div>
  );
}
