'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';

import type { PickerProfile } from '@/components/auth/profile-picker';
import { Keypad } from '@/components/auth/keypad';
import { PinDots } from '@/components/auth/pin-dots';

export type CodePadProps = {
  profile: PickerProfile;
  isAdmin: boolean;
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 + custom * 0.07,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function CodePad({ profile, isAdmin }: CodePadProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const greeting = useMemo(() => (isAdmin ? 'Console admin' : `Salut ${profile.displayName}`), [
    isAdmin,
    profile.displayName,
  ]);

  const handleKeyPress = (key: string) => {
    if (isSubmitting) return;

    if (key === 'delete') {
      setCode(prev => prev.slice(0, -1));
      setError(null);
      return;
    }

    if (key === 'enter') {
      if (code.length === 4) {
        void submitCode(code);
      }
      return;
    }

    if (/^\d$/.test(key) && code.length < 4) {
      setCode(prev => prev + key);
      setError(null);
    }
  };

  useEffect(() => {
    if (code.length === 4) {
      void submitCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const submitCode = async (value: string) => {
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: value, profile_id: profile.id, is_admin: isAdmin }),
    });

    if (!response.ok) {
      setError('Mauvais code');
      setSubmitting(false);
      setCode('');
      return;
    }

    const data = await response.json();
    setSuccessMessage(isAdmin ? 'Console admin ouverte' : `Bienvenue ${profile.displayName}`);
    setTimeout(() => router.push(data.redirect), 1000);
  };

  return (
    <div>
      <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={0} className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 py-1.5 pr-2.5 text-[13px] font-medium text-[var(--color-text-secondary)]"
        >
          <IconArrowLeft size={16} stroke={2} /> Retour
        </Link>
      </motion.div>

      <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={1} className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-[84px] w-[84px] items-center justify-center rounded-[28px]"
          style={{ backgroundColor: isAdmin ? 'var(--color-ink)' : profile.avatarColor ?? 'var(--color-mint)' }}
        >
          <span className={`text-[38px] font-bold ${isAdmin ? 'text-white' : 'text-[var(--color-ink)]'}`}>{profile.initials}</span>
        </div>
        <p className="text-[24px] font-bold leading-[1.15] text-[var(--color-ink)] [letter-spacing:-0.3px]">{greeting}</p>
        <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          {isAdmin ? 'Entre le code admin' : 'Entre le code équipe'}
        </p>
      </motion.div>

      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        custom={2}
        className="mb-10 flex flex-col items-center gap-3"
      >
        <PinDots valueLength={code.length} error={Boolean(error)} />
        {error && <p className="text-[13px] text-[var(--color-error-fg)]">{error}</p>}
      </motion.div>

      <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={3}>
        <Keypad onPress={handleKeyPress} disabled={isSubmitting} />
      </motion.div>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="mt-6 rounded-2xl bg-[var(--color-sage)]/40 px-4 py-3 text-center text-sm font-medium text-[var(--color-ink)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
