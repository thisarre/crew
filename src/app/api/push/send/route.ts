import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { notifyProfiles, notifyServiceAssignees } from '@/lib/push/notify';

const PayloadSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  url: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
});

const Body = z.union([
  z.object({
    target: z.literal('profiles'),
    profileIds: z.array(z.string().uuid()).min(1),
    payload: PayloadSchema,
  }),
  z.object({
    target: z.literal('service'),
    serviceId: z.string().uuid(),
    payload: PayloadSchema,
  }),
]);

/**
 * Cible :
 *   - 'profiles' avec profileIds → envoie à un ou plusieurs membres
 *   - 'service'  avec serviceId  → envoie à tous les assignés présents de ce service
 *
 * TODO : ajouter une vraie auth admin (cookie / header de session) avant la prod.
 */
export async function POST(request: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    if (payload.target === 'profiles') {
      const result = await notifyProfiles(supabase, payload.profileIds, payload.payload);
      return NextResponse.json({ ok: true, ...result });
    }
    const result = await notifyServiceAssignees(supabase, payload.serviceId, payload.payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
