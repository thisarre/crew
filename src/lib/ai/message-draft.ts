/**
 * Rédige automatiquement un message court pour les alertes admin du dashboard.
 *
 * Trois variantes :
 * - unvalidated_month → relance bienveillante pour valider le mois
 * - disengaging → prise de nouvelles d'un membre qui décroche
 * - cancelled → mot de soutien après une annulation
 *
 * Ton : chaleureux, simple, court (3-5 phrases max). Tutoiement.
 */

import { chatCompleteJson, isAiMockMode } from './client';
import { mockMessageDraft } from './mock';

export type MessageDraftKind = 'unvalidated_month' | 'disengaging' | 'cancelled';

export type MessageDraftInput = {
  kind: MessageDraftKind;
  profileName: string;
  context?: {
    monthLabel?: string;
    daysSincePublish?: number;
    weeksSilent?: number;
    serviceDateLabel?: string;
    slotLabel?: string;
  };
};

export type MessageDraftResult = {
  subject: string;
  body: string;
  tone: 'warm' | 'firm' | 'casual';
};

const promptFor = (input: MessageDraftInput): string => {
  const lines: string[] = [
    'Tu es l\'assistant d\'un responsable d\'équipe média en église. Tu rédiges des mots courts (3-5 phrases max), en français, ton chaleureux et bienveillant, tutoiement, sans jargon.',
    `Prénom du destinataire : ${input.profileName}`,
    '',
  ];
  if (input.kind === 'unvalidated_month') {
    lines.push(
      `Contexte : ${input.profileName} a des engagements sur le planning de ${input.context?.monthLabel ?? 'ce mois'}-ci mais n'a pas encore validé.`,
      `Le planning a été publié il y a ${input.context?.daysSincePublish ?? 'quelques'} jours.`,
      'Objectif : relancer en douceur, lui rappeler de valider, et lui ouvrir la porte si quelque chose la/le bloque.',
    );
  } else if (input.kind === 'disengaging') {
    lines.push(
      `Contexte : ${input.profileName} n'a pas servi depuis ${input.context?.weeksSilent ?? 3} semaines.`,
      'Objectif : prendre des nouvelles SANS pression, sans culpabilisation, juste montrer qu\'on pense à elle/lui. Proposer un café ou un moment informel.',
    );
  } else {
    lines.push(
      `Contexte : ${input.profileName} vient d'annuler son service du ${input.context?.serviceDateLabel ?? ''} sur le poste ${input.context?.slotLabel ?? ''}.`,
      'Objectif : reconnaître l\'annulation, rassurer (on va trouver quelqu\'un), souhaiter du bon pour la situation.',
    );
  }
  lines.push(
    '',
    'Format de sortie JSON :',
    '{ "subject": "string court (max 50 caractères)", "body": "string (3-5 phrases)", "tone": "warm" }',
  );
  return lines.join('\n');
};

export async function draftMessage(input: MessageDraftInput): Promise<MessageDraftResult> {
  if (isAiMockMode()) {
    return mockMessageDraft(input.kind, input.profileName);
  }

  return chatCompleteJson<MessageDraftResult>(
    [
      { role: 'system', content: 'Tu rédiges des messages courts en français pour une équipe d\'église, ton chaleureux.' },
      { role: 'user', content: promptFor(input) },
    ],
    { temperature: 0.7, maxTokens: 350 },
  );
}
