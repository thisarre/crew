import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { deriveInitials } from '@/lib/mutations/team';

const Body = z.object({
  display_name: z.string().min(1).max(60).optional(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function PATCH(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (!payload.display_name && !payload.avatar_color) {
    return NextResponse.json({ ok: false, error: 'nothing_to_update' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const updates: Record<string, string> = {};

    if (payload.display_name) {
      const name = payload.display_name.trim();
      updates.display_name = name;
      updates.initials = deriveInitials(name);
    }
    if (payload.avatar_color) {
      updates.avatar_color = payload.avatar_color;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.profileId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, updates });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
