/**
 * Propose un verset + une courte réflexion pour publier comme "pensée hebdomadaire".
 *
 * Input optionnel : thème courant (issu du prochain service), historique des dernières publications
 *   (pour éviter de re-proposer le même verset)
 * Output : verseText + verseReference (au format "Livre Chapitre:Verset"), shortReflection
 *
 * Si la table bible_verses est peuplée, on peut aussi proposer le LLM d'aller piocher dedans via
 * une recherche full-text — pour l'instant on laisse le LLM répondre librement.
 */

import { chatCompleteJson, isAiMockMode } from './client';
import { mockSpiritualSuggestion } from './mock';

export type SpiritualSuggestionInput = {
  theme?: string | null;
  recentReferences?: string[]; // pour éviter répétitions
};

export type SpiritualSuggestionResult = {
  verseText: string;
  verseReference: string;
  shortReflection: string;
  suggestedTitle: string;
};

export async function suggestSpiritualContent(
  input: SpiritualSuggestionInput = {},
): Promise<SpiritualSuggestionResult> {
  if (isAiMockMode()) {
    return mockSpiritualSuggestion(input.theme);
  }

  return chatCompleteJson<SpiritualSuggestionResult>(
    [
      {
        role: 'system',
        content:
          'Tu accompagnes une équipe média en église. Tu proposes un verset biblique (Bible Segond 21 si possible) avec une courte réflexion en français.',
      },
      {
        role: 'user',
        content: [
          'Propose une "pensée de la semaine" : un verset court + une réflexion d\'une à deux phrases.',
          input.theme ? `Si tu peux, aligne-toi sur le thème : « ${input.theme} ».` : '',
          input.recentReferences && input.recentReferences.length > 0
            ? `Évite ces références déjà publiées récemment : ${input.recentReferences.join(', ')}.`
            : '',
          '',
          'Le verset doit être lisible (cite le texte tel quel), la référence au format "Livre Chapitre:Verset".',
          'La réflexion doit être chaleureuse, concrète, parler de service en équipe.',
          '',
          'Réponds en JSON :',
          '{',
          '  "verseText": "string (le verset complet, sans guillemets ajoutés)",',
          '  "verseReference": "string (ex: \\"1 Pierre 4:10\\")",',
          '  "shortReflection": "string (1-2 phrases)",',
          '  "suggestedTitle": "string (court, ex: \\"Pensée du dimanche\\")"',
          '}',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    { temperature: 0.8, maxTokens: 350 },
  );
}
