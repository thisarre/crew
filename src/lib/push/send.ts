import webpush, { type WebPushError } from 'web-push';

import { ensureVapidConfigured } from './vapid';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

export type SendOutcome = {
  endpoint: string;
  ok: boolean;
  gone: boolean; // true si statut 404/410 → la subscription est invalide, à supprimer
  error?: string;
};

const toPushSubscription = (sub: StoredSubscription) => ({
  endpoint: sub.endpoint,
  keys: {
    p256dh: sub.p256dh_key,
    auth: sub.auth_key,
  },
});

const isWebPushError = (err: unknown): err is WebPushError =>
  typeof err === 'object' && err !== null && 'statusCode' in err;

/**
 * Envoie une notif à une seule subscription. Retourne le résultat (succès, gone, erreur).
 * Ne throw jamais — on veut traiter en bulk.
 */
export async function sendToSubscription(
  subscription: StoredSubscription,
  payload: PushPayload,
): Promise<SendOutcome> {
  ensureVapidConfigured();
  try {
    await webpush.sendNotification(toPushSubscription(subscription), JSON.stringify(payload));
    return { endpoint: subscription.endpoint, ok: true, gone: false };
  } catch (err) {
    const statusCode = isWebPushError(err) ? err.statusCode : 0;
    const gone = statusCode === 404 || statusCode === 410;
    return {
      endpoint: subscription.endpoint,
      ok: false,
      gone,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Envoie une même notif à plusieurs subscriptions en parallèle.
 */
export async function sendToMany(
  subscriptions: StoredSubscription[],
  payload: PushPayload,
): Promise<SendOutcome[]> {
  return Promise.all(subscriptions.map(sub => sendToSubscription(sub, payload)));
}
