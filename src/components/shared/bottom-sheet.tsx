'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, subtitle, children, footer }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ink/50"
          />
          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: EASE_PREMIUM }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[430px] rounded-t-[24px] bg-[var(--color-bg)] px-5 pb-7 pt-3 shadow-[0_-20px_60px_rgba(22,22,27,0.25)]"
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                {subtitle && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
                    {subtitle}
                  </p>
                )}
                {title && (
                  <p className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.3px] text-ink">{title}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white"
              >
                <IconX size={16} stroke={2} className="text-ink" />
              </button>
            </header>
            <div className="max-h-[60vh] overflow-y-auto">{children}</div>
            {footer && <div className="pt-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
