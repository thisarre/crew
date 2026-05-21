'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  IconBuilding,
  IconCheck,
  IconDeviceTv,
  IconHeadphones,
  IconMapPin,
  IconMessageCircle,
  IconNavigation,
  IconPhone,
  IconSparkles,
  IconUsers,
  IconVideo,
} from '@tabler/icons-react';

import type { ServiceDaySkill, ServiceDayView as ServiceDayData } from '@/lib/queries/member';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_PREMIUM } },
};

const SkillIcon = ({ badge, size = 34 }: { badge: ServiceDaySkill; size?: number }) => {
  if (badge === 'camera') return <IconVideo size={size} stroke={2} className="text-ink" />;
  if (badge === 'diffusion') return <IconDeviceTv size={size} stroke={2} className="text-ink" />;
  return <IconHeadphones size={size} stroke={2} className="text-ink" />;
};

const skillColor = (badge: ServiceDaySkill) =>
  badge === 'camera' ? '#96D8D0' : badge === 'diffusion' ? '#D2B4F1' : '#DAF4AA';

export function ServiceDayView({ data }: { data: ServiceDayData }) {
  const mapsHref = data.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`
    : null;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-6">
      {/* Header */}
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-secondary)]">
            Jour de service
          </p>
          <p className="mt-1 text-[22px] font-bold tracking-[-0.3px] text-ink">Hey {data.profileName}</p>
        </div>
        <div className="relative">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-bold text-ink"
            style={{ backgroundColor: data.avatarColor }}
          >
            {data.profileInitials}
          </div>
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-sage)] animate-pulse-dot" />
        </div>
      </motion.header>

      {/* Hero noir countdown */}
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[28px] bg-ink px-6 pb-7 pt-6">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[var(--color-sage)]/[0.08]" />
        <div className="relative">
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-sage)]/15 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)] animate-pulse-dot" />
            <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-sage)]">
              {data.badgeLabel}
            </span>
          </div>
          <p className="text-[14px] font-medium text-white/60 capitalize">{data.dateLabel}</p>
          <p className="mt-1 text-[38px] font-bold leading-none tracking-[-1.5px] text-white">{data.startLabel}</p>
          {data.arrivalLabel && (
            <p className="mt-2 text-[14px] font-medium text-[var(--color-sage)]">Tu arrives à {data.arrivalLabel}</p>
          )}
        </div>
      </motion.section>

      {/* Ton poste */}
      <motion.section variants={fadeUp} className="overflow-hidden rounded-[24px] bg-white">
        <div
          className="relative flex h-[140px] items-center justify-center overflow-hidden"
          style={{ backgroundColor: skillColor(data.mySkillBadge) }}
        >
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
          <div className="animate-cardFloat">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/10">
              <SkillIcon badge={data.mySkillBadge} />
            </div>
          </div>
          <span className="absolute left-3.5 top-3.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
            Ton poste
          </span>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Aujourd&apos;hui tu es à la
          </p>
          <p className="mt-1 text-[28px] font-bold tracking-[-0.5px] text-ink">{data.mySkillName}</p>
        </div>
      </motion.section>

      {/* Équipe du jour */}
      <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--color-sage)]">
            <IconUsers size={12} stroke={2} className="text-ink" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink">L&apos;équipe du jour</p>
        </div>
        <div className="flex flex-col gap-3">
          {data.team.map((member, idx) => (
            <React.Fragment key={member.profileId}>
              {idx > 0 && <div className="h-px bg-[var(--color-border-soft)]" />}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-ink"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  {member.isMe && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[var(--color-sage)]">
                      <IconCheck size={9} stroke={2.5} className="text-ink" />
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-ink">{member.name}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">{member.skillName}</p>
                </div>
                <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-ink">
                  {member.arrivalLabel}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.section>

      {/* Thème du jour */}
      {(data.theme || data.verseText) && (
        <motion.section variants={fadeUp} className="rounded-[24px] bg-[var(--color-sage)] p-[22px]">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink">
              <IconSparkles size={12} stroke={2} className="text-[var(--color-sage)]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink">Thème du jour</p>
          </div>
          {data.theme && (
            <p className="mb-2.5 text-[24px] font-bold leading-[1.15] tracking-[-0.3px] text-ink">{data.theme}</p>
          )}
          {data.verseText && (
            <p className="text-[14px] font-medium italic leading-relaxed text-ink/85">« {data.verseText} »</p>
          )}
          {data.verseReference && (
            <p className="mt-2 text-[12px] font-medium text-ink/55">{data.verseReference}</p>
          )}
        </motion.section>
      )}

      {/* Infos pratiques */}
      <motion.section variants={fadeUp} className="rounded-[24px] bg-white px-5 py-[18px]">
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--color-mint)]">
            <IconMapPin size={12} stroke={2} className="text-ink" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink">Infos pratiques</p>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)]">
              <IconBuilding size={18} stroke={2} className="text-ink" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">Lieu</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">{data.location || 'À préciser'}</p>
            </div>
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Itinéraire"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink"
              >
                <IconNavigation size={16} stroke={2} className="text-[var(--color-sage)]" />
              </a>
            )}
          </div>
          <div className="h-px bg-[var(--color-border-soft)]" />
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)]">
              <IconMessageCircle size={18} stroke={2} className="text-ink" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">Un souci ?</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">Contacter {data.admin.name}</p>
            </div>
            {data.admin.phone && (
              <a
                href={`tel:${data.admin.phone}`}
                aria-label={`Appeler ${data.admin.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-sage)]"
              >
                <IconPhone size={16} stroke={2} className="text-ink" />
              </a>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function ServiceDayEmpty({ profileName }: { profileName: string }) {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-secondary)]">
          Jour de service
        </p>
        <p className="mt-1 text-[22px] font-bold tracking-[-0.3px] text-ink">Hey {profileName}</p>
      </header>
      <div className="rounded-[24px] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg)]">
          <IconHeadphones size={28} stroke={2} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-[16px] font-bold text-ink">Pas de service à l&apos;horizon</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Tu n&apos;as aucun créneau à venir pour le moment. Cette vue s&apos;animera dès que tu seras de service.
        </p>
      </div>
    </div>
  );
}
