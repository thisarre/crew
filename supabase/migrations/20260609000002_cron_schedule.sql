-- Planification des automatisations admin via pg_cron + pg_net.
-- Le Postgres (auto-hébergé sur le NAS) appelle périodiquement les routes /api/cron/* de l'app.
--
-- PRÉREQUIS INFRA (hors migration) :
--   1. pg_cron doit être chargé via shared_preload_libraries dans postgresql.conf
--      (puis redémarrage du conteneur db). pg_net n'a besoin que de `create extension`.
--   2. L'URL de l'app doit être JOIGNABLE DEPUIS LE CONTENEUR POSTGRES : utiliser le nom
--      de service Docker + port interne (ex. http://crew-web:3000), pas localhost.
--
-- Le secret et l'URL ne sont PAS commités : ils vivent dans la table automation_config,
-- remplie manuellement après le déploiement (voir bloc commenté plus bas).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Config runtime (secret partagé + URL de base). Lisible uniquement côté serveur/DB.
create table if not exists automation_config (
  key text primary key,
  value text not null
);

-- ⚠️ À exécuter MANUELLEMENT une fois, en remplaçant les valeurs (ne pas commiter les vraies valeurs) :
--
--   insert into automation_config (key, value) values
--     ('app_base_url', 'http://crew-web:3000'),   -- URL interne au réseau Docker
--     ('cron_secret',  '<MÊME VALEUR QUE CRON_SECRET côté app>')
--   on conflict (key) do update set value = excluded.value;

-- Déclencheur générique : POST authentifié vers une route /api/cron/*.
create or replace function trigger_cron_endpoint(path text)
returns void
language plpgsql
security definer
as $$
declare
  base_url text;
  secret   text;
begin
  select value into base_url from automation_config where key = 'app_base_url';
  select value into secret   from automation_config where key = 'cron_secret';
  if base_url is null or secret is null then
    raise notice 'automation_config incomplet (app_base_url / cron_secret) — appel ignoré';
    return;
  end if;
  perform net.http_post(
    url     := base_url || path,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || secret
               ),
    body    := '{}'::jsonb
  );
end;
$$;

-- (Re)planification idempotente : on retire un job homonyme avant de le recréer.
do $$
begin
  perform cron.unschedule('crew-generate-services');
exception when others then null;
end $$;
do $$
begin
  perform cron.unschedule('crew-reminders');
exception when others then null;
end $$;

-- Génération des services : tous les lundis à 06h00.
select cron.schedule(
  'crew-generate-services',
  '0 6 * * 1',
  $$ select trigger_cron_endpoint('/api/cron/generate-services') $$
);

-- Relances : tous les jours à 07h00.
select cron.schedule(
  'crew-reminders',
  '0 7 * * *',
  $$ select trigger_cron_endpoint('/api/cron/reminders') $$
);
