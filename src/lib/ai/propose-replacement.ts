/**
 * Propose un remplaçant pour un slot annulé.
 *
 * Input : un contexte service + un slot ouvert (skill) + le profil de la personne qui a annulé
 * Output : la meilleure candidate + une justification chaleureuse en français
 *
 * Stratégie : on pré-sélectionne via algorithme rule-based (semaines sans servir, niveau ≥ autonome,
 * pas déjà sur le service, pas la personne qui a annulé), puis le LLM enrichit la justification et
 * peut suggérer 1-2 alternatives.
 */

import { chatCompleteJson, isAiMockMode } from './client';
import { mockReplacement } from './mock';
import type { AggregatedAdminData } from '@/lib/queries/admin';

export type ReplacementProposal = {
  rationale: string;
  alternates: { profileId: string; reason: string }[];
};

export type ReplacementInput = {
  ctx: AggregatedAdminData;
  serviceId: string;
  slotId: string;
  cancelledProfileId?: string;
  referenceDate?: Date;
};

export type RankedCandidate = {
  profileId: string;
  name: string;
  level: 'learning' | 'autonomous' | 'trainer';
  weeksSinceServed: number;
  futureLoad: number; // nombre de services à venir où ils sont déjà engagés
};

export const rankReplacementCandidates = (
  input: ReplacementInput,
): RankedCandidate[] => {
  const { ctx, serviceId, slotId, cancelledProfileId } = input;
  const now = input.referenceDate ?? new Date('2025-06-17T08:00:00Z');

  const slot = ctx.slots.find(s => s.id === slotId);
  if (!slot?.skill_id) return [];

  const presentAssignments = ctx.assignments.filter(a => a.service_id === serviceId && a.status === 'present');
  const occupied = new Set(presentAssignments.map(a => a.profile_id));
  const excludedFromCancel = new Set<string>();
  if (cancelledProfileId) excludedFromCancel.add(cancelledProfileId);

  const candidates = ctx.memberSkills.filter(
    ms =>
      ms.skill_id === slot.skill_id &&
      ms.level !== 'learning' &&
      ms.profile_id &&
      !occupied.has(ms.profile_id) &&
      !excludedFromCancel.has(ms.profile_id),
  );

  return candidates
    .map<RankedCandidate | null>(ms => {
      const profile = ctx.profiles.find(p => p.id === ms.profile_id);
      if (!profile || profile.role !== 'member') return null;
      const past = ctx.assignments
        .filter(a => a.profile_id === profile.id && a.status === 'present')
        .map(a => ctx.services.find(s => s.id === a.service_id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .map(s => new Date(s.service_date).getTime())
        .filter(t => t <= now.getTime())
        .sort((a, b) => b - a);
      const last = past[0];
      const weeksSinceServed = last ? Math.floor((now.getTime() - last) / (1000 * 60 * 60 * 24 * 7)) : 99;

      const futureLoad = ctx.assignments.filter(
        a =>
          a.profile_id === profile.id &&
          a.status === 'present' &&
          ctx.services.some(s => s.id === a.service_id && new Date(s.service_date).getTime() > now.getTime()),
      ).length;

      return { profileId: profile.id, name: profile.display_name, level: ms.level, weeksSinceServed, futureLoad };
    })
    .filter((c): c is RankedCandidate => Boolean(c))
    .sort((a, b) => {
      // priorité aux personnes qui n'ont pas servi depuis longtemps et qui ne sont pas surchargées
      if (a.weeksSinceServed !== b.weeksSinceServed) return b.weeksSinceServed - a.weeksSinceServed;
      return a.futureLoad - b.futureLoad;
    });
};

export async function proposeReplacement(input: ReplacementInput): Promise<{
  best: RankedCandidate;
  proposal: ReplacementProposal;
} | null> {
  const ranked = rankReplacementCandidates(input);
  if (ranked.length === 0) return null;
  const best = ranked[0];
  const slot = input.ctx.slots.find(s => s.id === input.slotId);
  const skill = input.ctx.skills.find(s => s.id === slot?.skill_id);
  const skillName = skill?.name ?? '';

  if (isAiMockMode()) {
    return { best, proposal: mockReplacement(best.name, skillName, best.weeksSinceServed) };
  }

  const cancelledProfile = input.cancelledProfileId
    ? input.ctx.profiles.find(p => p.id === input.cancelledProfileId)?.display_name
    : undefined;

  const proposal = await chatCompleteJson<ReplacementProposal>(
    [
      {
        role: 'system',
        content:
          'Tu es l\'assistant d\'un responsable d\'équipe média en église. Ton ton est chaleureux, simple, sans jargon, bienveillant. Tu réponds toujours en français.',
      },
      {
        role: 'user',
        content: [
          `Le service du ${new Date(
            input.ctx.services.find(s => s.id === input.serviceId)?.service_date ?? '',
          ).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a un poste ${skillName} à pourvoir.`,
          cancelledProfile ? `${cancelledProfile} a dû annuler.` : '',
          `Les candidats classés (1 = meilleur) :`,
          ...ranked.slice(0, 5).map(
            (c, idx) =>
              `${idx + 1}. ${c.name} — niveau ${c.level === 'trainer' ? 'formateur' : 'autonome'}, pas servi depuis ${c.weeksSinceServed} sem., ${c.futureLoad} engagement(s) à venir`,
          ),
          '',
          'Tâches :',
          `- Rédige une justification (2 phrases max) pour proposer ${best.name}. Mentionne sa compétence et qu'elle/il n'a pas servi récemment. Ton chaleureux.`,
          '- Si pertinent, liste 0 à 2 "alternates" (le 2ᵉ et 3ᵉ du classement) avec une courte raison chacun.',
          '',
          'Réponds uniquement en JSON avec ce schéma exact :',
          '{',
          '  "rationale": "string (2 phrases max, ton chaleureux, mentionne la compétence)",',
          '  "alternates": [ { "profileId": "string", "reason": "string (1 phrase)" } ]',
          '}',
          '',
          `IDs disponibles pour alternates : ${ranked
            .slice(1, 3)
            .map(c => `"${c.profileId}" (${c.name})`)
            .join(', ') || '(aucun)'}`,
        ].join('\n'),
      },
    ],
    { temperature: 0.6, maxTokens: 400 },
  );

  return { best, proposal };
}
