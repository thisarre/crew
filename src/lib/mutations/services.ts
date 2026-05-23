import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { ORG_ID } from '@/data/seed';
import { cancelAssignment } from './assignments';

type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type SlotInsert = Database['public']['Tables']['service_slots']['Insert'];
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];

export type CreateServiceInput = {
  organizationId?: string;
  eventType: ServiceInsert['event_type'] | 'special_event';
  serviceDate: string; // yyyy-mm-dd
  startTime?: string; // HH:mm or HH:mm:ss — absent pour sunday/midweek
  arrivalTime?: string;
  location?: string;
  spiritualTheme?: string;
  slotSkillIds: string[]; // skills à pourvoir
  initialAssignments?: { skillId: string; profileId: string; isTrainee?: boolean }[];
};

const toSqlTime = (raw: string): string => {
  // Accepte "14h00", "14:00", "14:00:00" → toujours HH:mm:ss
  const normalized = raw.replace('h', ':').replace(/[^0-9:]/g, '');
  const parts = normalized.split(':');
  const hh = (parts[0] ?? '0').padStart(2, '0');
  const mm = (parts[1] ?? '00').padStart(2, '0');
  const ss = (parts[2] ?? '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export async function createService(
  client: SupabaseServerClient,
  input: CreateServiceInput,
): Promise<{ serviceId: string; slotIds: string[]; assignmentIds: string[] }> {
  const orgId = input.organizationId ?? ORG_ID;

  // 1. Insert du service
  const servicePayload: Omit<ServiceInsert, 'event_type'> & { event_type: string } = {
    organization_id: orgId,
    event_type: input.eventType,
    title: input.eventType === 'sunday_service' ? 'Culte dimanche' : input.eventType === 'midweek_service' ? 'Service de semaine' : input.eventType === 'special_event' ? 'Événement spécial' : 'Call équipe',
    service_date: input.serviceDate,
    start_time: toSqlTime(input.startTime ?? '00:00'),
    arrival_time: input.arrivalTime ? toSqlTime(input.arrivalTime) : null,
    location: input.location ?? null,
    spiritual_theme: input.spiritualTheme ?? null,
    status: 'draft',
  };

  const { data: service, error: serviceErr } = await client
    .from('services')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(servicePayload as any)
    .select()
    .single();
  if (serviceErr || !service) throw serviceErr ?? new Error('service_insert_failed');

  // 2. Insert des slots (optionnel — pas de slots pour les événements sans postes)
  const slotsPayload: SlotInsert[] = input.slotSkillIds.map(skillId => ({
    service_id: service.id,
    skill_id: skillId,
    positions_required: 1,
  }));
  const { data: slots, error: slotsErr } = slotsPayload.length > 0
    ? await client.from('service_slots').insert(slotsPayload).select()
    : { data: [], error: null };
  if (slotsErr) throw slotsErr;

  // 3. Insert des assignations initiales (si IA propose-team a déjà choisi)
  const assignmentIds: string[] = [];
  if (input.initialAssignments && input.initialAssignments.length > 0 && slots) {
    const assignmentRows: AssignmentInsert[] = [];
    for (const init of input.initialAssignments) {
      const slot = slots.find(s => s.skill_id === init.skillId);
      if (!slot) continue;
      assignmentRows.push({
        service_id: service.id,
        slot_id: slot.id,
        profile_id: init.profileId,
        status: 'present',
        is_trainee: init.isTrainee ?? false,
      });
    }
    if (assignmentRows.length > 0) {
      const { data: inserted } = await client
        .from('assignments')
        .insert(assignmentRows)
        .select();
      inserted?.forEach(a => assignmentIds.push(a.id));
    }
  }

  return {
    serviceId: service.id,
    slotIds: (slots ?? []).map(s => s.id),
    assignmentIds,
  };
}

export async function publishService(
  client: SupabaseServerClient,
  serviceId: string,
): Promise<{ publishedAt: string }> {
  const publishedAt = new Date().toISOString();
  const { error } = await client
    .from('services')
    .update({ status: 'published', published_at: publishedAt })
    .eq('id', serviceId);
  if (error) throw error;
  return { publishedAt };
}

/**
 * Annule un service entier (le culte/la date) — possible à tout moment.
 * - Passe le service en statut 'cancelled'.
 * - Annule toutes les assignations 'present' rattachées (les membres sont libérés).
 * Renvoie le nombre d'assignations annulées (pour info / notification).
 */
export async function cancelService(
  client: SupabaseServerClient,
  serviceId: string,
): Promise<{ cancelledAssignments: number }> {
  const { error: svcErr } = await client
    .from('services')
    .update({ status: 'cancelled' })
    .eq('id', serviceId);
  if (svcErr) throw svcErr;

  const { data: present, error: fetchErr } = await client
    .from('assignments')
    .select('id')
    .eq('service_id', serviceId)
    .eq('status', 'present');
  if (fetchErr) throw fetchErr;

  const ids = (present ?? []).map(a => a.id);
  for (const id of ids) {
    await cancelAssignment(client, id, 'Service annulé');
  }

  return { cancelledAssignments: ids.length };
}

/**
 * Réactive un service précédemment annulé : repasse en 'draft'.
 * Les assignations annulées ne sont pas restaurées automatiquement — l'admin réassigne puis republie.
 */
export async function reactivateService(
  client: SupabaseServerClient,
  serviceId: string,
): Promise<void> {
  const { error } = await client
    .from('services')
    .update({ status: 'draft' })
    .eq('id', serviceId);
  if (error) throw error;
}
