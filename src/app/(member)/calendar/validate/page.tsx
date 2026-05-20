'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';

import { ValidationCalendar } from '@/components/member/validation/calendar';
import { SwipeCard } from '@/components/member/validation/swipe-card';
import { ProgressBar } from '@/components/member/validation/progress-bar';
import { ResetChoiceDialog } from '@/components/member/validation/reset-choice-dialog';
import { getMemberValidationData } from '@/data/member-validation';
import { useValidationFlow } from '@/hooks/use-validation-flow';

export default function ValidationPage() {
  const data = getMemberValidationData();
  const [eventToResetId, setEventToResetId] = useState<string | null>(null);
  const {
    events,
    progress,
    calendarDays,
    lastAction,
    handleSwipe,
    handleBulkConfirm,
    clearLastAction,
    undoLastAction,
    resetEvent,
  } = useValidationFlow(data);

  useEffect(() => {
    if (!lastAction) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearLastAction();
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [clearLastAction, lastAction]);

  const pendingEvents = events.filter(event => event.status === 'pending');
  const eventToReset = events.find(event => event.id === eventToResetId) ?? null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <Link href={'/dashboard' as Route} className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          ←
        </Link>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">Validation</p>
          <p className="text-[16px] font-bold text-ink">{data.monthLabel}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white"
          onClick={handleBulkConfirm}
        >
          Tout valider
        </button>
      </header>

      <ValidationCalendar
        weekdays={data.weekdays}
        days={calendarDays}
        onDaySelect={setEventToResetId}
      />

      <ProgressBar validatedCount={progress.validatedCount} total={progress.total} />

      <section>
        <p className="mb-[14px] text-left text-[12px] italic text-[#6B6B6F]">
          Swipe à droite pour valider, à gauche si tu ne peux pas
        </p>
        <div className="space-y-3">
          {pendingEvents.map((event, index) => (
            <SwipeCard
              key={event.id}
              event={event}
              onSwipe={handleSwipe}
              showHintArrow={index === 0 && event.id === data.events[0]?.id && event.status === 'pending'}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {eventToReset ? (
          <ResetChoiceDialog
            event={eventToReset}
            onCancel={() => setEventToResetId(null)}
            onConfirm={() => {
              clearLastAction();
              resetEvent(eventToReset.id);
              setEventToResetId(null);
            }}
          />
        ) : null}
        {lastAction ? (
          <motion.div
            key={lastAction.event.id}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[112px] left-5 right-5 z-[60] mx-auto flex max-w-[390px] items-center justify-between gap-3 rounded-[14px] bg-[#16161B] px-4 py-3 shadow-[0_8px_24px_rgba(22,22,27,0.2)]"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                lastAction.direction === 'right' ? 'bg-[#DAF4AA]' : 'bg-[#FCEBEB]'
              }`}
            >
              {lastAction.direction === 'right' ? (
                <IconCheck size={16} color="#16161B" />
              ) : (
                <IconX size={16} color="#A32D2D" />
              )}
            </span>
            <p className="flex-1 text-[13px] font-medium text-white">
              {lastAction.event.dateLabel} · {lastAction.direction === 'right' ? 'présent' : 'pas dispo'}
            </p>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent px-[10px] py-[6px] text-[12px] font-bold uppercase tracking-[0.5px] text-[#DAF4AA]"
              onClick={undoLastAction}
            >
              ANNULER
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
