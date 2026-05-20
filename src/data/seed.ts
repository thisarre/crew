import type { Database } from '@/types/database';

export const ORG_ID = 'b8e2c1d4-5a3f-4e8a-9b2c-1d4e5f6a7b8c';

export const ORGANIZATION_SEED: Database['public']['Tables']['organizations']['Insert'] = {
  id: ORG_ID,
  name: "Église d'Alpha",
};

export const PROFILE_IDS = {
  alpha: 'c4cb9a8c-3a59-4a3c-8d1f-6e9a7b3c2d1f',
  chana: 'f2a1c3b4-5d6e-7f80-91a2-b3c4d5e6f7a8',
  isaac: 'a3b2c1d4-e5f6-47a8-91b2-c3d4e5f6a7b8',
  chrisciana: 'd1c2b3a4-5e6f-7081-92a3-b4c5d6e7f8a9',
  dave: 'e7f6a5b4-c3d2-1f09-8a7b-6c5d4e3f2a1b',
  stephanie: '9a8b7c6d-5e4f-3a21-b0c9-d8e7f6a5b4c3',
  gloria: '18273645-5647-4839-9a0b-1c2d3e4f5a6b',
} as const;

export const SKILL_IDS = {
  sono: 'ab12cd34-ef56-7890-ab12-cd34ef56ab78',
  camera: 'bc23de45-f678-90ab-cdef-1234567890ab',
  diffusion: 'cd34ef56-7890-ab12-cd34-ef567890ab12',
} as const;

export const PROFILES_SEED: Database['public']['Tables']['profiles']['Insert'][] = [
  { id: PROFILE_IDS.alpha, organization_id: ORG_ID, initials: 'A', display_name: 'Alpha', role: 'admin', avatar_color: '#16161B' },
  { id: PROFILE_IDS.chana, organization_id: ORG_ID, initials: 'C', display_name: 'Chana', avatar_color: '#96D8D0' },
  { id: PROFILE_IDS.isaac, organization_id: ORG_ID, initials: 'I', display_name: 'Isaac', avatar_color: '#D2B4F1' },
  { id: PROFILE_IDS.chrisciana, organization_id: ORG_ID, initials: 'Cs', display_name: 'Chrisciana', avatar_color: '#DAF4AA' },
  { id: PROFILE_IDS.dave, organization_id: ORG_ID, initials: 'D', display_name: 'Dave', avatar_color: '#D2B4F1' },
  { id: PROFILE_IDS.stephanie, organization_id: ORG_ID, initials: 'S', display_name: 'Stéphanie', avatar_color: '#96D8D0' },
  { id: PROFILE_IDS.gloria, organization_id: ORG_ID, initials: 'G', display_name: 'Gloria', avatar_color: '#DAF4AA' },
];

export const SKILLS_SEED: Database['public']['Tables']['skills']['Insert'][] = [
  { id: SKILL_IDS.sono, organization_id: ORG_ID, name: 'Sono', icon_name: 'headphones', color: '#DAF4AA', display_order: 1 },
  { id: SKILL_IDS.camera, organization_id: ORG_ID, name: 'Caméra', icon_name: 'video', color: '#96D8D0', display_order: 2 },
  { id: SKILL_IDS.diffusion, organization_id: ORG_ID, name: 'Diffusion', icon_name: 'device-tv', color: '#D2B4F1', display_order: 3 },
];

export type MemberSkillSeed = {
  id: string;
  profile_id: string;
  skill_id: string;
  level: Database['public']['Tables']['member_skills']['Row']['level'];
};

export const MEMBER_SKILLS_SEED: MemberSkillSeed[] = [
  { id: '11111111-1111-4111-8111-111111111111', profile_id: PROFILE_IDS.isaac, skill_id: SKILL_IDS.sono, level: 'autonomous' },
  { id: '22222222-2222-4222-8222-222222222222', profile_id: PROFILE_IDS.chana, skill_id: SKILL_IDS.camera, level: 'autonomous' },
  { id: '33333333-3333-4333-8333-333333333333', profile_id: PROFILE_IDS.chana, skill_id: SKILL_IDS.diffusion, level: 'learning' },
  { id: '44444444-4444-4444-8444-444444444444', profile_id: PROFILE_IDS.chrisciana, skill_id: SKILL_IDS.diffusion, level: 'autonomous' },
  { id: '55555555-5555-4555-8555-555555555555', profile_id: PROFILE_IDS.dave, skill_id: SKILL_IDS.diffusion, level: 'autonomous' },
  { id: '66666666-6666-4666-8666-666666666666', profile_id: PROFILE_IDS.stephanie, skill_id: SKILL_IDS.camera, level: 'learning' },
  { id: '77777777-7777-4777-8777-777777777777', profile_id: PROFILE_IDS.stephanie, skill_id: SKILL_IDS.diffusion, level: 'learning' },
  { id: '88888888-8888-4888-8888-888888888888', profile_id: PROFILE_IDS.gloria, skill_id: SKILL_IDS.sono, level: 'learning' },
  { id: '99999999-9999-4999-8999-999999999999', profile_id: PROFILE_IDS.gloria, skill_id: SKILL_IDS.camera, level: 'autonomous' },
];

export const SEED_TABLE_ORDER = {
  organizations: [ORGANIZATION_SEED],
  profiles: PROFILES_SEED,
  skills: SKILLS_SEED,
  member_skills: MEMBER_SKILLS_SEED,
};
