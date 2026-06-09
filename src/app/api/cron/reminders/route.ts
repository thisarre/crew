import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { assertCronAuthorized } from '@/lib/auth/cron';
import { runReminders } from '@/lib/automation/reminders';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    assertCronAuthorized(request);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 401;
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status });
  }

  try {
    const supabase = createClient();
    const result = await runReminders(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
