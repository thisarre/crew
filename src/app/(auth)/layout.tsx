import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-5 pt-6 pb-8">
      <div className="mx-auto w-full max-w-[430px]">
        {children}
      </div>
    </div>
  );
}
