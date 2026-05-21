import webpush from 'web-push';

let initialized = false;

/**
 * Configure web-push avec les clés VAPID lues depuis l'env.
 * Idempotent — appeler avant chaque envoi.
 */
export function ensureVapidConfigured() {
  if (initialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      'VAPID non configuré — il manque NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY ou VAPID_SUBJECT dans .env.local',
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export const isPushConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );

export const getPublicKey = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
