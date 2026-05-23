/**
 * Queries dédiées au parcours membre — actuellement : chargement de la validation mensuelle
 * à partir des vraies assignments du membre dans Supabase.
 */

import type { SupabaseServerClient } from '@/lib/supabase/server';
import { getReferenceToday, loadAdminContext } from './admin';
import type {
  MemberValidationData,
  ValidationEvent,
  ValidationEventType,
  ValidationStatus,
} from '@/data/member-validation';
import type { CalendarDay, DashboardData } from '@/data/member-dashboard';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const FRENCH_WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  return `${FRENCH_WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${FRENCH_MONTHS[d.getUTCMonth()]}`;
};

const eventTypeLabel = (type: ValidationEventType): string => {
  if (type === 'midweek_service') return 'Service de semaine';
  if (type === 'team_call') return "Call d'équipe";
  return 'Culte dimanche';
};

const skillTeammateLabel = (skillName: string | undefined): string => {
  if (!skillName) return '';
  return skillName;
};

export type LoadMemberValidationOptions = {
  year: number;
  month: number;
};

export async function loadMemberValidationData(
  client: SupabaseServerClient,
  profileId: string,
  options: LoadMemberValidationOptions,
): Promise<MemberValidationData> {
  const ctx = await loadAdminContext(client, options);

  const profile = ctx.profiles.find(p => p.id === profileId);
  const profileName = profile?.display_name ?? 'Membre';

  // Toutes les assignments du membre pour le mois (présent + cancelled)
  const myAssignments = ctx.assignments.filter(a => {
    if (a.profile_id !== profileId) return false;
    const service = ctx.services.find(s => s.id === a.service_id);
    if (!service) return false;
    const d = new Date(service.service_date);
    return d.getUTCFullYear() === options.year && d.getUTCMonth() + 1 === options.month;
  });

  const events: ValidationEvent[] = myAssignments.map(a => {
    const service = ctx.services.find(s => s.id === a.service_id)!;
    const slot = ctx.slots.find(sl => sl.id === a.slot_id);
    const skill = ctx.skills.find(sk => sk.id === slot?.skill_id);

    // Coéquipiers : les autres assignments présent sur le même service
    const teammates = ctx.assignments
      .filter(
        other =>
          other.service_id === service.id &&
          other.status === 'present' &&
          other.profile_id !== profileId &&
          other.profile_id,
      )
      .map(other => ctx.profiles.find(p => p.id === other.profile_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(p => ({
        initials: p.initials,
        color: p.avatar_color ?? '#96D8D0',
        name: p.display_name,
      }));

    const dateObj = new Date(service.service_date);
    const calendarDay = dateObj.getUTCDate();
    const status: ValidationStatus = a.status === 'cancelled' ? 'declined' : 'pending';
    const startLabel = (service.start_time ?? '').slice(0, 5).replace(':', 'h');
    const arrivalLabel = service.arrival_time
      ? `Arrivée ${(service.arrival_time as string).slice(0, 5).replace(':', 'h')}`
      : startLabel;
    const skillLabel = skillTeammateLabel(skill?.name);
    const infoBits = [arrivalLabel, skillLabel, service.location].filter(Boolean);

    return {
      id: a.id,
      label: eventTypeLabel(service.event_type as ValidationEventType),
      dateLabel: formatDateLabel(service.service_date),
      info: infoBits.join(' · '),
      teammates,
      theme: service.spiritual_theme ? `Thème : ${service.spiritual_theme}` : '',
      type: service.event_type as ValidationEventType,
      calendarDay,
      status,
    };
  });

  // Tri par date croissante
  events.sort((a, b) => a.calendarDay - b.calendarDay);

  const calendar = buildCalendar(events, options);
  const monthLabel = `${capitalize(FRENCH_MONTHS[options.month - 1] ?? '')} ${options.year}`;

  return {
    profileName,
    monthLabel,
    weekdays: WEEKDAYS,
    calendar,
    events,
    progress: {
      validatedCount: events.filter(e => e.status !== 'pending').length,
      total: events.length,
    },
  };
}

// ---------- Prochain engagement réel (pour le dashboard) ----------

export type NextAssignment = {
  assignmentId: string;
  date: string;
  dateLabel: string;
  skillName: string;
};

/**
 * Renvoie le prochain service (toutes dates à venir) où le membre est présent, avec l'id
 * d'assignation pour pouvoir l'annuler depuis le dashboard. Null s'il n'a rien à venir.
 */
export async function getNextMemberAssignment(
  client: SupabaseServerClient,
  profileId: string,
): Promise<NextAssignment | null> {
  const ctx = await loadAdminContext(client);
  const now = getReferenceToday();

  const candidates = ctx.assignments
    .filter(a => a.profile_id === profileId && a.status === 'present')
    .map(a => {
      const service = ctx.services.find(s => s.id === a.service_id);
      if (!service) return null;
      const slot = ctx.slots.find(sl => sl.id === a.slot_id);
      const skill = ctx.skills.find(sk => sk.id === slot?.skill_id);
      return { a, service, skillName: skill?.name ?? '', t: new Date(service.service_date).getTime() };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x) && x!.t >= now.getTime())
    .sort((x, y) => x.t - y.t);

  const next = candidates[0];
  if (!next) return null;
  return {
    assignmentId: next.a.id,
    date: next.service.service_date,
    dateLabel: formatDateLabel(next.service.service_date),
    skillName: next.skillName,
  };
}

// ---------- Dashboard membre (écran d'accueil) ----------

const DASHBOARD_LEGEND = [
  { color: 'bg-[var(--color-sage)]', label: 'Culte' },
  { color: 'bg-[var(--color-mint)]', label: 'Semaine' },
  { color: 'bg-[var(--color-lilac)]', label: 'Call' },
];

const buildDashboardCalendarDays = (
  services: { date: string; type: ValidationEventType }[],
  year: number,
  month: number,
  now: Date,
): CalendarDay[] => {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const jsWeekday = firstDay.getUTCDay();
  const leading = jsWeekday === 0 ? 6 : jsWeekday - 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const todayDay =
    now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month ? now.getUTCDate() : -1;

  const cells: CalendarDay[] = [];
  for (let i = 0; i < leading; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const evt = services.find(s => new Date(s.date).getUTCDate() === day);
    cells.push({ value: day, type: evt?.type, isToday: day === todayDay });
  }
  return cells;
};

/**
 * Construit le dashboard membre (écran d'accueil) à partir des vraies données Supabase :
 * profil, validation du mois, pensée publiée, calendrier du mois courant, prochain événement.
 * Tous les blocs optionnels sont `null` quand il n'y a pas de donnée (états vides).
 */
export async function loadMemberDashboard(
  client: SupabaseServerClient,
  profileId: string,
): Promise<DashboardData> {
  const ctx = await loadAdminContext(client);
  const now = getReferenceToday();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const profile = ctx.profiles.find(p => p.id === profileId);
  const name = profile?.display_name ?? 'Membre';
  const initials = profile?.initials ?? 'M';
  const avatarColor = profile?.avatar_color ?? '#96D8D0';
  const subtitle = capitalize(
    `${FRENCH_WEEKDAYS_LONG[now.getUTCDay()]} ${now.getUTCDate()} ${FRENCH_MONTHS[now.getUTCMonth()]}`,
  );

  // --- Validation du mois courant ---
  const monthValidated = ctx.validations.some(v => v.profile_id === profileId);
  const monthlyEngagements = ctx.assignments.filter(a => {
    if (a.profile_id !== profileId || a.status !== 'present') return false;
    const service = ctx.services.find(s => s.id === a.service_id);
    if (!service) return false;
    const d = new Date(service.service_date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  }).length;
  const monthName = FRENCH_MONTHS[month - 1] ?? '';
  const validation: DashboardData['validation'] = monthValidated
    ? null
    : {
        needsAction: true,
        monthLabel: `Valide ton mois de ${monthName}`,
        description:
          monthlyEngagements > 0
            ? `${monthlyEngagements} engagement${monthlyEngagements > 1 ? 's' : ''} prévu${
                monthlyEngagements > 1 ? 's' : ''
              } · tu es présent par défaut, ajuste si besoin`
            : 'Confirme tes disponibilités pour le mois',
        totalEngagements: monthlyEngagements,
        buttonLabel: 'Voir et valider',
      };

  // --- Pensée de la semaine (dernier contenu publié) ---
  const thought = ctx.spiritual
    .filter(
      s =>
        s.content_type === 'weekly_thought' &&
        s.status === 'published' &&
        Boolean(s.published_at) &&
        new Date(s.published_at as string).getTime() <= now.getTime(),
    )
    .sort(
      (a, b) =>
        new Date(b.published_at as string).getTime() - new Date(a.published_at as string).getTime(),
    )[0];
  const weeklyThought: DashboardData['weeklyThought'] = thought
    ? {
        label: 'Pensée de la semaine',
        verse: `"${thought.verse_text}"`,
        reference: thought.verse_reference ?? '',
      }
    : null;

  // --- Calendrier du mois courant (services visibles par les membres) ---
  const monthServices = ctx.services.filter(s => {
    if (s.status !== 'published' && s.status !== 'completed') return false;
    const d = new Date(s.service_date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });
  const calendar: DashboardData['calendar'] = {
    monthLabel: `${capitalize(monthName)} ${year}`,
    weekdays: WEEKDAYS,
    days: buildDashboardCalendarDays(
      monthServices.map(s => ({ date: s.service_date, type: s.event_type as ValidationEventType })),
      year,
      month,
      now,
    ),
    legend: DASHBOARD_LEGEND,
  };

  // --- Prochain événement (prochaine assignation présente) ---
  const nextCandidate = ctx.assignments
    .filter(a => a.profile_id === profileId && a.status === 'present')
    .map(a => {
      const service = ctx.services.find(s => s.id === a.service_id);
      if (!service) return null;
      const slot = ctx.slots.find(sl => sl.id === a.slot_id);
      const skill = ctx.skills.find(sk => sk.id === slot?.skill_id);
      return { service, skill, t: new Date(service.service_date).getTime() };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x) && x!.t >= now.getTime())
    .sort((x, y) => x.t - y.t)[0];

  let nextEvent: DashboardData['nextEvent'] = null;
  if (nextCandidate) {
    const { service, skill } = nextCandidate;
    const arrival = service.arrival_time
      ? (service.arrival_time as string).slice(0, 5).replace(':', 'h')
      : (service.start_time ?? '').slice(0, 5).replace(':', 'h');
    const teammates = ctx.assignments
      .filter(
        o => o.service_id === service.id && o.status === 'present' && o.profile_id !== profileId && o.profile_id,
      )
      .map(o => ctx.profiles.find(p => p.id === o.profile_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(p => ({ initials: p.initials, color: p.avatar_color ?? '#96D8D0', name: p.display_name }));
    nextEvent = {
      countdownLabel: formatCountdownFr(service.service_date, now),
      skillBadge: skill?.name ?? '',
      title: capitalize(formatDateLabel(service.service_date)),
      details: [arrival ? `Arrivée ${arrival}` : '', service.location].filter(Boolean).join(' · '),
      teammates,
      theme: service.spiritual_theme ? `Thème · ${service.spiritual_theme}` : '',
      heroIcon: 'headphones',
      heroColor: skill?.color ?? '#96D8D0',
      arrivalTime: arrival,
      location: service.location ?? '',
      dateISO: service.service_date,
    };
  }

  // --- Appreciation contextuelle basée sur l'activité récente ---
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 3600 * 1000);

  const pastAssignments = ctx.assignments
    .filter(a => a.profile_id === profileId && a.status === 'present')
    .map(a => {
      const service = ctx.services.find(s => s.id === a.service_id);
      return service ? new Date(service.service_date).getTime() : null;
    })
    .filter((t): t is number => t !== null && t < now.getTime())
    .sort((a, b) => b - a);

  const lastServed = pastAssignments[0] ?? 0;
  const hasUpcoming = Boolean(nextEvent);

  let appreciationMessage: string;
  if (lastServed >= twoWeeksAgo.getTime()) {
    appreciationMessage = 'Merci pour ton engagement lors du dernier service !';
  } else if (hasUpcoming) {
    appreciationMessage = 'On compte sur toi pour le prochain service !';
  } else if (lastServed > 0 && lastServed < fourWeeksAgo.getTime()) {
    appreciationMessage = 'Tu nous manques ! On espère te revoir bientôt.';
  } else {
    appreciationMessage = "Merci de faire partie de l'équipe Crew !";
  }

  const appreciation: DashboardData['appreciation'] = {
    message: appreciationMessage,
    author: "L'équipe Crew",
    timeAgo: '',
    avatar: { initials: 'C', color: '#DAF4AA' },
  };

  return {
    profile: { id: profileId, name, initials, avatarColor, subtitle },
    validation,
    weeklyThought,
    calendar,
    nextEvent,
    appreciation,
  };
}

// ---------- Vue Service Day (écran 06) ----------

export type ServiceDaySkill = 'sono' | 'camera' | 'diffusion';

export type ServiceDayTeammate = {
  profileId: string;
  name: string;
  initials: string;
  avatarColor: string;
  skillName: string;
  isMe: boolean;
  arrivalLabel: string;
};

export type ServiceDayView = {
  profileName: string;
  profileInitials: string;
  avatarColor: string;
  badge: 'today' | 'tomorrow' | 'upcoming';
  badgeLabel: string;
  dateLabel: string;
  startLabel: string;
  arrivalLabel: string;
  location: string;
  mySkillName: string;
  mySkillBadge: ServiceDaySkill;
  theme: string | null;
  verseText: string | null;
  verseReference: string | null;
  team: ServiceDayTeammate[];
  admin: { name: string; phone: string | null };
};

const skillBadgeFromName = (name: string | undefined): ServiceDaySkill => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('cam')) return 'camera';
  if (n.includes('diff')) return 'diffusion';
  return 'sono';
};

export async function loadServiceDayView(
  client: SupabaseServerClient,
  profileId: string,
): Promise<ServiceDayView | null> {
  const ctx = await loadAdminContext(client);
  const now = getReferenceToday();

  // Prochain service présent du membre (toutes dates à venir)
  const mine = ctx.assignments
    .filter(a => a.profile_id === profileId && a.status === 'present')
    .map(a => {
      const service = ctx.services.find(s => s.id === a.service_id);
      if (!service) return null;
      return { a, service, t: new Date(service.service_date).getTime() };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x) && x!.t >= now.getTime() - 12 * 3600 * 1000)
    .sort((x, y) => x.t - y.t)[0];

  if (!mine) return null;

  const { service } = mine;
  const profile = ctx.profiles.find(p => p.id === profileId);
  const slot = ctx.slots.find(sl => sl.id === mine.a.slot_id);
  const mySkill = ctx.skills.find(sk => sk.id === slot?.skill_id);

  // Badge selon proximité
  const days = Math.round((new Date(service.service_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const badge: ServiceDayView['badge'] = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'upcoming';
  const badgeLabel = badge === 'today' ? "Aujourd'hui" : badge === 'tomorrow' ? 'Demain' : `Dans ${days} jours`;

  const arrivalLabel = service.arrival_time
    ? (service.arrival_time as string).slice(0, 5).replace(':', 'h')
    : (service.start_time ?? '').slice(0, 5).replace(':', 'h');

  // Équipe du jour (tous les présents du service)
  const team: ServiceDayTeammate[] = ctx.assignments
    .filter(a => a.service_id === service.id && a.status === 'present' && a.profile_id)
    .map(a => {
      const p = ctx.profiles.find(pr => pr.id === a.profile_id);
      if (!p) return null;
      const aSlot = ctx.slots.find(sl => sl.id === a.slot_id);
      const aSkill = ctx.skills.find(sk => sk.id === aSlot?.skill_id);
      return {
        profileId: p.id,
        name: p.id === profileId ? `${p.display_name} · toi` : p.display_name,
        initials: p.initials,
        avatarColor: p.avatar_color ?? '#96D8D0',
        skillName: aSkill?.name ?? '',
        isMe: p.id === profileId,
        arrivalLabel,
      } satisfies ServiceDayTeammate;
    })
    .filter((x): x is ServiceDayTeammate => Boolean(x))
    .sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : 0));

  const admin = ctx.profiles.find(p => p.role === 'admin');

  return {
    profileName: profile?.display_name ?? 'Membre',
    profileInitials: profile?.initials ?? '?',
    avatarColor: profile?.avatar_color ?? '#96D8D0',
    badge,
    badgeLabel,
    dateLabel: formatDateLabel(service.service_date),
    startLabel: (service.start_time ?? '').slice(0, 5).replace(':', 'h'),
    arrivalLabel,
    location: service.location ?? '',
    mySkillName: mySkill?.name ?? '',
    mySkillBadge: skillBadgeFromName(mySkill?.name),
    theme: service.spiritual_theme,
    verseText: service.spiritual_verse_text,
    verseReference: service.spiritual_verse_ref,
    team,
    admin: { name: admin?.display_name ?? 'ton responsable', phone: admin?.phone ?? null },
  };
}

// ---------- Vue consultation mensuelle (écran 05) ----------

export type MonthCalendarCell = {
  day?: number;
  type?: ValidationEventType;
  status?: 'present' | 'cancelled';
  isToday?: boolean;
};

export type MonthEvent = {
  id: string;
  date: string;
  dateLabel: string;
  shortDateLabel: string;
  type: ValidationEventType;
  skillName: string;
  status: 'present' | 'cancelled';
  startLabel: string;
  arrivalLabel: string;
  location: string;
  theme: string;
  countdownLabel: string;
  teammates: { initials: string; color: string; name: string }[];
};

export type MemberMonthView = {
  profileName: string;
  monthLabel: string;
  year: number;
  month: number;
  validated: boolean;
  weekdays: string[];
  calendar: MonthCalendarCell[];
  stats: { engagements: number; present: number; absent: number };
  upcoming: MonthEvent[];
  past: MonthEvent[];
  prev: { year: number; month: number };
  next: { year: number; month: number };
};

const formatCountdownFr = (iso: string, now: Date): string => {
  const target = new Date(iso);
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Passé';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
};

export async function loadMemberMonthView(
  client: SupabaseServerClient,
  profileId: string,
  options: { year: number; month: number },
): Promise<MemberMonthView> {
  const ctx = await loadAdminContext(client, options);
  const now = getReferenceToday();
  const { year, month } = options;

  const profile = ctx.profiles.find(p => p.id === profileId);
  const profileName = profile?.display_name ?? 'Membre';

  const validated = ctx.validations.some(v => v.profile_id === profileId);

  // Assignations du membre pour le mois
  const myAssignments = ctx.assignments.filter(a => {
    if (a.profile_id !== profileId) return false;
    const service = ctx.services.find(s => s.id === a.service_id);
    if (!service) return false;
    const d = new Date(service.service_date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });

  const events: MonthEvent[] = myAssignments
    .map(a => {
      const service = ctx.services.find(s => s.id === a.service_id);
      if (!service) return null;
      const slot = ctx.slots.find(sl => sl.id === a.slot_id);
      const skill = ctx.skills.find(sk => sk.id === slot?.skill_id);
      const teammates = ctx.assignments
        .filter(o => o.service_id === service.id && o.status === 'present' && o.profile_id !== profileId && o.profile_id)
        .map(o => ctx.profiles.find(p => p.id === o.profile_id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map(p => ({ initials: p.initials, color: p.avatar_color ?? '#96D8D0', name: p.display_name }));
      return {
        id: a.id,
        date: service.service_date,
        dateLabel: formatDateLabel(service.service_date),
        shortDateLabel: shortDate(service.service_date),
        type: service.event_type as ValidationEventType,
        skillName: skill?.name ?? '',
        status: (a.status === 'cancelled' ? 'cancelled' : 'present') as 'present' | 'cancelled',
        startLabel: (service.start_time ?? '').slice(0, 5).replace(':', 'h'),
        arrivalLabel: service.arrival_time ? (service.arrival_time as string).slice(0, 5).replace(':', 'h') : '',
        location: service.location ?? '',
        theme: service.spiritual_theme ?? '',
        countdownLabel: formatCountdownFr(service.service_date, now),
        teammates,
      } satisfies MonthEvent;
    })
    .filter((e): e is MonthEvent => Boolean(e))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const upcoming = events.filter(e => new Date(e.date).getTime() >= now.getTime());
  const past = events.filter(e => new Date(e.date).getTime() < now.getTime());

  const stats = {
    engagements: events.length,
    present: events.filter(e => e.status === 'present').length,
    absent: events.filter(e => e.status === 'cancelled').length,
  };

  const calendar = buildMonthCalendar(events, options, now);

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return {
    profileName,
    monthLabel: `${capitalize(FRENCH_MONTHS[month - 1] ?? '')} ${year}`,
    year,
    month,
    validated,
    weekdays: WEEKDAYS,
    calendar,
    stats,
    upcoming,
    past,
    prev,
    next,
  };
}

const shortDate = (iso: string): string => {
  const d = new Date(iso);
  const wd = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getUTCDay()];
  return `${wd} ${d.getUTCDate()} ${FRENCH_MONTHS[d.getUTCMonth()]}`;
};

const buildMonthCalendar = (
  events: MonthEvent[],
  options: { year: number; month: number },
  now: Date,
): MonthCalendarCell[] => {
  const firstDay = new Date(Date.UTC(options.year, options.month - 1, 1));
  const jsWeekday = firstDay.getUTCDay();
  const leading = jsWeekday === 0 ? 6 : jsWeekday - 1;
  const daysInMonth = new Date(Date.UTC(options.year, options.month, 0)).getUTCDate();
  const todayDay =
    now.getUTCFullYear() === options.year && now.getUTCMonth() + 1 === options.month ? now.getUTCDate() : -1;

  const cells: MonthCalendarCell[] = [];
  for (let i = 0; i < leading; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const evt = events.find(e => new Date(e.date).getUTCDate() === day);
    cells.push({
      day,
      type: evt?.type,
      status: evt?.status,
      isToday: day === todayDay,
    });
  }
  return cells;
};

const buildCalendar = (
  events: ValidationEvent[],
  options: { year: number; month: number },
): MemberValidationData['calendar'] => {
  // Premier jour du mois → quel weekday ? On normalise lundi=0..dimanche=6 pour aligner avec WEEKDAYS L M M J V S D
  const firstDay = new Date(Date.UTC(options.year, options.month - 1, 1));
  const jsWeekday = firstDay.getUTCDay(); // 0=dim, 1=lun, ...
  const leadingPlaceholders = jsWeekday === 0 ? 6 : jsWeekday - 1; // lundi=0 → 0 leading

  const daysInMonth = new Date(Date.UTC(options.year, options.month, 0)).getUTCDate();
  const cells: MemberValidationData['calendar'] = [];
  for (let i = 0; i < leadingPlaceholders; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const evt = events.find(e => e.calendarDay === day);
    if (evt) {
      cells.push({
        value: day,
        type: evt.type,
        status: evt.status,
        eventId: evt.id,
      });
    } else {
      cells.push({ value: day });
    }
  }
  return cells;
};

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : '');
