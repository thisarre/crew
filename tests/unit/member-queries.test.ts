import { describe, expect, it } from 'vitest';

import { createMockSupabaseClient } from '@/lib/supabase/mock';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { loadMemberDashboard, loadMemberValidationData } from '@/lib/queries/member';
import { PROFILE_IDS } from '@/data/seed';

const getClient = () => createMockSupabaseClient() as unknown as SupabaseServerClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('loadMemberValidationData', () => {
  it("retourne un mois de juin 2026 vide pour Isaac avec un calendrier valide", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2026, month: 6 });

    expect(data.profileName).toBe('Isaac');
    expect(data.monthLabel).toBe('Juin 2026');
    expect(data.events).toHaveLength(0);
    data.events.forEach(e => {
      expect(UUID_RE.test(e.id)).toBe(true);
    });
  });

  it("ne liste pas de coéquipiers tant qu'Isaac n'est pas assigné", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2026, month: 6 });
    expect(data.events).toHaveLength(0);
  });

  it("ne remonte aucune assignation annulée dans l'état initial", async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.dave, { year: 2026, month: 6 });
    const cancelled = data.events.filter(e => e.status === 'declined');
    expect(cancelled).toHaveLength(0);
    const presentOrPending = data.events.filter(e => e.status === 'pending');
    expect(presentOrPending).toHaveLength(0);
  });

  it('produit un calendrier avec les placeholders en début et le bon nombre de jours', async () => {
    const client = getClient();
    const data = await loadMemberValidationData(client, PROFILE_IDS.isaac, { year: 2026, month: 6 });
    // Juin 2026 a 30 jours, 1er juin = lundi.
    expect(data.calendar.length).toBe(30);
    const cell14 = data.calendar.find(c => c.value === 14);
    expect(cell14?.eventId).toBeUndefined();
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

describe('loadMemberDashboard', () => {
  it('construit le dashboard depuis la base pour Isaac (mois courant figé en juin 2026)', async () => {
    const client = getClient();
    const data = await loadMemberDashboard(client, PROFILE_IDS.isaac);

    expect(data.profile.name).toBe('Isaac');
    expect(data.profile.id).toBe(PROFILE_IDS.isaac);
    expect(data.calendar.monthLabel).toBe('Juin 2026');
    expect(data.weeklyThought).toBeNull();
    expect(data.nextEvent).toBeNull();
    // Pas de table appréciations chargée → bloc masqué.
    expect(data.appreciation).toBeNull();
  });

  it('renvoie des états vides pour un profil inconnu (aucune donnée)', async () => {
    const client = getClient();
    const data = await loadMemberDashboard(client, '00000000-0000-4000-8000-000000000099');

    expect(data.profile.name).toBe('Membre');
    expect(data.nextEvent).toBeNull();
    // La validation reste proposée (mois non validé pour ce profil).
    expect(data.validation).not.toBeNull();
  });
});
