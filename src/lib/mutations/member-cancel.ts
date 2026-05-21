import type { SupabaseServerClient } from '@/lib/supabase/server';
import { ORG_ID } from '@/data/seed';
import { cancelAssignment } from './assignments';
import { notifyProfiles } from '@/lib/push/notify';
import { isPushConfigured } from '@/lib/push/vapid';
import { formatFrenchDate } from '@/lib/queries/admin';

export type MemberCancelResult =
  | { ok: true; alreadyCancelled: boolean; serviceId: string | null; notifiedAdmins: number }
  | { ok: false; error: 'not_found' | 'forbidden' };

/**
 * Annule une assignation au nom du membre courant.
 * - Vérifie que l'assignation appartient bien au membre (sécurité).
 * - Idempotent si déjà annulée.
 * - Notifie les admins de l'organisation par push (si configuré).
 */
export async function cancelOwnAssignment(
  client: SupabaseServerClient,
  assignmentId: string,
  memberProfileId: string,
): Promise<MemberCancelResult> {
  const { data: assignment } = await client
    .from('assignments')
    .select('id, profile_id, service_id, status')
    .eq('id', assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: 'not_found' };
  if (assignment.profile_id !== memberProfileId) return { ok: false, error: 'forbidden' };

  if (assignment.status === 'cancelled') {
    return { ok: true, alreadyCancelled: true, serviceId: assignment.service_id, notifiedAdmins: 0 };
  }

  await cancelAssignment(client, assignmentId, 'Annulé par le membre');

  let notifiedAdmins = 0;
  if (isPushConfigured()) {
    // Infos pour le message
    const [{ data: member }, { data: service }, { data: admins }] = await Promise.all([
      client.from('profiles').select('display_name').eq('id', memberProfileId).maybeSingle(),
      assignment.service_id
        ? client.from('services').select('service_date').eq('id', assignment.service_id).maybeSingle()
        : Promise.resolve({ data: null }),
      client.from('profiles').select('id').eq('organization_id', ORG_ID).eq('role', 'admin'),
    ]);

    const adminIds = (admins ?? []).map(a => a.id);
    const memberName = member?.display_name ?? 'Un membre';
    const dateLabel = service?.service_date ? formatFrenchDate(service.service_date) : 'un service';

    if (adminIds.length > 0) {
      const result = await notifyProfiles(client, adminIds, {
        title: 'Annulation',
        body: `${memberName} ne peut plus assurer ${dateLabel}`,
        url: assignment.service_id ? `/admin/services/${assignment.service_id}` : '/admin',
        tag: `cancel-${assignmentId}`,
      });
      notifiedAdmins = result.delivered;
    }
  }

  return { ok: true, alreadyCancelled: false, serviceId: assignment.service_id, notifiedAdmins };
}
