import { beforeEach, describe, expect, it } from 'vitest';

import { __resetMockData, createMockSupabaseClient } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { getReferenceToday, loadAdminContext } from '@/lib/queries/admin';
import { PROFILE_IDS } from '@/data/seed';
import {
  detectCancelledNeedingReplacement,
  detectUnvalidatedMembers,
} from '@/lib/automation/detect';
import { enumerateDates, generateUpcomingServices } from '@/lib/automation/generate-services';
import { canSend, recordSend } from '@/lib/automation/dedupe';
import { runReminders } from '@/lib/automation/reminders';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

beforeEach(() => {
  __resetMockData();
});

describe('detect (détecteurs partagés)', () => {
  it('detectUnvalidatedMembers retourne les membres assignés non validés', async () => {
    const ctx = await loadAdminContext(getClient());
    const now = getReferenceToday();
    const members = detectUnvalidatedMembers(ctx, now);
    expect(members.length).toBeGreaterThan(0);
    // Stéphanie est assignée et n'a pas validé (cf. fixtures)
    expect(members.some(m => m.profile.id === PROFILE_IDS.stephanie)).toBe(true);
    // tous sont des membres actifs avec une ancienneté calculée
    for (const m of members) {
      expect(m.profile.role).toBe('member');
      expect(m.daysSincePublish).toBeGreaterThanOrEqual(0);
    }
  });

  it('detectCancelledNeedingReplacement repère le créneau Diffusion libéré (non pourvu)', async () => {
    const ctx = await loadAdminContext(getClient());
    const now = getReferenceToday();
    const needs = detectCancelledNeedingReplacement(ctx, now);
    expect(needs.length).toBeGreaterThan(0);
    const open = needs.find(n => !n.slotFilled);
    expect(open).toBeDefined();
    expect(open!.candidates).toBeGreaterThan(0);
  });
});

describe('enumerateDates (UTC)', () => {
  const ref = new Date('2025-06-17T08:00:00Z'); // mardi

  it('énumère les dimanches sur 4 semaines', () => {
    expect(enumerateDates(ref, 4, 0)).toEqual([
      '2025-06-22',
      '2025-06-29',
      '2025-07-06',
      '2025-07-13',
    ]);
  });

  it('énumère les mercredis sur 4 semaines', () => {
    expect(enumerateDates(ref, 4, 3)).toEqual([
      '2025-06-18',
      '2025-06-25',
      '2025-07-02',
      '2025-07-09',
    ]);
  });
});

describe('generateUpcomingServices', () => {
  it('crée les services manquants en brouillon, puis est idempotent', async () => {
    const client = getClient();

    const first = await generateUpcomingServices(client);
    expect(first.created).toBeGreaterThan(0);
    expect(first.warnings).toEqual([]);

    // tous les services créés sont en brouillon
    const ctx = await loadAdminContext(client);
    for (const detail of first.details) {
      const svc = ctx.services.find(s => s.id === detail.serviceId);
      expect(svc?.status).toBe('draft');
    }

    // 2e passage : plus rien à créer
    const second = await generateUpcomingServices(client);
    expect(second.created).toBe(0);
    expect(second.skipped).toBeGreaterThan(0);
  });

  it('pré-remplit des créneaux via la proposition IA (mock heuristique)', async () => {
    const client = getClient();
    const res = await generateUpcomingServices(client);
    // au moins un service a reçu des assignations proposées
    expect(res.assignmentsProposed).toBeGreaterThan(0);
  });
});

describe('dedupe (anti-spam)', () => {
  const now = new Date('2025-06-17T08:00:00Z');

  it('autorise un premier envoi puis bloque dans la fenêtre', async () => {
    const client = getClient();
    const key = {
      kind: 'unvalidated_reminder' as const,
      subjectProfileId: PROFILE_IDS.stephanie,
      refId: '2025-06',
    };
    expect(await canSend(client, { ...key, now, policy: { minIntervalDays: 7 } })).toBe(true);

    await recordSend(client, { ...key, now });
    // même jour → dans la fenêtre de 7 jours → bloqué
    expect(await canSend(client, { ...key, now, policy: { minIntervalDays: 7 } })).toBe(false);

    // 8 jours plus tard → autorisé de nouveau
    const later = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    expect(await canSend(client, { ...key, now: later, policy: { minIntervalDays: 7 } })).toBe(true);
  });

  it('respecte maxSends', async () => {
    const client = getClient();
    const key = {
      kind: 'unvalidated_reminder' as const,
      subjectProfileId: PROFILE_IDS.gloria,
      refId: '2025-06',
    };
    await recordSend(client, { ...key, now });
    await recordSend(client, { ...key, now });
    expect(
      await canSend(client, { ...key, now, policy: { maxSends: 2, minIntervalDays: 0 } }),
    ).toBe(false);
  });
});

describe('runReminders', () => {
  const VAPID_KEYS = {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-public',
    VAPID_PRIVATE_KEY: 'test-private',
    VAPID_SUBJECT: 'mailto:test@example.org',
  };

  it('court-circuite quand le push n\'est pas configuré', async () => {
    const saved = { ...VAPID_KEYS } as Record<string, string | undefined>;
    for (const k of Object.keys(VAPID_KEYS)) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    try {
      const res = await runReminders(getClient());
      expect(res.pushConfigured).toBe(false);
      expect(res.unvalidatedNotified).toBe(0);
      expect(res.replacementNotified).toBe(0);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('avec push configuré mais sans abonnement, n\'enregistre aucun événement', async () => {
    const saved: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(VAPID_KEYS)) {
      saved[k] = process.env[k];
      process.env[k] = v;
    }
    try {
      const client = getClient();
      const res = await runReminders(client);
      expect(res.pushConfigured).toBe(true);
      // aucun membre n'a d'abonnement push (seed vide) → rien n'est livré ni enregistré
      const { data } = await client.from('automation_events').select('*');
      expect((data ?? []).length).toBe(0);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
