import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { cancelAssignmentByMember, saveMonthlyValidation } from '@/lib/mutations/validations';

const Body = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  declinedAssignmentIds: z.array(z.string().uuid()).optional(),
});

/**
 * Valide le mois pour le membre courant (cookie session).
 * Optionnellement, annule les assignations refusées (swipe left dans le calendrier).
 */
export async function POST(request: Request) {
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

  try {
    const supabase = createClient();

    // 1. Annuler les assignations refusées
    if (payload.declinedAssignmentIds && payload.declinedAssignmentIds.length > 0) {
      await Promise.all(
        payload.declinedAssignmentIds.map(id =>
          cancelAssignmentByMember(supabase, id, 'Refusé lors de la validation mensuelle'),
        ),
      );
    }

    // 2. Enregistrer la validation
    const result = await saveMonthlyValidation(supabase, {
      profileId: session.profileId,
      year: payload.year,
      month: payload.month,
    });

    return NextResponse.json({ ok: true, ...result, declinedCount: payload.declinedAssignmentIds?.length ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
