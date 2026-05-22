'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IconBell,
  IconSparkles,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendar,
  IconHeadphones,
  IconHeart,
  IconX,
} from '@tabler/icons-react';

import { NotificationToggle } from '@/components/shared/notification-toggle';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { CalendarDay, DashboardData } from '@/data/member-dashboard';

export type NextAssignmentInfo = { id: string; dateLabel: string; skillName: string } | null;

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_PREMIUM } },
};

const calendarTypeStyles: Record<string, string> = {
  sunday_service: 'bg-[var(--color-sage)] text-ink',
  midweek_service: 'bg-[var(--color-mint)] text-ink',
  team_call: 'bg-[var(--color-lilac)] text-ink',
};

type MemberDashboardProps = {
  data: DashboardData;
  nextAssignment?: NextAssignmentInfo;
};

export function MemberDashboard({ data, nextAssignment = null }: MemberDashboardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelNext = async () => {
    if (!nextAssignment || cancelling) return;
    setCancelError(null);
    setCancelling(true);
    try {
      const res = await fetch(`/api/my/assignments/${nextAssignment.id}/cancel`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 pb-10">
      <ConfirmDialog
        open={confirmOpen}
        title="Tu ne peux plus assurer ?"
        message={
          nextAssignment
            ? `Ton créneau du ${nextAssignment.dateLabel} (${nextAssignment.skillName}) sera libéré et l'équipe sera prévenue.`
            : undefined
        }
        confirmLabel="Oui, j'annule"
        cancelLabel="Garder"
        tone="danger"
        busy={cancelling}
        error={cancelError}
        onConfirm={handleCancelNext}
        onCancel={() => {
          setConfirmOpen(false);
          setCancelError(null);
        }}
      />
      <motion.section variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">Hey {data.profile.name}</p>
          <p className="mt-1.5 text-[14px] text-[var(--color-text-secondary)]">{data.profile.subtitle}</p>
        </div>
        <div className="relative">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-ink"
            style={{ backgroundColor: data.profile.avatarColor }}
          >
            {data.profile.initials}
          </div>
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-sage)] animate-pulse-dot" />
        </div>
      </motion.section>

      {data.validation && data.validation.needsAction && (
        <motion.section variants={fadeUp} className="rounded-[24px] bg-ink p-5 text-white" style={{ animation: 'pulseGlow 2.5s ease-in-out infinite' }}>
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage)]">
              <IconBell size={14} stroke={2} className="text-ink" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--color-sage)]">Action requise</p>
          </div>
          <p className="text-[18px] font-bold leading-[1.25]">{data.validation.monthLabel}</p>
          <p className="mt-1.5 text-[13px] text-white/70">{data.validation.description}</p>
          <Link
            href={'/calendar/validate' as Route}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[100px] bg-[var(--color-sage)] py-3 text-[14px] font-bold text-ink transition hover:-translate-y-0.5"
          >
            {data.validation.buttonLabel}
            <IconArrowRight size={16} stroke={2} />
          </Link>
        </motion.section>
      )}

      {data.weeklyThought && (
        <motion.section variants={fadeUp} className="rounded-[24px] bg-[var(--color-sage)] p-5">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink">
              <IconSparkles size={12} stroke={2} className="text-[var(--color-sage)]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink">{data.weeklyThought.label}</p>
          </div>
          <p className="text-[16px] font-medium text-ink leading-[1.45]">{data.weeklyThought.verse}</p>
          <p className="text-[12px] font-medium text-ink/70">{data.weeklyThought.reference}</p>
        </motion.section>
      )}

      <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-mint)]">
              <IconCalendar size={12} stroke={2} className="text-ink" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink">Ton mois</p>
          </div>
          <Link
            href={'/calendar' as Route}
            className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-text-secondary)] transition active:scale-95"
          >
            <span>Voir</span>
            <IconArrowUpRight size={14} stroke={2} />
          </Link>
        </div>
        <p className="text-[22px] font-bold tracking-[-0.3px] text-ink">{data.calendar.monthLabel}</p>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {data.calendar.weekdays.map((day, index) => (
            <span key={`${day}-${index}`} className="text-[10px] font-semibold text-[var(--color-text-muted)]">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {data.calendar.days.map((day, index) => (
            <CalendarCell key={`${day.value ?? 'empty'}-${index}`} day={day} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-[var(--color-border-soft)] pt-3">
          {data.calendar.legend.map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
              <span className={`h-2 w-2.5 rounded-sm ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </motion.section>

      {data.nextEvent ? (
        <motion.section variants={fadeUp} className="overflow-hidden rounded-[24px] bg-white">
          <div className="relative flex h-28 items-center justify-center bg-[var(--color-mint)]">
            <div className="animate-cardFloat">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10">
                <IconHeadphones size={24} stroke={2} className="text-ink" />
              </div>
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
              {data.nextEvent.countdownLabel}
            </span>
            {data.nextEvent.skillBadge && (
              <span className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">
                {data.nextEvent.skillBadge}
              </span>
            )}
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink/80">Prochain événement</p>
              <p className="text-[22px] font-bold tracking-[-0.3px] text-ink">{data.nextEvent.title}</p>
              <p className="text-[13px] text-[var(--color-text-secondary)]">{data.nextEvent.details}</p>
            </div>
            {data.nextEvent.teammates.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {data.nextEvent.teammates.map(teammate => (
                    <div
                      key={`${teammate.initials}-${teammate.color}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-ink"
                      style={{ backgroundColor: teammate.color }}
                    >
                      {teammate.initials}
                    </div>
                  ))}
                </div>
                <p className="text-[13px] font-medium text-ink">Avec {data.nextEvent.teammates.map(t => t.name).join(' & ')}</p>
              </div>
            )}
            {data.nextEvent.theme && (
              <div className="flex items-center gap-2 rounded-[12px] bg-[var(--color-bg)] px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage)]">
                  <IconHeart size={12} stroke={2} className="text-ink" />
                </div>
                <p className="text-[13px] font-medium text-ink">{data.nextEvent.theme}</p>
              </div>
            )}
            {nextAssignment && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white py-2.5 text-[12px] font-semibold text-[var(--color-text-secondary)] active:scale-[0.98]"
              >
                <IconX size={13} stroke={2} />
                Je ne peux plus assurer
              </button>
            )}
          </div>
        </motion.section>
      ) : (
        <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg)]">
            <IconCalendar size={20} stroke={2} className="text-[var(--color-text-secondary)]" />
          </div>
          <p className="text-[14px] font-semibold text-ink">Aucun service à venir</p>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Tu n&apos;es assigné à rien pour le moment. Tu seras prévenu dès qu&apos;un service est publié.
          </p>
        </motion.section>
      )}

      {data.appreciation && (
        <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-lilac)]">
              <IconHeart size={12} stroke={2} className="text-ink" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink">Reçu cette semaine</p>
          </div>
          <div className="flex gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold text-ink"
              style={{ backgroundColor: data.appreciation.avatar.color }}
            >
              {data.appreciation.avatar.initials}
            </div>
            <div>
              <p className="text-[14px] font-medium leading-[1.5] text-ink">{data.appreciation.message}</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                {data.appreciation.author} · {data.appreciation.timeAgo}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      <motion.section variants={fadeUp}>
        <NotificationToggle profileId={data.profile.id} />
      </motion.section>
    </motion.div>
  );
}

const CalendarCell = ({ day }: { day: CalendarDay }) => {
  if (!day.value) {
    return <div className="aspect-square" aria-hidden="true" />;
  }

  if (day.isToday) {
    return (
      <div className="relative flex aspect-square flex-col items-center justify-center rounded-[12px] bg-ink text-white">
        <span className="text-[13px] font-semibold">{day.value}</span>
        <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-sage)]" />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-[var(--color-sage)] animate-pulse-dot" />
      </div>
    );
  }

  if (day.type) {
    return (
      <div className={`flex aspect-square flex-col items-center justify-center rounded-[12px] ${calendarTypeStyles[day.type]}`}>
        <span className="text-[13px] font-semibold">{day.value}</span>
        <span className="mt-0.5 h-1 w-1 rounded-full bg-ink" />
      </div>
    );
  }

  return (
    <div className="flex aspect-square items-center justify-center">
      <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">{day.value}</span>
    </div>
  );
};
