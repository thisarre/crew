/**
 * Tests des helpers IA — exécutés en mode mock (pas de clé OPENAI).
 * Les fonctions doivent renvoyer des structures valides avec les mocks déterministes.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockSupabaseClient } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadAdminContext } from '@/lib/queries/admin';
import { proposeReplacement, rankReplacementCandidates } from '@/lib/ai/propose-replacement';
import { proposeTeam } from '@/lib/ai/propose-team';
import { draftMessage } from '@/lib/ai/message-draft';
import { suggestSpiritualContent } from '@/lib/ai/spiritual-suggest';
import { SERVICE_IDS, SLOT_IDS } from '@/data/admin-seed';
import { PROFILE_IDS, SKILL_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

beforeEach(() => {
  // S'assure qu'on est en mock mode
  delete process.env.OPENAI_API_KEY;
});

describe('ai helpers (mock mode)', () => {
  describe('rankReplacementCandidates', () => {
    it('classe les candidats pour le slot Diffusion du 23 juin, exclut Dave (cancelled) et apprentis', async () => {
      const ctx = await loadAdminContext(getClient());
      const ranked = rankReplacementCandidates({
        ctx,
        serviceId: SERVICE_IDS.june23,
        slotId: SLOT_IDS.s23_diffusion,
        cancelledProfileId: PROFILE_IDS.dave,
      });
      const names = ranked.map(r => r.name);
      expect(names).not.toContain('Dave');
      expect(names).not.toContain('Stéphanie'); // apprentie
      // Chrisciana est autonome diffusion → devrait être présente
      expect(names).toContain('Chrisciana');
    });
  });

  describe('proposeReplacement', () => {
    it('retourne best + proposal en mock mode', async () => {
      const ctx = await loadAdminContext(getClient());
      const result = await proposeReplacement({
        ctx,
        serviceId: SERVICE_IDS.june23,
        slotId: SLOT_IDS.s23_diffusion,
        cancelledProfileId: PROFILE_IDS.dave,
      });
      expect(result).not.toBeNull();
      expect(result!.best.name).toBeDefined();
      expect(result!.proposal.rationale).toMatch(/(diffusion|maîtrise)/i);
      expect(Array.isArray(result!.proposal.alternates)).toBe(true);
    });

    it('retourne null s\'il n\'y a aucun candidat valide', async () => {
      const ctx = await loadAdminContext(getClient());
      const result = await proposeReplacement({
        ctx,
        serviceId: SERVICE_IDS.june23,
        slotId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', // slot inexistant
      });
      expect(result).toBeNull();
    });
  });

  describe('proposeTeam', () => {
    it('génère une équipe pour 2 dimanches avec les 3 skills', async () => {
      const ctx = await loadAdminContext(getClient());
      const result = await proposeTeam({
        ctx,
        dates: ['2025-07-06', '2025-07-13'],
        skillIds: [SKILL_IDS.sono, SKILL_IDS.camera, SKILL_IDS.diffusion],
      });
      expect(result.teams.length).toBe(2);
      result.teams.forEach(team => {
        expect(team.assignments.length).toBeGreaterThanOrEqual(1);
        // Chaque assignment doit avoir une primary
        team.assignments.forEach(a => {
          expect(a.primary.name).toBeDefined();
          expect(a.skillName).toBeDefined();
        });
        expect(team.rationale).toBeDefined();
      });
    });
  });

  describe('draftMessage', () => {
    it('rédige un mot pour relancer le mois non validé', async () => {
      const draft = await draftMessage({
        kind: 'unvalidated_month',
        profileName: 'Stéphanie',
        context: { monthLabel: 'juin', daysSincePublish: 4 },
      });
      expect(draft.subject).toMatch(/Stéphanie/i);
      expect(draft.body.length).toBeGreaterThan(20);
      expect(draft.tone).toBe('warm');
    });

    it('rédige un mot pour un membre qui décroche', async () => {
      const draft = await draftMessage({
        kind: 'disengaging',
        profileName: 'Gloria',
        context: { weeksSilent: 3 },
      });
      expect(draft.body).toMatch(/Gloria/i);
      expect(draft.body).not.toMatch(/culpabilis/i); // ton chaleureux, pas culpabilisant
    });

    it('rédige un mot après une annulation', async () => {
      const draft = await draftMessage({
        kind: 'cancelled',
        profileName: 'Dave',
        context: { serviceDateLabel: '23 juin', slotLabel: 'Diffusion' },
      });
      expect(draft.body).toMatch(/Dave/i);
    });
  });

  describe('suggestSpiritualContent', () => {
    it('retourne un verset avec référence et réflexion', async () => {
      const suggestion = await suggestSpiritualContent();
      expect(suggestion.verseText.length).toBeGreaterThan(10);
      expect(suggestion.verseReference).toMatch(/\d/);
      expect(suggestion.shortReflection.length).toBeGreaterThan(10);
      expect(suggestion.suggestedTitle).toBeDefined();
    });

    it("s'aligne sur le thème quand fourni", async () => {
      const suggestion = await suggestSpiritualContent({ theme: "L'unité" });
      expect(suggestion.verseReference).toBe('Psaume 133:1');
    });
  });
});
