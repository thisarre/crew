import type { ReactNode } from 'react';

import { BottomNav } from '@/components/member/bottom-nav';
import { getMockNextEventDate } from '@/data/member-dashboard';

export default function MemberLayout({ children }: { children: ReactNode }) {
  const nextEventDate = getMockNextEventDate();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pt-6 pb-[120px]">
      <main className="flex-1 pb-6">{children}</main>
      <BottomNav nextEventDate={nextEventDate} />
    </div>
  );
}
