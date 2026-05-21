import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadMemberMonthView } from '@/lib/queries/member';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('loadMemberMonthView (consultation)', () => {
  beforeEach(() => __resetMockData());

  it("retourne la vue de juin 2025 d'Isaac avec stats et calendrier", async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 6 });
    expect(data.monthLabel).toBe('Juin 2025');
    expect(data.year).toBe(2025);
    expect(data.month).toBe(6);
    // Isaac a 3 services en juin (8 servi, 22 à venir, 25 à venir)
    expect(data.stats.engagements).toBeGreaterThanOrEqual(3);
    expect(data.stats.present).toBeGreaterThanOrEqual(3);
    expect(data.stats.absent).toBe(0);
    // Le calendrier couvre les 30 jours de juin + placeholders de tête
    const dayCells = data.calendar.filter(c => c.day);
    expect(dayCells.length).toBe(30);
  });

  it('sépare correctement les services à venir et passés (référence 17 juin)', async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 6 });
    // 8 juin est passé ; 22 et 25 sont à venir
    expect(data.past.some(e => e.date === '2025-06-08')).toBe(true);
    expect(data.upcoming.some(e => e.date === '2025-06-22')).toBe(true);
    expect(data.upcoming.some(e => e.date === '2025-06-25')).toBe(true);
  });

  it('marque les absences (cancelled) dans les stats et le calendrier — Dave', async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.dave, { year: 2025, month: 6 });
    // Dave a 1 présent (8 juin) + 2 annulés (22, 29)
    expect(data.stats.absent).toBeGreaterThanOrEqual(1);
    const cancelledCell = data.calendar.find(c => c.status === 'cancelled');
    expect(cancelledCell).toBeDefined();
  });

  it('calcule prev/next correctement, y compris les bascules d\'année', async () => {
    const jan = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 1 });
    expect(jan.prev).toEqual({ year: 2024, month: 12 });
    expect(jan.next).toEqual({ year: 2025, month: 2 });

    const dec = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 12 });
    expect(dec.next).toEqual({ year: 2026, month: 1 });
  });

  it('indique le statut de validation du mois', async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 6 });
    // Isaac a une validation juin dans le seed
    expect(data.validated).toBe(true);

    const empty = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 3 });
    expect(empty.validated).toBe(false);
    expect(empty.stats.engagements).toBe(0);
  });
});
