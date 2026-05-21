import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { assignToSlot, cancelAssignment, SlotFullError } from '@/lib/mutations/assignments';

const CreateBody = z.object({
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  profileId: z.string().uuid(),
  isTrainee: z.boolean().optional(),
});

const CancelBody = z.object({
  assignmentId: z.string().uuid(),
  reason: z.string().max(280).optional(),
});

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let payload: z.infer<typeof CreateBody>;
  try {
    payload = CreateBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const result = await assignToSlot(supabase, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof SlotFullError) {
      return NextResponse.json({ ok: false, error: 'Ce poste est déjà pourvu' }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  let payload: z.infer<typeof CancelBody>;
  try {
    payload = CancelBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    await cancelAssignment(supabase, payload.assignmentId, payload.reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
