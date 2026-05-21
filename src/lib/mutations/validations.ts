import type { SupabaseServerClient } from '@/lib/supabase/server';
import { ORG_ID } from '@/data/seed';

export type SaveValidationInput = {
  profileId: string;
  year: number;
  month: number;
  organizationId?: string;
};

/**
 * Idempotent : si la validation existe déjà pour (profile, year, month), on no-op.
 */
export async function saveMonthlyValidation(
  client: SupabaseServerClient,
  input: SaveValidationInput,
): Promise<{ created: boolean; id: string | null }> {
  const orgId = input.organizationId ?? ORG_ID;

  // Vérifie si la validation existe déjà
  const existing = await client
    .from('monthly_validations')
    .select('id')
    .eq('profile_id', input.profileId)
    .eq('year', input.year)
    .eq('month', input.month)
    .maybeSingle();

  if (existing.data) {
    return { created: false, id: existing.data.id };
  }

  const { data, error } = await client
    .from('monthly_validations')
    .insert({
      profile_id: input.profileId,
      organization_id: orgId,
      year: input.year,
      month: input.month,
      validated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { created: true, id: data?.id ?? null };
}

/**
 * Annulation d'une assignation par le membre (depuis le swipe "non" sur le calendrier).
 */
export async function cancelAssignmentByMember(
  client: SupabaseServerClient,
  assignmentId: string,
  reason?: string,
): Promise<void> {
  const { error } = await client
    .from('assignments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason ?? 'Annulé depuis le calendrier',
    })
    .eq('id', assignmentId);
  if (error) throw error;
}
