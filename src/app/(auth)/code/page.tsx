import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { fetchProfileById } from '@/lib/queries/admin';
import { CodePad } from '@/components/auth/code-pad';

export const dynamic = 'force-dynamic';

declare type SearchParams = {
  profile_id?: string;
  is_admin?: string;
};

export default async function CodePage({ searchParams }: { searchParams: SearchParams }) {
  const profileId = searchParams.profile_id;
  const isAdmin = searchParams.is_admin === 'true';

  if (!profileId) {
    return notFound();
  }

  const profile = await fetchProfileById(createClient(), profileId);

  if (!profile) {
    return notFound();
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <CodePad
        profile={{
          id: profile.id,
          displayName: profile.display_name,
          initials: profile.initials,
          avatarColor: profile.avatar_color,
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
