/**
 * Session légère basée sur un cookie httpOnly.
 *
 * Posé par /api/auth/verify-code après succès. Contient { profileId, isAdmin, ts }.
 * Signature simple (HMAC SHA256) avec un secret côté serveur — pas du JWT complet, mais suffisant
 * pour le MVP. La sécurité tiendra réellement quand on passera à Supabase Auth.
 */

import { cookies } from 'next/headers';
import crypto from 'node:crypto';

const COOKIE_NAME = 'crew_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export type SessionPayload = {
  profileId: string;
  isAdmin: boolean;
  ts: number;
};

const getSecret = (): string => {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  // fallback dev — pas de secret défini : on signe avec une chaîne fixe.
  // En prod il faut absolument définir SESSION_SECRET.
  return 'crew-dev-fallback-secret-please-override-in-env';
};

const sign = (value: string): string => {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
};

const encode = (payload: SessionPayload): string => {
  const json = JSON.stringify(payload);
  const base = Buffer.from(json, 'utf8').toString('base64url');
  return `${base}.${sign(base)}`;
};

const decode = (token: string): SessionPayload | null => {
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const base = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (sign(base) !== signature) return null;
  try {
    const json = Buffer.from(base, 'base64url').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
};

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/**
 * Encode un token signé pour la session — à passer à response.cookies.set().
 */
export const encodeSessionToken = (payload: Omit<SessionPayload, 'ts'>): string => {
  return encode({ ...payload, ts: Date.now() });
};

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Sérialisation pour Set-Cookie (utilisée dans une Response côté API).
 * Conservé pour compat — préférer encodeSessionToken + response.cookies.set().
 */
export const buildSessionCookie = (payload: Omit<SessionPayload, 'ts'>): string => {
  const token = encodeSessionToken(payload);
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
};

export const buildClearSessionCookie = (): string => {
  const attrs = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
};

/**
 * Lit la session depuis les cookies (Server Component / Route Handler).
 * Retourne null si pas de session ou signature invalide.
 */
export const getSessionFromCookies = (): SessionPayload | null => {
  try {
    const store = cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return decode(token);
  } catch {
    return null;
  }
};

/**
 * Variante qui lit depuis un objet Request (utile en route handler).
 */
export const getSessionFromRequest = (request: Request): SessionPayload | null => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.split(/;\s*/).find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.slice(COOKIE_NAME.length + 1);
  return decode(token);
};

/**
 * Helper utilitaire : récupère le profileId actif ou renvoie une 401.
 */
export const requireSession = (request: Request): SessionPayload => {
  const session = getSessionFromRequest(request);
  if (!session) {
    const err = new Error('unauthenticated') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return session;
};

export const requireAdminSession = (request: Request): SessionPayload => {
  const session = requireSession(request);
  if (!session.isAdmin) {
    const err = new Error('forbidden') as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return session;
};
