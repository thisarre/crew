'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IconCheck,
  IconChevronRight,
  IconLogout,
  IconPencil,
  IconUser,
} from '@tabler/icons-react';

import { NotificationToggle } from '@/components/shared/notification-toggle';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_PREMIUM } },
};

const AVATAR_COLORS = [
  '#96D8D0', // mint/teal
  '#D2B4F1', // lilac
  '#DAF4AA', // lime
  '#F9C6D3', // pink
  '#FDD49E', // peach
  '#A8D8EA', // sky blue
  '#C4E0A5', // sage green
  '#FFD6A5', // apricot
];

const APP_VERSION = '0.1.0';

type MemberSettingsProps = {
  profile: {
    id: string;
    displayName: string;
    initials: string;
    avatarColor: string;
  };
};

export function MemberSettings({ profile }: MemberSettingsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const hasChanges =
    displayName.trim() !== profile.displayName || avatarColor !== profile.avatarColor;

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (displayName.trim() !== profile.displayName) body.display_name = displayName.trim();
      if (avatarColor !== profile.avatarColor) body.avatar_color = avatarColor;

      const res = await fetch('/api/my/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/';
    } catch {
      setLoggingOut(false);
    }
  };

  const initials =
    displayName.trim() !== profile.displayName
      ? deriveInitialsClient(displayName.trim())
      : profile.initials;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 pb-10">
      {/* Header */}
      <motion.section variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">Profil</p>
          <p className="mt-1.5 text-[14px] text-[var(--color-text-secondary)]">Tes informations personnelles</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-ink transition-colors"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
      </motion.section>

      {/* Avatar color picker */}
      <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-mint)]">
            <IconUser size={12} stroke={2} className="text-ink" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink">Couleur d&apos;avatar</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {AVATAR_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setAvatarColor(color)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
              style={{ backgroundColor: color }}
              aria-label={`Couleur ${color}`}
            >
              {avatarColor === color && (
                <IconCheck size={16} stroke={3} className="text-ink" />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Display name */}
      <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-lilac)]">
              <IconPencil size={12} stroke={2} className="text-ink" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink">Nom affiché</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-text-secondary)] transition active:scale-95"
            >
              Modifier
              <IconChevronRight size={14} stroke={2} />
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={60}
              className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] font-medium text-ink outline-none transition focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/30"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisplayName(profile.displayName);
                  setEditing(false);
                }}
                className="flex-1 rounded-full border border-[var(--color-border)] bg-white py-2.5 text-[13px] font-semibold text-[var(--color-text-secondary)] active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={!displayName.trim()}
                className="flex-1 rounded-full bg-ink py-2.5 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[18px] font-bold tracking-[-0.3px] text-ink">{displayName}</p>
        )}
      </motion.section>

      {/* Save button */}
      {hasChanges && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_PREMIUM }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          {error && (
            <p className="mt-2 text-center text-[12px] text-[var(--color-error-fg)]">{error}</p>
          )}
        </motion.section>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 rounded-[14px] bg-[var(--color-sage)]/20 py-3"
        >
          <IconCheck size={16} stroke={2.5} className="text-ink" />
          <p className="text-[13px] font-semibold text-ink">Profil mis à jour</p>
        </motion.div>
      )}

      {/* Notifications */}
      <motion.section variants={fadeUp}>
        <NotificationToggle profileId={profile.id} />
      </motion.section>

      {/* App version */}
      <motion.section variants={fadeUp} className="rounded-[24px] bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Version de l&apos;app</p>
          <p className="text-[13px] font-semibold text-ink">{APP_VERSION}</p>
        </div>
      </motion.section>

      {/* Logout */}
      <motion.section variants={fadeUp}>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-white py-4 text-[14px] font-semibold text-[var(--color-error-fg)] transition active:scale-[0.98] disabled:opacity-60"
        >
          <IconLogout size={18} stroke={2} />
          {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </button>
      </motion.section>
    </motion.div>
  );
}

/** Client-side initials derivation (mirrors server-side logic) */
function deriveInitialsClient(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const word = parts[0];
    return word.length >= 2 ? word[0].toUpperCase() + word[1].toLowerCase() : word[0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
