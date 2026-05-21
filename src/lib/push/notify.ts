/**
 * Helpers de haut niveau : notifier un membre / une liste de membres.
 * À appeler depuis les futures mutations (publish service, message envoyé, etc.).
 */

import type { SupabaseServerClient } from '@/lib/supabase/server';
import { sendToMany, type PushPayload, type StoredSubscription } from './send';

export type NotifyResult = {
  attempted: number;
  delivered: number;
  removed: number; // subscriptions supprimées (gone)
};

/**
 * Notifie un ensemble de profil_ids. Supprime automatiquement les subscriptions devenues invalides.
 */
export async function notifyProfiles(
  client: SupabaseServerClient,
  profileIds: string[],
  payload: PushPayload,
): Promise<NotifyResult> {
  if (profileIds.length === 0) {
    return { attempted: 0, delivered: 0, removed: 0 };
  }

  const { data: subs, error } = await client
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key, profile_id')
    .in('profile_id', profileIds);

  if (error) throw error;
  if (!subs || subs.length === 0) {
    return { attempted: 0, delivered: 0, removed: 0 };
  }

  const subscriptions: StoredSubscription[] = subs.map(s => ({
    id: s.id,
    endpoint: s.endpoint,
    p256dh_key: s.p256dh_key,
    auth_key: s.auth_key,
  }));

  const outcomes = await sendToMany(subscriptions, payload);
  const removedIds: string[] = [];

  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i].gone) {
      removedIds.push(subscriptions[i].id);
    }
  }

  if (removedIds.length > 0) {
    await client.from('push_subscriptions').delete().in('id', removedIds);
  }

  return {
    attempted: outcomes.length,
    delivered: outcomes.filter(o => o.ok).length,
    removed: removedIds.length,
  };
}

/**
 * Notifie les membres assignés à un service donné. À appeler après publication.
 */
export async function notifyServiceAssignees(
  client: SupabaseServerClient,
  serviceId: string,
  payload: PushPayload,
): Promise<NotifyResult & { profileIds: string[] }> {
  const { data: assignments } = await client
    .from('assignments')
    .select('profile_id, status')
    .eq('service_id', serviceId);

  const profileIds = Array.from(
    new Set(
      (assignments ?? [])
        .filter(a => a.status === 'present' && a.profile_id)
        .map(a => a.profile_id as string),
    ),
  );

  const result = await notifyProfiles(client, profileIds, payload);
  return { ...result, profileIds };
}

export type { PushPayload, SendOutcome } from './send';
