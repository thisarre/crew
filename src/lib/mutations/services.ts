import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { ORG_ID } from '@/data/seed';

type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type SlotInsert = Database['public']['Tables']['service_slots']['Insert'];
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];

export type CreateServiceInput = {
  organizationId?: string;
  eventType: ServiceInsert['event_type'];
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
  const servicePayload: ServiceInsert = {
    organization_id: orgId,
    event_type: input.eventType,
    title: input.eventType === 'sunday_service' ? 'Culte dimanche' : input.eventType === 'midweek_service' ? 'Service de semaine' : 'Call équipe',
    service_date: input.serviceDate,
    start_time: input.startTime ? toSqlTime(input.startTime) : null,
    arrival_time: input.arrivalTime ? toSqlTime(input.arrivalTime) : null,
    location: input.location ?? null,
    spiritual_theme: input.spiritualTheme ?? null,
    status: 'draft',
  };

  const { data: service, error: serviceErr } = await client
    .from('services')
    .insert(servicePayload)
    .select()
    .single();
  if (serviceErr || !service) throw serviceErr ?? new Error('service_insert_failed');

  // 2. Insert des slots
  const slotsPayload: SlotInsert[] = input.slotSkillIds.map(skillId => ({
    service_id: service.id,
    skill_id: skillId,
    positions_required: 1,
  }));
  const { data: slots, error: slotsErr } = await client
    .from('service_slots')
    .insert(slotsPayload)
    .select();
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
