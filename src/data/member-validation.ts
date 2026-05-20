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

const DEFAULT_EVENTS: ValidationEvent[] = [
  {
    id: 'evt-sunday-2',
    label: 'Culte dimanche',
    dateLabel: 'Dimanche 2 juin',
    info: 'Arrivée 13h30 · Sono · Salle principale',
    teammates: [
      { initials: 'C', color: '#96D8D0', name: 'Chana' },
      { initials: 'D', color: '#D2B4F1', name: 'Dave' },
    ],
    theme: 'Thème : la fidélité',
    type: 'sunday_service',
    calendarDay: 2,
    status: 'pending',
  },
  {
    id: 'evt-call-5',
    label: "Call d'équipe",
    dateLabel: 'Mercredi 5 juin',
    info: '20h · En ligne · Briefing du mois',
    teammates: [
      { initials: 'C', color: '#96D8D0', name: 'Chana' },
      { initials: 'Cs', color: '#D2B4F1', name: 'Chrisciana' },
      { initials: 'S', color: '#96D8D0', name: 'Stéphanie' },
      { initials: '+3', color: '#16161B', name: 'Equipe' },
    ],
    theme: 'Toute l’équipe',
    type: 'team_call',
    calendarDay: 5,
    status: 'pending',
  },
  {
    id: 'evt-sunday-9',
    label: 'Culte dimanche',
    dateLabel: 'Dimanche 9 juin',
    info: 'Arrivée 13h30 · Caméra · Salle principale',
    teammates: [
      { initials: 'G', color: '#DAF4AA', name: 'Gloria' },
      { initials: 'S', color: '#96D8D0', name: 'Stéphanie' },
    ],
    theme: "Thème : l'écoute",
    type: 'sunday_service',
    calendarDay: 9,
    status: 'pending',
  },
];

const buildCalendarDays = (events: ValidationEvent[]): ValidationCalendarDay[] => {
  const placeholders = Array<ValidationCalendarDay>(5).fill({});
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
    monthLabel: 'Juin 2025',
    weekdays: WEEKDAYS,
    calendar: buildCalendarDays(events),
    events,
    progress: {
      validatedCount: events.filter(event => event.status === 'confirmed').length,
      total: events.length,
    },
  };
};
