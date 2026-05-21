'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { motion } from 'framer-motion';
import { IconAlertCircle, IconChevronRight, IconCircleCheck, IconPlus } from '@tabler/icons-react';

import type { ServiceListItem } from '@/lib/queries/admin';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};

const STATUS_FILTERS = ['Tous', 'À publier', 'Publiés', 'Passés'] as const;
type Filter = (typeof STATUS_FILTERS)[number];

const matchFilter = (service: ServiceListItem, filter: Filter, today: Date) => {
  if (filter === 'Tous') return true;
  const inPast = new Date(service.date).getTime() < today.getTime();
  if (filter === 'À publier') return service.status === 'draft';
  if (filter === 'Publiés') return service.status === 'published' && !inPast;
  if (filter === 'Passés') return service.status === 'completed' || inPast;
  return true;
};

const TODAY = new Date('2025-06-17');

const statusBadge = (service: ServiceListItem) => {
  if (service.status === 'draft') return { text: 'Brouillon', cls: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]' };
  if (service.status === 'completed') return { text: 'Terminé', cls: 'bg-[var(--color-border-soft)] text-[var(--color-text-secondary)]' };
  if (service.status === 'cancelled') return { text: 'Annulé', cls: 'bg-[var(--color-error-bg)] text-[var(--color-error-fg)]' };
  if (service.hasAlert) return { text: 'À pourvoir', cls: 'bg-[var(--color-error-bg)] text-[var(--color-error-fg)]' };
  return { text: 'Publié', cls: 'bg-[var(--color-sage)] text-ink' };
};

const eventTypeLabel = (type: ServiceListItem['eventType']) => {
  if (type === 'midweek_service') return 'Semaine';
  if (type === 'team_call') return 'Call équipe';
  return 'Dimanche';
};

export function ServicesList({ services }: { services: ServiceListItem[] }) {
  const [filter, setFilter] = useState<Filter>('Tous');
  const filtered = useMemo(() => services.filter(s => matchFilter(s, filter, TODAY)), [services, filter]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 pb-6">
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Console admin
          </p>
          <p className="mt-1 text-[24px] font-bold tracking-[-0.4px] text-ink">Services</p>
        </div>
        <Link
          href={'/admin/services/new' as Route}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition active:scale-95"
        >
          <IconPlus size={14} stroke={2.5} />
          Créer
        </Link>
      </motion.header>

      <motion.section variants={fadeUp} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
              f === filter
                ? 'bg-ink text-white'
                : 'border border-[var(--color-border)] bg-white text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </motion.section>

      <motion.section variants={containerVariants} className="space-y-2.5">
        {filtered.map(service => {
          const badge = statusBadge(service);
          return (
            <motion.div key={service.id} variants={fadeUp}>
              <Link
                href={`/admin/services/${service.id}` as Route}
                className="block rounded-[22px] bg-white px-4 py-4 transition active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-bg)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[var(--color-text-secondary)]">
                      {new Date(service.date).toLocaleDateString('fr-FR', { month: 'short' }).slice(0, 3)}
                    </p>
                    <p className="text-[20px] font-bold leading-none text-ink">
                      {new Date(service.date).getUTCDate()}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-ink">{eventTypeLabel(service.eventType)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3px] ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                      {service.countdownLabel}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                      {service.hasAlert ? (
                        <IconAlertCircle size={13} stroke={2} className="text-[var(--color-error-fg)]" />
                      ) : (
                        <IconCircleCheck size={13} stroke={2} className="text-ink" />
                      )}
                      <span className="text-ink">
                        {service.filledCount}/{service.totalSlots} postes pourvus
                      </span>
                    </div>
                  </div>
                  <IconChevronRight size={18} stroke={2} className="mt-1 text-[var(--color-text-secondary)]" />
                </div>
              </Link>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-[22px] bg-white p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
            Aucun service ne correspond à ce filtre.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}
