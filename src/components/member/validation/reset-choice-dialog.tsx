'use client';

import React from 'react';
import { motion } from 'framer-motion';

import type { ValidationEvent } from '@/data/member-validation';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export type ResetChoiceDialogProps = {
  event: ValidationEvent;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetChoiceDialog({ event, onCancel, onConfirm }: ResetChoiceDialogProps) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-choice-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#16161B]/20 px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-[350px] rounded-[22px] bg-white p-5 shadow-[0_18px_50px_rgba(22,22,27,0.2)]"
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: EASE_PREMIUM }}
      >
        <h2 id="reset-choice-title" className="text-[18px] font-bold text-ink">
          Annuler mon choix
        </h2>
        <p className="mt-2 text-[13px] leading-[1.45] text-[var(--color-text-secondary)]">
          Tu veux remettre {event.dateLabel} en attente pour pouvoir choisir à nouveau ?
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-[var(--color-bg)] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.5px] text-ink"
            onClick={onCancel}
          >
            Non
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-ink px-4 py-3 text-[12px] font-bold uppercase tracking-[0.5px] text-white"
            onClick={onConfirm}
          >
            Oui
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
