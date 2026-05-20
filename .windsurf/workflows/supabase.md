---
description: Travail sur Supabase (migrations, RLS, Edge Functions, queries)
---

Tu vas travailler sur la couche Supabase du projet Crew.

## Contexte projet
- Multi-tenant via `organization_id` sur toutes les tables principales
- Helpers SQL existants : `current_org_id()` et `is_leader()` (voir migration `001_initial_schema.sql`)
- 14 tables principales (voir `/SPEC.md` Partie 4)
- Edge Functions en Deno, déployées via `supabase functions deploy`
- pg_cron pour les jobs schedulés

## Règles strictes RLS
- TOUTES les tables ont RLS activée (`alter table X enable row level security`)
- Lecture : filtrer par `organization_id = current_org_id()` ou via jointure
- Écriture : permissions selon le rôle (`is_leader()` pour les actions admin)
- Auto-gestion : un user peut écrire sur ses propres lignes via `profile_id = auth.uid()`
- **Jamais** de policy "Allow all" ou "Public read" sauf justification documentée
- Tester chaque policy en imaginant 3 cas : membre lambda, leader, user d'une autre org

## Règles migrations
- Toujours dans `supabase/migrations/NNN_description.sql`
- Numérotation séquentielle (002, 003, ...)
- Idempotent quand possible (`create table if not exists`, `create index if not exists`)
- Pas de modification destructive sans `down migration` documentée
- Toujours inclure les RLS policies dans la même migration que la table

## Règles Edge Functions
- Deno (pas Node.js)
- Stockage dans `supabase/functions/NOM/index.ts`
- Utiliser `SUPABASE_SERVICE_ROLE_KEY` depuis l'env, **jamais hardcodé**
- CORS configuré si appelée depuis le client
- Logs explicites (`console.log`) pour le debug Supabase Dashboard
- Schedulées via pg_cron en SQL :
  \`\`\`sql
  select cron.schedule('lundi-spirituel', '0 9 * * 1', $$ ... $$);
  \`\`\`

## Règles queries client
- Utiliser le client Supabase typé depuis `src/lib/supabase/`
- Server queries → `createServerClient` depuis `server.ts`
- Client queries → `createClient` depuis `client.ts`
- Toujours gérer les erreurs : `if (error) ...`
- Toujours typer le retour (générer les types via `supabase gen types typescript`)

## Sécurité non-négociable
- **JAMAIS** la `service_role_key` côté client
- Tokens publics (Service Day) : générer un JWT court ou un slug aléatoire en table dédiée avec expiration
- Données personnelles : préférer soft delete via `is_active = false` plutôt que vrai `delete`
- Conformité RGPD : log des accès admin si nécessaire

## Tâche
[Décris ici la tâche : migration, RLS, edge function, query...]

## Modèle conseillé
**Claude Sonnet 4.6 (2 crédits)** — la couche sécurité Supabase mérite la qualité supérieure. GPT-5.1-Codex (0 cr) est risqué sur les RLS (erreurs subtiles fréquentes). Opus 4.6 (6 cr) uniquement si bug RLS incompréhensible.