-- Automatisation admin — journal des actions automatiques (anti-spam des relances)
-- Une ligne = une notification automatique envoyée à un membre.
-- Sert à dédupliquer : on ne renotifie pas le même membre pour la même raison sans cesse.

create table automation_events (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('unvalidated_reminder', 'replacement_request')),
  subject_profile_id uuid references profiles(id) on delete cascade,
  -- clé métier qui borne la déduplication :
  --   unvalidated_reminder -> 'YYYY-MM' (mois concerné)
  --   replacement_request  -> '<slot_id>:<candidate_profile_id>'
  ref_id text not null,
  sent_at timestamptz not null default now(),
  meta jsonb not null default '{}'
);

create index idx_automation_events_lookup
  on automation_events (kind, subject_profile_id, ref_id, sent_at desc);

-- Idempotence dure de la génération : un seul service par (org, type, date).
-- Empêche un double-run du cron (ou cron + création manuelle) de créer un doublon.
create unique index uniq_service_per_day_type
  on services (organization_id, event_type, service_date);
