import { NextResponse } from 'next/server';
import { z } from 'zod';

import { draftMessage } from '@/lib/ai/message-draft';

const Body = z.object({
  kind: z.enum(['unvalidated_month', 'disengaging', 'cancelled']),
  profileName: z.string().min(1),
  context: z
    .object({
      monthLabel: z.string().optional(),
      daysSincePublish: z.number().optional(),
      weeksSilent: z.number().optional(),
      serviceDateLabel: z.string().optional(),
      slotLabel: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const draft = await draftMessage(payload);
    return NextResponse.json({ ok: true, ...draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
