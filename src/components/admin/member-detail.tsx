'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconArrowLeft, IconCalendar, IconPlus, IconTrash } from '@tabler/icons-react';

import type { MemberDetailData } from '@/lib/queries/admin';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};

type Level = 'learning' | 'autonomous' | 'trainer';
const LEVELS: { value: Level; label: string }[] = [
  { value: 'learning', label: 'apprenti' },
  { value: 'autonomous', label: 'autonome' },
  { value: 'trainer', label: 'formateur' },
];

const STATUS_LABELS: Record<MemberDetailData['statusBadge'], { text: string; classes: string } | null> = {
  ok: null,
  cancelled: { text: 'A annulé une mission', classes: 'bg-[var(--color-error-bg)] text-[var(--color-error-fg)]' },
  unvalidated: { text: 'Mois pas validé', classes: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' },
  disengaging: { text: 'À relancer', classes: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' },
};

export type MemberDetailProps = {
  data: MemberDetailData;
  allSkills: { id: string; name: string }[];
};

export function MemberDetail({ data, allSkills }: MemberDetailProps) {
  const router = useRouter();
  const status = STATUS_LABELS[data.statusBadge];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heldSkillIds = new Set(data.skills.map(s => s.skillId));
  const missingSkills = allSkills.filter(s => !heldSkillIds.has(s.id));

  const callSkill = async (method: 'POST' | 'DELETE', skillId: string, level?: Level) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${data.profile.id}/skills`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(method === 'POST' ? { skillId, level } : { skillId }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${data.profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ isActive: !(data.profile.is_active ?? true) }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-5 pb-6">
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <Link
          href={'/admin/team' as Route}
          aria-label="Retour à l'équipe"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <IconArrowLeft size={18} stroke={2} className="text-ink" />
        </Link>
        <p className="text-[13px] font-bold text-ink">Profil</p>
        <span className="h-9 w-9" aria-hidden="true" />
      </motion.header>

      <motion.section
        variants={fadeUp}
        className="flex flex-col items-center rounded-[22px] bg-white px-6 py-8"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-bold text-ink"
          style={{ backgroundColor: data.profile.avatar_color ?? '#96D8D0' }}
        >
          {data.profile.initials}
        </div>
        <p className="mt-3 text-[22px] font-bold text-ink">{data.profile.display_name}</p>
        {status && (
          <span className={`mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.3px] ${status.classes}`}>
            {status.text}
          </span>
        )}
        {data.profile.why_i_serve && (
          <p className="mt-4 max-w-[300px] text-center text-[13px] italic text-[var(--color-text-secondary)]">
            « {data.profile.why_i_serve} »
          </p>
        )}
      </motion.section>

      <motion.section variants={fadeUp} className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
          Compétences
        </p>
        <div className="space-y-2">
          {data.skills.map(skill => (
            <div
              key={skill.skillId}
              className="rounded-[14px] bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-ink">{skill.skillName}</p>
                <button
                  type="button"
                  onClick={() => callSkill('DELETE', skill.skillId)}
                  disabled={busy}
                  aria-label={`Retirer ${skill.skillName}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg)] disabled:opacity-50"
                >
                  <IconTrash size={14} stroke={2} className="text-[var(--color-text-secondary)]" />
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                {LEVELS.map(lvl => {
                  const active = skill.level === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => !active && callSkill('POST', skill.skillId, lvl.value)}
                      disabled={busy}
                      className={`flex-1 rounded-full px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.3px] transition disabled:opacity-50 ${
                        active
                          ? lvl.value === 'learning'
                            ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]'
                            : 'bg-[var(--color-sage)] text-ink'
                          : 'border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {data.skills.length === 0 && (
            <p className="rounded-[14px] bg-white p-4 text-center text-[12px] text-[var(--color-text-secondary)]">
              Aucune compétence enregistrée.
            </p>
          )}

          {missingSkills.length > 0 && (
            <div className="rounded-[14px] border border-dashed border-[var(--color-border)] bg-transparent p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3px] text-[var(--color-text-secondary)]">
                Ajouter une compétence
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => callSkill('POST', s.id, 'learning')}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm disabled:opacity-50"
                  >
                    <IconPlus size={12} stroke={2.5} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {error && (
        <p className="rounded-[12px] bg-[var(--color-error-bg)] p-3 text-[12px] font-medium text-[var(--color-error-fg)]">
          {error}
        </p>
      )}

      <motion.section variants={fadeUp} className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white px-3 py-4 text-center">
          <p className="text-[22px] font-bold leading-none tracking-[-0.5px] text-ink">{data.servedThisMonth}</p>
          <p className="mt-1 text-[10px] font-medium text-[var(--color-text-secondary)]">services ce mois</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center">
          <p className="text-[22px] font-bold leading-none tracking-[-0.5px] text-ink">
            {data.lastServedLabel ?? '—'}
          </p>
          <p className="mt-1 text-[10px] font-medium text-[var(--color-text-secondary)]">dernier service</p>
        </div>
      </motion.section>

      {data.upcomingAssignments.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Prochains services
          </p>
          <div className="space-y-2">
            {data.upcomingAssignments.map(item => (
              <div
                key={item.date}
                className="flex items-center gap-3 rounded-[14px] bg-white px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-sage)]">
                  <IconCalendar size={18} stroke={2} className="text-ink" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold capitalize text-ink">{item.label}</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">{item.skill}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section variants={fadeUp} className="pt-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={busy}
          className={`w-full rounded-full border py-3 text-[13px] font-semibold transition disabled:opacity-50 ${
            data.profile.is_active ?? true
              ? 'border-[var(--color-error-bg)] bg-[var(--color-error-bg)] text-[var(--color-error-fg)]'
              : 'border-[var(--color-sage)] bg-[var(--color-sage)] text-ink'
          }`}
        >
          {data.profile.is_active ?? true ? 'Désactiver ce membre' : 'Réactiver ce membre'}
        </button>
        <p className="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">
          Un membre désactivé n&apos;apparaît plus dans les propositions ni les statistiques.
        </p>
      </motion.section>
    </motion.div>
  );
}
