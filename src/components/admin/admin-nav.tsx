'use client';

import React, { useMemo, type ComponentType } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconCalendar, IconLayoutGrid, IconSparkles, IconUsers } from '@tabler/icons-react';
import type { IconProps } from '@tabler/icons-react';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

type AdminNavItem = {
  id: 'home' | 'services' | 'team' | 'spiritual';
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
};

export function AdminNav() {
  const pathname = usePathname() ?? '';

  const navItems = useMemo<AdminNavItem[]>(
    () => [
      { id: 'home', label: 'Console', href: '/admin', icon: IconLayoutGrid },
      { id: 'services', label: 'Services', href: '/admin/services', icon: IconCalendar },
      { id: 'team', label: 'Équipe', href: '/admin/team', icon: IconUsers },
      { id: 'spiritual', label: 'Spirituel', href: '/admin/spiritual', icon: IconSparkles },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-6">
        <div className="pointer-events-auto flex items-center justify-between rounded-[22px] border border-[var(--color-border-soft)] bg-white/95 px-4 py-3 shadow-[0_20px_40px_rgba(22,22,27,0.18)] backdrop-blur">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href as Route}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1"
              >
                <div className="relative flex h-11 w-11 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                    />
                  )}
                  <Icon
                    size={20}
                    stroke={2}
                    className={`relative z-10 ${active ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold tracking-[0.3px] ${active ? 'text-ink' : 'text-[var(--color-text-secondary)]'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
