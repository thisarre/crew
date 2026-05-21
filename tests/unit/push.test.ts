import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { notifyProfiles, notifyServiceAssignees } from '@/lib/push/notify';
import type { StoredSubscription } from '@/lib/push/send';
import { PROFILE_IDS } from '@/data/seed';
import { SERVICE_IDS } from '@/data/admin-seed';

// Mock du module send : on évite les vrais appels web-push pendant les tests
vi.mock('@/lib/push/send', async () => {
  const actual = await vi.importActual<typeof import('@/lib/push/send')>('@/lib/push/send');
  return {
    ...actual,
    sendToMany: vi.fn(async (subs: StoredSubscription[]) =>
      subs.map(sub => ({
        endpoint: sub.endpoint,
        ok: true,
        gone: false,
      })),
    ),
  };
});

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('push notify', () => {
  beforeEach(() => {
    __resetMockData();
    // S'assure que les clés VAPID sont config pour ne pas planter à l'ensureVapidConfigured
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public';
    process.env.VAPID_PRIVATE_KEY = 'test-private';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  });

  it('notifyProfiles renvoie 0 quand aucun profile n\'a de subscription', async () => {
    const result = await notifyProfiles(getClient(), [PROFILE_IDS.isaac], {
      title: 'Test',
      body: 'Hello',
    });
    expect(result).toEqual({ attempted: 0, delivered: 0, removed: 0 });
  });

  it('notifyServiceAssignees retourne la liste de profils visés (vide si pas de subs)', async () => {
    const client = getClient();
    const result = await notifyServiceAssignees(client, SERVICE_IDS.june23, {
      title: 'Service publié',
      body: 'Tu sers dimanche 23 juin',
      url: '/dashboard',
    });
    // 23 juin a Isaac (sono), Chana (camera), Stéphanie (camera trainee) en présent
    expect(result.profileIds).toContain(PROFILE_IDS.isaac);
    expect(result.profileIds).toContain(PROFILE_IDS.chana);
    expect(result.profileIds).toContain(PROFILE_IDS.stephanie);
    // Dave est cancelled → exclu
    expect(result.profileIds).not.toContain(PROFILE_IDS.dave);
    // attempted = 0 car pas de push_subscriptions seedées
    expect(result.attempted).toBe(0);
  });

  it('notifyProfiles avec push_subscriptions insérées appelle bien sendToMany', async () => {
    const client = getClient();
    // Insère une subscription mock pour Isaac
    await client.from('push_subscriptions').insert({
      profile_id: PROFILE_IDS.isaac,
      endpoint: 'https://fcm.googleapis.com/test-endpoint',
      p256dh_key: 'p256dh-test',
      auth_key: 'auth-test',
    });
    const result = await notifyProfiles(client, [PROFILE_IDS.isaac], {
      title: 'Hello',
      body: 'World',
    });
    expect(result.attempted).toBe(1);
    expect(result.delivered).toBe(1);
    expect(result.removed).toBe(0);
  });
});
