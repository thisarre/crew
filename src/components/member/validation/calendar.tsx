'use client';

import React from 'react';

import type { ValidationCalendarDay } from '@/data/member-validation';

const typeStyles: Record<string, string> = {
  sunday_service: 'border-[var(--color-sage)] bg-[var(--color-sage)]/40',
  midweek_service: 'border-[var(--color-mint)] bg-[var(--color-mint)]/40',
  team_call: 'border-[var(--color-lilac)] bg-[var(--color-lilac)]/40',
};

const statusIndicator: Record<string, string> = {
  confirmed: 'bg-ink',
  declined: 'bg-[var(--color-error-fg)]',
  pending: 'bg-ink',
};

export type ValidationCalendarProps = {
  weekdays: string[];
  days: ValidationCalendarDay[];
  onDaySelect?: (eventId: string) => void;
};

export function ValidationCalendar({ weekdays, days, onDaySelect }: ValidationCalendarProps) {
  return (
    <div className="rounded-[22px] bg-white p-4">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day, index) => (
          <span key={`${day}-${index}`} className="text-[10px] font-semibold text-[var(--color-text-muted)]">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <CalendarCell key={`${day.value ?? 'empty'}-${index}`} day={day} onDaySelect={onDaySelect} />
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] italic text-[var(--color-text-muted)]">
        Pointillés = en attente de validation
      </p>
    </div>
  );
}

const CalendarCell = ({
  day,
  onDaySelect,
}: {
  day: ValidationCalendarDay;
  onDaySelect?: (eventId: string) => void;
}) => {
  if (!day.value) {
    return <div className="aspect-square" aria-hidden="true" />;
  }

  if (day.type) {
    const wrapperClass = typeStyles[day.type] ?? 'border-[var(--color-border)] bg-transparent';
    const indicatorClass = day.status ? statusIndicator[day.status] : 'bg-transparent';
    const canReset = Boolean(day.eventId && day.status && day.status !== 'pending' && onDaySelect);
    const content = (
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-semibold text-ink">{day.value}</span>
        <span className={`mt-1 h-1 w-1 rounded-full ${indicatorClass}`} />
      </div>
    );

    if (canReset && day.eventId) {
      return (
        <button
          type="button"
          aria-label={`Modifier le choix du ${day.value}`}
          className={`flex aspect-square items-center justify-center rounded-[10px] border-2 ${wrapperClass}`}
          onClick={() => onDaySelect?.(day.eventId!)}
        >
          {content}
        </button>
      );
    }

    return (
      <div className={`flex aspect-square items-center justify-center rounded-[10px] border-2 ${wrapperClass}`}>
        {content}
      </div>
    );
  }

  return (
    <div className="flex aspect-square items-center justify-center">
      <span className="text-[11px] text-[var(--color-text-secondary)]">{day.value}</span>
    </div>
  );
};
