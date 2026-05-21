'use client';

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { IconCalendar, IconClockPlay, IconHome } from '@tabler/icons-react';
import type { IconProps } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useMemo, type ComponentType } from 'react';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type BottomNavProps = {
  nextEventDate?: string | Date | null;
};

export type BottomNavItem = {
  id: 'home' | 'calendar' | 'service';
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
};

export function shouldShowServiceDayTab(nextEventDate?: string | Date | null, now: Date = new Date()) {
  if (!nextEventDate) {
    return false;
  }

  const eventDate = typeof nextEventDate === 'string' ? new Date(nextEventDate) : nextEventDate;
  if (Number.isNaN(eventDate?.getTime())) {
    return false;
  }

  const diff = eventDate.getTime() - now.getTime();
  return diff >= 0 && diff <= TWENTY_FOUR_HOURS_MS;
}

export function BottomNav({ nextEventDate }: BottomNavProps) {
  const pathname = usePathname() ?? '';

  // L'onglet Service Day est toujours accessible (la vue gère elle-même l'état "pas de service").
  // shouldShowServiceDayTab sert à mettre en avant l'onglet le jour J (point pulsant).
  const highlightServiceDay = shouldShowServiceDayTab(nextEventDate);

  const navItems = useMemo<BottomNavItem[]>(
    () => [
      { id: 'home', label: 'Accueil', href: '/dashboard', icon: IconHome },
      { id: 'calendar', label: 'Calendrier', href: '/calendar', icon: IconCalendar },
      { id: 'service', label: 'Service Day', href: '/service-day', icon: IconClockPlay },
    ],
    [],
  );

  const isActive = (href: string) => {
    const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
    const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-6">
        <div className="pointer-events-auto flex items-center justify-between rounded-[22px] border border-[var(--color-border-soft)] bg-white/95 px-4 py-3 shadow-[0_20px_40px_rgba(22,22,27,0.18)] backdrop-blur">
          {navItems.map(item => {
            const ActiveIcon = item.icon;
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
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                    />
                  )}
                  <ActiveIcon
                    size={20}
                    stroke={2}
                    className={`relative z-10 ${active ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
                  />
                  {item.id === 'service' && highlightServiceDay && !active && (
                    <span className="absolute right-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-[var(--color-sage)] ring-2 ring-white animate-pulse-dot" />
                  )}
                </div>
                <span className={`text-[11px] font-semibold tracking-[0.3px] ${active ? 'text-ink' : 'text-[var(--color-text-secondary)]'}`}>
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
