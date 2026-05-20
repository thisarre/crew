'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconKey, IconArrowRight } from '@tabler/icons-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

export type PickerProfile = {
  id: string;
  displayName: string;
  initials: string;
  avatarColor?: string | null;
};

export type ProfilePickerProps = {
  members: PickerProfile[];
  admin: PickerProfile;
};

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE_PREMIUM },
});

export default function ProfilePicker({ members, admin }: ProfilePickerProps) {
  const router = useRouter();

  const handleNavigate = (profileId: string, isAdmin: boolean) => {
    const params = new URLSearchParams({
      profile_id: profileId,
      is_admin: String(isAdmin),
    });
    router.push((`/code?${params.toString()}` as Route));
  };

  return (
    <section>
      <motion.header {...fadeUp(0.05)} className="pt-2 mb-8 text-center">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[1.2px] text-text-secondary">
          Crew Production
        </p>
        <h1 className="mb-2 text-[28px] font-bold leading-[1.15] tracking-[-0.5px] text-ink">
          Qui es-tu ?
        </h1>
        <p className="text-[14px] text-text-secondary">Tap sur ton profil pour entrer</p>
      </motion.header>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {members.map((member, index) => (
          <motion.button
            key={member.id}
            type="button"
            {...fadeUp(0.12 + index * 0.08)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            onClick={() => handleNavigate(member.id, false)}
            className="flex flex-col items-center"
          >
            <div
              className="mb-2 flex aspect-square w-full items-center justify-center rounded-[22px]"
              style={{ backgroundColor: member.avatarColor ?? '#96D8D0' }}
            >
              <span className="text-[32px] font-bold text-ink">{member.initials}</span>
            </div>
            <p className="mt-2 text-center text-[13px] font-semibold text-ink">{member.displayName}</p>
          </motion.button>
        ))}
      </div>

      <motion.button
        type="button"
        {...fadeUp(0.12 + members.length * 0.08)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => handleNavigate(admin.id, true)}
        className="mb-6 flex w-full items-center justify-between rounded-[18px] bg-ink px-[18px] py-[14px]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage">
            <IconKey size={16} stroke={2} className="text-ink" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold leading-tight text-white">Je suis le responsable</p>
            <p className="mt-0.5 text-[11px] leading-tight text-white/55">Accès console admin</p>
          </div>
        </div>
        <IconArrowRight size={18} stroke={2} className="text-white" />
      </motion.button>

      <motion.p
        {...fadeUp(0.2 + members.length * 0.08)}
        className="mt-6 text-center text-[11px] leading-[1.5] text-text-muted"
      >
        Cet espace est partagé entre les membres de l&apos;équipe production
      </motion.p>
    </section>
  );
}


