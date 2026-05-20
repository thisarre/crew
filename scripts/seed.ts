import 'dotenv/config';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';
import {
  MEMBER_SKILLS_SEED,
  ORGANIZATION_SEED,
  PROFILES_SEED,
  SKILLS_SEED,
} from '../src/data/seed';

const resolveEnv = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Impossible de se connecter à Supabase. Vérifie SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_* pour un usage local).",
    );
  }

  return { url, key } as const;
};

type SupabaseServiceClient = SupabaseClient<Database>;

const cleanupTables = async (client: SupabaseServiceClient) => {
  const profileIds = PROFILES_SEED.map(profile => profile.id!);
  const skillIds = SKILLS_SEED.map(skill => skill.id!);
  const memberSkillIds = MEMBER_SKILLS_SEED.map(skill => skill.id);

  await client.from('member_skills').delete().in('id', memberSkillIds);
  if (profileIds.length) {
    await client.from('profiles').delete().in('id', profileIds);
  }
  if (skillIds.length) {
    await client.from('skills').delete().in('id', skillIds);
  }
  if (ORGANIZATION_SEED.id) {
    await client.from('organizations').delete().eq('id', ORGANIZATION_SEED.id);
  }
};

const upsertOrdered = async (client: SupabaseServiceClient) => {
  await client.from('organizations').upsert([ORGANIZATION_SEED], { onConflict: 'id' });
  await client.from('profiles').upsert(PROFILES_SEED, { onConflict: 'id' });
  await client.from('skills').upsert(SKILLS_SEED, { onConflict: 'id' });
  await client.from('member_skills').upsert(MEMBER_SKILLS_SEED, { onConflict: 'id' });
};

async function main() {
  try {
    const { url, key } = resolveEnv();
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });

    console.info('🧹 Nettoyage des données précédentes...');
    await cleanupTables(client);

    console.info('🌱 Insertion du seed Crew...');
    await upsertOrdered(client);

    console.info('✅ Seed terminé.');
  } catch (error) {
    console.error('❌ Seed échoué', error);
    process.exit(1);
  }
}

void main();
