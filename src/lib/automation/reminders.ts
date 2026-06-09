/**
 * Automatisation 2 — relances automatiques (notifications push).
 *
 * (a) Mois non validé : rappelle aux membres assignés à un service publié de valider leur mois.
 * (b) Annulation → remplacement : notifie le meilleur candidat pour un créneau libéré (sans
 *     créer l'assignation — il est juste sollicité).
 *
 * Anti-spam via `automation_events` (voir dedupe.ts). Aucune ligne n'est écrite si la notif
 * n'a touché personne (attempted === 0), pour pouvoir relancer le membre quand il s'abonnera.
 */

import type { SupabaseServerClient } from '@/lib/supabase/server';
import {
  FRENCH_MONTHS,
  formatFrenchDate,
  getReferenceToday,
  loadAdminContext,
} from '@/lib/queries/admin';
import { isPushConfigured } from '@/lib/push/vapid';
import { notifyProfiles } from '@/lib/push/notify';
import { rankReplacementCandidates } from '@/lib/ai/propose-replacement';
import { detectCancelledNeedingReplacement, detectUnvalidatedMembers } from './detect';
import { canSend, recordSend } from './dedupe';

// Seuils (modifiables) :
const UNVALIDATED_THRESHOLD_DAYS = 3; // on attend 3 jours après publication avant de relancer
const UNVALIDATED_MAX_SENDS = 2; // au plus 2 rappels par mois et par membre
const UNVALIDATED_MIN_INTERVAL_DAYS = 7; // espacés d'au moins 7 jours

export type RemindersResult = {
  pushConfigured: boolean;
  unvalidatedNotified: number;
  replacementNotified: number;
  skipped: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

export async function runReminders(client: SupabaseServerClient): Promise<RemindersResult> {
  const result: RemindersResult = {
    pushConfigured: isPushConfigured(),
    unvalidatedNotified: 0,
    replacementNotified: 0,
    skipped: 0,
  };
  // Court-circuit : sans VAPID, ensureVapidConfigured() jetterait — on ne tente rien.
  if (!result.pushConfigured) return result;

  const now = getReferenceToday();
  const ctx = await loadAdminContext(client);

  // ---------- (a) Mois non validé ----------
  const monthRef = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
  const monthLabel = FRENCH_MONTHS[now.getUTCMonth()] ?? '';

  for (const { profile, daysSincePublish } of detectUnvalidatedMembers(ctx, now)) {
    if (daysSincePublish < UNVALIDATED_THRESHOLD_DAYS) {
      result.skipped += 1;
      continue;
    }
    const allowed = await canSend(client, {
      kind: 'unvalidated_reminder',
      subjectProfileId: profile.id,
      refId: monthRef,
      now,
      policy: { maxSends: UNVALIDATED_MAX_SENDS, minIntervalDays: UNVALIDATED_MIN_INTERVAL_DAYS },
    });
    if (!allowed) {
      result.skipped += 1;
      continue;
    }

    const notify = await notifyProfiles(client, [profile.id], {
      title: 'Validation en attente',
      body: `Pense à valider ton planning du mois de ${monthLabel} 🙏`,
      url: '/calendar/validate',
      tag: `unvalidated-${monthRef}`,
    });

    if (notify.attempted > 0) {
      await recordSend(client, {
        kind: 'unvalidated_reminder',
        subjectProfileId: profile.id,
        refId: monthRef,
        now,
        meta: { daysSincePublish },
      });
      result.unvalidatedNotified += 1;
    } else {
      result.skipped += 1;
    }
  }

  // ---------- (b) Annulation → remplacement ----------
  for (const need of detectCancelledNeedingReplacement(ctx, now)) {
    if (need.slotFilled || !need.slot) {
      result.skipped += 1;
      continue;
    }
    const ranked = rankReplacementCandidates({
      ctx,
      serviceId: need.service.id,
      slotId: need.slot.id,
      cancelledProfileId: need.cancelledProfile?.id,
      referenceDate: now,
    });
    const best = ranked[0];
    if (!best) {
      result.skipped += 1;
      continue;
    }

    const refId = `${need.slot.id}:${best.profileId}`;
    const allowed = await canSend(client, {
      kind: 'replacement_request',
      subjectProfileId: best.profileId,
      refId,
      now,
      policy: { maxSends: 1, minIntervalDays: 0 }, // un seul ping par (créneau, candidat)
    });
    if (!allowed) {
      result.skipped += 1;
      continue;
    }

    const skillName = need.skill?.name ?? 'un poste';
    const dateLabel = formatFrenchDate(need.service.service_date);
    const notify = await notifyProfiles(client, [best.profileId], {
      title: 'Besoin de toi 🙌',
      body: `Un poste ${skillName} se libère le ${dateLabel}. Peux-tu dépanner ?`,
      url: '/dashboard',
      tag: `replacement-${need.slot.id}`,
    });

    if (notify.attempted > 0) {
      await recordSend(client, {
        kind: 'replacement_request',
        subjectProfileId: best.profileId,
        refId,
        now,
        meta: { serviceId: need.service.id, slotId: need.slot.id, skill: skillName },
      });
      result.replacementNotified += 1;
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
