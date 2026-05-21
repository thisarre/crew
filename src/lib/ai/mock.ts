/**
 * Fallback déterministe quand OPENAI_API_KEY est absent (dev local, tests).
 * Chaque mock reproduit le shape de retour attendu par le helper réel.
 */

import type { ReplacementProposal } from './propose-replacement';
import type { TeamProposalResult } from './propose-team';
import type { MessageDraftResult } from './message-draft';
import type { SpiritualSuggestionResult } from './spiritual-suggest';

export const mockReplacement = (candidateName: string, skillName: string, weeksSinceServed: number): ReplacementProposal => {
  const availability =
    weeksSinceServed <= 0
      ? 'reste disponible'
      : weeksSinceServed >= 50
        ? "n'a pas encore servi"
        : `n'a pas servi depuis ${weeksSinceServed} semaine${weeksSinceServed > 1 ? 's' : ''}`;
  return {
    rationale: `${candidateName} maîtrise ${skillName.toLowerCase()} et ${availability}. C'est l'occasion de la/le réinviter avec douceur.`,
    alternates: [],
  };
};

export const mockTeam = (teams: TeamProposalResult['teams']): TeamProposalResult => ({
  teams: teams.map(team => ({
    ...team,
    rationale: 'Équipe équilibrée : un autonome confirmé sur chaque poste, apprenti placé en binôme avec un formateur quand c\'est possible.',
  })),
});

export const mockMessageDraft = (kind: 'unvalidated_month' | 'disengaging' | 'cancelled', profileName: string): MessageDraftResult => {
  if (kind === 'unvalidated_month') {
    return {
      subject: `Salut ${profileName} 👋`,
      body: `Hello ${profileName}, juste un petit mot pour te rappeler que le planning de juin attend ta validation. Si quelque chose te bloque, dis-moi — on s'arrange. Bonne semaine !`,
      tone: 'warm',
    };
  }
  if (kind === 'disengaging') {
    return {
      subject: `Hey ${profileName}, on pense à toi`,
      body: `Hello ${profileName}, ça fait quelques semaines qu'on ne t'a pas vu sur les services. J'espère que tout va bien de ton côté. Si tu veux passer juste pour boire un café après le culte un dimanche, ça nous ferait plaisir.`,
      tone: 'warm',
    };
  }
  return {
    subject: `${profileName}, on a vu ton annulation`,
    body: `Pas de souci ${profileName}, ces choses arrivent. On va trouver quelqu'un pour te remplacer. Repose-toi bien et reviens en forme dimanche prochain si tu veux.`,
    tone: 'warm',
  };
};

export const mockSpiritualSuggestion = (theme?: string | null): SpiritualSuggestionResult => ({
  verseText: theme === "L'unité"
    ? "Voici, oh ! qu'il est agréable, qu'il est doux pour des frères de demeurer ensemble."
    : 'Que chacun mette au service des autres le don qu\'il a reçu.',
  verseReference: theme === "L'unité" ? 'Psaume 133:1' : '1 Pierre 4:10',
  shortReflection: theme
    ? `Une parole pour porter le thème « ${theme} » cette semaine : se rappeler que servir ensemble, c'est déjà témoigner.`
    : 'Une parole simple pour rappeler à l\'équipe que chaque don compte, du plus discret au plus visible.',
  suggestedTitle: theme ? `Pensée — ${theme}` : 'Pensée de la semaine',
});
