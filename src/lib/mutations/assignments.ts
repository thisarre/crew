import type { SupabaseServerClient } from '@/lib/supabase/server';

export type AssignSlotInput = {
  serviceId: string;
  slotId: string;
  profileId: string;
  isTrainee?: boolean;
};

export type AssignSlotResult = {
  assignmentId: string;
  alreadyAssigned: boolean;
};

export class SlotFullError extends Error {
  constructor() {
    super('slot_full');
    this.name = 'SlotFullError';
  }
}

/**
 * Assigne un membre à un slot — idempotent et sûr :
 *  - si ce membre est déjà 'present' sur ce slot, on renvoie l'assignation existante (pas de doublon)
 *  - si le slot a déjà atteint son nombre de postes requis (hors apprentis), on refuse (SlotFullError)
 *  - sinon on crée la nouvelle assignation 'present'
 *
 * Les assignations 'cancelled' antérieures sont ignorées (on ne les réactive pas).
 */
export async function assignToSlot(
  client: SupabaseServerClient,
  input: AssignSlotInput,
): Promise<AssignSlotResult> {
  // 1. Assignations existantes sur ce slot
  const { data: existing, error: fetchErr } = await client
    .from('assignments')
    .select('id, profile_id, status, is_trainee')
    .eq('slot_id', input.slotId);
  if (fetchErr) throw fetchErr;

  const rows = existing ?? [];

  // Déjà présent ? → idempotent
  const mine = rows.find(a => a.profile_id === input.profileId && a.status === 'present');
  if (mine) {
    return { assignmentId: mine.id, alreadyAssigned: true };
  }

  // Slot plein ? On compte les présents NON apprentis (le slot a positions_required titulaires)
  if (!input.isTrainee) {
    const { data: slot } = await client
      .from('service_slots')
      .select('positions_required')
      .eq('id', input.slotId)
      .maybeSingle();
    const required = slot?.positions_required ?? 1;
    const presentTitulars = rows.filter(a => a.status === 'present' && !a.is_trainee).length;
    if (presentTitulars >= required) {
      throw new SlotFullError();
    }
  }

  // 2. Insertion
  const { data, error } = await client
    .from('assignments')
    .insert({
      service_id: input.serviceId,
      slot_id: input.slotId,
      profile_id: input.profileId,
      status: 'present',
      is_trainee: input.isTrainee ?? false,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('assignment_insert_failed');
  return { assignmentId: data.id, alreadyAssigned: false };
}

export async function cancelAssignment(
  client: SupabaseServerClient,
  assignmentId: string,
  reason?: string,
): Promise<void> {
  const { error } = await client
    .from('assignments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason ?? null,
    })
    .eq('id', assignmentId);
  if (error) throw error;
}
