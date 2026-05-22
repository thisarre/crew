'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import type { TeamProposalResult } from '@/lib/ai/propose-team';
import { motion } from 'framer-motion';
import {
  IconBuildingChurch,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconDeviceTv,
  IconHeadphones,
  IconSparkles,
  IconUsers,
  IconVideo,
  IconX,
} from '@tabler/icons-react';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type EventType = 'sunday' | 'midweek' | 'call';

// Les UUIDs correspondent aux skills réels seedés en base.
const SKILLS = [
  { id: 'sono', skillId: 'ab12cd34-ef56-7890-ab12-cd34ef56ab78', label: 'Sono', color: '#DAF4AA', Icon: IconHeadphones },
  { id: 'camera', skillId: 'bc23de45-f678-90ab-cdef-1234567890ab', label: 'Caméra', color: '#96D8D0', Icon: IconVideo },
  { id: 'diffusion', skillId: 'cd34ef56-7890-ab12-cd34-ef567890ab12', label: 'Diffusion', color: '#D2B4F1', Icon: IconDeviceTv },
] as const;

// Helpers pour générer les dimanches d'un mois donné
function getSundays(offset: number): { date: string; iso: string; day: number; included: boolean }[] {
  const ref = new Date();
  ref.setUTCMonth(ref.getUTCMonth() + offset);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth();

  const sundays: { date: string; iso: string; day: number; included: boolean }[] = [];
  const cursor = new Date(Date.UTC(year, month, 1));
  while (cursor.getUTCMonth() === month) {
    if (cursor.getUTCDay() === 0) {
      sundays.push({
        date: cursor.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        iso: cursor.toISOString().slice(0, 10),
        day: cursor.getUTCDate(),
        included: true,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return sundays;
}

function getMonthLabel(offset: number): string {
  const ref = new Date();
  ref.setUTCMonth(ref.getUTCMonth() + offset);
  return ref.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function ServiceNew() {
  const router = useRouter();
  const [type, setType] = useState<EventType>('sunday');
  const [monthOffset, setMonthOffset] = useState(0);
  const [sundays, setSundays] = useState(() => getSundays(0));
  const [start, setStart] = useState('14h00');
  const [arrival, setArrival] = useState('13h30');
  const [duration, setDuration] = useState('45 min');
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set(['sono', 'camera', 'diffusion']));

  useEffect(() => {
    setSundays(getSundays(monthOffset));
  }, [monthOffset]);

  const includedSundays = useMemo(() => sundays.filter(s => s.included), [sundays]);

  const skillIdsActive = useMemo(
    () => SKILLS.filter(s => activeSkills.has(s.id)).map(s => s.skillId),
    [activeSkills],
  );

  const [aiProposal, setAiProposal] = useState<TeamProposalResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'sunday' || includedSundays.length === 0 || skillIdsActive.length === 0) {
      setAiProposal(null);
      return;
    }
    const controller = new AbortController();
    setAiLoading(true);
    setAiError(null);
    fetch('/api/ai/propose-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dates: includedSundays.map(s => s.iso),
        skillIds: skillIdsActive,
      }),
      signal: controller.signal,
    })
      .then(async res => {
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'unknown_error');
        setAiProposal({ teams: json.teams });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setAiError(err instanceof Error ? err.message : 'unknown_error');
      })
      .finally(() => !controller.signal.aborted && setAiLoading(false));
    return () => controller.abort();
  }, [type, includedSundays, skillIdsActive]);

  const toggleSunday = (iso: string) => {
    setSundays(prev => prev.map(s => (s.iso === iso ? { ...s, included: !s.included } : s)));
  };

  const toggleSkill = (id: string) => {
    setActiveSkills(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (withTeam: boolean) => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const eventType = type === 'sunday' ? 'sunday_service' : type === 'midweek' ? 'midweek_service' : 'team_call';
      const initialAssignmentsByDate: Record<
        string,
        { skillId: string; profileId: string; isTrainee?: boolean }[]
      > = {};
      if (withTeam && aiProposal) {
        const skillIdByName: Record<string, string> = {
          Sono: SKILLS[0].skillId,
          Caméra: SKILLS[1].skillId,
          Diffusion: SKILLS[2].skillId,
        };
        for (const team of aiProposal.teams) {
          initialAssignmentsByDate[team.date] = team.assignments.flatMap(a => {
            const skillId = skillIdByName[a.skillName];
            if (!skillId) return [];
            const rows: { skillId: string; profileId: string; isTrainee?: boolean }[] = [
              { skillId, profileId: a.primary.profileId },
            ];
            if (a.trainee) {
              rows.push({ skillId, profileId: a.trainee.profileId, isTrainee: true });
            }
            return rows;
          });
        }
      }

      const dates = type === 'sunday' ? includedSundays.map(s => s.iso) : [];
      if (dates.length === 0) {
        throw new Error('Sélectionne au moins une date');
      }

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          dates,
          startTime: type === 'call' ? start : undefined,
          arrivalTime: type !== 'call' ? arrival : undefined,
          location: type === 'call' ? duration : undefined,
          slotSkillIds: skillIdsActive,
          initialAssignmentsByDate: withTeam ? initialAssignmentsByDate : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'create_failed');
      router.push('/admin/services' as Route);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-10">
      <motion.div variants={fadeUp} className="mx-auto h-1 w-9 rounded-full bg-[var(--color-border)]" />

      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Nouveau
          </p>
          <p className="mt-1 text-[22px] font-bold tracking-[-0.3px] text-ink">Créer un événement</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fermer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
        >
          <IconX size={16} stroke={2} className="text-ink" />
        </button>
      </motion.header>

      {/* Type */}
      <motion.section variants={fadeUp}>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
          Type
        </p>
        <div className="grid grid-cols-3 gap-2">
          <TypeChoice id="sunday" label="Dimanche" Icon={IconBuildingChurch} color="#DAF4AA" active={type === 'sunday'} onClick={setType} />
          <TypeChoice id="midweek" label="Semaine" Icon={IconClock} color="#96D8D0" active={type === 'midweek'} onClick={setType} />
          <TypeChoice id="call" label="Call" Icon={IconUsers} color="#D2B4F1" active={type === 'call'} onClick={setType} />
        </div>
      </motion.section>

      {/* Série dimanches (si sunday) */}
      {type === 'sunday' && (
        <motion.section variants={fadeUp} className="rounded-2xl bg-[var(--color-sage)] px-3.5 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-ink">
              <IconCalendarEvent size={10} stroke={2} className="text-[var(--color-sage)]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-ink">
              Série
            </p>
            <div className="flex items-center gap-1 rounded-full bg-ink/10 p-0.5">
              <button
                type="button"
                onClick={() => setMonthOffset(0)}
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition ${monthOffset === 0 ? 'bg-ink text-white' : 'text-ink'}`}
              >
                {getMonthLabel(0).split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => setMonthOffset(1)}
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition ${monthOffset === 1 ? 'bg-ink text-white' : 'text-ink'}`}
              >
                {getMonthLabel(1).split(' ')[0]}
              </button>
            </div>
            <span className="ml-auto text-[11px] font-bold text-ink">
              {includedSundays.length} dimanche{includedSundays.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-1.5">
            {sundays.map(s => (
              <button
                key={s.iso}
                type="button"
                onClick={() => toggleSunday(s.iso)}
                className={`flex-1 rounded-[10px] px-1 py-2 text-center transition ${
                  s.included
                    ? 'bg-white'
                    : 'border border-dashed border-ink bg-white/40 opacity-60'
                }`}
              >
                <p className={`text-[8px] font-semibold ${s.included ? 'text-[var(--color-text-secondary)]' : 'line-through text-[var(--color-text-secondary)]'}`}>
                  DIM
                </p>
                <p className={`text-[14px] font-bold text-ink ${!s.included && 'line-through'}`}>{s.day}</p>
                {s.included ? (
                  <IconCheck size={11} stroke={2.5} className="mx-auto mt-0.5 text-ink" />
                ) : (
                  <p className="mt-0.5 text-[7px] font-bold text-ink">OFF</p>
                )}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Horaire */}
      <motion.section variants={fadeUp} className="space-y-2.5">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Horaire
          </p>
          <div className="flex gap-1.5">
            {type === 'call' ? (
              <>
                <TimeSegment label="Début" value={start} onChange={setStart} />
                <TimeSegment label="Durée" value={duration} onChange={setDuration} />
              </>
            ) : (
              <TimeSegment label="Arrivée" value={arrival} onChange={setArrival} />
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Postes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map(skill => {
              const Icon = skill.Icon;
              const active = activeSkills.has(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    active
                      ? 'text-ink'
                      : 'border-[1.5px] border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                  style={active ? { backgroundColor: skill.color } : undefined}
                >
                  <Icon size={12} stroke={2} className={active ? 'text-ink' : 'text-[var(--color-text-secondary)]'} />
                  {skill.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Proposition IA */}
      {type === 'sunday' && includedSundays.length > 0 && (
        <motion.section
          variants={fadeUp}
          className="rounded-2xl bg-[linear-gradient(110deg,#DAF4AA_0%,#C5E895_50%,#DAF4AA_100%)] bg-[length:200%_auto] p-[2px] animate-shimmer"
        >
          <div className="rounded-[14px] bg-white p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink">
                <IconSparkles size={10} stroke={2} className="text-[var(--color-sage)]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-ink">
                Proposition d&apos;équipes
              </p>
              {aiLoading && (
                <span className="ml-auto text-[10px] font-semibold text-[var(--color-text-secondary)]">
                  Calcul...
                </span>
              )}
            </div>
            {aiError && !aiLoading && (
              <p className="rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[10px] font-medium text-[var(--color-error-fg)]">
                {aiError}
              </p>
            )}
            {!aiError && (
              <>
                <p className="mb-2.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                  {includedSundays.length} dimanche{includedSundays.length > 1 ? 's' : ''} pré-assigné{includedSundays.length > 1 ? 's' : ''} selon les compétences. Tu pourras modifier après.
                </p>
                <div className="space-y-1.5">
                  {aiProposal?.teams.map(team => {
                    const sunday = includedSundays.find(s => s.iso === team.date);
                    const day = sunday?.day ?? new Date(team.date).getUTCDate();
                    const names = team.assignments.map(a => {
                      const trainee = a.trainee ? ` + ${a.trainee.name}` : '';
                      return `${a.primary.name}${trainee}`;
                    });
                    return (
                      <div key={team.date} className="rounded-[10px] bg-[var(--color-bg)] px-2.5 py-2">
                        <p className="text-[11px] font-bold text-ink">
                          Dim {day} {getMonthLabel(monthOffset).split(' ')[0]}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
                          {names.join(' · ')}
                          {team.assignments.some(a => a.trainee) && (
                            <span className="ml-1.5 rounded-full bg-[var(--color-warning-bg)] px-1 py-0.5 text-[8px] font-bold text-[var(--color-warning-fg)]">
                              + binôme
                            </span>
                          )}
                        </p>
                        {team.rationale && (
                          <p className="mt-1 text-[10px] italic text-[var(--color-text-muted)]">{team.rationale}</p>
                        )}
                      </div>
                    );
                  })}
                  {aiLoading && (
                    <>
                      <div className="h-10 animate-pulse rounded-[10px] bg-[var(--color-bg)]" />
                      <div className="h-10 animate-pulse rounded-[10px] bg-[var(--color-bg)]" />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.section>
      )}

      {submitError && (
        <p className="rounded-[12px] bg-[var(--color-error-bg)] px-3 py-2 text-[11px] font-medium text-[var(--color-error-fg)]">
          {submitError}
        </p>
      )}

      {/* Actions */}
      <motion.section variants={fadeUp} className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="rounded-full border border-[var(--color-border)] bg-transparent px-3.5 py-3 text-[12px] font-semibold text-[var(--color-text-secondary)] disabled:opacity-60"
        >
          Sans équipe
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-60"
        >
          <IconCheck size={14} stroke={2} />
          {submitting
            ? 'Création...'
            : `Créer ${includedSundays.length > 0 ? `${includedSundays.length} dimanche${includedSundays.length > 1 ? 's' : ''}` : ''}`}
        </button>
      </motion.section>
    </motion.div>
  );
}

function TypeChoice({
  id,
  label,
  Icon,
  color,
  active,
  onClick,
}: {
  id: EventType;
  label: string;
  Icon: typeof IconBuildingChurch;
  color: string;
  active: boolean;
  onClick: (id: EventType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex flex-col items-center gap-1.5 rounded-[14px] px-1.5 py-3 transition ${
        active ? 'bg-ink' : 'border border-[var(--color-border)] bg-white'
      }`}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-[9px]"
        style={{ backgroundColor: color }}
      >
        <Icon size={16} stroke={2} className="text-ink" />
      </div>
      <p className={`text-[11px] font-bold ${active ? 'text-white' : 'text-ink'}`}>{label}</p>
    </button>
  );
}

function TimeSegment({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex-1 rounded-xl bg-white px-3 py-2.5">
      <span className="text-[9px] font-semibold text-[var(--color-text-secondary)]">{label.toUpperCase()}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent text-[14px] font-bold text-ink outline-none"
      />
    </label>
  );
}
