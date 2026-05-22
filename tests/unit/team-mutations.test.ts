import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient, __resetMockData } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import {
  deleteMember,
  deriveInitials,
  inviteMember,
  removeMemberSkill,
  setMemberActive,
  setMemberSkill,
} from '@/lib/mutations/team';
import { loadAdminContext, buildMembersOverview } from '@/lib/queries/admin';
import { PROFILE_IDS, SKILL_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

describe('team mutations', () => {
  beforeEach(() => __resetMockData());

  describe('deriveInitials', () => {
    it('génère des initiales correctes', () => {
      expect(deriveInitials('Marie')).toBe('Ma');
      expect(deriveInitials('Jean Dupont')).toBe('JD');
      expect(deriveInitials('A')).toBe('A');
      expect(deriveInitials('  paul   martin ')).toBe('PM');
    });
  });

  it('inviteMember crée un nouveau profil membre', async () => {
    const client = getClient();
    const { profileId } = await inviteMember(client, { displayName: 'Marie' });
    expect(profileId).toBeTruthy();

    const ctx = await loadAdminContext(client);
    const created = ctx.profiles.find(p => p.id === profileId);
    expect(created?.display_name).toBe('Marie');
    expect(created?.initials).toBe('Ma');
    expect(created?.role).toBe('member');
    expect(created?.is_active).toBe(true);
  });

  it('setMemberSkill crée puis met à jour le niveau', async () => {
    const client = getClient();
    // Isaac n'a pas la compétence caméra dans le seed
    const first = await setMemberSkill(client, {
      profileId: PROFILE_IDS.isaac,
      skillId: SKILL_IDS.camera,
      level: 'learning',
    });
    expect(first.created).toBe(true);

    const second = await setMemberSkill(client, {
      profileId: PROFILE_IDS.isaac,
      skillId: SKILL_IDS.camera,
      level: 'autonomous',
    });
    expect(second.created).toBe(false);

    const ctx = await loadAdminContext(client);
    const overview = buildMembersOverview(ctx);
    const isaac = overview.find(m => m.profile.id === PROFILE_IDS.isaac);
    const camera = isaac!.skills.find(s => s.skillId === SKILL_IDS.camera);
    expect(camera?.level).toBe('autonomous');
  });

  it('removeMemberSkill supprime la compétence', async () => {
    const client = getClient();
    // Isaac a sono autonome dans le seed
    await removeMemberSkill(client, PROFILE_IDS.isaac, SKILL_IDS.sono);
    const ctx = await loadAdminContext(client);
    const isaacSkills = ctx.memberSkills.filter(ms => ms.profile_id === PROFILE_IDS.isaac);
    expect(isaacSkills.some(ms => ms.skill_id === SKILL_IDS.sono)).toBe(false);
  });

  it('setMemberActive désactive un membre (exclu des overviews)', async () => {
    const client = getClient();
    await setMemberActive(client, PROFILE_IDS.gloria, false);
    const ctx = await loadAdminContext(client);
    const overview = buildMembersOverview(ctx);
    expect(overview.some(m => m.profile.id === PROFILE_IDS.gloria)).toBe(false);

    // Réactivation
    await setMemberActive(client, PROFILE_IDS.gloria, true);
    const ctx2 = await loadAdminContext(client);
    const overview2 = buildMembersOverview(ctx2);
    expect(overview2.some(m => m.profile.id === PROFILE_IDS.gloria)).toBe(true);
  });

  it('deleteMember supprime le profil et ses données liées', async () => {
    const client = getClient();

    // Gloria possède des compétences dans le seed.
    const before = await loadAdminContext(client);
    expect(before.profiles.some(p => p.id === PROFILE_IDS.gloria)).toBe(true);
    expect(before.memberSkills.some(ms => ms.profile_id === PROFILE_IDS.gloria)).toBe(true);

    await deleteMember(client, PROFILE_IDS.gloria);

    const after = await loadAdminContext(client);
    expect(after.profiles.some(p => p.id === PROFILE_IDS.gloria)).toBe(false);
    expect(after.memberSkills.some(ms => ms.profile_id === PROFILE_IDS.gloria)).toBe(false);
    expect(after.assignments.some(a => a.profile_id === PROFILE_IDS.gloria)).toBe(false);
    // Les autres membres restent intacts.
    expect(after.profiles.some(p => p.id === PROFILE_IDS.isaac)).toBe(true);
  });

  it('deleteMember refuse de supprimer le dernier administrateur', async () => {
    const client = getClient();
    await expect(deleteMember(client, PROFILE_IDS.alpha)).rejects.toThrow('last_admin');

    // Alpha est toujours là.
    const ctx = await loadAdminContext(client);
    expect(ctx.profiles.some(p => p.id === PROFILE_IDS.alpha)).toBe(true);
  });

  it('deleteMember échoue proprement pour un profil inexistant', async () => {
    const client = getClient();
    await expect(deleteMember(client, 'inexistant-0000-0000-0000-000000000000')).rejects.toThrow(
      'profile_not_found',
    );
  });
});
