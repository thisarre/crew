import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { cancelOwnAssignment } from '@/lib/mutations/member-cancel';

export async function POST(request: Request, context: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  try {
    const supabase = createClient();
    const result = await cancelOwnAssignment(supabase, context.params.id, session.profileId);
    if (!result.ok) {
      const status = result.error === 'forbidden' ? 403 : 404;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({
      ok: true,
      alreadyCancelled: result.alreadyCancelled,
      notifiedAdmins: result.notifiedAdmins,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
