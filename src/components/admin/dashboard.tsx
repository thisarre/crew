'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { motion } from 'framer-motion';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconDeviceTv,
  IconHeadphones,
  IconPlus,
  IconSparkles,
  IconUser,
  IconVideo,
} from '@tabler/icons-react';

import { BottomSheet } from '@/components/shared/bottom-sheet';
import type { MessageDraftResult } from '@/lib/ai/message-draft';
import type { AdminAlert, AdminDashboardData } from '@/lib/queries/admin';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_PREMIUM } },
};

const SkillIcon = ({ badge, size = 22 }: { badge: 'sono' | 'camera' | 'diffusion'; size?: number }) => {
  if (badge === 'camera') return <IconVideo size={size} stroke={2} className="text-ink" />;
  if (badge === 'diffusion') return <IconDeviceTv size={size} stroke={2} className="text-ink" />;
  return <IconHeadphones size={size} stroke={2} className="text-ink" />;
};

type AdminDashboardProps = {
  data: AdminDashboardData;
};

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [activeAlert, setActiveAlert] = useState<AdminAlert | null>(null);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 pb-6">
      {/* Header */}
      <motion.section variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">Hey {data.admin.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.4px] text-[var(--color-sage)]">
              Responsable
            </span>
            <p className="text-[12px] text-[var(--color-text-secondary)]">{data.todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-bold text-[var(--color-sage)]"
              style={{ backgroundColor: data.admin.avatarColor }}
            >
              {data.admin.initials}
            </div>
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-sage)] animate-pulse-dot" />
          </div>
        </div>
      </motion.section>

      {/* Prochain événement */}
      {data.nextService && (
        <motion.section
          variants={fadeUp}
          className="overflow-hidden rounded-[24px] border-2 border-ink bg-white"
        >
          <div
            className="relative flex h-[100px] items-center justify-center"
            style={{ backgroundColor: data.nextService.skillColor }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/10">
              <SkillIcon badge={data.nextService.skillBadge} size={24} />
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
              {data.nextService.countdownLabel}
            </span>
            <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
              Prochain
            </span>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
                  Prochain événement
                </p>
                <p className="mt-1 text-[20px] font-bold capitalize text-ink">{data.nextService.dateLabel}</p>
                <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                  {data.nextService.startLabel} · {data.nextService.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-bold leading-none text-ink">
                  {data.nextService.validatedCount}
                  <span className="text-[14px] text-[var(--color-text-secondary)]">/{data.nextService.totalSlots}</span>
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--color-text-secondary)]">
                  Validés
                </p>
              </div>
            </div>
            <Link
              href={`/admin/services/${data.nextService.id}` as Route}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[13px] font-bold text-white transition active:scale-[0.97]"
            >
              Voir et gérer le service
              <IconArrowRight size={15} stroke={2} />
            </Link>
          </div>
        </motion.section>
      )}

      {/* Actions à mener */}
      {data.alerts.length > 0 && (
        <>
          <motion.div variants={fadeUp} className="flex items-center gap-2 pt-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-error-bg)]">
              <IconAlertCircle size={12} stroke={2} className="text-[var(--color-error-fg)]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink">Actions à mener</p>
            <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-sage)]">
              {data.alerts.length}
            </span>
          </motion.div>
          <motion.div variants={fadeUp} className="space-y-2">
            {data.alerts.map((alert, idx) => (
              <AlertCard
                key={`${alert.kind}-${alert.profileId}-${idx}`}
                alert={alert}
                onAction={() => setActiveAlert(alert)}
              />
            ))}
          </motion.div>
        </>
      )}

      <MessageDraftSheet alert={activeAlert} onClose={() => setActiveAlert(null)} />

      {/* Planning personnel de l'admin */}
      {data.personalAssignment && (
        <motion.section
          variants={fadeUp}
          className="rounded-[22px] bg-[var(--color-sage)] p-5"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink">
              <IconUser size={12} stroke={2} className="text-[var(--color-sage)]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink">Ton planning de servant</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[17px] font-bold capitalize text-ink">{data.personalAssignment.label}</p>
              <p className="mt-1 text-[12px] text-ink/70">
                {data.personalAssignment.skill}
                {data.personalAssignment.teammates.length > 0 &&
                  ` · Avec ${data.personalAssignment.teammates.join(' & ')}`}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink">
              <IconHeadphones size={22} stroke={2} className="text-[var(--color-sage)]" />
            </div>
          </div>
        </motion.section>
      )}

      {/* Stats */}
      <motion.section variants={fadeUp} className="grid grid-cols-3 gap-2">
        <StatTile value={String(data.stats.activeMembers)} label="membres actifs" />
        <StatTile value={String(data.stats.servicesThisMonth)} label="services ce mois" />
        <StatTile value={`${data.stats.attendancePercent}%`} label="de présence" highlight />
      </motion.section>

      {/* FAB */}
      <Link
        href={'/admin/services/new' as Route}
        aria-label="Créer un événement"
        className="fixed bottom-[110px] right-[max(20px,calc(50%-195px))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink shadow-[0_8px_24px_rgba(22,22,27,0.18)] transition active:scale-95"
      >
        <IconPlus size={26} stroke={2} className="text-[var(--color-sage)]" />
      </Link>
    </motion.div>
  );
}

function AlertCard({ alert, onAction }: { alert: AdminAlert; onAction: () => void }) {
  const isError = alert.severity === 'error';
  const borderClass = isError
    ? 'border-[var(--color-error-bg)] border-l-4 border-l-[var(--color-error-fg)]'
    : 'border-[var(--color-warning-bg)] border-l-4 border-l-[var(--color-warning-fg)]';

  return (
    <div className={`rounded-[14px] border bg-white p-3.5 ${borderClass}`}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink"
          style={{ backgroundColor: alert.profileColor }}
        >
          {alert.profileInitials}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-ink">{titleFor(alert)}</p>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{subtitleFor(alert)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {alert.kind === 'cancelled' && (
              <Link
                href={'/admin/services' as Route}
                className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Réassigner →
              </Link>
            )}
            <button
              type="button"
              onClick={onAction}
              className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink"
            >
              <IconSparkles size={11} stroke={2} className="text-ink" />
              {alert.kind === 'cancelled' ? 'Lui répondre' : ctaFor(alert)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageDraftSheet({ alert, onClose }: { alert: AdminAlert | null; onClose: () => void }) {
  const [draft, setDraft] = useState<MessageDraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!alert) {
      setDraft(null);
      setError(null);
      setCopied(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDraft(null);
    const controller = new AbortController();
    const context =
      alert.kind === 'cancelled'
        ? {
            serviceDateLabel: new Date(alert.serviceDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
            }),
            slotLabel: alert.slotLabel,
          }
        : alert.kind === 'unvalidated_month'
          ? { monthLabel: alert.monthLabel, daysSincePublish: alert.daysSincePublish }
          : { weeksSilent: alert.weeksSilent };
    fetch('/api/ai/message-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: alert.kind, profileName: alert.profileName, context }),
      signal: controller.signal,
    })
      .then(async res => {
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'unknown_error');
        setDraft({ subject: json.subject, body: json.body, tone: json.tone });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'unknown_error');
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [alert]);

  const handleCopy = async () => {
    if (!draft) return;
    const text = `${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <BottomSheet
      open={Boolean(alert)}
      onClose={onClose}
      subtitle="Brouillon IA"
      title={alert ? `Mot pour ${alert.profileName}` : ''}
      footer={
        draft && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[13px] font-bold text-white active:scale-[0.98]"
            >
              {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
              {copied ? 'Copié' : 'Copier le mot'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--color-border)] bg-transparent px-4 py-3 text-[12px] font-semibold text-[var(--color-text-secondary)]"
            >
              Fermer
            </button>
          </div>
        )
      }
    >
      {loading && (
        <div className="space-y-2 py-2">
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
        </div>
      )}
      {error && !loading && (
        <p className="rounded-[14px] bg-[var(--color-error-bg)] p-3 text-[12px] font-medium text-[var(--color-error-fg)]">
          Impossible de générer le mot : {error}
        </p>
      )}
      {draft && !loading && (
        <div className="space-y-3 rounded-[14px] bg-white p-4">
          <p className="text-[14px] font-bold text-ink">{draft.subject}</p>
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink/85">{draft.body}</p>
        </div>
      )}
    </BottomSheet>
  );
}

function titleFor(alert: AdminAlert) {
  if (alert.kind === 'cancelled') {
    const dateLabel = new Date(alert.serviceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return `${alert.profileName} a annulé le ${dateLabel}`;
  }
  if (alert.kind === 'unvalidated_month') {
    return `${alert.profileName} n'a pas validé son mois`;
  }
  return `${alert.profileName} décroche un peu`;
}

function subtitleFor(alert: AdminAlert) {
  if (alert.kind === 'cancelled') {
    return `Poste ${alert.slotLabel} à réattribuer · ${alert.candidates} candidat${alert.candidates > 1 ? 's' : ''} disponible${alert.candidates > 1 ? 's' : ''}`;
  }
  if (alert.kind === 'unvalidated_month') {
    return `Planning publié il y a ${alert.daysSincePublish} jour${alert.daysSincePublish > 1 ? 's' : ''}`;
  }
  return `N'a pas servi depuis ${alert.weeksSilent} semaine${alert.weeksSilent > 1 ? 's' : ''}`;
}

function ctaFor(alert: AdminAlert) {
  if (alert.kind === 'cancelled') return 'Réassigner →';
  if (alert.kind === 'unvalidated_month') return 'Lui envoyer un mot';
  return 'Prendre des nouvelles';
}

function StatTile({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-2.5 py-3 text-center ${highlight ? 'bg-[var(--color-sage)]' : 'bg-white'}`}
    >
      <p className="text-[22px] font-bold leading-none tracking-[-0.5px] text-ink">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-ink/70">{label}</p>
    </div>
  );
}
