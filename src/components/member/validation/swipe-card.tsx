'use client';

import React, { useMemo } from 'react';
import { IconArrowBarToRight, IconCheck, IconX } from '@tabler/icons-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

import type { ValidationEvent } from '@/data/member-validation';

const CARD_THRESHOLD = 70;
const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export type SwipeCardProps = {
  event: ValidationEvent;
  onSwipe: (eventId: string, direction: 'left' | 'right') => void;
  showHintArrow?: boolean;
};

export function SwipeCard({ event, onSwipe, showHintArrow = false }: SwipeCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.4, 1, 0.4]);
  const rotate = useTransform(x, [-150, 0, 150], [-4, 0, 4]);
  const confirmOpacity = useTransform(x, value => (value > 0 ? Math.min(value / CARD_THRESHOLD, 1) : 0));
  const declineOpacity = useTransform(x, value => (value < 0 ? Math.min(Math.abs(value) / CARD_THRESHOLD, 1) : 0));

  const backgroundClass = useMemo(() => {
    switch (event.type) {
      case 'sunday_service':
        return 'bg-[var(--color-sage)]';
      case 'midweek_service':
        return 'bg-[var(--color-mint)]';
      case 'team_call':
      default:
        return 'bg-[var(--color-lilac)]';
    }
  }, [event.type]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > CARD_THRESHOLD) {
      onSwipe(event.id, 'right');
      void x.set(0);
      return;
    }

    if (info.offset.x < -CARD_THRESHOLD) {
      onSwipe(event.id, 'left');
      void x.set(0);
      return;
    }

    void x.set(0);
  };

  return (
    <article className="relative overflow-hidden rounded-[22px] shadow-[0_15px_40px_rgba(22,22,27,0.12)]">
      <motion.div
        style={{ opacity: confirmOpacity }}
        className="absolute inset-0 flex items-center justify-start bg-[#DAF4AA] pl-6"
      >
        <IconCheck size={20} color="#16161B" />
        <span className="ml-[10px] text-[14px] font-bold tracking-[0.5px] text-[#16161B]">JE SERAI LÀ</span>
      </motion.div>
      <motion.div
        style={{ opacity: declineOpacity }}
        className="absolute inset-0 flex items-center justify-end bg-[#FCEBEB] pr-6"
      >
        <IconX size={20} color="#A32D2D" />
        <span className="ml-[10px] text-[14px] font-bold tracking-[0.5px] text-[#A32D2D]">PAS DISPO</span>
      </motion.div>
      <motion.div
        style={{ x, opacity, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        transition={{ duration: 0.3, ease: EASE_PREMIUM }}
        className="relative z-10 rounded-[22px] bg-white p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2.5 rounded-sm ${backgroundClass}`} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-ink">{event.label}</p>
          </div>
          {showHintArrow ? <IconArrowBarToRight className="animate-validation-hint text-[#DAF4AA]" size={18} /> : null}
        </div>
        <p className="text-[17px] font-bold tracking-[-0.2px] text-ink">{event.dateLabel}</p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">{event.info}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {event.teammates.map((teammate, index) => (
              <div
                key={`${teammate.initials}-${index}`}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-ink"
                style={{ backgroundColor: teammate.color }}
              >
                {teammate.initials}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-text-secondary)]">{event.theme}</p>
        </div>
      </motion.div>
    </article>
  );
}
