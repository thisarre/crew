'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDownload, IconX } from '@tabler/icons-react';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const DISMISS_KEY = 'crew-install-prompt-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Bandeau discret en bas d'écran qui propose d'installer la PWA.
 * Apparaît quand le navigateur déclenche 'beforeinstallprompt' (Chrome/Edge sur desktop & Android).
 * Sur iOS, ce hook ne se déclenche pas — l'utilisateur passe par "Ajouter à l'écran d'accueil".
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(DISMISS_KEY, 'accepted');
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_PREMIUM }}
          className="pointer-events-none fixed inset-x-0 bottom-[200px] z-40 flex justify-center px-5"
        >
          <div className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-[18px] bg-ink p-3.5 shadow-[0_20px_40px_rgba(22,22,27,0.25)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-sage)]">
              <IconDownload size={18} stroke={2} className="text-ink" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Installer Crew</p>
              <p className="text-[11px] text-white/60">Accès rapide, mode hors ligne</p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-full bg-[var(--color-sage)] px-3 py-1.5 text-[11px] font-bold text-ink active:scale-95"
            >
              Installer
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Plus tard"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70"
            >
              <IconX size={14} stroke={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
