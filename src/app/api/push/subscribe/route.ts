import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const SubscribeBody = z.object({
  profileId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

const UnsubscribeBody = z.object({
  endpoint: z.string().url(),
  profileId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof SubscribeBody>;
  try {
    payload = SubscribeBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    // upsert sur (profile_id, endpoint) — recreate la subscription si déjà connue
    const row = {
      profile_id: payload.profileId,
      endpoint: payload.endpoint,
      p256dh_key: payload.keys.p256dh,
      auth_key: payload.keys.auth,
      device_user_agent: payload.userAgent ?? null,
    };
    // upsert n'est pas implémenté dans le mock — fallback : delete puis insert (idempotent)
    await supabase.from('push_subscriptions').delete().eq('endpoint', payload.endpoint);
    const { error } = await supabase.from('push_subscriptions').insert(row);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let payload: z.infer<typeof UnsubscribeBody>;
  try {
    payload = UnsubscribeBody.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', payload.endpoint);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
