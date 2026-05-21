import { describe, expect, it } from 'vitest';

import { createMockSupabaseClient } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadMemberValidationData } from '@/lib/queries/member';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('loadMemberValidationData', () => {
  it("retourne les vraies assignments d'Isaac pour juin 2025 avec des UUIDs", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2025, month: 6 });

    expect(data.profileName).toBe('Isaac');
    expect(data.monthLabel).toBe('Juin 2025');
    expect(data.events.length).toBeGreaterThanOrEqual(3);
    // Tous les IDs doivent être des UUIDs (issus de la table assignments)
    data.events.forEach(e => {
      expect(UUID_RE.test(e.id)).toBe(true);
    });
    // Isaac sert sur le 22 juin (sono), 25 juin (midweek), et a servi avant (8 juin)
    const days = data.events.map(e => e.calendarDay).sort((a, b) => a - b);
    expect(days).toContain(22);
    expect(days).toContain(25);
  });

  it("liste les coéquipiers pour chaque event d'Isaac", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2025, month: 6 });
    const june22 = data.events.find(e => e.calendarDay === 22);
    expect(june22).toBeDefined();
    // Le 22 juin : Isaac (sono), Chana (caméra), Stéphanie (caméra trainee). Coéquipiers = Chana, Stéphanie.
    const teammateNames = june22!.teammates.map(t => t.name);
    expect(teammateNames).toContain('Chana');
    expect(teammateNames).toContain('Stéphanie');
    expect(teammateNames).not.toContain('Isaac');
  });

  it("marque les assignments annulées comme 'declined' au chargement", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.dave, { year: 2025, month: 6 });
    // Dave a 2 assignments cancelled (22 et 29 juin) + 1 present (8 juin)
    const cancelled = data.events.filter(e => e.status === 'declined');
    expect(cancelled.length).toBeGreaterThanOrEqual(1);
    const presentOrPending = data.events.filter(e => e.status === 'pending');
    expect(presentOrPending.length).toBeGreaterThanOrEqual(1);
  });

  it('produit un calendrier avec les placeholders en début et le bon nombre de jours', async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2025, month: 6 });
    // Juin 2025 a 30 jours, 1er juin = dimanche → 6 placeholders en début (L M M J V S avant le D=1)
    expect(data.calendar.length).toBe(30 + 6);
    // Le 22 juin (dimanche, Isaac sur sono) doit avoir un eventId
    const cell22 = data.calendar.find(c => c.value === 22);
    expect(cell22?.eventId).toBeDefined();
    expect(UUID_RE.test(cell22!.eventId!)).toBe(true);
  });

  it('retourne un set vide pour un membre sans engagement ce mois', async () => {
    const client = getClient();
    // Chrisciana n'a aucun engagement en juin dans le seed actuel (sauf le 15 où elle a servi)
    // Test avec un UUID inexistant pour être sûr d'avoir 0 events
    const data = await loadMemberValidationData(client, '00000000-0000-4000-8000-000000000099', {
      year: 2025,
      month: 6,
    });
    expect(data.events.length).toBe(0);
    expect(data.progress.total).toBe(0);
  });
});
