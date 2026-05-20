import { useState, useMemo, useCallback } from 'react';

import type {
  MemberValidationData,
  ValidationEvent,
  ValidationStatus,
  ValidationCalendarDay,
} from '@/data/member-validation';

export type ValidationAction = {
  event: ValidationEvent;
  direction: 'left' | 'right';
  status: Extract<ValidationStatus, 'confirmed' | 'declined'>;
};

export type ValidationFlow = {
  events: ValidationEvent[];
  progress: { validatedCount: number; total: number };
  calendarDays: ValidationCalendarDay[];
  lastAction: ValidationAction | null;
  handleSwipe: (eventId: string, direction: 'left' | 'right') => void;
  handleBulkConfirm: () => void;
  resetEvent: (eventId: string) => void;
  clearLastAction: () => void;
  undoLastAction: () => void;
};

export const useValidationFlow = (initialData: MemberValidationData): ValidationFlow => {
  const [events, setEvents] = useState<ValidationEvent[]>(initialData.events);
  const [lastAction, setLastAction] = useState<ValidationAction | null>(null);

  const updateEventStatus = useCallback((eventId: string, status: ValidationStatus) => {
    setEvents(prev => prev.map(event => (event.id === eventId ? { ...event, status } : event)));
  }, []);

  const handleSwipe = useCallback(
    (eventId: string, direction: 'left' | 'right') => {
      const status = direction === 'right' ? 'confirmed' : 'declined';
      setEvents(prev =>
        prev.map(event => {
          if (event.id !== eventId) {
            return event;
          }
          setLastAction({ event, direction, status });
          return { ...event, status };
        }),
      );
    },
    [],
  );

  const handleBulkConfirm = useCallback(() => {
    setEvents(prev => prev.map(event => ({ ...event, status: 'confirmed' })));
  }, []);

  const resetEvent = useCallback(
    (eventId: string) => {
      updateEventStatus(eventId, 'pending');
    },
    [updateEventStatus],
  );

  const clearLastAction = useCallback(() => {
    setLastAction(null);
  }, []);

  const undoLastAction = useCallback(() => {
    setLastAction(action => {
      if (!action) {
        return null;
      }
      setEvents(prev =>
        prev.map(event => (event.id === action.event.id ? { ...action.event, status: 'pending' } : event)),
      );
      return null;
    });
  }, []);

  const progress = useMemo(() => {
    const validatedCount = events.filter(event => event.status !== 'pending').length;
    return { validatedCount, total: events.length };
  }, [events]);

  const calendarDays = useMemo<ValidationCalendarDay[]>(
    () =>
      initialData.calendar.map(day => {
        if (!day.eventId) {
          return day;
        }
        const event = events.find(evt => evt.id === day.eventId);
        if (!event) {
          return day;
        }
        return { ...day, status: event.status };
      }),
    [events, initialData.calendar],
  );

  return {
    events,
    progress,
    calendarDays,
    lastAction,
    handleSwipe,
    handleBulkConfirm,
    resetEvent,
    clearLastAction,
    undoLastAction,
  };
};
