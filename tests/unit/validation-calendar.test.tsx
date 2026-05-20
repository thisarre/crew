import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ValidationCalendar } from '@/components/member/validation/calendar';
import type { ValidationCalendarDay } from '@/data/member-validation';

const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

describe('ValidationCalendar', () => {
  it('lets the member select an already answered day to reset it', () => {
    const onDaySelect = vi.fn();
    const days: ValidationCalendarDay[] = [
      { value: 1 },
      { value: 2, eventId: 'evt-2', type: 'sunday_service', status: 'confirmed' },
      { value: 3, eventId: 'evt-3', type: 'team_call', status: 'pending' },
    ];

    render(<ValidationCalendar weekdays={weekdays} days={days} onDaySelect={onDaySelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modifier le choix du 2' }));

    expect(onDaySelect).toHaveBeenCalledWith('evt-2');
  });

  it('does not make pending days selectable', () => {
    const days: ValidationCalendarDay[] = [
      { value: 2, eventId: 'evt-2', type: 'sunday_service', status: 'pending' },
    ];

    render(<ValidationCalendar weekdays={weekdays} days={days} onDaySelect={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Modifier le choix du 2' })).not.toBeInTheDocument();
  });
});
