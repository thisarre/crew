import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import { MEMBER_SKILLS_SEED, ORGANIZATION_SEED, PROFILES_SEED, SKILLS_SEED } from '@/data/seed';

type TableKey = keyof Database['public']['Tables'];
type TableRows<T extends TableKey> = Database['public']['Tables'][T]['Row'];

type SelectResult<T> = { data: T[] | null; error: Error | null };

type SingleResult<T> = { data: T | null; error: Error | null };

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

const tableCache: { [K in TableKey]: TableRows<K>[] } = {
  organizations: organizationsRows,
  profiles: profilesRows,
  skills: skillsRows,
  member_skills: memberSkillsRows,
  services: [],
  service_slots: [],
  assignments: [],
  availabilities: [],
  monthly_validations: [],
  appreciations: [],
  spiritual_content: [],
  push_subscriptions: [],
  bible_verses: [],
};

class QueryBuilder<T extends TableKey> {
  private filters: Array<(row: TableRows<T>) => boolean> = [];

  constructor(private readonly table: T) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: keyof TableRows<T>, value: unknown) {
    this.filters.push(row => row[column] === value);
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
    const data = this.applyFilters();
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

export class MockSupabaseClient {
  from = ((table: string) => new QueryBuilder(table as TableKey)) as unknown as SupabaseClient<Database>['from'];
}

export const createMockSupabaseClient = () => new MockSupabaseClient();
