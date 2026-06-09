import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadServiceDayView } from '@/lib/queries/member';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('loadServiceDayView (écran 06)', () => {
  beforeEach(() => __resetMockData());

  it("renvoie null tant qu'Isaac n'a pas de service assigné", async () => {
    const data = await loadServiceDayView(getClient(), PROFILE_IDS.isaac);
    expect(data).toBeNull();
  });

  it('renvoie null aussi pour un profil inconnu', async () => {
    const data = await loadServiceDayView(getClient(), '00000000-0000-4000-8000-000000000099');
    expect(data).toBeNull();
  });
});
