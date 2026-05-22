import ProfilePicker, { type PickerProfile } from '@/components/auth/profile-picker';
import { PROFILES_SEED } from '@/data/seed';
import { createClient } from '@/lib/supabase/server';
import { fetchProfiles } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

type PickerEntry = PickerProfile & { role: string | null };

const fromSeed = (): PickerEntry[] =>
  PROFILES_SEED.map(p => ({
    id: p.id!,
    displayName: p.display_name,
    initials: p.initials,
    avatarColor: p.avatar_color,
    role: p.role ?? 'member',
  }));

const loadPickerProfiles = async (): Promise<PickerEntry[]> => {
  try {
    const rows = await fetchProfiles(createClient());
    const active = rows.filter(r => r.is_active ?? true);
    if (active.length === 0) return fromSeed();
    return active.map(r => ({
      id: r.id,
      displayName: r.display_name,
      initials: r.initials,
      avatarColor: r.avatar_color,
      role: r.role,
    }));
  } catch {
    // Base injoignable : on retombe sur les profils de référence pour ne pas casser l'écran de connexion.
    return fromSeed();
  }
};

export default async function HomePage() {
  const profiles = await loadPickerProfiles();
  const admin = profiles.find(profile => profile.role === 'admin');
  const members = profiles.filter(profile => profile.role !== 'admin');

  if (!admin) {
    throw new Error("Impossible de trouver le profil admin");
  }

  return (
    <ProfilePicker
      admin={{
        id: admin.id,
        displayName: admin.displayName,
        initials: admin.initials,
        avatarColor: admin.avatarColor,
      }}
      members={members.map(member => ({
        id: member.id,
        displayName: member.displayName,
        initials: member.initials,
        avatarColor: member.avatarColor,
      }))}
    />
  );
}
