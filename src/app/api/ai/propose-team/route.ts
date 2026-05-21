import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { loadAdminContext } from '@/lib/queries/admin';
import { proposeTeam } from '@/lib/ai/propose-team';

const Body = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  skillIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const ctx = await loadAdminContext(supabase);
    const result = await proposeTeam({ ctx, ...payload });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
