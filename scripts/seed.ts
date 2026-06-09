import 'dotenv/config';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';
import {
  ADMIN_SEED_TABLES,
  ASSIGNMENTS_SEED,
  MONTHLY_VALIDATIONS_SEED,
  SERVICES_SEED,
  SLOTS_SEED,
  SPIRITUAL_CONTENT_SEED,
} from '../src/data/admin-seed';
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
  const assignmentIds = ASSIGNMENTS_SEED.map(assignment => assignment.id!);
  const slotIds = SLOTS_SEED.map(slot => slot.id!);
  const serviceIds = SERVICES_SEED.map(service => service.id!);
  const validationIds = MONTHLY_VALIDATIONS_SEED.map(validation => validation.id!);
  const spiritualContentIds = SPIRITUAL_CONTENT_SEED.map(content => content.id!);
  const profileIds = PROFILES_SEED.map(profile => profile.id!);
  const skillIds = SKILLS_SEED.map(skill => skill.id!);
  const memberSkillIds = MEMBER_SKILLS_SEED.map(skill => skill.id);

  if (assignmentIds.length) {
    await client.from('assignments').delete().in('id', assignmentIds);
  }
  if (slotIds.length) {
    await client.from('service_slots').delete().in('id', slotIds);
  }
  if (serviceIds.length) {
    await client.from('services').delete().in('id', serviceIds);
  }
  if (validationIds.length) {
    await client.from('monthly_validations').delete().in('id', validationIds);
  }
  if (spiritualContentIds.length) {
    await client.from('spiritual_content').delete().in('id', spiritualContentIds);
  }
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
  await client.from('services').upsert(ADMIN_SEED_TABLES.services, { onConflict: 'id' });
  await client.from('service_slots').upsert(ADMIN_SEED_TABLES.service_slots, { onConflict: 'id' });
  await client.from('assignments').upsert(ADMIN_SEED_TABLES.assignments, { onConflict: 'id' });
  await client.from('monthly_validations').upsert(ADMIN_SEED_TABLES.monthly_validations, { onConflict: 'id' });
  await client.from('spiritual_content').upsert(ADMIN_SEED_TABLES.spiritual_content, { onConflict: 'id' });
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
