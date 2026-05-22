'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconDeviceTv,
  IconHeadphones,
  IconSend,
  IconSparkles,
  IconTrash,
  IconVideo,
} from '@tabler/icons-react';

import type { ServiceDetailData, ServiceSlotDetail } from '@/lib/queries/admin';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const SkillIcon = ({ badge, size = 18 }: { badge: 'sono' | 'camera' | 'diffusion'; size?: number }) => {
  if (badge === 'camera') return <IconVideo size={size} stroke={2} className="text-ink" />;
  if (badge === 'diffusion') return <IconDeviceTv size={size} stroke={2} className="text-ink" />;
  return <IconHeadphones size={size} stroke={2} className="text-ink" />;
};

const eventTypeLabel = (type: ServiceDetailData['service']['event_type']) => {
  if (type === 'midweek_service') return 'Service de semaine';
  if (type === 'team_call') return 'Call équipe';
  return 'Culte dimanche';
};

export function ServiceDetail({ data }: { data: ServiceDetailData }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedMessage, setPublishedMessage] = useState<string | null>(null);
  const isAlreadyPublished = data.service.status === 'published' || data.service.status === 'completed';
  const isCancelled = data.service.status === 'cancelled';
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handlePublish = async () => {
    if (publishing) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const res = await fetch(`/api/services/${data.service.id}/publish`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      const notif = body.notification as { delivered: number } | null;
      setPublishedMessage(
        notif && notif.delivered > 0
          ? `Service publié — ${notif.delivered} membre${notif.delivered > 1 ? 's' : ''} notifié${notif.delivered > 1 ? 's' : ''}`
          : 'Service publié',
      );
      router.refresh();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setPublishing(false);
    }
  };

  const handleCancelToggle = async (action: 'cancel' | 'reactivate') => {
    if (cancelling) return;
    setCancelMessage(null);
    setCancelling(true);
    try {
      const res = await fetch(`/api/services/${data.service.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      if (action === 'reactivate') {
        setCancelMessage('Service réactivé (remis en brouillon)');
      } else {
        const n = typeof body.notified === 'number' ? body.notified : 0;
        setCancelMessage(
          n > 0
            ? `Service annulé — ${n} membre${n > 1 ? 's' : ''} notifié${n > 1 ? 's' : ''}`
            : 'Service annulé',
        );
      }
      setConfirmCancel(false);
      router.refresh();
    } catch (err) {
      setCancelMessage(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setCancelling(false);
    }
  };

  const ratioPercent = data.totalSlots === 0 ? 0 : Math.round((data.filledCount / data.totalSlots) * 100);
  const dashOffset = ratioPercent === 0 ? 81.68 : 81.68 - (81.68 * ratioPercent) / 100;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-[200px]">
      {/* Header */}
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <Link
          href={'/admin/services' as Route}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <IconArrowLeft size={18} stroke={2} className="text-ink" />
        </Link>
        <p className="text-[13px] font-bold text-ink">Gérer le service</p>
        <span className="h-9 w-9" aria-hidden="true" />
      </motion.header>

      {/* Hero noir */}
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[24px] bg-ink px-6 py-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-sage)]/[0.08]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-[var(--color-sage)]">
              {eventTypeLabel(data.service.event_type)}
            </span>
          </div>
          <p className="mt-3 text-[22px] font-bold leading-tight tracking-[-0.3px] text-white capitalize">
            {data.dateLabel}
          </p>
          <p className="mt-1.5 text-[13px] text-white/65">
            {data.startLabel} {data.arrivalLabel && `· Arrivée ${data.arrivalLabel}`}
            {data.service.location ? ` · ${data.service.location}` : ''}
          </p>
          {data.service.spiritual_theme && (
            <p className="mt-2 text-[12px] font-medium italic text-[var(--color-sage)]">
              Thème · {data.service.spiritual_theme}
            </p>
          )}
        </div>
      </motion.section>

      {/* Indicateur de progression */}
      <motion.section
        variants={fadeUp}
        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8">
            <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
              <circle cx="16" cy="16" r="13" stroke="var(--color-bg)" strokeWidth="3.5" fill="none" />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="var(--color-ink)"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="81.68"
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ink">
              {data.filledCount}/{data.totalSlots}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">
              {data.filledCount} poste{data.filledCount > 1 ? 's' : ''} pourvu{data.filledCount > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {data.openSlotsCount > 0
                ? `${data.openSlotsCount} à réassigner`
                : 'Tout est en place'}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Slots */}
      <motion.div variants={fadeUp} className="pt-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
          Postes à pourvoir
        </p>
      </motion.div>

      <motion.section variants={container} className="space-y-3">
        {data.slots.map(slot => (
          <SlotCard key={slot.slotId} slot={slot} serviceId={data.service.id} />
        ))}
      </motion.section>

      {/* Action bar fixée — placée au-dessus de la bottom nav (108px = nav 96px + marge 12px) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[108px] z-40">
        <div className="mx-auto w-full max-w-[430px] space-y-1.5 px-5">
          {publishError && (
            <p className="pointer-events-auto rounded-[12px] bg-[var(--color-error-bg)] px-3 py-2 text-center text-[11px] font-medium text-[var(--color-error-fg)]">
              {publishError}
            </p>
          )}
          {publishedMessage && (
            <p className="pointer-events-auto rounded-[12px] bg-[var(--color-sage)] px-3 py-2 text-center text-[11px] font-bold text-ink">
              {publishedMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={!data.isPublishable || publishing || isAlreadyPublished || isCancelled}
            className={`pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold shadow-[0_8px_24px_rgba(22,22,27,0.15)] transition ${
              data.isPublishable && !isAlreadyPublished && !isCancelled
                ? 'bg-ink text-white active:scale-[0.98]'
                : 'bg-ink text-white opacity-50'
            }`}
          >
            <IconSend size={16} stroke={2} />
            {isAlreadyPublished
              ? 'Service déjà publié'
              : publishing
                ? 'Publication...'
                : "Publier et notifier l'équipe"}
            {!data.isPublishable && !isAlreadyPublished && (
              <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                {data.openSlotsCount} poste{data.openSlotsCount > 1 ? 's' : ''} à pourvoir
              </span>
            )}
          </button>

          {cancelMessage && (
            <p className="pointer-events-auto rounded-[12px] bg-white px-3 py-2 text-center text-[11px] font-medium text-ink">
              {cancelMessage}
            </p>
          )}

          {isCancelled ? (
            <button
              type="button"
              onClick={() => handleCancelToggle('reactivate')}
              disabled={cancelling}
              className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white py-3 text-[13px] font-bold text-ink active:scale-[0.98] disabled:opacity-50"
            >
              {cancelling ? 'Réactivation...' : 'Réactiver le service'}
            </button>
          ) : confirmCancel ? (
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-white py-3 text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => handleCancelToggle('cancel')}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--color-error-fg)] py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-50"
              >
                <IconAlertCircle size={15} stroke={2} />
                {cancelling ? 'Annulation...' : "Confirmer l'annulation"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-error-fg)]/40 bg-white py-3 text-[13px] font-bold text-[var(--color-error-fg)] active:scale-[0.98] disabled:opacity-50"
            >
              Annuler le service
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SlotCard({ slot, serviceId }: { slot: ServiceSlotDetail; serviceId: string }) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [binomeId, setBinomeId] = useState<string | 'admin' | null>(null);
  const isOpen = slot.status === 'open';

  const primaryCandidate = slot.candidates.find(c => c.profileId === primaryId);
  const binomeCandidates = slot.candidates.filter(c => c.profileId !== primaryId);
  const cardClass = isOpen
    ? 'rounded-[22px] border-[1.5px] border-[var(--color-error-fg)] bg-white p-5'
    : 'rounded-[22px] bg-white p-5';

  const handleAssign = async () => {
    if (!slot.aiProposal || assigning) return;
    setAssignError(null);
    setAssigning(true);
    try {
      const postAssignment = async (profileId: string, isTrainee: boolean) => {
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ serviceId, slotId: slot.slotId, profileId, isTrainee }),
        });
        const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      };

      if (slot.aiProposal.isTrainee) {
        // Apprenti en premier (isTrainee: true), puis binôme autonome si ce n'est pas l'admin
        await postAssignment(slot.aiProposal.profileId, true);
        if (slot.aiProposal.binome && slot.aiProposal.binome !== 'admin') {
          await postAssignment(slot.aiProposal.binome.profileId, false);
        }
      } else {
        await postAssignment(slot.aiProposal.profileId, false);
      }

      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setAssigning(false);
    }
  };

  const handleManualAssign = async () => {
    if (!primaryId || assigning) return;
    setAssignError(null);
    setAssigning(true);
    try {
      const postAssignment = async (profileId: string, isTrainee: boolean) => {
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ serviceId, slotId: slot.slotId, profileId, isTrainee }),
        });
        const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      };

      const isLearner = primaryCandidate?.level === 'learning';
      await postAssignment(primaryId, isLearner ?? false);
      if (binomeId && binomeId !== 'admin') {
        await postAssignment(binomeId, false);
      }

      setManualMode(false);
      setPrimaryId(null);
      setBinomeId(null);
      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (assigning) return;
    setAssignError(null);
    setAssigning(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ assignmentId, reason: "Retiré par l'admin" }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div variants={fadeUp} className={cardClass}>
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: slot.skillColor }}
        >
          <SkillIcon badge={slot.skillBadge} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-ink">{slot.skillName}</p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {slot.positionsRequired} personne{slot.positionsRequired > 1 ? 's' : ''} · autonomie requise
          </p>
        </div>
        {slot.status === 'filled' && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-sage)] px-2 py-1">
            <IconCheck size={11} stroke={2.5} className="text-ink" />
            <span className="text-[10px] font-bold text-ink">Pourvu</span>
          </span>
        )}
        {slot.status === 'open' && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-error-bg)] px-2 py-1">
            <IconAlertCircle size={11} stroke={2} className="text-[var(--color-error-fg)]" />
            <span className="text-[10px] font-bold text-[var(--color-error-fg)]">À pourvoir</span>
          </span>
        )}
        {slot.status === 'partial' && (
          <span className="rounded-full bg-[var(--color-warning-bg)] px-2 py-1 text-[10px] font-bold text-[var(--color-warning-fg)]">
            Partiel
          </span>
        )}
      </div>

      {slot.assigned.map(assigned => (
        <div
          key={assigned.assignmentId}
          className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 ${
            assigned.status === 'cancelled' ? 'bg-[var(--color-error-bg)]' : 'bg-[var(--color-bg)]'
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold ${
              assigned.status === 'cancelled'
                ? 'bg-white text-[var(--color-error-fg)] line-through'
                : 'text-ink'
            }`}
            style={assigned.status === 'cancelled' ? undefined : { backgroundColor: assigned.avatarColor }}
          >
            {assigned.initials}
          </div>
          <div className="flex-1">
            <p
              className={`text-[13px] font-bold ${
                assigned.status === 'cancelled' ? 'text-ink/60 line-through' : 'text-ink'
              }`}
            >
              {assigned.name}
            </p>
            {assigned.status === 'cancelled' ? (
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-error-fg)]">
                A annulé il y a {assigned.cancelledHoursAgo ?? '?'} h
              </p>
            ) : (
              assigned.level && (
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    assigned.level === 'learning'
                      ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]'
                      : 'bg-[var(--color-sage)] text-ink'
                  }`}
                >
                  {assigned.level === 'learning' ? 'Apprenti' : 'Autonome'}
                </span>
              )
            )}
          </div>
          {assigned.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => handleRemove(assigned.assignmentId)}
              disabled={assigning}
              aria-label={`Retirer ${assigned.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-50"
            >
              <IconTrash size={15} stroke={2} className="text-[var(--color-text-secondary)]" />
            </button>
          )}
        </div>
      ))}

      {slot.aiProposal && (
        <div className="mt-3 rounded-2xl bg-[linear-gradient(110deg,#DAF4AA_0%,#C5E895_50%,#DAF4AA_100%)] bg-[length:200%_auto] p-[2px] animate-shimmer">
          <div className="rounded-[14px] bg-white p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-ink">
                <IconSparkles size={10} stroke={2} className="text-[var(--color-sage)]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-ink">Proposition</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold text-ink"
                  style={{ backgroundColor: slot.aiProposal.avatarColor }}
                >
                  {slot.aiProposal.initials}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-ink">{slot.aiProposal.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${slot.aiProposal.isTrainee ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' : 'bg-[var(--color-sage)] text-ink'}`}>
                      {slot.aiProposal.level === 'trainer' ? 'Formateur' : slot.aiProposal.level === 'learning' ? 'Apprenti' : 'Autonome'}
                    </span>
                    <span className="text-[11px] font-medium capitalize text-ink">
                      {slot.aiProposal.availabilityLabel}
                    </span>
                  </div>
                </div>
              </div>

              {slot.aiProposal.binome && (
                <div className="flex items-center gap-2.5 rounded-[12px] bg-[var(--color-bg)] px-3 py-2">
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">Binôme</span>
                  {slot.aiProposal.binome === 'admin' ? (
                    <span className="text-[12px] font-bold text-ink">Vous-même</span>
                  ) : (
                    <>
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-ink"
                        style={{ backgroundColor: slot.aiProposal.binome.avatarColor }}
                      >
                        {slot.aiProposal.binome.initials}
                      </div>
                      <span className="text-[12px] font-bold text-ink">{slot.aiProposal.binome.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2.5 text-[11px] italic leading-relaxed text-[var(--color-text-secondary)]">
              {slot.aiProposal.reason}
            </p>
            {assignError && (
              <p className="mt-2 rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[10px] font-medium text-[var(--color-error-fg)]">
                {assignError}
              </p>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[12px] font-bold text-white active:scale-[0.97] disabled:opacity-60"
              >
                <IconCheck size={14} stroke={2} />
                {assigning
                  ? 'Assignation...'
                  : slot.aiProposal.isTrainee && slot.aiProposal.binome && slot.aiProposal.binome !== 'admin'
                    ? 'Assigner le binôme'
                    : "L'assigner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sélecteur manuel */}
      {!manualMode && slot.candidates.length > 0 && (
        <button
          type="button"
          onClick={() => { setManualMode(true); setPrimaryId(null); setBinomeId(null); }}
          className="mt-3 w-full rounded-2xl border border-dashed border-[var(--color-border)] py-2.5 text-[11px] font-bold text-[var(--color-text-secondary)] transition active:scale-[0.98]"
        >
          Choisir manuellement →
        </button>
      )}

      {manualMode && (
        <div className="mt-3 space-y-3 rounded-2xl border border-[var(--color-border)] p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.4px] text-ink">Sélection manuelle</p>
            <button
              type="button"
              onClick={() => { setManualMode(false); setPrimaryId(null); setBinomeId(null); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg)]"
            >
              <IconX size={12} stroke={2} className="text-ink" />
            </button>
          </div>

          {/* Choix du titulaire */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">Titulaire</p>
            <div className="space-y-1.5">
              {slot.candidates.map(c => (
                <button
                  key={c.profileId}
                  type="button"
                  onClick={() => { setPrimaryId(c.profileId); setBinomeId(null); }}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left transition ${primaryId === c.profileId ? 'bg-ink' : 'bg-[var(--color-bg)]'}`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink"
                    style={{ backgroundColor: primaryId === c.profileId ? 'var(--color-sage)' : c.avatarColor }}
                  >
                    {c.initials}
                  </div>
                  <p className={`flex-1 text-[12px] font-bold ${primaryId === c.profileId ? 'text-white' : 'text-ink'}`}>{c.name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    c.level === 'learning'
                      ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]'
                      : primaryId === c.profileId ? 'bg-[var(--color-sage)] text-ink' : 'bg-white text-ink'
                  }`}>
                    {c.level === 'trainer' ? 'Formateur' : c.level === 'learning' ? 'Apprenti' : 'Autonome'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Choix du binôme (optionnel) */}
          {primaryId && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                Binôme <span className="font-normal">(optionnel)</span>
                {primaryCandidate?.level === 'learning' && (
                  <span className="ml-1.5 rounded-full bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-warning-fg)]">recommandé</span>
                )}
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setBinomeId(binomeId === 'admin' ? null : 'admin')}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left transition ${binomeId === 'admin' ? 'bg-ink' : 'bg-[var(--color-bg)]'}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage)] text-[10px] font-bold text-ink">Moi</div>
                  <p className={`flex-1 text-[12px] font-bold ${binomeId === 'admin' ? 'text-white' : 'text-ink'}`}>Vous-même</p>
                  {binomeId === 'admin' && <IconCheck size={13} stroke={2.5} className="text-[var(--color-sage)]" />}
                </button>
                {binomeCandidates.map(c => (
                  <button
                    key={c.profileId}
                    type="button"
                    onClick={() => setBinomeId(binomeId === c.profileId ? null : c.profileId)}
                    className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left transition ${binomeId === c.profileId ? 'bg-ink' : 'bg-[var(--color-bg)]'}`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink"
                      style={{ backgroundColor: binomeId === c.profileId ? 'var(--color-sage)' : c.avatarColor }}
                    >
                      {c.initials}
                    </div>
                    <p className={`flex-1 text-[12px] font-bold ${binomeId === c.profileId ? 'text-white' : 'text-ink'}`}>{c.name}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      c.level === 'learning'
                        ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]'
                        : binomeId === c.profileId ? 'bg-[var(--color-sage)] text-ink' : 'bg-white text-ink'
                    }`}>
                      {c.level === 'trainer' ? 'Formateur' : c.level === 'learning' ? 'Apprenti' : 'Autonome'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {assignError && (
            <p className="rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[10px] font-medium text-[var(--color-error-fg)]">
              {assignError}
            </p>
          )}

          {primaryId && (
            <button
              type="button"
              onClick={handleManualAssign}
              disabled={assigning}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[12px] font-bold text-white active:scale-[0.97] disabled:opacity-60"
            >
              <IconCheck size={14} stroke={2} />
              {assigning ? 'Assignation...' : binomeId ? 'Assigner le binôme' : "L'assigner"}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
