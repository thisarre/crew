import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadMemberMonthView } from '@/lib/queries/member';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('loadMemberMonthView (consultation)', () => {
  beforeEach(() => __resetMockData());

  it("retourne la vue de juin 2026 d'Isaac sans engagement initial", async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2026, month: 6 });
    expect(data.monthLabel).toBe('Juin 2026');
    expect(data.year).toBe(2026);
    expect(data.month).toBe(6);
    expect(data.stats.engagements).toBe(0);
    expect(data.stats.present).toBe(0);
    expect(data.stats.absent).toBe(0);
    // Le calendrier couvre les 30 jours de juin.
    const dayCells = data.calendar.filter(c => c.day);
    expect(dayCells.length).toBe(30);
  });

  it('ne mélange pas le culte ouvert avec des engagements membre', async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2026, month: 6 });
    expect(data.past).toHaveLength(0);
    expect(data.upcoming).toHaveLength(0);
  });

  it("ne marque aucune absence dans l'état initial — Dave", async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.dave, { year: 2026, month: 6 });
    expect(data.stats.absent).toBe(0);
    const cancelledCell = data.calendar.find(c => c.status === 'cancelled');
    expect(cancelledCell).toBeUndefined();
  });

  it('calcule prev/next correctement, y compris les bascules d\'année', async () => {
    const jan = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 1 });
    expect(jan.prev).toEqual({ year: 2024, month: 12 });
    expect(jan.next).toEqual({ year: 2025, month: 2 });

    const dec = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2025, month: 12 });
    expect(dec.next).toEqual({ year: 2026, month: 1 });
  });

  it('indique le statut de validation du mois', async () => {
    const data = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2026, month: 6 });
    expect(data.validated).toBe(false);

    const empty = await loadMemberMonthView(getClient(), PROFILE_IDS.isaac, { year: 2026, month: 3 });
    expect(empty.validated).toBe(false);
    expect(empty.stats.engagements).toBe(0);
  });
});
