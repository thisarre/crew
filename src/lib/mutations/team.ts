import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { ORG_ID } from '@/data/seed';

type SkillLevel = Database['public']['Tables']['member_skills']['Row']['level'];

const PALETTE = ['#96D8D0', '#D2B4F1', '#DAF4AA', '#16161B'];

/**
 * Dérive des initiales depuis un nom : "Jean Dupont" → "JD", "Chrisciana" → "Cs".
 */
export const deriveInitials = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const word = parts[0];
    return word.length >= 2 ? word[0].toUpperCase() + word[1].toLowerCase() : word[0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const pickColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

export type InviteMemberInput = {
  displayName: string;
  initials?: string;
  avatarColor?: string;
  role?: 'member' | 'admin';
  organizationId?: string;
};

export async function inviteMember(
  client: SupabaseServerClient,
  input: InviteMemberInput,
): Promise<{ profileId: string }> {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error('display_name_required');

  const initials = (input.initials?.trim() || deriveInitials(displayName)).slice(0, 3);
  const avatarColor = input.avatarColor ?? pickColor(displayName);

  const { data, error } = await client
    .from('profiles')
    .insert({
      organization_id: input.organizationId ?? ORG_ID,
      display_name: displayName,
      initials,
      avatar_color: avatarColor,
      role: input.role ?? 'member',
      is_active: true,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('profile_insert_failed');
  return { profileId: data.id };
}

export type SetSkillInput = {
  profileId: string;
  skillId: string;
  level: SkillLevel;
};

/**
 * Upsert d'une compétence membre : crée ou met à jour le niveau pour (profile, skill).
 */
export async function setMemberSkill(
  client: SupabaseServerClient,
  input: SetSkillInput,
): Promise<{ created: boolean }> {
  const existing = await client
    .from('member_skills')
    .select('id')
    .eq('profile_id', input.profileId)
    .eq('skill_id', input.skillId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await client
      .from('member_skills')
      .update({ level: input.level, updated_at: new Date().toISOString() })
      .eq('id', existing.data.id);
    if (error) throw error;
    return { created: false };
  }

  const { error } = await client.from('member_skills').insert({
    profile_id: input.profileId,
    skill_id: input.skillId,
    level: input.level,
  });
  if (error) throw error;
  return { created: true };
}

export async function removeMemberSkill(
  client: SupabaseServerClient,
  profileId: string,
  skillId: string,
): Promise<void> {
  const { error } = await client
    .from('member_skills')
    .delete()
    .eq('profile_id', profileId)
    .eq('skill_id', skillId);
  if (error) throw error;
}

export async function setMemberActive(
  client: SupabaseServerClient,
  profileId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await client.from('profiles').update({ is_active: isActive }).eq('id', profileId);
  if (error) throw error;
}

/**
 * Supprime définitivement un membre et toutes ses données liées.
 *
 * Le schéma n'a pas de `ON DELETE CASCADE` : on supprime donc explicitement les lignes
 * dépendantes (affectations, compétences, validations, abonnements push, dispos, appréciations)
 * avant le profil lui-même.
 *
 * Garde-fou : refuse de supprimer le dernier administrateur (sinon plus personne ne peut administrer).
 * La protection contre l'auto-suppression est gérée côté route API (qui connaît la session).
 */
export async function deleteMember(client: SupabaseServerClient, profileId: string): Promise<void> {
  if (!profileId) throw new Error('profile_id_required');

  // 1. Vérifie l'existence et applique le garde-fou "dernier admin".
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('profile_not_found');

  if (profile.role === 'admin') {
    const { data: admins, error: adminsError } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (adminsError) throw adminsError;
    if ((admins?.length ?? 0) <= 1) throw new Error('last_admin');
  }

  // 2. Détache les éventuels appairages pointant vers les affectations du membre
  //    (FK assignments.is_paired_with → assignments.id, sans cascade).
  const { data: ownAssignments, error: ownAssignmentsError } = await client
    .from('assignments')
    .select('id')
    .eq('profile_id', profileId);
  if (ownAssignmentsError) throw ownAssignmentsError;
  const ownAssignmentIds = (ownAssignments ?? []).map(a => a.id);
  if (ownAssignmentIds.length > 0) {
    const { error: unpairError } = await client
      .from('assignments')
      .update({ is_paired_with: null })
      .in('is_paired_with', ownAssignmentIds);
    if (unpairError) throw unpairError;
  }

  // 3. Supprime les lignes liées.
  {
    const { error } = await client.from('assignments').delete().eq('profile_id', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('member_skills').delete().eq('profile_id', profileId);
    if (error) throw error;
  }
  {
    // Le membre pouvait aussi être renseigné comme formateur d'autres compétences.
    const { error } = await client.from('member_skills').delete().eq('trained_by', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('monthly_validations').delete().eq('profile_id', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('push_subscriptions').delete().eq('profile_id', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('availabilities').delete().eq('profile_id', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('appreciations').delete().eq('from_profile_id', profileId);
    if (error) throw error;
  }
  {
    const { error } = await client.from('appreciations').delete().eq('to_profile_id', profileId);
    if (error) throw error;
  }

  // 4. Supprime enfin le profil.
  const { error: deleteError } = await client.from('profiles').delete().eq('id', profileId);
  if (deleteError) throw deleteError;
}
