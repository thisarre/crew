/**
 * Automatisation 1 — génération des services à venir.
 *
 * Maintient un horizon glissant de services (dimanches + service de semaine) à partir des
 * templates. Pour chaque service nouvellement créé, pré-remplit les créneaux via l'IA
 * (`proposeTeam`) mais LAISSE LE SERVICE EN BROUILLON : l'admin vérifie l'équipe et publie.
 *
 * Idempotent : un (date, type) déjà présent en base est ignoré.
 */

import { getReferenceToday, loadAdminContext } from '@/lib/queries/admin';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { createService } from '@/lib/mutations/services';
import { proposeTeam, type TeamProposalAssignment } from '@/lib/ai/propose-team';
import { SERVICE_TEMPLATES, HORIZON_WEEKS } from './templates';

const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd à partir des composantes UTC (cohérent avec la lecture getUTCDay ailleurs). */
const toYmdUTC = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Normalise un nom de compétence (sans accents, minuscules) pour un matching robuste. */
const normalizeSkill = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques combinants
    .toLowerCase()
    .trim();

/**
 * Énumère, en UTC, toutes les dates `yyyy-mm-dd` du jour J à J+`weeks` semaines qui tombent
 * sur `weekday` (0=dimanche … 6=samedi). Calcul en UTC pour éviter tout décalage de fuseau.
 */
export const enumerateDates = (now: Date, weeks: number, weekday: number): string[] => {
  const dayMs = 24 * 60 * 60 * 1000;
  const startMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endMs = startMs + weeks * 7 * dayMs;
  const dates: string[] = [];
  for (let ms = startMs; ms <= endMs; ms += dayMs) {
    const d = new Date(ms);
    if (d.getUTCDay() === weekday) dates.push(toYmdUTC(d));
  }
  return dates;
};

export type GenerateServicesResult = {
  created: number;
  skipped: number;
  assignmentsProposed: number;
  warnings: string[];
  details: { date: string; eventType: string; serviceId: string; slots: number; assignments: number }[];
};

export async function generateUpcomingServices(
  client: SupabaseServerClient,
): Promise<GenerateServicesResult> {
  const now = getReferenceToday();
  const ctx = await loadAdminContext(client);

  // nom normalisé -> skill_id (IDs réels de la base)
  const skillIdByName = new Map<string, string>();
  for (const skill of ctx.skills) skillIdByName.set(normalizeSkill(skill.name), skill.id);

  // (date, type) déjà existants -> idempotence
  const existing = new Set(ctx.services.map(s => `${s.service_date}|${s.event_type}`));

  const result: GenerateServicesResult = {
    created: 0,
    skipped: 0,
    assignmentsProposed: 0,
    warnings: [],
    details: [],
  };

  for (const tmpl of SERVICE_TEMPLATES) {
    // 1. Résoudre les compétences du template en skill_id
    const slotSkillIds: string[] = [];
    for (const name of tmpl.slotSkillNames) {
      const id = skillIdByName.get(normalizeSkill(name));
      if (id) slotSkillIds.push(id);
      else result.warnings.push(`Compétence "${name}" introuvable — créneau ignoré (${tmpl.eventType}).`);
    }

    // 2. Dates cibles non encore présentes
    const allDates = enumerateDates(now, HORIZON_WEEKS, tmpl.weekday);
    const newDates = allDates.filter(d => !existing.has(`${d}|${tmpl.eventType}`));
    result.skipped += allDates.length - newDates.length;
    if (newDates.length === 0) continue;

    // 3. Pré-assignation IA — un seul appel pour toutes les nouvelles dates du template
    const teamsByDate = new Map<string, TeamProposalAssignment[]>();
    if (slotSkillIds.length > 0) {
      const proposal = await proposeTeam({ ctx, dates: newDates, skillIds: slotSkillIds, referenceDate: now });
      for (const team of proposal.teams) teamsByDate.set(team.date, team.assignments);
    }

    // 4. Créer chaque service (statut 'draft' — createService ne publie jamais)
    for (const date of newDates) {
      const assignments = teamsByDate.get(date) ?? [];
      const initialAssignments: { skillId: string; profileId: string; isTrainee?: boolean }[] = [];
      for (const a of assignments) {
        const skillId = skillIdByName.get(normalizeSkill(a.skillName));
        if (!skillId) continue;
        initialAssignments.push({ skillId, profileId: a.primary.profileId, isTrainee: false });
        if (a.trainee) initialAssignments.push({ skillId, profileId: a.trainee.profileId, isTrainee: true });
      }

      const created = await createService(client, {
        eventType: tmpl.eventType,
        serviceDate: date,
        startTime: tmpl.startTime,
        arrivalTime: tmpl.arrivalTime,
        location: tmpl.location,
        slotSkillIds,
        initialAssignments,
      });

      result.created += 1;
      result.assignmentsProposed += created.assignmentIds.length;
      result.details.push({
        date,
        eventType: tmpl.eventType,
        serviceId: created.serviceId,
        slots: created.slotIds.length,
        assignments: created.assignmentIds.length,
      });
      existing.add(`${date}|${tmpl.eventType}`);
    }
  }

  return result;
}
