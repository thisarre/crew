import type { Database } from '@/types/database';
import { ORG_ID, SKILL_IDS } from '@/data/seed';

/**
 * Etat initial admin.
 *
 * On garde uniquement le prochain culte réel pour démarrer proprement :
 * dimanche 14 juin 2026, avec les trois postes à pourvoir.
 */

export const SERVICE_IDS = {
  june14: '11140000-0000-4000-8000-000000000001',
} as const;

export const SLOT_IDS = {
  s14_sono: '11140000-0000-4000-8000-000000000101',
  s14_camera: '11140000-0000-4000-8000-000000000102',
  s14_diffusion: '11140000-0000-4000-8000-000000000103',
} as const;

export const SERVICES_SEED: Database['public']['Tables']['services']['Insert'][] = [
  {
    id: SERVICE_IDS.june14,
    organization_id: ORG_ID,
    event_type: 'sunday_service',
    title: 'Culte dimanche',
    service_date: '2026-06-14',
    start_time: '14:00:00',
    arrival_time: '13:30:00',
    location: 'Salle principale',
    status: 'draft',
    published_at: null,
  },
];

export const SLOTS_SEED: Database['public']['Tables']['service_slots']['Insert'][] = [
  { id: SLOT_IDS.s14_sono, service_id: SERVICE_IDS.june14, skill_id: SKILL_IDS.sono, positions_required: 1 },
  { id: SLOT_IDS.s14_camera, service_id: SERVICE_IDS.june14, skill_id: SKILL_IDS.camera, positions_required: 1 },
  { id: SLOT_IDS.s14_diffusion, service_id: SERVICE_IDS.june14, skill_id: SKILL_IDS.diffusion, positions_required: 1 },
];

export const ASSIGNMENTS_SEED: Database['public']['Tables']['assignments']['Insert'][] = [];

export const MONTHLY_VALIDATIONS_SEED: Database['public']['Tables']['monthly_validations']['Insert'][] = [];

export const SPIRITUAL_CONTENT_SEED: Database['public']['Tables']['spiritual_content']['Insert'][] = [];

export const ADMIN_SEED_TABLES = {
  services: SERVICES_SEED,
  service_slots: SLOTS_SEED,
  assignments: ASSIGNMENTS_SEED,
  monthly_validations: MONTHLY_VALIDATIONS_SEED,
  spiritual_content: SPIRITUAL_CONTENT_SEED,
} as const;
