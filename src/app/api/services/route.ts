import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createService } from '@/lib/mutations/services';

const AssignmentSchema = z.object({
  skillId: z.string().uuid(),
  profileId: z.string().uuid(),
  isTrainee: z.boolean().optional(),
});

const Body = z.object({
  eventType: z.enum(['sunday_service', 'midweek_service', 'team_call', 'special_event']),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  startTime: z.string().min(1).optional(),
  arrivalTime: z.string().optional(),
  location: z.string().optional(),
  spiritualTheme: z.string().optional(),
  slotSkillIds: z.array(z.string().uuid()),
  initialAssignmentsByDate: z.record(z.array(AssignmentSchema)).optional(),
});

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const created = await Promise.all(
      payload.dates.map(date =>
        createService(supabase, {
          eventType: payload.eventType,
          serviceDate: date,
          startTime: payload.startTime ?? '',
          arrivalTime: payload.arrivalTime,
          location: payload.location,
          spiritualTheme: payload.spiritualTheme,
          slotSkillIds: payload.slotSkillIds,
          initialAssignments: payload.initialAssignmentsByDate?.[date],
        }),
      ),
    );
    return NextResponse.json({ ok: true, services: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
