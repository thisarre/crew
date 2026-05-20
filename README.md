## Crew — Gestion d'équipe technique

Application Next.js 14 / Supabase décrite dans `crew-dev-plan.md`. Suis la règle des « 3 cases » : ✅ Code · ✅ Tests · ✅ Validation humaine pour chaque feature.

### Pile technique

- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS + tokens Connectify
- Supabase (Postgres, Auth, Realtime, Storage)
- Vitest + Playwright pour les tests

## Commandes clés

```bash
npm run dev          # serveur Next.js
npm run lint         # ESLint
npm run test         # Vitest (unit + integration)
npm run test:e2e     # Playwright
npm run db:migrate   # supabase migration up
npm run db:seed      # scripts/seed.ts
```

## Supabase local

1. Installer le CLI : `npm install -g supabase`
2. Lancer les services locaux : `supabase start`
3. Appliquer le schéma : `npm run db:migrate`
4. Alimenter les données Alpha : `npm run db:seed`

Le fichier `supabase/config.toml` pointe vers l'instance locale par défaut (`127.0.0.1`). Expose les variables suivantes pour l'app et les scripts :

```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role>" # requis pour le seed
```

## Types et client Supabase

- `src/types/database.ts` contient les types générés à partir de la migration.
- `src/lib/supabase/server.ts` fournit `createClient()` (mock automatique pendant les tests via `SUPABASE_MOCK=true`).
- `src/lib/supabase/client.ts` crée le client navigateur via `@supabase/ssr`.

## Données Bible Segond 21

Par contrainte de licence, le dépôt n'embarque qu'un extrait de démonstration (`public/bible-segond21.json`).

Pour respecter la spec :

1. Récupère la Bible Segond 21 sous licence (JSON ou CSV).
2. Convertis-la au format attendu: `[{ book, chapter, verse, text, reference }]`.
3. Remplace `public/bible-segond21.json` par l'intégralité (~31k versets).

Les helpers de recherche (Sprint 6) consommeront directement ce fichier statique.
