import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { ORG_ID } from '@/data/seed';

type Tables = Database['public']['Tables'];

export type ProfileRow = Tables['profiles']['Row'];
export type SkillRow = Tables['skills']['Row'];
export type MemberSkillRow = Tables['member_skills']['Row'];
export type ServiceRow = Tables['services']['Row'];
export type SlotRow = Tables['service_slots']['Row'];
export type AssignmentRow = Tables['assignments']['Row'];
export type ValidationRow = Tables['monthly_validations']['Row'];
export type SpiritualRow = Tables['spiritual_content']['Row'];

// ---------- Helpers de récupération brute ----------

type QueryResult<T> = { data: T[] | null; error: Error | null };

const fetchAll = async <T>(query: PromiseLike<QueryResult<T>>): Promise<T[]> => {
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data ?? [];
};

export const fetchProfiles = (client: SupabaseServerClient) =>
  fetchAll<ProfileRow>(
    client.from('profiles').select('*').eq('organization_id', ORG_ID) as unknown as PromiseLike<QueryResult<ProfileRow>>,
  );

/** Récupère un profil par son id (ou null s'il n'existe pas). Utilisé par le flux de connexion. */
export const fetchProfileById = async (
  client: SupabaseServerClient,
  id: string,
): Promise<ProfileRow | null> => {
  const { data, error } = (await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()) as { data: ProfileRow | null; error: Error | null };
  if (error) throw error;
  return data ?? null;
};

export const fetchSkills = (client: SupabaseServerClient) =>
  fetchAll<SkillRow>(
    client
      .from('skills')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('display_order') as unknown as PromiseLike<QueryResult<SkillRow>>,
  );

export const fetchMemberSkills = (client: SupabaseServerClient) =>
  fetchAll<MemberSkillRow>(
    client.from('member_skills').select('*') as unknown as PromiseLike<QueryResult<MemberSkillRow>>,
  );

export const fetchServices = (client: SupabaseServerClient) =>
  fetchAll<ServiceRow>(
    client
      .from('services')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('service_date') as unknown as PromiseLike<QueryResult<ServiceRow>>,
  );

export const fetchSlots = (client: SupabaseServerClient) =>
  fetchAll<SlotRow>(
    client.from('service_slots').select('*') as unknown as PromiseLike<QueryResult<SlotRow>>,
  );

export const fetchAssignments = (client: SupabaseServerClient) =>
  fetchAll<AssignmentRow>(
    client.from('assignments').select('*') as unknown as PromiseLike<QueryResult<AssignmentRow>>,
  );

export const fetchValidationsForMonth = (client: SupabaseServerClient, year: number, month: number) =>
  fetchAll<ValidationRow>(
    client
      .from('monthly_validations')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('year', year)
      .eq('month', month) as unknown as PromiseLike<QueryResult<ValidationRow>>,
  );

export const fetchSpiritualContent = (client: SupabaseServerClient) =>
  fetchAll<SpiritualRow>(
    client
      .from('spiritual_content')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('published_at', { ascending: false }) as unknown as PromiseLike<QueryResult<SpiritualRow>>,
  );

// ---------- Aggregats ----------

export type MemberSkillSummary = {
  skillId: string;
  skillName: string;
  level: MemberSkillRow['level'];
};

export type MemberWithSkills = {
  profile: ProfileRow;
  skills: MemberSkillSummary[];
  servedThisMonth: number;
  lastServedDate: string | null; // ISO yyyy-mm-dd
  cancelledDate: string | null;
  monthValidated: boolean;
};

export type AggregatedAdminData = {
  profiles: ProfileRow[];
  skills: SkillRow[];
  memberSkills: MemberSkillRow[];
  services: ServiceRow[];
  slots: SlotRow[];
  assignments: AssignmentRow[];
  validations: ValidationRow[];
  spiritual: SpiritualRow[];
};

/**
 * "Aujourd'hui" de référence.
 * En production : la vraie date du jour (new Date()).
 * En tests/démo : on peut figer la date via la variable d'env CREW_REFERENCE_TODAY
 * (ISO 8601, ex: "2025-06-17T08:00:00Z") pour garder les fixtures déterministes.
 */
export const getReferenceToday = (): Date => {
  const override = process.env.CREW_REFERENCE_TODAY;
  if (override) {
    const parsed = new Date(override);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

export const loadAdminContext = async (
  client: SupabaseServerClient,
  options: { year?: number; month?: number } = {},
): Promise<AggregatedAdminData> => {
  const now = getReferenceToday();
  const year = options.year ?? now.getUTCFullYear();
  const month = options.month ?? now.getUTCMonth() + 1;

  const [profiles, skills, memberSkills, services, slots, assignments, validations, spiritual] = await Promise.all([
    fetchProfiles(client),
    fetchSkills(client),
    fetchMemberSkills(client),
    fetchServices(client),
    fetchSlots(client),
    fetchAssignments(client),
    fetchValidationsForMonth(client, year, month),
    fetchSpiritualContent(client),
  ]);

  return { profiles, skills, memberSkills, services, slots, assignments, validations, spiritual };
};

export const buildMembersOverview = (
  ctx: AggregatedAdminData,
  options: { year?: number; month?: number } = {},
): MemberWithSkills[] => {
  const now = getReferenceToday();
  const year = options.year ?? now.getUTCFullYear();
  const month = options.month ?? now.getUTCMonth() + 1;
  const skillsById = new Map(ctx.skills.map(skill => [skill.id, skill]));

  return ctx.profiles
    .filter(profile => profile.role === 'member' && (profile.is_active ?? true))
    .map(profile => {
      const skills = ctx.memberSkills
        .filter(ms => ms.profile_id === profile.id)
        .map<MemberSkillSummary>(ms => ({
          skillId: ms.skill_id ?? '',
          skillName: skillsById.get(ms.skill_id ?? '')?.name ?? '—',
          level: ms.level,
        }));

      const profileAssignments = ctx.assignments.filter(a => a.profile_id === profile.id);
      const presentAssignments = profileAssignments.filter(a => a.status === 'present');

      const servedDates = presentAssignments
        .map(a => ctx.services.find(s => s.id === a.service_id))
        .filter((s): s is ServiceRow => Boolean(s));

      const servedThisMonth = servedDates.filter(s => {
        const d = new Date(s.service_date);
        return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
      }).length;

      const pastServed = servedDates
        .map(s => s.service_date)
        .filter(date => new Date(date).getTime() <= now.getTime())
        .sort((a, b) => (a < b ? 1 : -1));
      const lastServedDate = pastServed[0] ?? null;

      const cancelled = profileAssignments
        .filter(a => a.status === 'cancelled')
        .map(a => ctx.services.find(s => s.id === a.service_id))
        .filter((s): s is ServiceRow => Boolean(s))
        .map(s => s.service_date)
        .sort();
      const cancelledDate = cancelled[0] ?? null;

      const monthValidated = ctx.validations.some(v => v.profile_id === profile.id);

      return {
        profile,
        skills,
        servedThisMonth,
        lastServedDate,
        cancelledDate,
        monthValidated,
      };
    });
};

// ---------- Vue dashboard admin ----------

export type AdminAlert =
  | {
      kind: 'cancelled';
      severity: 'error';
      profileId: string;
      profileName: string;
      profileInitials: string;
      profileColor: string;
      serviceDate: string;
      slotLabel: string;
      candidates: number;
    }
  | {
      kind: 'unvalidated_month';
      severity: 'warning';
      profileId: string;
      profileName: string;
      profileInitials: string;
      profileColor: string;
      monthLabel: string;
      daysSincePublish: number;
    }
  | {
      kind: 'disengaging';
      severity: 'warning';
      profileId: string;
      profileName: string;
      profileInitials: string;
      profileColor: string;
      weeksSilent: number;
    };

export type NextServiceSummary = {
  id: string;
  date: string;
  dateLabel: string;
  countdownLabel: string;
  startLabel: string;
  arrivalLabel: string;
  location: string;
  validatedCount: number;
  totalSlots: number;
  filledCount: number;
  cancelledCount: number;
  needsAction: boolean;
  themeLabel: string | null;
  skillBadge: 'sono' | 'camera' | 'diffusion';
  skillColor: string;
};

export type AdminDashboardData = {
  admin: { id: string; name: string; initials: string; avatarColor: string };
  todayLabel: string;
  nextService: NextServiceSummary | null;
  alerts: AdminAlert[];
  personalAssignment: {
    serviceId: string;
    date: string;
    label: string;
    skill: string;
    teammates: string[];
  } | null;
  stats: {
    activeMembers: number;
    servicesThisMonth: number;
    attendancePercent: number;
  };
};

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const FRENCH_WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const formatFrenchDate = (iso: string): string => {
  const date = new Date(iso);
  return `${FRENCH_WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${FRENCH_MONTHS[date.getUTCMonth()]}`;
};

export const formatShortFrenchDate = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${FRENCH_MONTHS[date.getUTCMonth()]}`;
};

export const formatCountdown = (iso: string, now: Date = getReferenceToday()): string => {
  const target = new Date(iso);
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Passé';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
};

const skillBadgeFor = (skillName: string | undefined): { badge: 'sono' | 'camera' | 'diffusion'; color: string } => {
  const name = (skillName ?? '').toLowerCase();
  if (name.includes('cam')) return { badge: 'camera', color: '#96D8D0' };
  if (name.includes('diff')) return { badge: 'diffusion', color: '#D2B4F1' };
  return { badge: 'sono', color: '#DAF4AA' };
};

export const buildAdminDashboard = (
  ctx: AggregatedAdminData,
  adminProfile: ProfileRow,
  options: { year?: number; month?: number } = {},
): AdminDashboardData => {
  const now = getReferenceToday();
  const year = options.year ?? now.getUTCFullYear();
  const month = options.month ?? now.getUTCMonth() + 1;

  // Prochain service publié à venir
  const upcoming = ctx.services
    .filter(s => s.status !== 'completed' && s.status !== 'cancelled')
    .map(s => ({ s, t: new Date(s.service_date).getTime() }))
    .filter(({ t }) => t >= now.getTime() - 24 * 3600 * 1000)
    .sort((a, b) => a.t - b.t)[0];

  let nextService: NextServiceSummary | null = null;
  if (upcoming) {
    const service = upcoming.s;
    const serviceSlots = ctx.slots.filter(slot => slot.service_id === service.id);
    const serviceAssignments = ctx.assignments.filter(a => a.service_id === service.id);
    const filled = serviceSlots.filter(slot =>
      serviceAssignments.some(a => a.slot_id === slot.id && a.status === 'present'),
    ).length;
    const cancelled = serviceAssignments.filter(a => a.status === 'cancelled').length;
    const profilesOnService = serviceAssignments
      .filter(a => a.status === 'present')
      .map(a => a.profile_id)
      .filter((id): id is string => Boolean(id));
    const validated = profilesOnService.filter(id => ctx.validations.some(v => v.profile_id === id)).length;
    const firstSlot = serviceSlots[0];
    const firstSkill = ctx.skills.find(sk => sk.id === firstSlot?.skill_id);
    const skillInfo = skillBadgeFor(firstSkill?.name);

    nextService = {
      id: service.id,
      date: service.service_date,
      dateLabel: formatFrenchDate(service.service_date),
      countdownLabel: formatCountdown(service.service_date),
      startLabel: (service.start_time ?? '').slice(0, 5).replace(':', 'h'),
      arrivalLabel: (service.arrival_time ?? '').slice(0, 5).replace(':', 'h'),
      location: service.location ?? '',
      validatedCount: validated,
      totalSlots: serviceSlots.length,
      filledCount: filled,
      cancelledCount: cancelled,
      needsAction: filled < serviceSlots.length,
      themeLabel: service.spiritual_theme,
      skillBadge: skillInfo.badge,
      skillColor: skillInfo.color,
    };
  }

  // Alertes
  const alerts: AdminAlert[] = [];

  // 1. Annulations futures
  for (const assignment of ctx.assignments) {
    if (assignment.status !== 'cancelled') continue;
    const service = ctx.services.find(s => s.id === assignment.service_id);
    if (!service) continue;
    if (new Date(service.service_date).getTime() < now.getTime()) continue;
    const profile = ctx.profiles.find(p => p.id === assignment.profile_id);
    if (!profile) continue;
    const slot = ctx.slots.find(s => s.id === assignment.slot_id);
    const skill = ctx.skills.find(s => s.id === slot?.skill_id);
    const candidates = ctx.memberSkills.filter(
      ms => ms.skill_id === slot?.skill_id && ms.level !== 'learning' && ms.profile_id !== profile.id,
    ).length;
    alerts.push({
      kind: 'cancelled',
      severity: 'error',
      profileId: profile.id,
      profileName: profile.display_name,
      profileInitials: profile.initials,
      profileColor: profile.avatar_color ?? '#96D8D0',
      serviceDate: service.service_date,
      slotLabel: skill?.name ?? '',
      candidates,
    });
  }

  // 2. Mois non validé (membres assignés à un service publié)
  const publishedServices = ctx.services.filter(s => s.status === 'published' || s.status === 'completed');
  const publishedAt = publishedServices
    .map(s => (s.published_at ? new Date(s.published_at).getTime() : 0))
    .reduce((min, t) => (t > 0 && t < min ? t : min), Infinity);
  const daysSincePublish = publishedAt !== Infinity ? Math.floor((now.getTime() - publishedAt) / (1000 * 60 * 60 * 24)) : 0;
  const unvalidatedProfiles = ctx.profiles.filter(p => {
    if (p.role !== 'member' || !(p.is_active ?? true)) return false;
    const hasAssignment = ctx.assignments.some(a => a.profile_id === p.id && publishedServices.some(s => s.id === a.service_id));
    const validated = ctx.validations.some(v => v.profile_id === p.id);
    return hasAssignment && !validated;
  });
  for (const profile of unvalidatedProfiles) {
    alerts.push({
      kind: 'unvalidated_month',
      severity: 'warning',
      profileId: profile.id,
      profileName: profile.display_name,
      profileInitials: profile.initials,
      profileColor: profile.avatar_color ?? '#96D8D0',
      monthLabel: FRENCH_MONTHS[month - 1] ?? '',
      daysSincePublish,
    });
  }

  // 3. Membres qui décrochent (>3 semaines sans servir)
  for (const profile of ctx.profiles) {
    if (profile.role !== 'member' || !(profile.is_active ?? true)) continue;
    const presentAssignments = ctx.assignments
      .filter(a => a.profile_id === profile.id && a.status === 'present')
      .map(a => ctx.services.find(s => s.id === a.service_id))
      .filter((s): s is ServiceRow => Boolean(s))
      .map(s => new Date(s.service_date).getTime())
      .filter(t => t <= now.getTime())
      .sort((a, b) => b - a);
    const last = presentAssignments[0];
    const futureAssignments = ctx.assignments.some(a =>
      a.profile_id === profile.id &&
      a.status === 'present' &&
      ctx.services.some(s => s.id === a.service_id && new Date(s.service_date).getTime() > now.getTime()),
    );
    if (!last) continue;
    const daysSince = (now.getTime() - last) / (1000 * 60 * 60 * 24);
    if (daysSince >= 21 && !futureAssignments) {
      alerts.push({
        kind: 'disengaging',
        severity: 'warning',
        profileId: profile.id,
        profileName: profile.display_name,
        profileInitials: profile.initials,
        profileColor: profile.avatar_color ?? '#96D8D0',
        weeksSilent: Math.floor(daysSince / 7),
      });
    }
  }

  // Planning perso de l'admin
  type AdminEntry = { a: AssignmentRow; s: ServiceRow; t: number };
  const adminAssignment: AdminEntry | undefined = ctx.assignments
    .filter(a => a.profile_id === adminProfile.id && a.status === 'present')
    .reduce<AdminEntry[]>((acc, a) => {
      const s = ctx.services.find(svc => svc.id === a.service_id);
      if (!s) return acc;
      acc.push({ a, s, t: new Date(s.service_date).getTime() });
      return acc;
    }, [])
    .filter(x => x.t >= now.getTime() - 24 * 3600 * 1000)
    .sort((a, b) => a.t - b.t)[0];

  let personalAssignment: AdminDashboardData['personalAssignment'] = null;
  if (adminAssignment) {
    const { a, s } = adminAssignment;
    const slot = ctx.slots.find(sl => sl.id === a.slot_id);
    const skill = ctx.skills.find(sk => sk.id === slot?.skill_id);
    const teammates = ctx.assignments
      .filter(other => other.service_id === s.id && other.status === 'present' && other.profile_id !== adminProfile.id)
      .map(other => ctx.profiles.find(p => p.id === other.profile_id)?.display_name)
      .filter((n): n is string => Boolean(n));
    personalAssignment = {
      serviceId: s.id,
      date: s.service_date,
      label: formatFrenchDate(s.service_date),
      skill: skill?.name ?? '',
      teammates,
    };
  }

  // Stats
  const activeMembers = ctx.profiles.filter(p => p.role === 'member' && (p.is_active ?? true)).length;
  const servicesThisMonth = ctx.services.filter(s => {
    const d = new Date(s.service_date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  }).length;
  const allAssignmentsThisMonth = ctx.assignments.filter(a => {
    const service = ctx.services.find(s => s.id === a.service_id);
    if (!service) return false;
    const d = new Date(service.service_date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });
  const presentCount = allAssignmentsThisMonth.filter(a => a.status === 'present').length;
  const total = allAssignmentsThisMonth.length;
  const attendancePercent = total === 0 ? 0 : Math.round((presentCount / total) * 100);

  return {
    admin: {
      id: adminProfile.id,
      name: adminProfile.display_name,
      initials: adminProfile.initials,
      avatarColor: adminProfile.avatar_color ?? '#16161B',
    },
    todayLabel: formatFrenchDate(now.toISOString()),
    nextService,
    alerts,
    personalAssignment,
    stats: { activeMembers, servicesThisMonth, attendancePercent },
  };
};

// ---------- Service detail ----------

export type ServiceSlotDetail = {
  slotId: string;
  skillId: string;
  skillName: string;
  skillBadge: 'sono' | 'camera' | 'diffusion';
  skillColor: string;
  positionsRequired: number;
  assigned: {
    assignmentId: string;
    profileId: string;
    name: string;
    initials: string;
    avatarColor: string;
    level: MemberSkillRow['level'] | null;
    status: AssignmentRow['status'];
    cancelledHoursAgo: number | null;
  }[];
  status: 'filled' | 'open' | 'partial';
  aiProposal: {
    profileId: string;
    name: string;
    initials: string;
    avatarColor: string;
    level: MemberSkillRow['level'];
    weeksSinceServed: number;
    availabilityLabel: string;
    reason: string;
    isTrainee: boolean;
    binome?: { profileId: string; name: string; initials: string; avatarColor: string } | 'admin';
  } | null;
};

/**
 * Libellé lisible de la disponibilité d'un membre selon le nombre de semaines depuis son dernier service.
 */
export const describeWeeksSinceServed = (weeks: number): string => {
  if (weeks >= 50) return "n'a jamais servi";
  if (weeks <= 0) return 'a servi cette semaine';
  if (weeks === 1) return "pas servi depuis 1 semaine";
  return `pas servi depuis ${weeks} semaines`;
};

/** Variante courte pour les badges (ex: "1 sem.", "cette sem.", "nouveau"). */
export const shortWeeksSinceServed = (weeks: number): string => {
  if (weeks >= 50) return 'nouveau';
  if (weeks <= 0) return 'cette sem.';
  return `${weeks} sem.`;
};

export type ServiceDetailData = {
  service: ServiceRow;
  dateLabel: string;
  countdownLabel: string;
  startLabel: string;
  arrivalLabel: string;
  validatedCount: number;
  filledCount: number;
  totalSlots: number;
  cancelledCount: number;
  slots: ServiceSlotDetail[];
  isPublishable: boolean;
  openSlotsCount: number;
};

export const buildServiceDetail = (
  ctx: AggregatedAdminData,
  serviceId: string,
): ServiceDetailData | null => {
  const service = ctx.services.find(s => s.id === serviceId);
  if (!service) return null;
  const now = getReferenceToday();
  const serviceSlots = ctx.slots.filter(sl => sl.service_id === serviceId);
  const serviceAssignments = ctx.assignments.filter(a => a.service_id === serviceId);

  const slots: ServiceSlotDetail[] = serviceSlots.map(slot => {
    const skill = ctx.skills.find(sk => sk.id === slot.skill_id);
    const skillInfo = skillBadgeFor(skill?.name);

    const slotAssignments = serviceAssignments.filter(a => a.slot_id === slot.id);
    const presentAssignments = slotAssignments.filter(a => a.status === 'present');
    const cancelledAssignments = slotAssignments.filter(a => a.status === 'cancelled');

    const assigned = [...presentAssignments, ...cancelledAssignments].map(a => {
      const profile = ctx.profiles.find(p => p.id === a.profile_id);
      const memberSkill = ctx.memberSkills.find(ms => ms.profile_id === a.profile_id && ms.skill_id === slot.skill_id);
      const cancelledHoursAgo = a.cancelled_at
        ? Math.floor((now.getTime() - new Date(a.cancelled_at).getTime()) / (1000 * 60 * 60))
        : null;
      return {
        assignmentId: a.id,
        profileId: profile?.id ?? '',
        name: profile?.display_name ?? '?',
        initials: profile?.initials ?? '?',
        avatarColor: profile?.avatar_color ?? '#96D8D0',
        level: memberSkill?.level ?? null,
        status: a.status,
        cancelledHoursAgo,
      };
    });

    const filledByPresent = presentAssignments.length;
    const required = slot.positions_required ?? 1;
    const status: ServiceSlotDetail['status'] = filledByPresent >= required ? 'filled' : filledByPresent > 0 ? 'partial' : 'open';

    // Proposition IA simple : meilleur match si slot open
    let aiProposal: ServiceSlotDetail['aiProposal'] = null;
    if (status === 'open' && skill) {
      const occupiedProfileIds = new Set(presentAssignments.map(a => a.profile_id));
      // Aussi exclure les cancelled de ce slot pour éviter de re-proposer Dave qui a annulé
      const cancelledProfileIds = new Set(cancelledAssignments.map(a => a.profile_id));

      const candidates = ctx.memberSkills.filter(
        ms => ms.skill_id === skill.id && !occupiedProfileIds.has(ms.profile_id) && !cancelledProfileIds.has(ms.profile_id),
      );

      const ranked = candidates
        .map(candidate => {
          const profile = ctx.profiles.find(p => p.id === candidate.profile_id);
          if (!profile || profile.role !== 'member' || !(profile.is_active ?? true)) return null;
          // Exclure ceux déjà sur ce service
          if (serviceAssignments.some(a => a.profile_id === profile.id && a.status === 'present')) return null;
          const lastServed = ctx.assignments
            .filter(a => a.profile_id === profile.id && a.status === 'present')
            .map(a => ctx.services.find(s => s.id === a.service_id))
            .filter((s): s is ServiceRow => Boolean(s))
            .map(s => new Date(s.service_date).getTime())
            .filter(t => t <= now.getTime())
            .sort((x, y) => y - x)[0];
          const weeksSince = lastServed ? Math.floor((now.getTime() - lastServed) / (1000 * 60 * 60 * 24 * 7)) : 99;
          return { profile, candidate, weeksSince };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .sort((a, b) => {
          // Autonomes/formateurs en premier, apprentis en dernier
          const aLearner = a.candidate.level === 'learning' ? 1 : 0;
          const bLearner = b.candidate.level === 'learning' ? 1 : 0;
          if (aLearner !== bLearner) return aLearner - bLearner;
          return b.weeksSince - a.weeksSince;
        });

      const top = ranked[0];
      if (top) {
        const isTrainee = top.candidate.level === 'learning';
        const availability = describeWeeksSinceServed(top.weeksSince);

        // Si apprenti → trouver un binôme autonome libre sur ce service
        let binome: { profileId: string; name: string; initials: string; avatarColor: string } | 'admin' | undefined = undefined;
        if (isTrainee) {
          const binomeProfile = ctx.memberSkills
            .filter(ms => ms.skill_id === skill.id && ms.level !== 'learning' && ms.profile_id !== top.profile.id)
            .map(ms => ctx.profiles.find(p => p.id === ms.profile_id))
            .find(p => p && p.role === 'member' && (p.is_active ?? true)
              && !serviceAssignments.some(a => a.profile_id === p.id && a.status === 'present'));
          binome = binomeProfile
            ? { profileId: binomeProfile.id, name: binomeProfile.display_name, initials: binomeProfile.initials, avatarColor: binomeProfile.avatar_color ?? '#96D8D0' }
            : 'admin';
        }

        const reason = isTrainee
          ? `En apprentissage sur ${skill.name.toLowerCase()} — à encadrer en binôme.`
          : top.weeksSince <= 0
            ? `Maîtrise ${skill.name.toLowerCase()} et reste disponible. Un choix sûr pour ce poste.`
            : top.weeksSince >= 50
              ? `Maîtrise ${skill.name.toLowerCase()} et n'a pas encore servi. L'occasion de l'intégrer.`
              : `Maîtrise ${skill.name.toLowerCase()} et ${availability}. L'occasion de la/le réinviter.`;

        aiProposal = {
          profileId: top.profile.id,
          name: top.profile.display_name,
          initials: top.profile.initials,
          avatarColor: top.profile.avatar_color ?? '#96D8D0',
          level: top.candidate.level,
          weeksSinceServed: top.weeksSince,
          availabilityLabel: availability,
          reason,
          isTrainee,
          binome,
        };
      }
    }

    return {
      slotId: slot.id,
      skillId: skill?.id ?? '',
      skillName: skill?.name ?? '',
      skillBadge: skillInfo.badge,
      skillColor: skillInfo.color,
      positionsRequired: required,
      assigned,
      status,
      aiProposal,
    };
  });

  const presentProfiles = serviceAssignments
    .filter(a => a.status === 'present')
    .map(a => a.profile_id)
    .filter((id): id is string => Boolean(id));
  const validatedCount = presentProfiles.filter(id => ctx.validations.some(v => v.profile_id === id)).length;
  const filledCount = slots.filter(s => s.status === 'filled').length;
  const openSlotsCount = slots.filter(s => s.status === 'open' || s.status === 'partial').length;

  return {
    service,
    dateLabel: formatFrenchDate(service.service_date),
    countdownLabel: formatCountdown(service.service_date),
    startLabel: (service.start_time ?? '').slice(0, 5).replace(':', 'h'),
    arrivalLabel: (service.arrival_time ?? '').slice(0, 5).replace(':', 'h'),
    validatedCount,
    filledCount,
    totalSlots: slots.length,
    cancelledCount: serviceAssignments.filter(a => a.status === 'cancelled').length,
    slots,
    isPublishable: openSlotsCount === 0,
    openSlotsCount,
  };
};

// ---------- Services list (admin) ----------

export type ServiceListItem = {
  id: string;
  date: string;
  dateLabel: string;
  countdownLabel: string;
  status: ServiceRow['status'];
  eventType: ServiceRow['event_type'];
  filledCount: number;
  totalSlots: number;
  hasAlert: boolean;
};

export const buildServicesList = (ctx: AggregatedAdminData): ServiceListItem[] => {
  return ctx.services.map(service => {
    const serviceSlots = ctx.slots.filter(sl => sl.service_id === service.id);
    const serviceAssignments = ctx.assignments.filter(a => a.service_id === service.id);
    const filled = serviceSlots.filter(slot =>
      serviceAssignments.some(a => a.slot_id === slot.id && a.status === 'present'),
    ).length;
    const hasCancelled = serviceAssignments.some(a => a.status === 'cancelled');
    return {
      id: service.id,
      date: service.service_date,
      dateLabel: formatFrenchDate(service.service_date),
      countdownLabel: formatCountdown(service.service_date),
      status: service.status,
      eventType: service.event_type,
      filledCount: filled,
      totalSlots: serviceSlots.length,
      hasAlert: filled < serviceSlots.length || hasCancelled,
    };
  });
};

// ---------- Member detail ----------

export type MemberDetailData = {
  profile: ProfileRow;
  skills: MemberSkillSummary[];
  servedThisMonth: number;
  lastServedLabel: string | null;
  upcomingAssignments: { date: string; label: string; skill: string }[];
  statusBadge: 'ok' | 'cancelled' | 'unvalidated' | 'disengaging';
};

export const buildMemberDetail = (
  ctx: AggregatedAdminData,
  profileId: string,
): MemberDetailData | null => {
  const profile = ctx.profiles.find(p => p.id === profileId);
  if (!profile) return null;

  const skillsById = new Map(ctx.skills.map(s => [s.id, s]));
  const skills = ctx.memberSkills
    .filter(ms => ms.profile_id === profile.id)
    .map<MemberSkillSummary>(ms => ({
      skillId: ms.skill_id ?? '',
      skillName: skillsById.get(ms.skill_id ?? '')?.name ?? '—',
      level: ms.level,
    }));

  const now = getReferenceToday();
  const upcomingAssignments = ctx.assignments
    .filter(a => a.profile_id === profile.id && a.status === 'present')
    .reduce<{ date: string; label: string; skill: string }[]>((acc, a) => {
      const s = ctx.services.find(svc => svc.id === a.service_id);
      if (!s) return acc;
      if (new Date(s.service_date).getTime() < now.getTime()) return acc;
      const slot = ctx.slots.find(sl => sl.id === a.slot_id);
      const skillName = ctx.skills.find(sk => sk.id === slot?.skill_id)?.name ?? '';
      acc.push({ date: s.service_date, label: formatFrenchDate(s.service_date), skill: skillName });
      return acc;
    }, [])
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const servedDates = ctx.assignments
    .filter(a => a.profile_id === profile.id && a.status === 'present')
    .map(a => ctx.services.find(s => s.id === a.service_id))
    .filter((s): s is ServiceRow => Boolean(s));
  const servedThisMonth = servedDates.filter(s => {
    const d = new Date(s.service_date);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  }).length;
  const past = servedDates
    .map(s => s.service_date)
    .filter(d => new Date(d).getTime() <= now.getTime())
    .sort((a, b) => (a < b ? 1 : -1));
  const lastServedLabel = past[0] ? formatShortFrenchDate(past[0]) : null;

  let statusBadge: MemberDetailData['statusBadge'] = 'ok';
  if (ctx.assignments.some(a => a.profile_id === profile.id && a.status === 'cancelled')) {
    statusBadge = 'cancelled';
  } else if (ctx.assignments.some(a => a.profile_id === profile.id) && !ctx.validations.some(v => v.profile_id === profile.id)) {
    statusBadge = 'unvalidated';
  } else if (past[0]) {
    const days = (now.getTime() - new Date(past[0]).getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 21) statusBadge = 'disengaging';
  }

  return { profile, skills, servedThisMonth, lastServedLabel, upcomingAssignments, statusBadge };
};
