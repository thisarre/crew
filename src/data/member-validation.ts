import { PROFILE_IDS, PROFILES_SEED } from '@/data/seed';

export type ValidationStatus = 'pending' | 'confirmed' | 'declined';

export type ValidationEventType = 'sunday_service' | 'midweek_service' | 'team_call';

export type ValidationCalendarDay = {
  value?: number;
  type?: ValidationEventType;
  status?: ValidationStatus;
  eventId?: string;
};

export type ValidationEvent = {
  id: string;
  label: string;
  dateLabel: string;
  info: string;
  teammates: { initials: string; color: string; name: string }[];
  theme: string;
  type: ValidationEventType;
  calendarDay: number;
  status: ValidationStatus;
};

export type ValidationProgress = {
  validatedCount: number;
  total: number;
};

export type MemberValidationData = {
  profileName: string;
  monthLabel: string;
  weekdays: string[];
  calendar: ValidationCalendarDay[];
  events: ValidationEvent[];
  progress: ValidationProgress;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const DEFAULT_EVENTS: ValidationEvent[] = [];

const buildCalendarDays = (events: ValidationEvent[]): ValidationCalendarDay[] => {
  const placeholders: ValidationCalendarDay[] = [];
  const days: ValidationCalendarDay[] = [];
  for (let day = 1; day <= 30; day += 1) {
    const event = events.find(evt => evt.calendarDay === day);
    if (event) {
      days.push({
        value: day,
        type: event.type,
        status: event.status,
        eventId: event.id,
      });
    } else {
      days.push({ value: day });
    }
  }
  return [...placeholders, ...days];
};

export const getMemberValidationData = (profileId?: string): MemberValidationData => {
  const resolvedProfileId = profileId ?? PROFILE_IDS.isaac;
  const profileSeed = PROFILES_SEED.find(profile => profile.id === resolvedProfileId);
  const profileName = profileSeed?.display_name ?? 'Membre';

  const events = DEFAULT_EVENTS;

  return {
    profileName,
    monthLabel: 'Juin 2026',
    weekdays: WEEKDAYS,
    calendar: buildCalendarDays(events),
    events,
    progress: {
      validatedCount: events.filter(event => event.status === 'confirmed').length,
      total: events.length,
    },
  };
};
