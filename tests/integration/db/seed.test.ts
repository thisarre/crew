import { beforeAll, describe, expect, it } from 'vitest';

import { PROFILE_IDS, SKILLS_SEED } from '@/data/seed';
import { createClient, type SupabaseServerClient } from '@/lib/supabase/server';

let supabase: SupabaseServerClient;

beforeAll(() => {
  process.env.SUPABASE_MOCK = 'true';
  supabase = createClient();
});

describe('Seed data', () => {
  it('has 7 profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    expect(error).toBeNull();
    expect(data).toHaveLength(7);
  });

  it('has Alpha as admin', async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').single();
    expect(error).toBeNull();
    expect(data?.display_name).toBe('Alpha');
  });

  it('has 3 skills', async () => {
    const { data, error } = await supabase.from('skills').select('*');
    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data?.map(skill => skill.name)).toEqual(['Sono', 'Caméra', 'Diffusion']);
  });

  it('Isaac is autonomous in Sono only', async () => {
    const { data, error } = await supabase
      .from('member_skills')
      .select('*')
      .eq('profile_id', PROFILE_IDS.isaac);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].level).toBe('autonomous');

    const skillName = SKILLS_SEED.find(skill => skill.id === data?.[0].skill_id)?.name;
    expect(skillName).toBe('Sono');
  });

  it('Chana has 2 skills (Caméra autonome, Diffusion apprentie)', async () => {
    const { data, error } = await supabase
      .from('member_skills')
      .select('*')
      .eq('profile_id', PROFILE_IDS.chana);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    const skillsByName = data?.map(item => ({
      level: item.level,
      name: SKILLS_SEED.find((skill): skill is (typeof SKILLS_SEED)[number] => skill.id === item.skill_id)?.name,
    }));

    expect(skillsByName).toContainEqual({ name: 'Caméra', level: 'autonomous' });
    expect(skillsByName).toContainEqual({ name: 'Diffusion', level: 'learning' });
  });
});
