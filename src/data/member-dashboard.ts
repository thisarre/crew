import { PROFILE_IDS, PROFILES_SEED } from '@/data/seed';

export type CalendarEventType = 'sunday_service' | 'midweek_service' | 'team_call';

export type CalendarDay = {
  value?: number;
  type?: CalendarEventType;
  isToday?: boolean;
};

export type DashboardData = {
  profile: {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    subtitle: string;
  };
  validation: {
    needsAction: boolean;
    monthLabel: string;
    description: string;
    totalEngagements: number;
    buttonLabel: string;
  } | null;
  weeklyThought: {
    label: string;
    verse: string;
    reference: string;
  } | null;
  calendar: {
    monthLabel: string;
    weekdays: string[];
    days: CalendarDay[];
    legend: { color: string; label: string }[];
  };
  nextEvent: {
    countdownLabel: string;
    skillBadge: string;
    title: string;
    details: string;
    teammates: { initials: string; color: string; name: string }[];
    theme: string;
    heroIcon: 'headphones';
    heroColor: string;
    arrivalTime: string;
    location: string;
    dateISO: string;
  } | null;
  appreciation: {
    message: string;
    author: string;
    timeAgo: string;
    avatar: { initials: string; color: string };
  } | null;
};

export const MOCK_NEXT_EVENT_DATE = '2025-06-22T12:00:00Z';

const buildCalendarDays = (): CalendarDay[] => {
  const placeholders = Array<CalendarDay>(5).fill({});
  const days: CalendarDay[] = [
    { value: 1 },
    { value: 2, type: 'sunday_service' },
    { value: 3 },
    { value: 4 },
    { value: 5, type: 'team_call' },
    { value: 6 },
    { value: 7 },
    { value: 8 },
    { value: 9, type: 'sunday_service' },
    { value: 10 },
    { value: 11 },
    { value: 12 },
    { value: 13 },
    { value: 14 },
    { value: 15 },
    { value: 16, type: 'sunday_service' },
    { value: 17 },
    { value: 18 },
    { value: 19 },
    { value: 20 },
    { value: 21 },
    { value: 22 },
    { value: 23, type: 'sunday_service', isToday: true },
    { value: 24 },
    { value: 25, type: 'midweek_service' },
    { value: 26 },
    { value: 27 },
    { value: 28 },
    { value: 29 },
    { value: 30, type: 'sunday_service' },
  ];

  return [...placeholders, ...days];
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export type MemberDashboardOptions = {
  /** Si true, la carte "Valide ton mois" est masquée (le membre a déjà validé) */
  monthValidated?: boolean;
};

export const getMemberDashboardData = (
  profileId?: string,
  options: MemberDashboardOptions = {},
): DashboardData => {
  const resolvedProfileId = profileId ?? PROFILE_IDS.isaac;
  const profileSeed = PROFILES_SEED.find(profile => profile.id === resolvedProfileId);
  const name = profileSeed?.display_name ?? 'Membre';
  const initials = profileSeed?.initials ?? 'M';
  const avatarColor = profileSeed?.avatar_color ?? '#96D8D0';

  return {
    profile: {
      id: resolvedProfileId,
      name,
      initials,
      avatarColor,
      subtitle: 'Juin commence',
    },
    validation: options.monthValidated
      ? null
      : {
          needsAction: true,
          monthLabel: 'Valide ton mois de juin',
          description: '5 engagements prévus · tu es présent par défaut, ajuste si besoin',
          totalEngagements: 5,
          buttonLabel: 'Voir et valider',
        },
    weeklyThought: {
      label: 'Pensée de la semaine',
      verse: '"Que chacun mette au service des autres le don qu’il a reçu."',
      reference: '1 Pierre 4:10',
    },
    calendar: {
      monthLabel: 'Juin 2025',
      weekdays: WEEKDAYS,
      days: buildCalendarDays(),
      legend: [
        { color: 'bg-[var(--color-sage)]', label: 'Culte' },
        { color: 'bg-[var(--color-mint)]', label: 'Semaine' },
        { color: 'bg-[var(--color-lilac)]', label: 'Call' },
      ],
    },
    nextEvent: {
      countdownLabel: 'Dans 4 jours',
      skillBadge: 'Sono',
      title: 'Dimanche 22 juin',
      details: 'Arrivée 13h30 · Salle principale',
      teammates: [
        { initials: 'C', color: '#96D8D0', name: 'Chana' },
        { initials: 'D', color: '#D2B4F1', name: 'Dave' },
      ],
      theme: "Thème · L'unité",
      heroIcon: 'headphones',
      heroColor: '#96D8D0',
      arrivalTime: '13h30',
      location: 'Salle principale',
      dateISO: MOCK_NEXT_EVENT_DATE,
    },
    appreciation: {
      message: "Merci pour ton calme dimanche, ça a porté toute l'équipe.",
      author: 'Chana',
      timeAgo: 'il y a 2 jours',
      avatar: { initials: 'C', color: '#96D8D0' },
    },
  };
};

export const getMockNextEventDate = () => MOCK_NEXT_EVENT_DATE;
