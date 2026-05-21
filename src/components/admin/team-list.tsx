'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconChevronRight, IconCheck, IconPlus } from '@tabler/icons-react';

import { BottomSheet } from '@/components/shared/bottom-sheet';
import type { MemberWithSkills } from '@/lib/queries/admin';

const AVATAR_PALETTE = ['#96D8D0', '#D2B4F1', '#DAF4AA', '#16161B'];

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};

const FILTERS = ['Tous', 'Sono', 'Caméra', 'Diffusion', 'Apprentis'] as const;
type FilterKey = (typeof FILTERS)[number];

const matchSkill = (member: MemberWithSkills, filter: FilterKey) => {
  if (filter === 'Tous') return true;
  if (filter === 'Apprentis') return member.skills.some(s => s.level === 'learning');
  return member.skills.some(s => s.skillName.toLowerCase().includes(filter.toLowerCase().replace('é', 'e')));
};

const levelBadgeClass = (level: 'learning' | 'autonomous' | 'trainer') => {
  if (level === 'learning') return 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]';
  return 'bg-[var(--color-sage)] text-ink';
};

const levelLabel = (level: 'learning' | 'autonomous' | 'trainer') => {
  if (level === 'learning') return 'apprenti';
  if (level === 'trainer') return 'formateur';
  return 'autonome';
};

type TeamListProps = {
  members: MemberWithSkills[];
  stats: { total: number; autonomous: number; learning: number };
};

export function TeamList({ members, stats }: TeamListProps) {
  const [filter, setFilter] = useState<FilterKey>('Tous');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => members.filter(m => matchSkill(m, filter)), [members, filter]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 pb-6">
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Console admin
          </p>
          <p className="mt-1 text-[24px] font-bold tracking-[-0.4px] text-ink">Ton équipe</p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition active:scale-95"
        >
          <IconPlus size={14} stroke={2.5} />
          Inviter
        </button>
      </motion.header>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <motion.section variants={fadeUp} className="grid grid-cols-3 gap-2">
        <TeamStat value={stats.total} label="membres" />
        <TeamStat value={stats.autonomous} label="autonomes" tone="sage" />
        <TeamStat value={stats.learning} label="apprentissages" tone="warning" />
      </motion.section>

      <motion.section variants={fadeUp} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map(f => {
          const active = f === filter;
          const count = members.filter(m => matchSkill(m, f)).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                active
                  ? 'bg-ink text-white'
                  : 'border border-[var(--color-border)] bg-white text-ink'
              }`}
            >
              {f}
              {active && count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </motion.section>

      <motion.section variants={containerVariants} className="space-y-2.5">
        {filtered.map(member => (
          <MemberCard key={member.profile.id} member={member} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-[22px] bg-white p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
            Aucun membre ne correspond à ce filtre.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}

function MemberCard({ member }: { member: MemberWithSkills }) {
  const { profile, skills, servedThisMonth, lastServedDate, cancelledDate, monthValidated } = member;

  const contextualBadge = (() => {
    if (cancelledDate) {
      const d = new Date(cancelledDate);
      const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return { text: `Annulé ${label}`, classes: 'bg-[var(--color-error-bg)] text-[var(--color-error-fg)]' };
    }
    if (!monthValidated && servedThisMonth >= 0) {
      const hasAssignments = servedThisMonth > 0 || lastServedDate != null;
      if (hasAssignments) return { text: 'À relancer', classes: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' };
    }
    if (lastServedDate) {
      const days = (new Date('2025-06-17').getTime() - new Date(lastServedDate).getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 21) return { text: 'Décroche', classes: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' };
    }
    return null;
  })();

  const servedSuffix = profile.display_name.endsWith('a') ? 'e' : '';
  const lastLabel = lastServedDate ? formatServedLabel(lastServedDate, servedSuffix) : 'Pas encore servi';

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/admin/team/${profile.id}` as Route}
        className="relative block rounded-[22px] bg-white px-4 py-4 transition active:scale-[0.99]"
      >
        {contextualBadge && (
          <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3px] ${contextualBadge.classes}`}>
            {contextualBadge.text}
          </span>
        )}
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-ink"
            style={{ backgroundColor: profile.avatar_color ?? '#96D8D0' }}
          >
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">{profile.display_name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span
                  key={s.skillId}
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${levelBadgeClass(s.level)}`}
                >
                  {s.skillName} {levelLabel(s.level)}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <span>
                <span className="font-bold text-ink">{servedThisMonth}</span> ce mois
              </span>
              {lastServedDate && (
                <>
                  <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-border)]" />
                  <span className="font-semibold text-ink">{lastLabel}</span>
                </>
              )}
            </div>
          </div>
          <IconChevronRight size={18} stroke={2} className="text-[var(--color-text-secondary)]" />
        </div>
      </Link>
    </motion.div>
  );
}

const REF_TODAY = new Date('2025-06-17');

function formatServedLabel(iso: string, suffix: string) {
  const days = Math.floor((REF_TODAY.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return `Servi${suffix} aujourd'hui`;
  if (days === 1) return `Servi${suffix} hier`;
  if (days < 7) return `Servi${suffix} il y a ${days} j.`;
  const weeks = Math.floor(days / 7);
  return `Servi${suffix} il y a ${weeks} sem.`;
}

function TeamStat({ value, label, tone }: { value: number; label: string; tone?: 'sage' | 'warning' }) {
  const bg = tone === 'sage' ? 'bg-[var(--color-sage)]' : tone === 'warning' ? 'bg-[var(--color-warning-bg)]' : 'bg-white';
  const valueColor = tone === 'warning' ? 'text-[var(--color-warning-fg)]' : 'text-ink';
  const labelColor = tone === 'warning' ? 'text-[var(--color-warning-fg)]' : tone === 'sage' ? 'text-ink' : 'text-[var(--color-text-secondary)]';
  return (
    <div className={`rounded-2xl px-2.5 py-3 text-center ${bg}`}>
      <p className={`text-[22px] font-bold leading-none tracking-[-0.5px] ${valueColor}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-medium ${labelColor}`}>{label}</p>
    </div>
  );
}

const deriveInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].length >= 2 ? parts[0][0].toUpperCase() + parts[0][1].toLowerCase() : parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = name.trim() ? deriveInitials(name) : '?';

  const reset = () => {
    setName('');
    setColor(AVATAR_PALETTE[0]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (submitting || !name.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ displayName: name.trim(), avatarColor: color }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      reset();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      subtitle="Nouveau membre"
      title="Inviter dans l'équipe"
      footer={
        <div className="space-y-2">
          {error && (
            <p className="rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[11px] font-medium text-[var(--color-error-fg)]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            <IconCheck size={14} stroke={2} />
            {submitting ? 'Ajout...' : 'Ajouter le membre'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-bold"
            style={{ backgroundColor: color, color: color === '#16161B' ? '#DAF4AA' : '#16161B' }}
          >
            {initials}
          </div>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Aperçu de l&apos;avatar. Les initiales sont générées automatiquement.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Prénom
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex : Marie"
            className="w-full rounded-[14px] bg-white px-4 py-3 text-[14px] font-medium text-ink outline-none focus:ring-2 focus:ring-ink"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Couleur
          </p>
          <div className="flex gap-2.5">
            {AVATAR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Couleur ${c}`}
                className={`h-10 w-10 rounded-full transition ${color === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <p className="rounded-[12px] bg-white p-3 text-[11px] text-[var(--color-text-secondary)]">
          Tu pourras ajouter ses compétences (Sono, Caméra, Diffusion) depuis sa fiche, juste après.
        </p>
      </div>
    </BottomSheet>
  );
}
