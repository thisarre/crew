import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { BottomNav } from '@/components/member/bottom-nav';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getNextMemberAssignment } from '@/lib/queries/member';

export const dynamic = 'force-dynamic';

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const session = getSessionFromCookies();
  if (!session) redirect('/');
  const profileId = session.profileId;

  // Date du prochain service du membre — sert à mettre en avant l'onglet "Service Day" le jour J.
  let nextEventDate: string | null = null;
  try {
    const next = await getNextMemberAssignment(createClient(), profileId);
    nextEventDate = next?.date ?? null;
  } catch {
    nextEventDate = null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pt-6 pb-[120px]">
      <main className="flex-1 pb-6">{children}</main>
      <BottomNav nextEventDate={nextEventDate} />
    </div>
  );
}
