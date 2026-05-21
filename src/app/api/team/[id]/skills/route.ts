import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { removeMemberSkill, setMemberSkill } from '@/lib/mutations/team';

const SetBody = z.object({
  skillId: z.string().uuid(),
  level: z.enum(['learning', 'autonomous', 'trainer']),
});

const RemoveBody = z.object({
  skillId: z.string().uuid(),
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let payload: z.infer<typeof SetBody>;
  try {
    payload = SetBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const result = await setMemberSkill(supabase, { profileId: context.params.id, ...payload });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let payload: z.infer<typeof RemoveBody>;
  try {
    payload = RemoveBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    await removeMemberSkill(supabase, context.params.id, payload.skillId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
