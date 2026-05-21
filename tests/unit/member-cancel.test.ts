import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { cancelOwnAssignment } from '@/lib/mutations/member-cancel';
import { getNextMemberAssignment } from '@/lib/queries/member';
import { loadAdminContext } from '@/lib/queries/admin';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('annulation par le membre', () => {
  beforeEach(() => {
    __resetMockData();
    // Pas de clés VAPID → pas de push, le helper ne notifie pas (isPushConfigured false)
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  });

  it('annule une assignation appartenant au membre', async () => {
    const client = getClient();
    const ctx0 = await loadAdminContext(client);
    const isaacAssignment = ctx0.assignments.find(
      a => a.profile_id === PROFILE_IDS.isaac && a.status === 'present',
    )!;

    const result = await cancelOwnAssignment(client, isaacAssignment.id, PROFILE_IDS.isaac);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyCancelled).toBe(false);

    const ctx1 = await loadAdminContext(client);
    const updated = ctx1.assignments.find(a => a.id === isaacAssignment.id);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.cancelled_reason).toBe('Annulé par le membre');
  });

  it("refuse d'annuler l'assignation d'un autre membre", async () => {
    const client = getClient();
    const ctx0 = await loadAdminContext(client);
    const chanaAssignment = ctx0.assignments.find(
      a => a.profile_id === PROFILE_IDS.chana && a.status === 'present',
    )!;

    const result = await cancelOwnAssignment(client, chanaAssignment.id, PROFILE_IDS.isaac);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('forbidden');

    // L'assignation de Chana reste présente
    const ctx1 = await loadAdminContext(client);
    expect(ctx1.assignments.find(a => a.id === chanaAssignment.id)?.status).toBe('present');
  });

  it('retourne not_found pour une assignation inexistante', async () => {
    const client = getClient();
    const result = await cancelOwnAssignment(client, '00000000-0000-4000-8000-000000000099', PROFILE_IDS.isaac);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('not_found');
  });

  it('est idempotent sur une assignation déjà annulée', async () => {
    const client = getClient();
    const ctx0 = await loadAdminContext(client);
    // Dave a une assignation cancelled dans le seed
    const daveCancelled = ctx0.assignments.find(
      a => a.profile_id === PROFILE_IDS.dave && a.status === 'cancelled',
    )!;
    const result = await cancelOwnAssignment(client, daveCancelled.id, PROFILE_IDS.dave);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyCancelled).toBe(true);
  });

  it('getNextMemberAssignment trouve le prochain engagement présent à venir', async () => {
    const client = getClient();
    const next = await getNextMemberAssignment(client, PROFILE_IDS.isaac);
    expect(next).not.toBeNull();
    // Le prochain engagement d'Isaac (réf 17 juin) est le 22 juin (sono)
    expect(next!.date).toBe('2025-06-22');
    expect(next!.skillName).toBe('Sono');
  });

  it('getNextMemberAssignment renvoie null après annulation du prochain', async () => {
    const client = getClient();
    const next = await getNextMemberAssignment(client, PROFILE_IDS.isaac);
    await cancelOwnAssignment(client, next!.assignmentId, PROFILE_IDS.isaac);
    const after = await getNextMemberAssignment(client, PROFILE_IDS.isaac);
    // Isaac a aussi le 25 juin (midweek) → devient le prochain
    expect(after?.date).toBe('2025-06-25');
  });
});
