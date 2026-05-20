# Règles permanentes — Projet Crew

Tu travailles sur **Crew**, une PWA pour équipes de service en église (7 membres, dimanches et semaine). Le projet est documenté dans `/SPEC.md` à la racine. Lis-le si tu manques de contexte.

## Mission
Faire en sorte que chaque membre se sente vu, valorisé et fier de servir. La chaleur prime sur l'efficacité. Le spirituel s'infuse partout, n'est jamais un module isolé.

## Stack imposé (ne pas dévier)
- **Framework** : Next.js 14 App Router
- **Langage** : TypeScript strict (zéro `any`)
- **Styling** : Tailwind CSS + shadcn/ui
- **Backend** : Supabase (auth magic link + Postgres + Realtime + Edge Functions Deno)
- **Hosting** : Vercel
- **Notifications** : Web Push API native (pas Twilio, pas Firebase)
- **Dates** : date-fns avec locale `fr`
- **Forms** : react-hook-form + zod
- **Animations** : Framer Motion
- **Icons** : Lucide React

## Langue & ton (NON-NÉGOCIABLE)
- TOUTE l'UI en français
- **Tutoiement systématique** pour les membres, jamais "vous"
- Ne jamais utiliser "bénévole" → toujours "équipe", "servir"
- Utiliser le **prénom préféré**, pas le nom complet
- Émojis dosés : max 1-2 par message UI
- Phrases courtes, verbes d'action
- Le ton admin est plus factuel mais reste bienveillant
- Exemple : "Hey Isaac, dimanche tu seras à la sono avec Chana. Tu confirmes ?" ✅
- Contre-exemple : "Service du 14/06 — confirmer ?" ❌

## Design system
- **Couleur primaire (humain)** : `warmth-500` = `#F59E0B` (ambre)
- **Couleur spirituelle** : `spirit-500` = `#10B981` (émeraude)
- **Couleur base** : palette `slate` de Tailwind
- **Border radius par défaut** : `rounded-2xl`
- **Typo titres** : `font-display` (Fraunces)
- **Typo corps** : `Inter`
- **Mobile-first iPhone 13 (390px)** : tout doit être impeccable en mobile avant le desktop
- **Pas de dark mode** au MVP — focus mode clair impeccable
- **Cards standard** : `rounded-2xl shadow-sm border border-slate-200 bg-white p-5`
- **Espacement généreux** : minimum `space-y-4` entre blocs

## Architecture
- **Server Components par défaut**, `"use client"` uniquement si nécessaire (interactivité, hooks, browser APIs)
- **App Router** strict, pas de Pages Router
- **Route groups** pour layouts : `(auth)`, `(member)`, `(admin)`
- **Mode Service Day** : route publique `/service/[id]` avec token

## Sécurité
- **RLS Supabase activée sur TOUTES les tables** sans exception
- Utiliser les helpers `current_org_id()` et `is_leader()` définis dans la migration
- **Jamais de `service_role_key` côté client** — uniquement dans les Edge Functions
- Tokens publics avec expiration pour `/service/[id]`
- Respecter le RGPD France (données personnelles minimales, droit à l'oubli via `is_active`)

## Style de code
- **Pas de `any` TypeScript** — utiliser `unknown` puis narrow, ou typer correctement
- **Composants** en PascalCase, **fichiers** en kebab-case
- **Hooks custom** préfixés `use`
- **Imports absolus** avec alias `@/`
- **Async/await** plutôt que `.then()`
- **Zod schemas** pour toute validation de form ou d'input API
- Commentaires en français quand explicatifs, jamais évidents

## Accessibilité
- ARIA labels sur tous les boutons icônes
- Navigation clavier fonctionnelle partout
- Contraste WCAG AA minimum
- `alt` descriptif sur toutes les images
- Focus states visibles

## États vides chaleureux (obligatoires)
Chaque liste/page doit avoir un état vide soigné :
- Pas d'indispos → "Tu es dispo tout le mois, super 🌟"
- Pas de service à venir → "Pas de service prévu — repose-toi bien 😌"
- Pas d'appréciations → "Les premiers mercis arrivent bientôt"

## Workflow Git
- Commit après chaque sous-tâche
- Messages de commit en français, format : `feat: ajoute composant ServiceCard`
- Préfixes : `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`

## Filtre de décision
Avant chaque feature, pose-toi : **"Est-ce que ce moment fait que le membre se sent vu, valorisé, fier de servir ?"** Si non → ne pas construire.