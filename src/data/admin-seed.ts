import type { Database } from '@/types/database';
import { ORG_ID, PROFILE_IDS, SKILL_IDS } from '@/data/seed';

/**
 * Fixtures admin — services Juin 2025, assignations, validations mensuelles, contenu spirituel.
 * Source de référence pour le mock client Supabase + bootstrap du seed remote.
 *
 * Date de référence : 2025-06-17 (mardi). Le "prochain service" est dim. 22 juin.
 */

export const SERVICE_IDS = {
  june09: '10000000-0000-4000-8000-000000000001',
  june16: '10000000-0000-4000-8000-000000000002',
  june23: '10000000-0000-4000-8000-000000000003',
  june30: '10000000-0000-4000-8000-000000000004',
  june25Midweek: '10000000-0000-4000-8000-000000000005',
} as const;

export const SLOT_IDS = {
  s09_sono: '20000000-0000-4000-8000-000000000101',
  s09_camera: '20000000-0000-4000-8000-000000000102',
  s09_diffusion: '20000000-0000-4000-8000-000000000103',
  s16_sono: '20000000-0000-4000-8000-000000000201',
  s16_camera: '20000000-0000-4000-8000-000000000202',
  s16_diffusion: '20000000-0000-4000-8000-000000000203',
  s23_sono: '20000000-0000-4000-8000-000000000301',
  s23_camera: '20000000-0000-4000-8000-000000000302',
  s23_diffusion: '20000000-0000-4000-8000-000000000303',
  s30_sono: '20000000-0000-4000-8000-000000000401',
  s30_camera: '20000000-0000-4000-8000-000000000402',
  s30_diffusion: '20000000-0000-4000-8000-000000000403',
  s25_sono: '20000000-0000-4000-8000-000000000501',
} as const;

export const SERVICES_SEED: Database['public']['Tables']['services']['Insert'][] = [
  {
    id: SERVICE_IDS.june09,
    organization_id: ORG_ID,
    event_type: 'sunday_service',
    title: 'Culte dimanche',
    service_date: '2025-06-08',
    start_time: '14:00:00',
    arrival_time: '13:30:00',
    location: 'Salle principale',
    spiritual_theme: 'La fidélité',
    spiritual_verse_ref: 'Lamentations 3:23',
    spiritual_verse_text: 'Sa fidélité est nouvelle chaque matin.',
    status: 'completed',
  },
  {
    id: SERVICE_IDS.june16,
    organization_id: ORG_ID,
    event_type: 'sunday_service',
    title: 'Culte dimanche',
    service_date: '2025-06-15',
    start_time: '14:00:00',
    arrival_time: '13:30:00',
    location: 'Salle principale',
    spiritual_theme: 'La gratitude',
    spiritual_verse_ref: 'Psaume 100:4',
    spiritual_verse_text: 'Entrez dans ses portes avec reconnaissance.',
    status: 'completed',
  },
  {
    id: SERVICE_IDS.june23,
    organization_id: ORG_ID,
    event_type: 'sunday_service',
    title: 'Culte dimanche',
    service_date: '2025-06-22',
    start_time: '14:00:00',
    arrival_time: '13:30:00',
    location: 'Salle principale',
    spiritual_theme: "L'unité",
    spiritual_verse_ref: 'Psaume 133:1',
    spiritual_verse_text: 'Voici, oh ! qu’il est agréable, qu’il est doux pour des frères de demeurer ensemble.',
    status: 'published',
    published_at: '2025-06-12T10:00:00Z',
  },
  {
    id: SERVICE_IDS.june25Midweek,
    organization_id: ORG_ID,
    event_type: 'midweek_service',
    title: 'Service de semaine',
    service_date: '2025-06-25',
    start_time: '19:30:00',
    arrival_time: '19:00:00',
    location: 'Salle principale',
    status: 'published',
    published_at: '2025-06-15T10:00:00Z',
  },
  {
    id: SERVICE_IDS.june30,
    organization_id: ORG_ID,
    event_type: 'sunday_service',
    title: 'Culte dimanche',
    service_date: '2025-06-29',
    start_time: '14:00:00',
    arrival_time: '13:30:00',
    location: 'Salle principale',
    status: 'draft',
  },
];

export const SLOTS_SEED: Database['public']['Tables']['service_slots']['Insert'][] = [
  { id: SLOT_IDS.s09_sono, service_id: SERVICE_IDS.june09, skill_id: SKILL_IDS.sono, positions_required: 1 },
  { id: SLOT_IDS.s09_camera, service_id: SERVICE_IDS.june09, skill_id: SKILL_IDS.camera, positions_required: 1 },
  { id: SLOT_IDS.s09_diffusion, service_id: SERVICE_IDS.june09, skill_id: SKILL_IDS.diffusion, positions_required: 1 },
  { id: SLOT_IDS.s16_sono, service_id: SERVICE_IDS.june16, skill_id: SKILL_IDS.sono, positions_required: 1 },
  { id: SLOT_IDS.s16_camera, service_id: SERVICE_IDS.june16, skill_id: SKILL_IDS.camera, positions_required: 1 },
  { id: SLOT_IDS.s16_diffusion, service_id: SERVICE_IDS.june16, skill_id: SKILL_IDS.diffusion, positions_required: 1 },
  { id: SLOT_IDS.s23_sono, service_id: SERVICE_IDS.june23, skill_id: SKILL_IDS.sono, positions_required: 1 },
  { id: SLOT_IDS.s23_camera, service_id: SERVICE_IDS.june23, skill_id: SKILL_IDS.camera, positions_required: 1 },
  { id: SLOT_IDS.s23_diffusion, service_id: SERVICE_IDS.june23, skill_id: SKILL_IDS.diffusion, positions_required: 1 },
  { id: SLOT_IDS.s30_sono, service_id: SERVICE_IDS.june30, skill_id: SKILL_IDS.sono, positions_required: 1 },
  { id: SLOT_IDS.s30_camera, service_id: SERVICE_IDS.june30, skill_id: SKILL_IDS.camera, positions_required: 1 },
  { id: SLOT_IDS.s30_diffusion, service_id: SERVICE_IDS.june30, skill_id: SKILL_IDS.diffusion, positions_required: 1 },
  { id: SLOT_IDS.s25_sono, service_id: SERVICE_IDS.june25Midweek, skill_id: SKILL_IDS.sono, positions_required: 1 },
];

export const ASSIGNMENTS_SEED: Database['public']['Tables']['assignments']['Insert'][] = [
  // 9 juin (completed)
  { id: '30000000-0000-4000-8000-000000000901', service_id: SERVICE_IDS.june09, slot_id: SLOT_IDS.s09_sono, profile_id: PROFILE_IDS.isaac, status: 'present' },
  { id: '30000000-0000-4000-8000-000000000902', service_id: SERVICE_IDS.june09, slot_id: SLOT_IDS.s09_camera, profile_id: PROFILE_IDS.chana, status: 'present' },
  { id: '30000000-0000-4000-8000-000000000903', service_id: SERVICE_IDS.june09, slot_id: SLOT_IDS.s09_diffusion, profile_id: PROFILE_IDS.dave, status: 'present' },

  // 16 juin (completed)
  { id: '30000000-0000-4000-8000-000000001601', service_id: SERVICE_IDS.june16, slot_id: SLOT_IDS.s16_sono, profile_id: PROFILE_IDS.alpha, status: 'present' },
  { id: '30000000-0000-4000-8000-000000001602', service_id: SERVICE_IDS.june16, slot_id: SLOT_IDS.s16_camera, profile_id: PROFILE_IDS.chana, status: 'present' },
  { id: '30000000-0000-4000-8000-000000001603', service_id: SERVICE_IDS.june16, slot_id: SLOT_IDS.s16_diffusion, profile_id: PROFILE_IDS.chrisciana, status: 'present' },

  // 22 juin (published, next service) — Sono Isaac, Caméra Chana + Stéphanie en apprentie, Diffusion Dave (annulé il y a 2h)
  { id: '30000000-0000-4000-8000-000000002301', service_id: SERVICE_IDS.june23, slot_id: SLOT_IDS.s23_sono, profile_id: PROFILE_IDS.isaac, status: 'present' },
  { id: '30000000-0000-4000-8000-000000002302', service_id: SERVICE_IDS.june23, slot_id: SLOT_IDS.s23_camera, profile_id: PROFILE_IDS.chana, status: 'present' },
  {
    id: '30000000-0000-4000-8000-000000002304',
    service_id: SERVICE_IDS.june23,
    slot_id: SLOT_IDS.s23_camera,
    profile_id: PROFILE_IDS.stephanie,
    status: 'present',
    is_paired_with: '30000000-0000-4000-8000-000000002302',
    is_trainee: true,
  },
  {
    id: '30000000-0000-4000-8000-000000002303',
    service_id: SERVICE_IDS.june23,
    slot_id: SLOT_IDS.s23_diffusion,
    profile_id: PROFILE_IDS.dave,
    status: 'cancelled',
    cancelled_at: '2025-06-17T06:00:00Z',
    cancelled_reason: 'Imprévu',
  },

  // 30 juin (draft) — Sono Alpha, Caméra Gloria, Diffusion Dave (annulé)
  { id: '30000000-0000-4000-8000-000000003001', service_id: SERVICE_IDS.june30, slot_id: SLOT_IDS.s30_sono, profile_id: PROFILE_IDS.alpha, status: 'present' },
  { id: '30000000-0000-4000-8000-000000003002', service_id: SERVICE_IDS.june30, slot_id: SLOT_IDS.s30_camera, profile_id: PROFILE_IDS.gloria, status: 'present' },
  {
    id: '30000000-0000-4000-8000-000000003003',
    service_id: SERVICE_IDS.june30,
    slot_id: SLOT_IDS.s30_diffusion,
    profile_id: PROFILE_IDS.dave,
    status: 'cancelled',
    cancelled_at: '2025-06-17T08:30:00Z',
    cancelled_reason: 'Imprévu familial',
  },

  // 25 juin midweek — Sono Isaac
  { id: '30000000-0000-4000-8000-000000002501', service_id: SERVICE_IDS.june25Midweek, slot_id: SLOT_IDS.s25_sono, profile_id: PROFILE_IDS.isaac, status: 'present' },
];

export const MONTHLY_VALIDATIONS_SEED: Database['public']['Tables']['monthly_validations']['Insert'][] = [
  // Validations Juin 2025 : tous sauf Stéphanie
  { id: '40000000-0000-4000-8000-000000000001', profile_id: PROFILE_IDS.alpha, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-12T10:00:00Z' },
  { id: '40000000-0000-4000-8000-000000000002', profile_id: PROFILE_IDS.chana, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-13T19:00:00Z' },
  { id: '40000000-0000-4000-8000-000000000003', profile_id: PROFILE_IDS.isaac, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-13T20:30:00Z' },
  { id: '40000000-0000-4000-8000-000000000004', profile_id: PROFILE_IDS.chrisciana, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-14T07:45:00Z' },
  { id: '40000000-0000-4000-8000-000000000005', profile_id: PROFILE_IDS.dave, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-14T22:10:00Z' },
  { id: '40000000-0000-4000-8000-000000000006', profile_id: PROFILE_IDS.gloria, organization_id: ORG_ID, year: 2025, month: 6, validated_at: '2025-06-15T18:00:00Z' },
  // Stéphanie n'a pas validé son mois (alerte admin)
];

export const SPIRITUAL_CONTENT_SEED: Database['public']['Tables']['spiritual_content']['Insert'][] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    organization_id: ORG_ID,
    content_type: 'weekly_thought',
    title: 'Pensée du 17 juin',
    verse_text: 'Que chacun mette au service des autres le don qu’il a reçu.',
    verse_reference: '1 Pierre 4:10',
    status: 'published',
    published_at: '2025-06-17T08:00:00Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    organization_id: ORG_ID,
    content_type: 'weekly_thought',
    title: 'Pensée du 10 juin',
    verse_text: 'Soyez forts et courageux, ne craignez pas et ne soyez pas effrayés.',
    verse_reference: 'Deutéronome 31:6',
    status: 'published',
    published_at: '2025-06-10T08:00:00Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    organization_id: ORG_ID,
    content_type: 'weekly_thought',
    title: 'Pensée du 3 juin',
    verse_text: 'Confiez-vous en l’Éternel de tout votre cœur, et ne vous appuyez pas sur votre sagesse.',
    verse_reference: 'Proverbes 3:5',
    status: 'published',
    published_at: '2025-06-03T08:00:00Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    organization_id: ORG_ID,
    content_type: 'weekly_thought',
    title: 'Pensée du 27 mai',
    verse_text: 'L’amour est patient, il est plein de bonté.',
    verse_reference: '1 Corinthiens 13:4',
    status: 'published',
    published_at: '2025-05-27T08:00:00Z',
  },
];

export const ADMIN_SEED_TABLES = {
  services: SERVICES_SEED,
  service_slots: SLOTS_SEED,
  assignments: ASSIGNMENTS_SEED,
  monthly_validations: MONTHLY_VALIDATIONS_SEED,
  spiritual_content: SPIRITUAL_CONTENT_SEED,
} as const;
