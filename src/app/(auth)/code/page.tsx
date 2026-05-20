import { notFound } from 'next/navigation';

declare type SearchParams = {
  profile_id?: string;
  is_admin?: string;
};

import { PROFILES_SEED } from '@/data/seed';
import { CodePad } from '@/components/auth/code-pad';

export default function CodePage({ searchParams }: { searchParams: SearchParams }) {
  const profileId = searchParams.profile_id;
  const isAdmin = searchParams.is_admin === 'true';

  if (!profileId) {
    return notFound();
  }

  const profile = PROFILES_SEED.find(item => item.id === profileId);

  if (!profile) {
    return notFound();
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <CodePad
        profile={{
          id: profile.id!,
          displayName: profile.display_name,
          initials: profile.initials,
          avatarColor: profile.avatar_color,
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
