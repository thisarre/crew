import ProfilePicker from '@/components/auth/profile-picker';
import { PROFILES_SEED } from '@/data/seed';

const getMembers = () => {
  const profiles = PROFILES_SEED;
  const admin = profiles.find(profile => profile.role === 'admin');
  const members = profiles.filter(profile => profile.role !== 'admin');

  return {
    admin,
    members,
  };
};

export default function AuthHomePage() {
  const { admin, members } = getMembers();

  if (!admin) {
    throw new Error("Impossible de trouver le profil admin 'Alpha'");
  }

  return (
    <ProfilePicker
      admin={{
        id: admin.id!,
        displayName: admin.display_name,
        initials: admin.initials,
        avatarColor: admin.avatar_color,
      }}
      members={members.map(member => ({
        id: member.id!,
        displayName: member.display_name,
        initials: member.initials,
        avatarColor: member.avatar_color,
      }))}
    />
  );
}
