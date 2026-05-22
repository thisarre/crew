import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { deleteMember, setMemberActive } from '@/lib/mutations/team';

const Body = z.object({
  isActive: z.boolean(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    await setMemberActive(supabase, context.params.id, payload.isActive);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  // Un admin ne peut pas supprimer son propre compte (évite de se verrouiller dehors).
  if (session.profileId === context.params.id) {
    return NextResponse.json({ ok: false, error: 'cannot_delete_self' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    await deleteMember(supabase, context.params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    const clientErrors = new Set(['last_admin', 'profile_not_found', 'profile_id_required']);
    const status = clientErrors.has(message) ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
