'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Le dialog est rendu via un portal sur <body> pour échapper aux conteneurs animés
  // par framer-motion (qui créent un contexte de transform cassant `position: fixed`).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => !busy && e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, busy, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-6"
          onClick={busy ? undefined : onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[360px] rounded-[22px] bg-white p-6"
          >
            <p className="text-[18px] font-bold leading-tight text-ink">{title}</p>
            {message && (
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{message}</p>
            )}
            {error && (
              <p className="mt-3 rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[11px] font-medium text-[var(--color-error-fg)]">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="flex-1 rounded-full border border-[var(--color-border)] bg-white py-3 text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`flex-1 rounded-full py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-50 ${
                  tone === 'danger' ? 'bg-[var(--color-error-fg)]' : 'bg-ink'
                }`}
              >
                {busy ? '...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
