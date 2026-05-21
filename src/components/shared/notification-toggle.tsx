'use client';

import React, { useEffect, useState } from 'react';
import { IconBell, IconBellOff, IconCheck } from '@tabler/icons-react';

type Status = 'unsupported' | 'denied' | 'idle' | 'subscribing' | 'subscribed' | 'error';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export type NotificationToggleProps = {
  profileId: string;
  className?: string;
};

export function NotificationToggle({ profileId, className }: NotificationToggleProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    // Check subscription existante
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (sub) setStatus('subscribed');
      })
      .catch(() => {
        // SW probablement pas encore enregistré (dev mode)
      });
  }, []);

  const enable = async () => {
    setError(null);
    setStatus('subscribing');
    try {
      if (!VAPID_PUBLIC_KEY) throw new Error('Clé VAPID publique manquante');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'subscribe_failed');
      setStatus('subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
      setStatus('error');
    }
  };

  const disable = async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint, profileId }),
        });
        await sub.unsubscribe();
      }
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
      setStatus('error');
    }
  };

  if (status === 'unsupported') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white px-4 py-3">
          <IconBellOff size={18} stroke={2} className="text-[var(--color-text-muted)]" />
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Ton navigateur ne supporte pas les notifications.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2.5 rounded-[14px] bg-[var(--color-warning-bg)] px-4 py-3">
          <IconBellOff size={18} stroke={2} className="text-[var(--color-warning-fg)]" />
          <p className="text-[12px] font-medium text-[var(--color-warning-fg)]">
            Notifications bloquées. Active-les dans les paramètres du navigateur.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className={className}>
        <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-sage)]">
              <IconCheck size={14} stroke={2.5} className="text-ink" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink">Notifications activées</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">Tu recevras les nouvelles du planning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={disable}
            className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)]"
          >
            Désactiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={enable}
        disabled={status === 'subscribing'}
        className="flex w-full items-center justify-between rounded-[14px] bg-white px-4 py-3 text-left transition active:scale-[0.99] disabled:opacity-60"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink">
            <IconBell size={14} stroke={2.5} className="text-[var(--color-sage)]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">
              {status === 'subscribing' ? 'Activation...' : 'Activer les notifications'}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Reçois tes services et les pensées hebdo
            </p>
          </div>
        </div>
        <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white">
          {status === 'subscribing' ? '...' : 'Activer'}
        </span>
      </button>
      {error && (
        <p className="mt-1.5 px-1 text-[10px] text-[var(--color-error-fg)]">{error}</p>
      )}
    </div>
  );
}
