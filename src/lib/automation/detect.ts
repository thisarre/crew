/**
 * Détecteurs purs partagés entre le dashboard admin et les relances automatiques.
 *
 * Extraits de `buildAdminDashboard` pour éviter la dérive de logique : le badge affiché
 * à l'admin et la relance envoyée par le cron reposent désormais sur la MÊME détection.
 *
 * Tout est pur (pas d'I/O) : on prend le contexte agrégé + une date de référence.
 */

import type {
  AggregatedAdminData,
  AssignmentRow,
  ProfileRow,
  ServiceRow,
  SkillRow,
  SlotRow,
} from '@/lib/queries/admin';

/** Une annulation future dont le poste reste potentiellement à pourvoir. */
export type CancelledReplacementNeed = {
  assignment: AssignmentRow;
  service: ServiceRow;
  slot: SlotRow | null;
  skill: SkillRow | null;
  cancelledProfile: ProfileRow | null;
  /** true si un autre membre `present` occupe déjà ce créneau (plus besoin de remplaçant). */
  slotFilled: boolean;
  /** nombre de membres éligibles (compétence OK, pas apprenti, ≠ la personne qui a annulé). */
  candidates: number;
};

/**
 * Annulations sur des services à venir. Le consommateur décide quoi faire de `slotFilled` :
 * le dashboard affiche toutes les annulations futures ; la relance ne cible que les créneaux non pourvus.
 */
export const detectCancelledNeedingReplacement = (
  ctx: AggregatedAdminData,
  now: Date,
): CancelledReplacementNeed[] => {
  const results: CancelledReplacementNeed[] = [];
  for (const assignment of ctx.assignments) {
    if (assignment.status !== 'cancelled') continue;
    const service = ctx.services.find(s => s.id === assignment.service_id);
    if (!service) continue;
    if (new Date(service.service_date).getTime() < now.getTime()) continue;

    const slot = ctx.slots.find(s => s.id === assignment.slot_id) ?? null;
    const skill = ctx.skills.find(s => s.id === slot?.skill_id) ?? null;
    const cancelledProfile = ctx.profiles.find(p => p.id === assignment.profile_id) ?? null;
    const slotFilled = slot
      ? ctx.assignments.some(a => a.slot_id === slot.id && a.status === 'present')
      : false;
    const candidates = ctx.memberSkills.filter(
      ms =>
        ms.skill_id === slot?.skill_id &&
        ms.level !== 'learning' &&
        ms.profile_id !== assignment.profile_id,
    ).length;

    results.push({ assignment, service, slot, skill, cancelledProfile, slotFilled, candidates });
  }
  return results;
};

/** Un membre assigné à un service publié qui n'a pas validé son mois. */
export type UnvalidatedMember = {
  profile: ProfileRow;
  /** ancienneté (en jours) depuis la publication la plus ancienne de SES services publiés. */
  daysSincePublish: number;
};

/**
 * Membres (actifs) assignés à au moins un service publié et qui n'ont pas validé le mois.
 * `daysSincePublish` est calculé par membre (depuis la publication la plus ancienne de ses
 * services publiés) — plus précis que l'ancien calcul global.
 */
export const detectUnvalidatedMembers = (
  ctx: AggregatedAdminData,
  now: Date,
): UnvalidatedMember[] => {
  const publishedServices = ctx.services.filter(
    s => s.status === 'published' || s.status === 'completed',
  );
  const results: UnvalidatedMember[] = [];

  for (const profile of ctx.profiles) {
    if (profile.role !== 'member' || !(profile.is_active ?? true)) continue;

    const myPublished = publishedServices.filter(s =>
      ctx.assignments.some(a => a.profile_id === profile.id && a.service_id === s.id),
    );
    if (myPublished.length === 0) continue;

    const validated = ctx.validations.some(v => v.profile_id === profile.id);
    if (validated) continue;

    const publishTimes = myPublished
      .map(s => (s.published_at ? new Date(s.published_at).getTime() : 0))
      .filter(t => t > 0);
    const oldest = publishTimes.length ? Math.min(...publishTimes) : 0;
    const daysSincePublish =
      oldest > 0 ? Math.floor((now.getTime() - oldest) / (1000 * 60 * 60 * 24)) : 0;

    results.push({ profile, daysSincePublish });
  }
  return results;
};
