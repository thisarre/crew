-- Initial Crew schema generated for Feature 1.2
-- Derived from crew-dev-plan.md section 3

-- Extensions
create extension if not exists "uuid-ossp";

-- Organisations (1 seule pour le MVP : l'église d'Alpha)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Profils (membres de l'équipe + admin)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  display_name text not null,
  avatar_color text default '#96D8D0',
  avatar_url text,
  initials text not null,
  phone text,
  birthday date,
  why_i_serve text,
  role text default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz default now(),
  is_active boolean default true,
  device_locked_until timestamptz,
  device_id text
);

create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(role);

-- Compétences (Sono, Caméra, Diffusion + extensibles)
create table skills (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  icon_name text,
  color text,
  display_order integer default 0
);

-- Compétences des membres (avec niveau)
create table member_skills (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  level text not null check (level in ('learning', 'autonomous', 'trainer')),
  trained_by uuid references profiles(id),
  trained_at date,
  updated_at timestamptz default now(),
  unique(profile_id, skill_id)
);

create index idx_member_skills_profile on member_skills(profile_id);
create index idx_member_skills_skill on member_skills(skill_id);

-- Événements (services, cultes semaine, calls d'équipe)
create table services (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  event_type text not null check (event_type in ('sunday_service', 'midweek_service', 'team_call')),
  title text,
  service_date date not null,
  start_time time not null,
  arrival_time time,
  location text,
  notes text,
  spiritual_theme text,
  spiritual_verse_ref text,
  spiritual_verse_text text,
  status text default 'draft' check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  series_id uuid
);

create index idx_services_org_date on services(organization_id, service_date);
create index idx_services_status on services(status);

-- Postes à pourvoir (1 service peut avoir plusieurs slots Sono, etc.)
create table service_slots (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete cascade,
  skill_id uuid references skills(id),
  positions_required integer default 1,
  notes text
);

-- Assignations (qui sert sur quel slot)
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete cascade,
  slot_id uuid references service_slots(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  status text default 'present' check (status in ('present', 'cancelled', 'pending_validation')),
  cancelled_at timestamptz,
  cancelled_reason text,
  is_paired_with uuid references assignments(id),
  is_trainee boolean default false,
  created_at timestamptz default now()
);

create index idx_assignments_service on assignments(service_id);
create index idx_assignments_profile on assignments(profile_id);
create index idx_assignments_status on assignments(status);

-- Indisponibilités déclarées
create table availabilities (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  unavailable_from date not null,
  unavailable_to date not null,
  reason text,
  created_at timestamptz default now()
);

create index idx_availabilities_profile on availabilities(profile_id);
create index idx_availabilities_dates on availabilities(unavailable_from, unavailable_to);

-- Validations mensuelles
create table monthly_validations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  validated_at timestamptz default now(),
  unique(profile_id, year, month)
);

-- Appréciations entre membres
create table appreciations (
  id uuid primary key default uuid_generate_v4(),
  from_profile_id uuid references profiles(id) on delete cascade,
  to_profile_id uuid references profiles(id) on delete cascade,
  service_id uuid references services(id),
  content text not null,
  created_at timestamptz default now()
);

create index idx_appreciations_to on appreciations(to_profile_id);
create index idx_appreciations_created on appreciations(created_at desc);

-- Contenu spirituel
create table spiritual_content (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  content_type text default 'weekly_thought' check (content_type in ('weekly_thought', 'service_theme')),
  title text,
  verse_text text not null,
  verse_reference text,
  scheduled_for timestamptz,
  published_at timestamptz,
  status text default 'draft' check (status in ('draft', 'scheduled', 'published')),
  service_id uuid references services(id),
  created_at timestamptz default now()
);

-- Notifications push
create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  device_user_agent text,
  created_at timestamptz default now(),
  unique(profile_id, endpoint)
);

-- Bible Segond 21 (table simple pour la recherche)
create table bible_verses (
  id uuid primary key default uuid_generate_v4(),
  book text not null,
  chapter integer not null,
  verse integer not null,
  text text not null,
  reference text not null,
  unique(book, chapter, verse)
);

create index idx_bible_reference on bible_verses(reference);
create index idx_bible_text_search on bible_verses using gin(to_tsvector('french', text));

-- Trigger updated_at automatique
create or replace function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger services_updated_at before update on services
  for each row execute function update_updated_at();

-- Row level security baseline
alter table profiles enable row level security;
alter table services enable row level security;
alter table assignments enable row level security;
alter table appreciations enable row level security;
alter table spiritual_content enable row level security;

create policy "Read all profiles" on profiles for select using (true);
create policy "Read published services" on services for select using (status = 'published');
create policy "Read assignments" on assignments for select using (true);
create policy "Read appreciations" on appreciations for select using (true);
create policy "Read spiritual content" on spiritual_content for select using (status in ('draft', 'scheduled', 'published'));
