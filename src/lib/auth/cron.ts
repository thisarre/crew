/**
 * Garde des routes /api/cron/* : un secret partagé en en-tête Authorization: Bearer <CRON_SECRET>.
 *
 * Appelé par le planificateur (pg_cron + pg_net) côté serveur, jamais par un navigateur.
 * Fail-closed : si CRON_SECRET n'est pas défini, toute requête est refusée.
 */

import crypto from 'node:crypto';

const httpError = (message: string, status: number) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
};

const timingSafeEqualStr = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

export function assertCronAuthorized(request: Request): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw httpError('cron_secret_not_configured', 503);
  const header = request.headers.get('authorization') ?? '';
  if (!timingSafeEqualStr(header, `Bearer ${secret}`)) throw httpError('unauthorized', 401);
}
