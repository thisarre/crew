import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { publishService } from '@/lib/mutations/services';
import { notifyServiceAssignees } from '@/lib/push/notify';
import { formatFrenchDate } from '@/lib/queries/admin';
import { isPushConfigured } from '@/lib/push/vapid';

export async function POST(_request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const supabase = createClient();

    // Fetch service pour construire la notif
    const { data: service, error: serviceErr } = await supabase
      .from('services')
      .select('id, service_date, start_time, location, spiritual_theme')
      .eq('id', context.params.id)
      .single();
    if (serviceErr || !service) {
      return NextResponse.json({ ok: false, error: 'service_not_found' }, { status: 404 });
    }

    const { publishedAt } = await publishService(supabase, context.params.id);

    let notification: { attempted: number; delivered: number; removed: number } | null = null;
    if (isPushConfigured()) {
      const dateLabel = formatFrenchDate(service.service_date);
      const startLabel = (service.start_time ?? '').slice(0, 5).replace(':', 'h');
      const result = await notifyServiceAssignees(supabase, context.params.id, {
        title: 'Nouveau service publié',
        body: `Tu sers ${dateLabel} · ${startLabel}${service.location ? ` · ${service.location}` : ''}`,
        url: '/dashboard',
        tag: `service-${context.params.id}`,
      });
      notification = {
        attempted: result.attempted,
        delivered: result.delivered,
        removed: result.removed,
      };
    }

    return NextResponse.json({ ok: true, publishedAt, notification });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
