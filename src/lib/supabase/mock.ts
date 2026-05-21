import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import {
  MEMBER_SKILLS_SEED,
  ORGANIZATION_SEED,
  PROFILES_SEED,
  SKILLS_SEED,
} from '@/data/seed';
import {
  ASSIGNMENTS_SEED,
  MONTHLY_VALIDATIONS_SEED,
  SERVICES_SEED,
  SLOTS_SEED,
  SPIRITUAL_CONTENT_SEED,
} from '@/data/admin-seed';

type TableKey = keyof Database['public']['Tables'];
type TableRows<T extends TableKey> = Database['public']['Tables'][T]['Row'];
type Insert<T extends TableKey> = Database['public']['Tables'][T]['Insert'];

type SelectResult<T> = { data: T[] | null; error: Error | null };
type SingleResult<T> = { data: T | null; error: Error | null };
type MutationResult<T> = { data: T | null; error: Error | null };

const nowISO = () => new Date().toISOString();

const organizationsRows: TableRows<'organizations'>[] = [
  {
    id: ORGANIZATION_SEED.id!,
    name: ORGANIZATION_SEED.name,
    created_at: ORGANIZATION_SEED.created_at ?? nowISO(),
  },
];

const profilesRows: TableRows<'profiles'>[] = PROFILES_SEED.map(profile => ({
  id: profile.id!,
  organization_id: profile.organization_id ?? null,
  display_name: profile.display_name,
  avatar_color: profile.avatar_color ?? null,
  avatar_url: profile.avatar_url ?? null,
  initials: profile.initials,
  phone: profile.phone ?? null,
  birthday: profile.birthday ?? null,
  why_i_serve: profile.why_i_serve ?? null,
  role: profile.role ?? 'member',
  joined_at: profile.joined_at ?? nowISO(),
  is_active: profile.is_active ?? true,
  device_locked_until: profile.device_locked_until ?? null,
  device_id: profile.device_id ?? null,
}));

const skillsRows: TableRows<'skills'>[] = SKILLS_SEED.map(skill => ({
  id: skill.id!,
  organization_id: skill.organization_id ?? null,
  name: skill.name,
  icon_name: skill.icon_name ?? null,
  color: skill.color ?? null,
  display_order: skill.display_order ?? null,
}));

const memberSkillsRows: TableRows<'member_skills'>[] = MEMBER_SKILLS_SEED.map(({ id, profile_id, skill_id, level }) => ({
  id,
  profile_id,
  skill_id,
  level,
  trained_by: null,
  trained_at: null,
  updated_at: nowISO(),
}));

const servicesRows: TableRows<'services'>[] = SERVICES_SEED.map((service: Insert<'services'>) => ({
  id: service.id!,
  organization_id: service.organization_id ?? null,
  event_type: service.event_type,
  title: service.title ?? null,
  service_date: service.service_date,
  start_time: service.start_time,
  arrival_time: service.arrival_time ?? null,
  location: service.location ?? null,
  notes: service.notes ?? null,
  spiritual_theme: service.spiritual_theme ?? null,
  spiritual_verse_ref: service.spiritual_verse_ref ?? null,
  spiritual_verse_text: service.spiritual_verse_text ?? null,
  status: service.status ?? 'draft',
  created_at: service.created_at ?? nowISO(),
  updated_at: service.updated_at ?? nowISO(),
  published_at: service.published_at ?? null,
  series_id: service.series_id ?? null,
}));

const serviceSlotsRows: TableRows<'service_slots'>[] = SLOTS_SEED.map((slot: Insert<'service_slots'>) => ({
  id: slot.id!,
  service_id: slot.service_id ?? null,
  skill_id: slot.skill_id ?? null,
  positions_required: slot.positions_required ?? 1,
  notes: slot.notes ?? null,
}));

const assignmentsRows: TableRows<'assignments'>[] = ASSIGNMENTS_SEED.map((row: Insert<'assignments'>) => ({
  id: row.id!,
  service_id: row.service_id ?? null,
  slot_id: row.slot_id ?? null,
  profile_id: row.profile_id ?? null,
  status: row.status ?? 'present',
  cancelled_at: row.cancelled_at ?? null,
  cancelled_reason: row.cancelled_reason ?? null,
  is_paired_with: row.is_paired_with ?? null,
  is_trainee: row.is_trainee ?? false,
  created_at: row.created_at ?? nowISO(),
}));

const monthlyValidationsRows: TableRows<'monthly_validations'>[] = MONTHLY_VALIDATIONS_SEED.map(
  (row: Insert<'monthly_validations'>) => ({
    id: row.id!,
    profile_id: row.profile_id ?? null,
    organization_id: row.organization_id ?? null,
    year: row.year,
    month: row.month,
    validated_at: row.validated_at ?? nowISO(),
    created_at: nowISO(),
  }),
);

const spiritualContentRows: TableRows<'spiritual_content'>[] = SPIRITUAL_CONTENT_SEED.map(
  (row: Insert<'spiritual_content'>) => ({
    id: row.id!,
    organization_id: row.organization_id ?? null,
    content_type: row.content_type ?? 'weekly_thought',
    title: row.title ?? null,
    verse_text: row.verse_text,
    verse_reference: row.verse_reference ?? null,
    scheduled_for: row.scheduled_for ?? null,
    published_at: row.published_at ?? null,
    status: row.status ?? 'draft',
    service_id: row.service_id ?? null,
    created_at: row.created_at ?? nowISO(),
  }),
);

const buildInitialCache = (): { [K in TableKey]: TableRows<K>[] } => ({
  organizations: organizationsRows,
  profiles: profilesRows,
  skills: skillsRows,
  member_skills: memberSkillsRows,
  services: servicesRows,
  service_slots: serviceSlotsRows,
  assignments: assignmentsRows,
  availabilities: [],
  monthly_validations: monthlyValidationsRows,
  appreciations: [],
  spiritual_content: spiritualContentRows,
  push_subscriptions: [],
  bible_verses: [],
});

// Le cache est clonable et réinitialisable — utile pour isoler les tests (chaque requête réelle
// a sa propre base, mais le mock partage ce cache au niveau module).
let tableCache: { [K in TableKey]: TableRows<K>[] } = structuredClone(buildInitialCache());

/**
 * Réinitialise le cache du mock à son état seed. À appeler dans beforeEach des tests qui mutent.
 */
export const __resetMockData = () => {
  tableCache = structuredClone(buildInitialCache());
};

type OrderSpec = { column: string; ascending: boolean };

class QueryBuilder<T extends TableKey> {
  private filters: Array<(row: TableRows<T>) => boolean> = [];
  private orderSpec: OrderSpec | null = null;
  private limitN: number | null = null;

  constructor(private readonly table: T) {}

  select(_columns?: string) {
    void _columns;
    return this;
  }

  eq(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  neq(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] !== value);
    return this;
  }

  in(column: keyof TableRows<T>, values: unknown[]) {
    const set = new Set(values);
    this.filters.push(row => set.has(row[column] as unknown));
    return this;
  }

  gte(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => (row[column] as unknown as number) >= (value as number));
    return this;
  }

  lte(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => (row[column] as unknown as number) <= (value as number));
    return this;
  }

  is(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderSpec = { column, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  async single(): Promise<SingleResult<TableRows<T>>> {
    const { data, error } = await this.execute();
    if (error) {
      return { data: null, error };
    }
    const [first] = data ?? [];
    if (!first) {
      return { data: null, error: new Error('No rows returned') };
    }
    return { data: first, error: null };
  }

  async maybeSingle(): Promise<SingleResult<TableRows<T>>> {
    const { data, error } = await this.execute();
    if (error) {
      return { data: null, error };
    }
    return { data: data?.[0] ?? null, error: null };
  }

  then<TResult1 = SelectResult<TableRows<T>>, TResult2 = never>(
    onfulfilled?: ((value: SelectResult<TableRows<T>>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null,
  ) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.execute().finally(onfinally);
  }

  private execute(): Promise<SelectResult<TableRows<T>>> {
    let data = this.applyFilters();
    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      data = [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[column];
        const bv = (b as Record<string, unknown>)[column];
        if (av === bv) return 0;
        if (av == null) return ascending ? -1 : 1;
        if (bv == null) return ascending ? 1 : -1;
        return ascending ? (av < bv ? -1 : 1) : av < bv ? 1 : -1;
      });
    }
    if (this.limitN != null) {
      data = data.slice(0, this.limitN);
    }
    return Promise.resolve({ data, error: null });
  }

  private applyFilters() {
    const rows = tableCache[this.table] as TableRows<T>[];
    if (!this.filters.length) {
      return [...rows];
    }
    return rows.filter(row => this.filters.every(filter => filter(row)));
  }
}

// ---------- Mutations basiques (insert / update / delete / upsert) ----------

class UpdateBuilder<T extends TableKey> {
  private filters: Array<(row: TableRows<T>) => boolean> = [];

  constructor(private readonly table: T, private readonly patch: Partial<TableRows<T>>) {}

  eq(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  in(column: keyof TableRows<T>, values: unknown[]) {
    const set = new Set(values);
    this.filters.push(row => set.has(row[column] as unknown));
    return this;
  }

  select(_columns?: string) {
    void _columns;
    return this;
  }

  async single(): Promise<MutationResult<TableRows<T>>> {
    const { data } = await this.execute();
    return { data: data?.[0] ?? null, error: null };
  }

  then<TResult1 = MutationResult<TableRows<T>[]>, TResult2 = never>(
    onfulfilled?: ((value: MutationResult<TableRows<T>[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.execute().finally(onfinally);
  }

  private async execute(): Promise<MutationResult<TableRows<T>[]>> {
    const rows = tableCache[this.table] as TableRows<T>[];
    if (this.filters.length === 0) {
      return { data: [], error: null };
    }
    const updated: TableRows<T>[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (this.filters.every(filter => filter(rows[i]))) {
        const next = { ...rows[i], ...(this.patch as Record<string, unknown>) } as TableRows<T>;
        rows[i] = next;
        updated.push(next);
      }
    }
    return { data: updated, error: null };
  }
}

class DeleteBuilder<T extends TableKey> {
  private filters: Array<(row: TableRows<T>) => boolean> = [];

  constructor(private readonly table: T) {}

  eq(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  in(column: keyof TableRows<T>, values: unknown[]) {
    const set = new Set(values);
    this.filters.push(row => set.has(row[column] as unknown));
    return this;
  }

  then<TResult1 = MutationResult<TableRows<T>[]>, TResult2 = never>(
    onfulfilled?: ((value: MutationResult<TableRows<T>[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.execute().finally(onfinally);
  }

  private async execute(): Promise<MutationResult<TableRows<T>[]>> {
    const rows = tableCache[this.table] as TableRows<T>[];
    if (this.filters.length === 0) {
      // pas de delete sans filtre : trop dangereux, on no-op
      return { data: [], error: null };
    }
    const remaining: TableRows<T>[] = [];
    const removed: TableRows<T>[] = [];
    for (const row of rows) {
      if (this.filters.every(filter => filter(row))) {
        removed.push(row);
      } else {
        remaining.push(row);
      }
    }
    (tableCache[this.table] as TableRows<T>[]) = remaining;
    return { data: removed, error: null };
  }
}

const nowFallback = () => new Date().toISOString();

const generateUuid = () => {
  // Implémentation minimaliste — pas crypto-grade mais suffit pour le mock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoGlobal = (globalThis as any).crypto;
  if (cryptoGlobal?.randomUUID) return cryptoGlobal.randomUUID() as string;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const insertRowsSync = <T extends TableKey>(
  table: T,
  values: Partial<TableRows<T>> | Partial<TableRows<T>>[],
): TableRows<T>[] => {
  const rows = Array.isArray(values) ? values : [values];
  const inserted: TableRows<T>[] = [];
  for (const value of rows) {
    const row = {
      ...(value as Record<string, unknown>),
    } as Record<string, unknown>;
    if (!row.id) row.id = generateUuid();
    if (!row.created_at && 'created_at' in (tableCache[table][0] ?? {})) row.created_at = nowFallback();
    inserted.push(row as TableRows<T>);
  }
  (tableCache[table] as TableRows<T>[]).push(...inserted);
  return inserted;
};

class InsertBuilder<T extends TableKey> {
  private rowsInserted: TableRows<T>[] | null = null;

  constructor(private readonly table: T, private readonly values: Partial<TableRows<T>> | Partial<TableRows<T>>[]) {}

  private ensureInserted(): TableRows<T>[] {
    if (this.rowsInserted === null) {
      this.rowsInserted = insertRowsSync(this.table, this.values);
    }
    return this.rowsInserted;
  }

  select(_columns?: string) {
    void _columns;
    return this;
  }

  async single(): Promise<MutationResult<TableRows<T>>> {
    const data = this.ensureInserted();
    return { data: data[0] ?? null, error: null };
  }

  then<TResult1 = MutationResult<TableRows<T>[]>, TResult2 = never>(
    onfulfilled?: ((value: MutationResult<TableRows<T>[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    const data = this.ensureInserted();
    return Promise.resolve({ data, error: null } as MutationResult<TableRows<T>[]>).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null) {
    const data = this.ensureInserted();
    return Promise.resolve({ data, error: null } as MutationResult<TableRows<T>[]>).catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null) {
    const data = this.ensureInserted();
    return Promise.resolve({ data, error: null } as MutationResult<TableRows<T>[]>).finally(onfinally);
  }
}

class TableProxy<T extends TableKey> {
  constructor(private readonly table: T) {}

  select(columns?: string) {
    const qb = new QueryBuilder(this.table);
    return qb.select(columns);
  }

  insert(values: Partial<TableRows<T>> | Partial<TableRows<T>>[]) {
    return new InsertBuilder(this.table, values);
  }

  update(patch: Partial<TableRows<T>>) {
    return new UpdateBuilder(this.table, patch);
  }

  delete() {
    return new DeleteBuilder(this.table);
  }

  upsert(values: Partial<TableRows<T>> | Partial<TableRows<T>>[], opts?: { onConflict?: string }) {
    const rows = Array.isArray(values) ? values : [values];
    const conflictKeys = opts?.onConflict?.split(',').map(s => s.trim()) ?? ['id'];
    const cache = tableCache[this.table] as TableRows<T>[];
    const result: TableRows<T>[] = [];
    for (const row of rows) {
      const idx = cache.findIndex(existing =>
        conflictKeys.every(k => (existing as Record<string, unknown>)[k] === (row as Record<string, unknown>)[k]),
      );
      if (idx >= 0) {
        const merged = { ...cache[idx], ...(row as Record<string, unknown>) } as TableRows<T>;
        cache[idx] = merged;
        result.push(merged);
      } else {
        const next = { ...(row as Record<string, unknown>) } as Record<string, unknown>;
        if (!next.id) next.id = generateUuid();
        cache.push(next as TableRows<T>);
        result.push(next as TableRows<T>);
      }
    }
    return Promise.resolve({ data: result, error: null } as MutationResult<TableRows<T>[]>);
  }
}

export class MockSupabaseClient {
  from = ((table: string) => new TableProxy(table as TableKey)) as unknown as SupabaseClient<Database>['from'];
}

export const createMockSupabaseClient = () => new MockSupabaseClient();
