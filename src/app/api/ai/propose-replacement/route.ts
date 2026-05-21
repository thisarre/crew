import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { loadAdminContext } from '@/lib/queries/admin';
import { proposeReplacement } from '@/lib/ai/propose-replacement';

const Body = z.object({
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  cancelledProfileId: z.string().uuid().optional(),
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
    const result = await proposeReplacement({ ctx, ...payload });
    if (!result) {
      return NextResponse.json({ ok: true, proposal: null });
    }
    return NextResponse.json({
      ok: true,
      best: result.best,
      proposal: result.proposal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
