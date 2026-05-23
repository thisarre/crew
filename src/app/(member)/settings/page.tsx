import { redirect } from 'next/navigation';

import { MemberSettings } from '@/components/member/member-settings';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = getSessionFromCookies();
  if (!session) redirect('/');
  const profileId = session.profileId;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, initials, avatar_color')
    .eq('id', profileId)
    .single();

  if (!profile) redirect('/');

  return (
    <MemberSettings
      profile={{
        id: profile.id,
        displayName: profile.display_name,
        initials: profile.initials,
        avatarColor: profile.avatar_color ?? '#96D8D0',
      }}
    />
  );
}
