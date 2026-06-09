/**
 * Politique anti-spam des relances automatiques, basée sur la table `automation_events`.
 *
 * Le filtrage temporel est fait EN JS (pas via .gte('sent_at')) : le client mock caste les
 * opérandes de gte/lte en Number, ce qui donne NaN sur des timestamps ISO. On lit donc les
 * lignes par clé (.eq) puis on applique la fenêtre/le comptage en mémoire.
 */

import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export type AutomationKind = 'unvalidated_reminder' | 'replacement_request';

type EventRow = {
  id: string;
  kind: string;
  subject_profile_id: string | null;
  ref_id: string;
  sent_at: string;
  meta: unknown;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const fetchEvents = async (
  client: SupabaseServerClient,
  kind: AutomationKind,
  subjectProfileId: string,
  refId: string,
): Promise<EventRow[]> => {
  const { data, error } = await client
    .from('automation_events')
    .select('id, kind, subject_profile_id, ref_id, sent_at, meta')
    .eq('kind', kind)
    .eq('subject_profile_id', subjectProfileId)
    .eq('ref_id', refId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as EventRow[];
  // du plus récent au plus ancien
  return [...rows].sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1));
};

export type DedupePolicy = {
  /** nombre maximum d'envois pour cette clé (omis = illimité). */
  maxSends?: number;
  /** intervalle minimal entre deux envois, en jours (0 = pas de contrainte de fenêtre). */
  minIntervalDays: number;
};

/**
 * Indique si on peut (re)notifier pour une clé (kind, subjectProfileId, refId) selon la politique.
 */
export async function canSend(
  client: SupabaseServerClient,
  args: {
    kind: AutomationKind;
    subjectProfileId: string;
    refId: string;
    now: Date;
    policy: DedupePolicy;
  },
): Promise<boolean> {
  const { kind, subjectProfileId, refId, now, policy } = args;
  const events = await fetchEvents(client, kind, subjectProfileId, refId);

  if (policy.maxSends != null && events.length >= policy.maxSends) return false;

  const latest = events[0];
  if (!latest) return true;

  const elapsedDays = (now.getTime() - new Date(latest.sent_at).getTime()) / DAY_MS;
  return elapsedDays >= policy.minIntervalDays;
}

/**
 * Enregistre un envoi. Le mock ne pose pas `sent_at` automatiquement → on le fixe explicitement.
 */
export async function recordSend(
  client: SupabaseServerClient,
  args: {
    kind: AutomationKind;
    subjectProfileId: string;
    refId: string;
    now: Date;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await client.from('automation_events').insert({
    kind: args.kind,
    subject_profile_id: args.subjectProfileId,
    ref_id: args.refId,
    sent_at: args.now.toISOString(),
    meta: (args.meta ?? {}) as unknown as Json,
  });
  if (error) throw error;
}
