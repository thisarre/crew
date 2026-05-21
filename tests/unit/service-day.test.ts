import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadServiceDayView } from '@/lib/queries/member';
import { cancelOwnAssignment } from '@/lib/mutations/member-cancel';
import { loadAdminContext } from '@/lib/queries/admin';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('loadServiceDayView (écran 06)', () => {
  beforeEach(() => __resetMockData());

  it("retourne le prochain service d'Isaac avec poste, équipe, thème", async () => {
    const data = await loadServiceDayView(getClient(), PROFILE_IDS.isaac);
    expect(data).not.toBeNull();
    // Prochain service présent d'Isaac = 22 juin, sono
    expect(data!.dateLabel).toMatch(/22 juin/i);
    expect(data!.mySkillName).toBe('Sono');
    expect(data!.mySkillBadge).toBe('sono');
    expect(data!.startLabel).toBe('14h00');
    expect(data!.arrivalLabel).toBe('13h30');
    // Thème du 22 juin
    expect(data!.theme).toBe("L'unité");
    expect(data!.verseReference).toBe('Psaume 133:1');
  });

  it("inclut l'équipe du jour avec le membre marqué 'toi' en premier", async () => {
    const data = await loadServiceDayView(getClient(), PROFILE_IDS.isaac);
    expect(data!.team.length).toBeGreaterThanOrEqual(2);
    expect(data!.team[0].isMe).toBe(true);
    expect(data!.team[0].name).toContain('toi');
    // Chana est présente (caméra) sur le 22 juin
    expect(data!.team.some(t => t.skillName === 'Caméra')).toBe(true);
  });

  it('calcule le badge de proximité (référence 17 juin → 22 juin = dans 5 jours)', async () => {
    const data = await loadServiceDayView(getClient(), PROFILE_IDS.isaac);
    expect(data!.badge).toBe('upcoming');
    expect(data!.badgeLabel).toMatch(/Dans 5 jours/);
  });

  it('expose le contact admin', async () => {
    const data = await loadServiceDayView(getClient(), PROFILE_IDS.isaac);
    expect(data!.admin.name).toBe('Alpha');
  });

  it('renvoie null si le membre n\'a aucun service à venir', async () => {
    const client = getClient();
    // Annule les 2 prochains engagements présents d'Isaac (22 et 25 juin)
    const ctx = await loadAdminContext(client);
    const isaacUpcoming = ctx.assignments.filter(
      a => a.profile_id === PROFILE_IDS.isaac && a.status === 'present',
    );
    for (const a of isaacUpcoming) {
      await cancelOwnAssignment(client, a.id, PROFILE_IDS.isaac);
    }
    const data = await loadServiceDayView(client, PROFILE_IDS.isaac);
    expect(data).toBeNull();
  });
});
