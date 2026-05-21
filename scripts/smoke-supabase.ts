/**
 * Smoke test : vérifie que les queries admin tournent contre la vraie DB Supabase.
 *
 * Usage : npm run smoke
 * Prérequis : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local
 */
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv(); // fallback .env
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';
import {
  buildAdminDashboard,
  buildMembersOverview,
  buildServiceDetail,
  loadAdminContext,
} from '../src/lib/queries/admin';
import { PROFILE_IDS } from '../src/data/seed';
import { SERVICE_IDS } from '../src/data/admin-seed';
import type { SupabaseServerClient } from '../src/lib/supabase/server';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local');
  }

  const client = createSupabaseClient<Database>(url, serviceKey ?? anonKey, {
    auth: { persistSession: false },
  }) as unknown as SupabaseServerClient;

  console.info('🔌 Connexion :', url);

  console.info('📥 loadAdminContext ...');
  const ctx = await loadAdminContext(client);
  console.info(
    `   profiles=${ctx.profiles.length} | skills=${ctx.skills.length} | services=${ctx.services.length} | slots=${ctx.slots.length} | assignments=${ctx.assignments.length} | validations=${ctx.validations.length} | spiritual=${ctx.spiritual.length}`,
  );

  console.info('\n🧮 buildAdminDashboard ...');
  const admin = ctx.profiles.find(p => p.id === PROFILE_IDS.alpha);
  if (!admin) throw new Error('Admin Alpha introuvable');
  const dashboard = buildAdminDashboard(ctx, admin);
  console.info(`   admin = ${dashboard.admin.name}`);
  console.info(`   nextService = ${dashboard.nextService?.dateLabel ?? '∅'} (${dashboard.nextService?.countdownLabel})`);
  console.info(`   alertes = ${dashboard.alerts.length}`);
  dashboard.alerts.forEach(a => {
    console.info(`     - ${a.kind} | ${a.profileName}`);
  });
  console.info(`   stats : ${dashboard.stats.activeMembers} actifs, ${dashboard.stats.servicesThisMonth} services ce mois, ${dashboard.stats.attendancePercent}% présence`);

  console.info('\n👥 buildMembersOverview ...');
  const members = buildMembersOverview(ctx);
  members.forEach(m => {
    const skills = m.skills.map(s => `${s.skillName}(${s.level[0]})`).join(', ');
    console.info(`   ${m.profile.display_name.padEnd(11)} | ${skills}`);
  });

  console.info('\n📅 buildServiceDetail (23 juin) ...');
  const detail = buildServiceDetail(ctx, SERVICE_IDS.june23);
  if (!detail) throw new Error('Service 23 juin introuvable');
  console.info(`   ${detail.dateLabel} — ${detail.filledCount}/${detail.totalSlots} pourvus, ${detail.cancelledCount} annulé(s)`);
  detail.slots.forEach(s => {
    const ai = s.aiProposal ? ` → IA propose ${s.aiProposal.name}` : '';
    console.info(`   - ${s.skillName.padEnd(10)} [${s.status}]${ai}`);
  });

  console.info('\n✅ Smoke OK — la couche queries fonctionne contre Supabase.');
}

void main().catch(err => {
  console.error('❌ Smoke failed', err);
  process.exit(1);
});
