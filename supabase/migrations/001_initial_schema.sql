-- =====================================================
-- CREW - Schéma initial
-- =====================================================

-- 1. ORGANIZATIONS
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  timezone text default 'Europe/Paris',
  greeting_style text default 'warm' check (greeting_style in ('warm', 'formal', 'spiritual')),
  created_at timestamptz default now()
);

-- 2. PROFILES
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  phone text,
  email text,
  avatar_url text,
  role text default 'member' check (role in ('admin', 'leader', 'member')),
  joined_at date default current_date,
  birthday date,
  why_i_serve text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. SKILLS
create table skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  icon text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table member_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  level text default 'learning' check (level in ('learning', 'autonomous', 'trainer')),
  level_reached_at timestamptz default now(),
  trained_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(profile_id, skill_id)
);

-- 4. SERVICES
create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  service_date date not null,
  start_time time not null,
  arrival_time time,
  location text,
  notes text,
  spiritual_theme text,
  status text default 'planned' check (status in ('planned', 'confirmed', 'past', 'cancelled')),
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  responded_at timestamptz,
  checked_in_at timestamptz,
  paired_with uuid references profiles(id),
  pairing_role text check (pairing_role in ('learning_from', 'training')),
  created_at timestamptz default now(),
  unique(service_id, profile_id, skill_id)
);

-- 5. UNAVAILABILITIES
create table unavailabilities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now()
);

-- 6. RECONNAISSANCE
create table appreciations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  from_profile_id uuid references profiles(id),
  to_profile_id uuid references profiles(id) on delete cascade,
  service_id uuid references services(id),
  message text not null,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table service_feedback (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  rating text check (rating in ('great', 'ok', 'issue')),
  comment text,
  created_at timestamptz default now(),
  unique(service_id, profile_id)
);

-- 7. SPIRITUEL
create table spiritual_content (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  type text not null check (type in ('verse', 'reflection', 'challenge', 'testimony')),
  title text,
  content text not null,
  reference text,
  publish_date date not null,
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table testimonies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  service_id uuid references services(id),
  content text not null,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- 8. COMMUNICATION
create table announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  author_id uuid references profiles(id),
  title text not null,
  body text not null,
  priority text default 'normal' check (priority in ('normal', 'important', 'urgent')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table announcement_reads (
  announcement_id uuid references announcements(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  read_at timestamptz default now(),
  reaction text,
  primary key (announcement_id, profile_id)
);

-- 9. NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  sent_at timestamptz default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(profile_id, endpoint)
);

-- INDEX
create index idx_services_org_date on services(organization_id, service_date);
create index idx_assignments_service on assignments(service_id);
create index idx_assignments_profile on assignments(profile_id);
create index idx_unavail_profile_dates on unavailabilities(profile_id, start_date, end_date);
create index idx_notifications_profile on notifications(profile_id, sent_at desc);
create index idx_appreciations_to on appreciations(to_profile_id, created_at desc);
create index idx_spiritual_publish on spiritual_content(organization_id, publish_date desc);

-- VUES
create or replace view member_stats as
select
  p.id as profile_id,
  p.organization_id,
  count(distinct a.service_id) filter (where s.service_date >= date_trunc('year', current_date)) as services_this_year,
  count(distinct a.service_id) filter (where s.service_date >= date_trunc('month', current_date)) as services_this_month,
  count(distinct a.id) filter (where a.checked_in_at is not null and s.service_date >= date_trunc('year', current_date)) as checkins_this_year,
  count(distinct app.id) filter (where app.created_at >= date_trunc('month', current_date)) as appreciations_received_this_month
from profiles p
left join assignments a on a.profile_id = p.id and a.status = 'confirmed'
left join services s on s.id = a.service_id
left join appreciations app on app.to_profile_id = p.id
group by p.id, p.organization_id;

-- HELPERS
create or replace function current_org_id() returns uuid as $$
  select organization_id from profiles where id = auth.uid()
$$ language sql security definer;

create or replace function is_leader() returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'leader')
  )
$$ language sql security definer;

-- RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table skills enable row level security;
alter table member_skills enable row level security;
alter table services enable row level security;
alter table assignments enable row level security;
alter table unavailabilities enable row level security;
alter table appreciations enable row level security;
alter table service_feedback enable row level security;
alter table spiritual_content enable row level security;
alter table testimonies enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;

create policy "Read own org" on profiles for select using (organization_id = current_org_id());
create policy "Read own org services" on services for select using (organization_id = current_org_id());
create policy "Read own org skills" on skills for select using (organization_id = current_org_id());
create policy "Read own org assignments" on assignments for select using (service_id in (select id from services where organization_id = current_org_id()));
create policy "Read own org appreciations" on appreciations for select using (organization_id = current_org_id());
create policy "Read own org spiritual" on spiritual_content for select using (organization_id = current_org_id());
create policy "Read own org announcements" on announcements for select using (organization_id = current_org_id());
create policy "Read own org member_skills" on member_skills for select using (profile_id in (select id from profiles where organization_id = current_org_id()));
create policy "Read own org testimonies" on testimonies for select using (organization_id = current_org_id());
create policy "Read own org announcement_reads" on announcement_reads for select using (profile_id in (select id from profiles where organization_id = current_org_id()));

create policy "Manage own unavailabilities" on unavailabilities for all using (profile_id = auth.uid());
create policy "Manage own feedback" on service_feedback for all using (profile_id = auth.uid());
create policy "Manage own announcement_reads" on announcement_reads for all using (profile_id = auth.uid());
create policy "Send appreciations" on appreciations for insert with check (from_profile_id = auth.uid() and organization_id = current_org_id());
create policy "Read own notifications" on notifications for select using (profile_id = auth.uid());
create policy "Update own notifications" on notifications for update using (profile_id = auth.uid());
create policy "Manage own push subs" on push_subscriptions for all using (profile_id = auth.uid());
create policy "Confirm own assignments" on assignments for update using (profile_id = auth.uid());
create policy "Submit own testimonies" on testimonies for insert with check (profile_id = auth.uid() and organization_id = current_org_id());

create policy "Leaders manage services" on services for all using (organization_id = current_org_id() and is_leader());
create policy "Leaders manage assignments" on assignments for all using (is_leader());
create policy "Leaders manage spiritual" on spiritual_content for all using (organization_id = current_org_id() and is_leader());
create policy "Leaders manage announcements" on announcements for all using (organization_id = current_org_id() and is_leader());
create policy "Leaders manage skills" on skills for all using (organization_id = current_org_id() and is_leader());
create policy "Leaders manage member_skills" on member_skills for all using (is_leader());
create policy "Leaders manage profiles" on profiles for update using (organization_id = current_org_id() and is_leader());
