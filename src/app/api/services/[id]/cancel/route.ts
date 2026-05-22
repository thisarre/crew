import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { cancelService, reactivateService } from '@/lib/mutations/services';
import { notifyProfiles } from '@/lib/push/notify';
import { formatFrenchDate } from '@/lib/queries/admin';
import { isPushConfigured } from '@/lib/push/vapid';

/**
 * Annule (ou réactive) un service entier. Réservé aux admins, disponible à tout moment.
 * Body optionnel : { action: 'cancel' | 'reactivate' } — défaut 'cancel'.
 */
export async function POST(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let action: 'cancel' | 'reactivate' = 'cancel';
  const body = await request.json().catch(() => null);
  if (body && body.action === 'reactivate') action = 'reactivate';

  try {
    const supabase = createClient();

    const { data: service, error: serviceErr } = await supabase
      .from('services')
      .select('id, service_date')
      .eq('id', context.params.id)
      .single();
    if (serviceErr || !service) {
      return NextResponse.json({ ok: false, error: 'service_not_found' }, { status: 404 });
    }

    if (action === 'reactivate') {
      await reactivateService(supabase, context.params.id);
      return NextResponse.json({ ok: true, status: 'draft' });
    }

    // On capture les personnes assignées AVANT l'annulation (sinon elles passent 'cancelled').
    const { data: assignments } = await supabase
      .from('assignments')
      .select('profile_id, status')
      .eq('service_id', context.params.id);
    const profileIds = Array.from(
      new Set(
        (assignments ?? [])
          .filter(a => a.status === 'present' && a.profile_id)
          .map(a => a.profile_id as string),
      ),
    );

    const result = await cancelService(supabase, context.params.id);

    let notified = 0;
    if (isPushConfigured() && profileIds.length > 0) {
      const dateLabel = formatFrenchDate(service.service_date);
      const r = await notifyProfiles(supabase, profileIds, {
        title: 'Service annulé',
        body: `Le service du ${dateLabel} a été annulé`,
        url: '/dashboard',
        tag: `service-cancel-${context.params.id}`,
      });
      notified = r.delivered;
    }

    return NextResponse.json({
      ok: true,
      status: 'cancelled',
      cancelledAssignments: result.cancelledAssignments,
      notified,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
