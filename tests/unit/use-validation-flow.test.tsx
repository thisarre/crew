import { describe, expect, it } from 'vitest';

import type { MemberValidationData } from '@/data/member-validation';
import { useValidationFlow } from '@/hooks/use-validation-flow';
import { renderHook, act } from '@testing-library/react';

describe('useValidationFlow', () => {
  const data: MemberValidationData = {
    profileName: 'Isaac',
    monthLabel: 'Juin 2026',
    weekdays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    calendar: [
      { value: 14, type: 'sunday_service', status: 'pending', eventId: 'evt-sunday-14' },
    ],
    events: [
      {
        id: 'evt-sunday-14',
        label: 'Culte dimanche',
        dateLabel: 'Dimanche 14 juin',
        info: 'Arrivée 13h30 · Sono · Salle principale',
        teammates: [],
        theme: 'Thème à définir',
        type: 'sunday_service',
        calendarDay: 14,
        status: 'pending',
      },
    ],
    progress: {
      validatedCount: 0,
      total: 1,
    },
  };

  it('increments validated count and calendar status when swiping right', () => {
    const { result } = renderHook(() => useValidationFlow(data));
    const eventId = data.events[0].id;

    act(() => {
      result.current.handleSwipe(eventId, 'right');
    });

    expect(result.current.progress.validatedCount).toBe(1);
    const calendarEntry = result.current.calendarDays.find(day => day.eventId === eventId);
    expect(calendarEntry?.status).toBe('confirmed');
  });

  it('increments validated count and calendar status when swiping left', () => {
    const { result } = renderHook(() => useValidationFlow(data));
    const eventId = data.events[0].id;

    act(() => {
      result.current.handleSwipe(eventId, 'left');
    });

    expect(result.current.progress.validatedCount).toBe(1);
    const calendarEntry = result.current.calendarDays.find(day => day.eventId === eventId);
    expect(calendarEntry?.status).toBe('declined');
  });

  it('undoes the latest swipe action', () => {
    const { result } = renderHook(() => useValidationFlow(data));
    const eventId = data.events[0].id;

    act(() => {
      result.current.handleSwipe(eventId, 'right');
    });

    act(() => {
      result.current.undoLastAction();
    });

    expect(result.current.progress.validatedCount).toBe(0);
    expect(result.current.lastAction).toBeNull();
    const calendarEntry = result.current.calendarDays.find(day => day.eventId === eventId);
    expect(calendarEntry?.status).toBe('pending');
  });

  it('resets a confirmed or declined event from the calendar', () => {
    const { result } = renderHook(() => useValidationFlow(data));
    const eventId = data.events[0].id;

    act(() => {
      result.current.handleSwipe(eventId, 'left');
    });

    act(() => {
      result.current.clearLastAction();
      result.current.resetEvent(eventId);
    });

    expect(result.current.progress.validatedCount).toBe(0);
    const calendarEntry = result.current.calendarDays.find(day => day.eventId === eventId);
    expect(calendarEntry?.status).toBe('pending');
  });

  it('bulk confirm updates all events', () => {
    const { result } = renderHook(() => useValidationFlow(data));

    act(() => {
      result.current.handleBulkConfirm();
    });

    expect(result.current.progress.validatedCount).toBe(data.events.length);
    result.current.calendarDays.forEach(day => {
      if (day.eventId) {
        expect(day.status).toBe('confirmed');
      }
    });
  });

});
