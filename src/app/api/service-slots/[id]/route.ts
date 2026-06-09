import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromRequest } from '@/lib/auth/session';
import { updateSlotPositionsRequired } from '@/lib/mutations/services';
import { createServiceClient } from '@/lib/supabase/server';

const Body = z.object({
  positionsRequired: z.number().int().min(1).max(20),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const result = await updateSlotPositionsRequired(supabase, context.params.id, payload.positionsRequired);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'slot_update_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
