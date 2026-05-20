import { describe, expect, it } from 'vitest';

import { getMemberValidationData } from '@/data/member-validation';
import { useValidationFlow } from '@/hooks/use-validation-flow';
import { renderHook, act } from '@testing-library/react';

describe('useValidationFlow', () => {
  const data = getMemberValidationData();

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
