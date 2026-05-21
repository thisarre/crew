/**
 * Propose une équipe complète pour un ou plusieurs services à créer.
 *
 * Input : contexte admin + liste de dates cibles + skills voulus
 * Output : pour chaque date, l'équipe assignée (sono/caméra/diffusion) + une rationale globale
 *
 * Stratégie : on pré-attribue via heuristique (round-robin sur les autonomes, pairage apprenti+autonome
 * quand possible), puis le LLM enrichit la rationale et peut ajuster.
 */

import { chatCompleteJson, isAiMockMode } from './client';
import { mockTeam } from './mock';
import type { AggregatedAdminData } from '@/lib/queries/admin';

export type TeamProposalAssignment = {
  skillName: string;
  primary: { profileId: string; name: string; level: 'learning' | 'autonomous' | 'trainer' };
  trainee?: { profileId: string; name: string };
};

export type TeamProposalEntry = {
  date: string; // ISO yyyy-mm-dd
  assignments: TeamProposalAssignment[];
  rationale?: string;
};

export type TeamProposalResult = {
  teams: TeamProposalEntry[];
};

export type TeamProposalInput = {
  ctx: AggregatedAdminData;
  dates: string[]; // ISO
  skillIds: string[]; // skill_id list
  referenceDate?: Date;
};

const heuristicPick = (
  input: TeamProposalInput,
): TeamProposalEntry[] => {
  const now = input.referenceDate ?? new Date('2025-06-17T08:00:00Z');
  const usageCount = new Map<string, number>();

  const skills = input.skillIds
    .map(id => input.ctx.skills.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return input.dates.map(date => {
    const assignments: TeamProposalAssignment[] = [];
    const usedThisDate = new Set<string>();

    for (const skill of skills) {
      const candidates = input.ctx.memberSkills
        .filter(ms => ms.skill_id === skill.id && ms.profile_id)
        .map(ms => {
          const profile = input.ctx.profiles.find(p => p.id === ms.profile_id);
          if (!profile || profile.role !== 'member' || !(profile.is_active ?? true)) return null;
          const lastServedTs = input.ctx.assignments
            .filter(a => a.profile_id === profile.id && a.status === 'present')
            .map(a => input.ctx.services.find(s => s.id === a.service_id))
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
            .map(s => new Date(s.service_date).getTime())
            .filter(t => t <= now.getTime())
            .sort((a, b) => b - a)[0];
          const weeksSinceServed = lastServedTs ? (now.getTime() - lastServedTs) / (1000 * 60 * 60 * 24 * 7) : 52;
          const usage = usageCount.get(profile.id) ?? 0;
          return { profile, level: ms.level, weeksSinceServed, usage };
        })
        .filter((c): c is NonNullable<typeof c> => Boolean(c) && !usedThisDate.has(c!.profile.id))
        .sort((a, b) => {
          if (a.usage !== b.usage) return a.usage - b.usage; // round-robin
          return b.weeksSinceServed - a.weeksSinceServed; // priorité aux moins sollicités récemment
        });

      const autonomous = candidates.find(c => c.level !== 'learning');
      if (!autonomous) continue;

      usedThisDate.add(autonomous.profile.id);
      usageCount.set(autonomous.profile.id, (usageCount.get(autonomous.profile.id) ?? 0) + 1);

      const learner = candidates.find(c => c.level === 'learning' && c.profile.id !== autonomous.profile.id);
      const entry: TeamProposalAssignment = {
        skillName: skill.name,
        primary: {
          profileId: autonomous.profile.id,
          name: autonomous.profile.display_name,
          level: autonomous.level,
        },
      };
      if (learner) {
        usedThisDate.add(learner.profile.id);
        usageCount.set(learner.profile.id, (usageCount.get(learner.profile.id) ?? 0) + 1);
        entry.trainee = { profileId: learner.profile.id, name: learner.profile.display_name };
      }
      assignments.push(entry);
    }

    return { date, assignments };
  });
};

export async function proposeTeam(input: TeamProposalInput): Promise<TeamProposalResult> {
  const heuristic = heuristicPick(input);

  if (isAiMockMode()) {
    return mockTeam(heuristic);
  }

  const teams = await chatCompleteJson<TeamProposalResult>(
    [
      {
        role: 'system',
        content:
          "Tu es l'assistant d'un responsable d'équipe média en église. Tu rédiges des justifications courtes, chaleureuses, en français.",
      },
      {
        role: 'user',
        content: [
          'Voici une proposition d\'équipe pour plusieurs services. Pour chaque date, rédige une rationale courte (1-2 phrases) qui explique le choix.',
          'Le ton doit être chaleureux et concret (mentionne les niveaux, les pairages apprenti-autonome, l\'équilibre).',
          '',
          'Données :',
          JSON.stringify(heuristic, null, 2),
          '',
          'Réponds en JSON :',
          '{ "teams": [ { "date": "yyyy-mm-dd", "assignments": [...inchangé...], "rationale": "string" } ] }',
          'Reprends exactement les mêmes assignments, ajoute juste la rationale par date.',
        ].join('\n'),
      },
    ],
    { temperature: 0.5, maxTokens: 800 },
  );

  return teams;
}
