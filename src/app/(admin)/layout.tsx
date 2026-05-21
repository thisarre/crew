import type { ReactNode } from 'react';

import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pt-6 pb-[120px]">
      <main className="flex-1 pb-6">{children}</main>
      <AdminNav />
    </div>
  );
}
