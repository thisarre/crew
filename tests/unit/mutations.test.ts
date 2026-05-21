import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { saveMonthlyValidation, cancelAssignmentByMember } from '@/lib/mutations/validations';
import { createService, publishService } from '@/lib/mutations/services';
import { assignToSlot, cancelAssignment, SlotFullError } from '@/lib/mutations/assignments';
import { publishSpiritualContent } from '@/lib/mutations/spiritual';
import { loadAdminContext } from '@/lib/queries/admin';
import { PROFILE_IDS, SKILL_IDS } from '@/data/seed';
import { SERVICE_IDS, SLOT_IDS } from '@/data/admin-seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('mutations layer', () => {
  beforeEach(() => __resetMockData());

  it('saveMonthlyValidation crée puis devient idempotent', async () => {
    const client = getClient();
    const first = await saveMonthlyValidation(client, {
      profileId: PROFILE_IDS.stephanie,
      year: 2025,
      month: 6,
    });
    expect(first.created).toBe(true);
    expect(first.id).toBeTruthy();

    const second = await saveMonthlyValidation(client, {
      profileId: PROFILE_IDS.stephanie,
      year: 2025,
      month: 6,
    });
    expect(second.created).toBe(false);
  });

  it('cancelAssignmentByMember change le statut à cancelled', async () => {
    const client = getClient();
    // Isaac est assigné sur le 23 juin (sono present)
    const ctx0 = await loadAdminContext(client);
    const isaacAssignment = ctx0.assignments.find(
      a => a.profile_id === PROFILE_IDS.isaac && a.service_id === SERVICE_IDS.june23 && a.status === 'present',
    );
    expect(isaacAssignment).toBeDefined();

    await cancelAssignmentByMember(client, isaacAssignment!.id, 'Test annulation');

    const ctx1 = await loadAdminContext(client);
    const updated = ctx1.assignments.find(a => a.id === isaacAssignment!.id);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.cancelled_reason).toBe('Test annulation');
  });

  it('publishService passe status à published + ajoute published_at', async () => {
    const client = getClient();
    const { publishedAt } = await publishService(client, SERVICE_IDS.june30);
    expect(publishedAt).toBeTruthy();

    const ctx = await loadAdminContext(client);
    const updated = ctx.services.find(s => s.id === SERVICE_IDS.june30);
    expect(updated?.status).toBe('published');
    expect(updated?.published_at).toBe(publishedAt);
  });

  it('assignToSlot crée une nouvelle assignation present', async () => {
    const client = getClient();
    const { assignmentId } = await assignToSlot(client, {
      serviceId: SERVICE_IDS.june23,
      slotId: SLOT_IDS.s23_diffusion,
      profileId: PROFILE_IDS.chrisciana,
    });
    expect(assignmentId).toBeTruthy();

    const ctx = await loadAdminContext(client);
    const created = ctx.assignments.find(a => a.id === assignmentId);
    expect(created?.profile_id).toBe(PROFILE_IDS.chrisciana);
    expect(created?.status).toBe('present');
  });

  it('assignToSlot est idempotent : double appel = pas de doublon', async () => {
    const client = getClient();
    const first = await assignToSlot(client, {
      serviceId: SERVICE_IDS.june23,
      slotId: SLOT_IDS.s23_diffusion,
      profileId: PROFILE_IDS.chrisciana,
    });
    expect(first.alreadyAssigned).toBe(false);

    const second = await assignToSlot(client, {
      serviceId: SERVICE_IDS.june23,
      slotId: SLOT_IDS.s23_diffusion,
      profileId: PROFILE_IDS.chrisciana,
    });
    expect(second.alreadyAssigned).toBe(true);
    expect(second.assignmentId).toBe(first.assignmentId);

    // Une seule ligne present pour Chrisciana sur ce slot
    const ctx = await loadAdminContext(client);
    const present = ctx.assignments.filter(
      a => a.slot_id === SLOT_IDS.s23_diffusion && a.profile_id === PROFILE_IDS.chrisciana && a.status === 'present',
    );
    expect(present.length).toBe(1);
  });

  it('assignToSlot refuse si le slot titulaire est déjà plein', async () => {
    const client = getClient();
    // Le slot Sono du 23 juin a déjà Isaac (présent, titulaire, positions_required=1)
    await expect(
      assignToSlot(client, {
        serviceId: SERVICE_IDS.june23,
        slotId: SLOT_IDS.s23_sono,
        profileId: PROFILE_IDS.gloria,
      }),
    ).rejects.toBeInstanceOf(SlotFullError);
  });

  it('cancelAssignment marque une ligne existante comme cancelled', async () => {
    const client = getClient();
    const ctx0 = await loadAdminContext(client);
    const chana = ctx0.assignments.find(
      a => a.profile_id === PROFILE_IDS.chana && a.status === 'present',
    );
    expect(chana).toBeDefined();
    await cancelAssignment(client, chana!.id, 'Test admin cancel');

    const ctx1 = await loadAdminContext(client);
    const after = ctx1.assignments.find(a => a.id === chana!.id);
    expect(after?.status).toBe('cancelled');
  });

  it('createService crée service + slots + assignments initiaux', async () => {
    const client = getClient();
    const { serviceId, slotIds, assignmentIds } = await createService(client, {
      eventType: 'sunday_service',
      serviceDate: '2025-07-06',
      startTime: '14h00',
      arrivalTime: '13:30',
      location: 'Salle principale',
      slotSkillIds: [SKILL_IDS.sono, SKILL_IDS.camera, SKILL_IDS.diffusion],
      initialAssignments: [
        { skillId: SKILL_IDS.sono, profileId: PROFILE_IDS.isaac },
        { skillId: SKILL_IDS.camera, profileId: PROFILE_IDS.chana },
      ],
    });
    expect(serviceId).toBeTruthy();
    expect(slotIds).toHaveLength(3);
    expect(assignmentIds).toHaveLength(2);

    const ctx = await loadAdminContext(client);
    const service = ctx.services.find(s => s.id === serviceId);
    expect(service?.service_date).toBe('2025-07-06');
    expect(service?.start_time).toBe('14:00:00');
    expect(service?.status).toBe('draft');
  });

  it('publishSpiritualContent insère un row published', async () => {
    const client = getClient();
    const { id, publishedAt } = await publishSpiritualContent(client, {
      verseText: 'Test verset',
      verseReference: 'Test 1:1',
      title: 'Test pensée',
    });
    expect(id).toBeTruthy();
    expect(publishedAt).toBeTruthy();
  });
});
