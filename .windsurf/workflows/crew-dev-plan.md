# Crew — Plan de développement complet

> **App de gestion d'équipe production pour église — PWA Next.js 14 + Supabase**
> **Équipe : Alpha (admin) + 6 membres (Chana, Isaac, Chrisciana, Dave, Stéphanie, Gloria)**
> **Mission : "Se sentir vu, valorisé, fier de servir."**

---

## ⚠️ Instructions critiques pour l'agent (Windsurf / Claude Code)

### Règle d'or
**Avant de commencer une nouvelle fonctionnalité, l'agent DOIT revenir vérifier que la fonctionnalité précédente est complète selon les 3 critères :**

1. ✅ **Code écrit et fonctionnel**
2. ✅ **Tests automatisés écrits et passants** (Vitest + Playwright)
3. ✅ **Validation humaine** (Alpha a coché la checklist + validé les scénarios narratifs)

**Aucune feature n'est "terminée" tant que ces 3 cases ne sont pas cochées.** L'agent doit lire le statut dans ce fichier et mettre à jour les cases au fur et à mesure.

### Cycle de travail par fonctionnalité

```
1. L'agent lit la spec de la fonctionnalité
2. Il code l'implémentation
3. Il écrit les tests automatisés
4. Il lance `npm run test` ET `npm run test:e2e` → tout doit passer
5. Il met à jour le statut "Code ✅ Tests ✅"
6. Il prévient Alpha : "Cette feature est prête pour ta validation humaine"
7. Alpha exécute la checklist + scénarios → coche manuellement
8. Une fois validé → "Validé ✅" et passage à la suivante
```

### Tests : philosophie

- **Pragmatique > Exhaustif** : on teste la logique métier (assignations, IA, validation mensuelle) et les flows critiques. Pas chaque clic.
- **Coverage cible** : 60-70%
- **Stack** : Vitest (unitaires + intégration), React Testing Library (composants), Playwright (E2E), MSW (mock Supabase)
- **Convention** : un test cassé bloque le merge

---

## Table des matières

1. [Stack technique et setup](#1-stack-technique-et-setup)
2. [Design System Connectify](#2-design-system-connectify)
3. [Schéma de base de données Supabase](#3-schéma-de-base-de-données-supabase)
4. [Architecture du projet](#4-architecture-du-projet)
5. [Conventions de test](#5-conventions-de-test)
6. **[Sprint 1 — Foundation + Auth + Profile Picker](#sprint-1--foundation--auth--profile-picker)**
7. **[Sprint 2 — Dashboard membre + Calendrier](#sprint-2--dashboard-membre--calendrier)**
8. **[Sprint 3 — Mode Service Day + Console admin](#sprint-3--mode-service-day--console-admin)**
9. **[Sprint 4 — Détail service + Assignations + IA](#sprint-4--détail-service--assignations--ia)**
10. **[Sprint 5 — Gestion équipe + Création événement](#sprint-5--gestion-équipe--création-événement)**
11. **[Sprint 6 — Contenu spirituel + PWA + Polish](#sprint-6--contenu-spirituel--pwa--polish)**
12. [Prompts Midjourney pour assets](#prompts-midjourney-pour-assets)
13. [Tableau de suivi global](#tableau-de-suivi-global)

---

## 1. Stack technique et setup

### Stack imposée

```yaml
Framework: Next.js 14 (App Router, TypeScript strict)
Database: Supabase (Postgres + Auth + Realtime + Storage)
Style: Tailwind CSS + CSS custom properties (variables)
Animations: Framer Motion v11+
Icons: Tabler Icons React (@tabler/icons-react)
Fonts: Gilroy (via @next/font/local)
State: React Query (TanStack Query v5) + Zustand pour UI state
Forms: React Hook Form + Zod
PWA: next-pwa
Push: Web Push API + Supabase Edge Functions
Tests: Vitest + React Testing Library + Playwright + MSW
Deploy: Vercel (recommandé) ou Railway
```

### Setup initial

```bash
# Création du projet
npx create-next-app@latest crew --typescript --tailwind --app --src-dir --import-alias "@/*"
cd crew

# Dependencies principales
npm install @supabase/supabase-js @supabase/ssr
npm install framer-motion @tabler/icons-react
npm install @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npm install next-pwa
npm install date-fns

# Dependencies dev (tests)
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D msw @mswjs/data
npm install -D @types/node

# Initialisation Playwright
npx playwright install
```

### Variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Codes d'accès
TEAM_CODE=4729
ADMIN_CODE=9182

# Push notifications (Web Push)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:alpha@example.com
```

### Scripts package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

---

## 2. Design System Connectify

### Palette de couleurs

```css
:root {
  /* Pastels signature Connectify */
  --color-sage: #DAF4AA;       /* Vert pastel — actions positives, célébration */
  --color-mint: #96D8D0;       /* Menthe — informatif neutre */
  --color-lilac: #D2B4F1;      /* Lilas — catégorie call/spirituel */

  /* Neutres */
  --color-ink: #16161B;        /* Quasi-noir — texte principal, CTA forts */
  --color-bg: #F4F4F2;         /* Beige cassé — fond app */
  --color-bg-soft: #DDDDDA;    /* Bg device frame */
  --color-white: #FFFFFF;      /* Cards */
  --color-text-secondary: #6B6B6F;  /* Texte secondaire */
  --color-text-muted: #9C9CA0; /* Texte tertiaire, dates */
  --color-border: #DDDDDA;     /* Bordures */
  --color-border-soft: #EEEEEC; /* Bordures internes */

  /* Sémantiques (jamais agressifs) */
  --color-error-bg: #FCEBEB;
  --color-error-fg: #A32D2D;
  --color-warning-bg: #FAEEDA;
  --color-warning-fg: #854F0B;
}
```

**Règle stricte** : pas de couleur "vive" ou agressive. Le rouge des erreurs reste tamisé.

### Typographie

```css
/* Police principale : Gilroy (à acheter ou alternative similaire : Inter, Plus Jakarta Sans) */
font-family: 'Gilroy', -apple-system, 'Segoe UI', sans-serif;

/* Échelle typographique */
--text-xs: 10px;
--text-sm: 11px;
--text-base: 13px;
--text-md: 14px;
--text-lg: 17px;
--text-xl: 22px;
--text-2xl: 28px;
--text-3xl: 38px;

/* Weights */
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Line-heights */
--lh-tight: 1.15;
--lh-normal: 1.4;
--lh-relaxed: 1.5;

/* Letter-spacing */
--ls-tight: -0.5px;  /* Titres */
--ls-caps: 0.5px;    /* Labels uppercase */
```

### Border radius

```css
--radius-xs: 8px;      /* Petits éléments */
--radius-sm: 10px;     /* Boutons icônes */
--radius-md: 12px;     /* Champs, badges large */
--radius-lg: 14px;     /* Cards intérieures */
--radius-xl: 18px;     /* Cards secondaires */
--radius-2xl: 22px;    /* Cards principales */
--radius-3xl: 28px;    /* Hero blocks */
--radius-full: 100px;  /* Pills, avatars, boutons */
```

### Spacings

```css
--space-1: 4px;
--space-2: 6px;
--space-3: 8px;
--space-4: 10px;
--space-5: 12px;
--space-6: 14px;
--space-7: 16px;
--space-8: 18px;
--space-9: 20px;
--space-10: 24px;
--space-12: 32px;
--space-16: 48px;
```

### Animations — Easing signature

```ts
// lib/animations.ts
export const easings = {
  premium: [0.16, 1, 0.3, 1] as const,  // ease-out-expo, signature iOS/Linear
  smooth: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring', stiffness: 400, damping: 30 } as const,
};

export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  storytelling: 0.5,
};

// Variants Framer Motion partagés
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easings.premium } },
  exit: { opacity: 0, y: -8 },
};

export const stagger = (delay = 0.07) => ({
  animate: { transition: { staggerChildren: delay } },
});

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: durations.normal, ease: easings.premium } },
};

export const slideUpModal = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easings.premium } },
  exit: { opacity: 0, y: 40 },
};
```

### Composants types — Inventaire

```yaml
Layout:
  - DeviceFrame (mobile 390px)
  - BottomNav (membre 2-3 onglets / admin 4 onglets)
  - PageHeader
  - BottomSheet (modal qui glisse depuis le bas)

Buttons:
  - Button.Primary (ink bg, white text, radius-full)
  - Button.Secondary (transparent, border, gray text)
  - Button.Sage (sage bg, ink text)
  - Button.Ghost (no border, no bg)
  - Button.Icon (round 44x44)
  - FAB (Floating Action Button, sage glow animation)

Cards:
  - Card.Base (white bg, radius-2xl)
  - Card.Hero (with illustration heading)
  - Card.Action (with CTA at bottom)
  - Card.Member (avatar + name + skills + stats)
  - Card.Event (with countdown badge)

Forms:
  - Input.Text
  - Input.Time (segmented)
  - Input.Date
  - SelectChip (chip-based selector)
  - PinInput (4 digits)
  - Toggle

Feedback:
  - Badge (sage / mint / lilac / sage-error / warning)
  - Alert (rouge tamisé / ambre)
  - Toast (top-right slide)
  - Progress (circle SVG + linear)
  - Skeleton (pulse loader)

Display:
  - Avatar (circle, colored bg, initials, optional badge)
  - AvatarStack (overlapping avatars)
  - StatTile (number + label)
  - MiniCalendar (month grid with colored dots)

Special:
  - SwipeCard (validation mensuelle, threshold 70px)
  - AIProposal (shimmer animated border)
  - ServiceDayHero (black countdown bloc)
```

### Iconographie

**Tabler Icons** exclusivement (@tabler/icons-react). Aucune autre librairie.

```tsx
import {
  IconHome, IconCalendar, IconUsers, IconSparkles, IconBell,
  IconCheck, IconX, IconArrowLeft, IconArrowRight,
  IconHeadphones, IconVideo, IconDeviceTv,
  IconHeart, IconMessageCircle, IconPhone, IconMapPin,
  IconClock, IconClockPlay, IconClockCheck, IconBuilding,
  IconNavigation, IconKey, IconEye, IconPencil,
  IconAlertCircle, IconBackspace, IconSeedling,
  IconPlus, IconChevronRight, IconChevronLeft, IconChevronDown,
  IconBook, IconBookmark, IconSend, IconDots, IconDotsVertical,
  IconLayoutGrid, IconChurch, IconTrophy, IconCake, IconSearch
} from '@tabler/icons-react';
```

### Patterns d'animation premium

```yaml
Page entry:
  - Stagger des blocs (50-100ms entre chacun)
  - fadeUp 500ms ease premium

Tap interactions:
  - scale 0.96 + spring back (115ms)
  - Pas de hover sur mobile, seulement focus

Hover (desktop):
  - translateY(-2px) sur cards
  - Borders qui foncent légèrement

Notifications/badges:
  - Pulse infini sur les dots de notification (3s)
  - Ping radial sur badges urgents (2s)

CTA importants:
  - Glow shadow infinite (FAB)
  - Shimmer border sur propositions IA (4s linear)

Transitions d'écran:
  - Bottom sheet: slideUp 350ms
  - Page change: fade + translateX dans Next.js

Confirmations:
  - Checkmark pop animation (rotation -45° → 0° + scale 0 → 1.2 → 1)
  - Couleur change de neutre vers sage
```

### Règles d'or visuelles

1. **Pas de bordures sauf nécessaire** — on utilise les fonds colorés pour distinguer
2. **Radius généreux** — toujours 18px+ sur les cards, 100px sur les pills
3. **Padding interne minimum** — 16px pour cards principales, 12px pour secondaires
4. **Couleurs jamais saturées** — toujours pastels ou neutres profonds
5. **Texte principal = ink** — jamais de gris pour le texte principal
6. **Hiérarchie par contraste** — pas par taille seulement
7. **Animations partout mais discrètes** — la signature Connectify
8. **Avatars colorés par membre** mais cohérents avec la palette

---

## 3. Schéma de base de données Supabase

### Migration initiale

```sql
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
  avatar_color text default '#96D8D0',  -- couleur de fond pour avatar
  avatar_url text,  -- URL Midjourney quand uploadée
  initials text not null,  -- "C", "Cs", "I", etc.
  phone text,
  birthday date,
  why_i_serve text,  -- "Pourquoi je sers" (citation)
  role text default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz default now(),
  is_active boolean default true,
  device_locked_until timestamptz,  -- pour le device locking 30 jours
  device_id text  -- identifiant du device verrouillé
);

create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(role);

-- Compétences (Sono, Caméra, Diffusion + extensibles)
create table skills (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,  -- "Sono", "Caméra", "Diffusion"
  icon_name text,  -- "headphones", "video", "device-tv"
  color text,  -- "#DAF4AA", "#96D8D0", "#D2B4F1"
  display_order integer default 0
);

-- Compétences des membres (avec niveau)
create table member_skills (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  level text not null check (level in ('learning', 'autonomous', 'trainer')),
  trained_by uuid references profiles(id),  -- qui a formé (traçabilité interne)
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
  title text,  -- optionnel, calculé automatiquement si null
  service_date date not null,
  start_time time not null,
  arrival_time time,  -- null pour les calls
  location text,
  notes text,
  spiritual_theme text,
  spiritual_verse_ref text,  -- "Psaume 133:1"
  spiritual_verse_text text,  -- texte complet du verset
  status text default 'draft' check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  series_id uuid  -- pour grouper les événements d'une série
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
  cancelled_reason text,  -- "Je ne pourrai pas" par défaut, optionnel
  is_paired_with uuid references assignments(id),  -- pour apprenti + autonome
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
  reason text,  -- "Vacances", "Pro", etc. (optionnel)
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
  service_id uuid references services(id),  -- optionnel, lié à un service
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
  verse_reference text,  -- "1 Pierre 4:10"
  scheduled_for timestamptz,  -- date de publication programmée
  published_at timestamptz,
  status text default 'draft' check (status in ('draft', 'scheduled', 'published')),
  service_id uuid references services(id),  -- si lié à un service spécifique
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
  reference text not null,  -- "Psaume 133:1"
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
```

### Row Level Security (RLS)

```sql
-- Approche simplifiée : pas d'auth Supabase individuelle pour les membres
-- Le code équipe (4729) et code admin (9182) sont vérifiés côté server

-- Activation RLS
alter table profiles enable row level security;
alter table services enable row level security;
alter table assignments enable row level security;
alter table appreciations enable row level security;
alter table spiritual_content enable row level security;

-- Policy permissive pour l'anon key (auth gérée par middleware Next.js)
-- En production, on créerait un service role qui vérifie le code côté server
create policy "Read all" on profiles for select using (true);
create policy "Read all services" on services for select using (status = 'published');
-- etc.
```

### Données de seed initial

```typescript
// scripts/seed.ts
const ORG_ID = 'b8e2c1d4-5a3f-4e8a-9b2c-1d4e5f6a7b8c';

const profiles = [
  { initials: 'A', display_name: 'Alpha', role: 'admin', avatar_color: '#16161B' },
  { initials: 'C', display_name: 'Chana', avatar_color: '#96D8D0' },
  { initials: 'I', display_name: 'Isaac', avatar_color: '#D2B4F1' },
  { initials: 'Cs', display_name: 'Chrisciana', avatar_color: '#DAF4AA' },
  { initials: 'D', display_name: 'Dave', avatar_color: '#D2B4F1' },
  { initials: 'S', display_name: 'Stéphanie', avatar_color: '#96D8D0' },
  { initials: 'G', display_name: 'Gloria', avatar_color: '#DAF4AA' },
];

const skills = [
  { name: 'Sono', icon_name: 'headphones', color: '#DAF4AA', display_order: 1 },
  { name: 'Caméra', icon_name: 'video', color: '#96D8D0', display_order: 2 },
  { name: 'Diffusion', icon_name: 'device-tv', color: '#D2B4F1', display_order: 3 },
];

const memberSkills = [
  // Isaac
  { member: 'Isaac', skill: 'Sono', level: 'autonomous' },
  // Chana
  { member: 'Chana', skill: 'Caméra', level: 'autonomous' },
  { member: 'Chana', skill: 'Diffusion', level: 'learning' },
  // Chrisciana
  { member: 'Chrisciana', skill: 'Diffusion', level: 'autonomous' },
  // Dave
  { member: 'Dave', skill: 'Diffusion', level: 'autonomous' },
  // Stéphanie
  { member: 'Stéphanie', skill: 'Caméra', level: 'learning' },
  { member: 'Stéphanie', skill: 'Diffusion', level: 'learning' },
  // Gloria
  { member: 'Gloria', skill: 'Sono', level: 'learning' },
  { member: 'Gloria', skill: 'Caméra', level: 'autonomous' },
];
```

---

## 4. Architecture du projet

### Structure des dossiers

```
crew/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # Layout sans nav
│   │   │   ├── page.tsx            # Profile Picker
│   │   │   └── code/
│   │   │       └── page.tsx        # Saisie de code
│   │   ├── (member)/
│   │   │   ├── layout.tsx          # Avec bottom nav membre
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx        # Vue mensuelle consultation
│   │   │   │   └── validate/
│   │   │   │       └── page.tsx    # Validation initiale
│   │   │   └── service-day/
│   │   │       └── page.tsx        # Mode Service Day
│   │   ├── (admin)/
│   │   │   ├── layout.tsx          # Avec bottom nav admin
│   │   │   ├── page.tsx            # Dashboard admin
│   │   │   ├── services/
│   │   │   │   ├── page.tsx        # Liste services
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx    # Création événement
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Détail service + assignations
│   │   │   ├── team/
│   │   │   │   ├── page.tsx        # Liste équipe
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Fiche membre
│   │   │   └── spiritual/
│   │   │       └── page.tsx        # Contenu spirituel
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── verify-code/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── propose-team/route.ts
│   │   │   │   └── propose-replacement/route.ts
│   │   │   └── push/
│   │   │       ├── subscribe/route.ts
│   │   │       └── send/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Composants génériques (Button, Card, etc.)
│   │   ├── layout/                 # DeviceFrame, BottomNav, PageHeader
│   │   ├── member/                 # Composants spécifiques membre
│   │   ├── admin/                  # Composants spécifiques admin
│   │   └── shared/                 # Composants partagés (Avatar, etc.)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Client browser
│   │   │   ├── server.ts           # Client server
│   │   │   └── middleware.ts
│   │   ├── ai/
│   │   │   ├── assignment-scorer.ts  # Logique de scoring pour reco
│   │   │   └── team-builder.ts       # Compose une équipe
│   │   ├── animations.ts
│   │   ├── auth.ts                 # Vérification codes, device locking
│   │   ├── push.ts                 # Web Push helpers
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-profile.ts
│   │   ├── use-services.ts
│   │   └── use-assignments.ts
│   ├── store/
│   │   ├── auth-store.ts           # Zustand : profil actif, session
│   │   └── ui-store.ts             # Modals, toasts
│   ├── types/
│   │   └── database.ts             # Types générés par Supabase
│   └── middleware.ts               # Auth middleware Next.js
├── public/
│   ├── icons/                      # Icons PWA
│   ├── images/
│   │   ├── avatars/                # 7 avatars Midjourney
│   │   └── skills/                 # 3 illustrations
│   ├── bible-segond21.json         # Bible embarquée (3 Mo)
│   ├── manifest.json
│   └── sw.js                       # Service Worker
├── tests/
│   ├── unit/                       # Tests unitaires Vitest
│   ├── integration/                # Tests intégration
│   ├── e2e/                        # Tests Playwright
│   └── fixtures/                   # Données de test
├── supabase/
│   ├── migrations/                 # SQL migrations
│   └── seed.sql
├── scripts/
│   └── seed.ts                     # Seed initial des données
├── .env.local
├── playwright.config.ts
├── vitest.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 5. Conventions de test

### Vitest — Tests unitaires et intégration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.config.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Playwright — Tests E2E

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Structure d'un test type

```typescript
// tests/unit/lib/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { verifyTeamCode, verifyAdminCode } from '@/lib/auth';

describe('Auth — Code verification', () => {
  beforeEach(() => {
    process.env.TEAM_CODE = '4729';
    process.env.ADMIN_CODE = '9182';
  });

  it('accepts the correct team code', () => {
    expect(verifyTeamCode('4729')).toBe(true);
  });

  it('rejects incorrect team code', () => {
    expect(verifyTeamCode('0000')).toBe(false);
  });

  it('distinguishes admin code from team code', () => {
    expect(verifyAdminCode('9182')).toBe(true);
    expect(verifyAdminCode('4729')).toBe(false);
  });
});
```

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('member can login with team code', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Qui es-tu ?')).toBeVisible();

    await page.getByRole('button', { name: /Chana/i }).click();
    await expect(page.getByText('Salut Chana')).toBeVisible();

    // Entrer le code 4729
    for (const digit of '4729') {
      await page.getByRole('button', { name: digit }).click();
    }

    await expect(page.getByText('Bienvenue Chana')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);  // dashboard membre
  });

  test('wrong code shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Chana/i }).click();

    for (const digit of '0000') {
      await page.getByRole('button', { name: digit }).click();
    }

    await expect(page.getByText(/Mauvais code/i)).toBeVisible();
  });
});
```

### Conventions de nommage

- **Unitaires** : `tests/unit/[module]/[file].test.ts`
- **Intégration** : `tests/integration/[feature]/[scenario].test.ts`
- **E2E** : `tests/e2e/[user-journey].spec.ts`

### Coverage targets par feature

```yaml
Critique (90%+):
  - Logique d'auth (vérification codes, device lock)
  - Algorithme IA d'assignation
  - Validation mensuelle
  - Calcul des disponibilités

Important (70%+):
  - Composants UI critiques (SwipeCard, PinInput)
  - API routes
  - Hooks (use-services, use-assignments)

Nice-to-have (40%+):
  - Composants présentationnels
  - Layouts
```

---

# Sprint 1 — Foundation + Auth + Profile Picker

**Objectif** : Avoir un projet Next.js déployable avec Supabase configuré, le seed initial, le Profile Picker fonctionnel et l'auth par code qui marche.

**Durée estimée** : 1 semaine
**Pré-requis** : Compte Supabase créé, Vercel/Railway prêt pour deploy

---

## Feature 1.1 — Setup initial du projet

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Créer le projet Next.js 14 avec App Router + TypeScript strict
2. Installer toutes les dépendances de la stack
3. Configurer Tailwind avec les CSS custom properties Connectify
4. Setup Supabase (créer le projet, récupérer les clés, initialiser CLI)
5. Créer la structure de dossiers décrite section 4
6. Configurer ESLint + Prettier
7. Configurer Vitest + Playwright + MSW
8. Premier déploiement Vercel (page d'accueil minimaliste)

### Tests automatisés

```typescript
// tests/unit/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('Smoke tests', () => {
  it('imports work', async () => {
    const { cn } = await import('@/lib/utils');
    expect(cn).toBeDefined();
  });

  it('environment variables are loaded', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });
});

// tests/e2e/smoke.spec.ts
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Crew/);
});
```

### ✅ Checklist humaine (Alpha)

- [ ] Je peux lancer `npm run dev` sans erreur
- [ ] La page http://localhost:3000 s'affiche
- [ ] `npm run test` passe (smoke tests)
- [ ] `npm run test:e2e` passe (smoke tests)
- [ ] Le déploiement Vercel fonctionne et est accessible
- [ ] Variables d'env sont en place sur Vercel

---

## Feature 1.2 — Schéma Supabase + Seed

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Écrire la migration SQL complète (cf. section 3)
2. Activer RLS sur les tables sensibles
3. Créer le script de seed avec :
   - 1 organisation
   - 7 profils (Alpha + 6 membres)
   - 3 skills (Sono, Caméra, Diffusion)
   - 9 member_skills (cf. matrice section 3)
4. Importer la Bible Segond 21 en JSON dans `public/bible-segond21.json`
5. Générer les types TypeScript : `npx supabase gen types typescript`

### Tests automatisés

```typescript
// tests/integration/db/seed.test.ts
import { createClient } from '@/lib/supabase/server';

describe('Seed data', () => {
  it('has 7 profiles', async () => {
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('*');
    expect(data).toHaveLength(7);
  });

  it('has Alpha as admin', async () => {
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('*').eq('role', 'admin').single();
    expect(data?.display_name).toBe('Alpha');
  });

  it('has 3 skills', async () => {
    const supabase = createClient();
    const { data } = await supabase.from('skills').select('*');
    expect(data).toHaveLength(3);
    expect(data?.map(s => s.name)).toEqual(['Sono', 'Caméra', 'Diffusion']);
  });

  it('Isaac is autonomous in Sono only', async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('member_skills')
      .select('*, profile:profiles(display_name), skill:skills(name)')
      .eq('profile.display_name', 'Isaac');
    expect(data).toHaveLength(1);
    expect(data?.[0].level).toBe('autonomous');
    expect(data?.[0].skill?.name).toBe('Sono');
  });

  it('Chana has 2 skills (Caméra autonome, Diffusion apprentie)', async () => {
    // ...
  });
});
```

### ✅ Checklist humaine

- [ ] Je vois les 7 profils dans Supabase Studio
- [ ] Chaque profil a le bon `avatar_color` et les bonnes `initials`
- [ ] Les 3 skills sont créés
- [ ] La matrice de compétences correspond à la spec
- [ ] La table `bible_verses` contient ~31000 versets (ou JSON accessible)
- [ ] Les types TypeScript sont générés dans `src/types/database.ts`

---

## Feature 1.3 — Profile Picker (écran d'accueil)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Page `/` (groupe `(auth)`)
2. Affichage de 6 avatars membres en grille 3 colonnes
3. Lien discret en bas "Je suis le responsable" pour Alpha
4. Animation stagger d'entrée (50ms entre chaque avatar)
5. Tap sur un avatar → navigation vers `/code?profile_id=xxx&is_admin=false`
6. Tap sur bouton admin → navigation vers `/code?profile_id=alpha-id&is_admin=true`
7. Petit disclaimer en bas "Cet espace est partagé entre les membres"
8. Hover/tap animations (scale + translateY)

### Composants à créer

```typescript
// src/components/auth/profile-picker.tsx
// src/components/shared/avatar.tsx
```

### Tests automatisés

```typescript
// tests/integration/profile-picker.test.tsx
describe('ProfilePicker', () => {
  it('renders 6 member avatars', async () => {
    render(<ProfilePicker profiles={mockProfiles} />);
    const avatars = screen.getAllByRole('button', { name: /^[A-Z][a-zé]+$/i });
    expect(avatars).toHaveLength(6);
  });

  it('shows admin link', () => {
    render(<ProfilePicker profiles={mockProfiles} />);
    expect(screen.getByText(/Je suis le responsable/i)).toBeInTheDocument();
  });

  it('navigates to code page on avatar click', async () => {
    const { user } = renderWithRouter(<ProfilePicker profiles={mockProfiles} />);
    await user.click(screen.getByRole('button', { name: /Chana/i }));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('profile_id='));
  });
});

// tests/e2e/profile-picker.spec.ts
test('profile picker shows all members', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Qui es-tu ?')).toBeVisible();

  for (const name of ['Chana', 'Isaac', 'Chrisciana', 'Dave', 'Stéphanie', 'Gloria']) {
    await expect(page.getByText(name)).toBeVisible();
  }

  await expect(page.getByText('Je suis le responsable')).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] La page d'accueil affiche bien "Qui es-tu ?" en gros
- [ ] Les 6 avatars membres sont visibles (sans les vraies images, juste les couleurs + initiales)
- [ ] Les avatars ont les bonnes couleurs (Chana menthe, Isaac lilas, Chrisciana sage, etc.)
- [ ] Animation stagger d'entrée visible et fluide
- [ ] Le bouton "Je suis le responsable" est en bas, discret mais visible
- [ ] Tap sur un avatar navigue vers l'écran code

### 📖 Scénario narratif (Alpha)

> "Tu lances l'app pour la première fois. L'écran de bienvenue te montre les 6 visages de ton équipe. Tu reconnais immédiatement Chana, Isaac, et les autres. En bas, un petit lien discret te permet d'entrer en mode admin. Tu sens que l'app pose le ton 'équipe' dès la première seconde."

Si tu ressens ça → ✅ validé. Sinon → ajustements.

---

## Feature 1.4 — Écran de saisie de code

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Page `/code` (groupe `(auth)`)
2. Reçoit `profile_id` et `is_admin` en query params
3. Affiche l'avatar agrandi (84px) + "Salut [Prénom]" ou "Console admin"
4. 4 dots qui se remplissent
5. Pavé numérique iOS-style (3 cols, ratio 1.4)
6. Bouton retour en haut à gauche
7. Mauvais code → shake animation des dots + message d'erreur rouge tamisé
8. Bon code → animation success + redirect
9. Animation pop du checkmark à la validation

### Logique technique

```typescript
// src/lib/auth.ts
export function verifyTeamCode(code: string): boolean {
  return code === process.env.TEAM_CODE;
}

export function verifyAdminCode(code: string): boolean {
  return code === process.env.ADMIN_CODE;
}

// src/app/api/auth/verify-code/route.ts
export async function POST(request: Request) {
  const { code, profile_id, is_admin } = await request.json();

  if (is_admin) {
    if (!verifyAdminCode(code)) {
      return Response.json({ ok: false, error: 'invalid_code' }, { status: 401 });
    }
    // Vérifier que profile_id correspond bien à un admin
    // Créer la session, device lock
  } else {
    if (!verifyTeamCode(code)) {
      return Response.json({ ok: false, error: 'invalid_code' }, { status: 401 });
    }
    // Créer la session, device lock 30 jours
  }

  // Set cookie httpOnly avec profile_id + device_id
  return Response.json({ ok: true, redirect: is_admin ? '/admin' : '/' });
}
```

### Tests automatisés

```typescript
// tests/unit/auth.test.ts
describe('Auth', () => {
  it('verifyTeamCode accepts 4729', () => {
    process.env.TEAM_CODE = '4729';
    expect(verifyTeamCode('4729')).toBe(true);
    expect(verifyTeamCode('1234')).toBe(false);
  });
  // ...
});

// tests/e2e/auth-flow.spec.ts
test.describe('Auth flow', () => {
  test('Chana logs in with team code', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Chana")');
    await expect(page).toHaveURL(/\/code/);
    await expect(page.locator('text=Salut Chana')).toBeVisible();

    for (const digit of '4729') {
      await page.locator(`[data-num="${digit}"]`).click();
    }

    await expect(page.locator('text=Bienvenue Chana')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL('/');
  });

  test('Alpha logs in with admin code', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Je suis le responsable")');
    await expect(page.locator('text=Console admin')).toBeVisible();

    for (const digit of '9182') {
      await page.locator(`[data-num="${digit}"]`).click();
    }

    await expect(page).toHaveURL('/admin');
  });

  test('Wrong code shows error', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Chana")');

    for (const digit of '0000') {
      await page.locator(`[data-num="${digit}"]`).click();
    }

    await expect(page.locator('text=Mauvais code')).toBeVisible();
  });
});
```

### ✅ Checklist humaine

- [ ] L'avatar du profil sélectionné s'affiche en grand
- [ ] "Salut [Prénom]" personnalisé selon le profil
- [ ] Pour Alpha (admin) : "Console admin" + avatar noir + icône clé
- [ ] Pavé numérique tactile et réactif (animation scale au tap)
- [ ] Les 4 dots se remplissent visuellement quand je tape
- [ ] Mauvais code → shake horizontal des dots + message rouge
- [ ] Bon code → animation success "Bienvenue [Prénom]" puis redirect
- [ ] Bouton retour fonctionne

### 📖 Scénario narratif

> "Tu choisis Chana, tu tapes le code 4729. Le checkmark sage explose, l'écran te dit 'Bienvenue Chana' avec chaleur. Tu te sens reconnue, pas filtrée par un firewall. Tu arrives sur ton tableau de bord, c'est ton espace."

---

## Feature 1.5 — Device locking 30 jours

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. À la première connexion réussie, on stocke en DB :
   - `profile.device_id` = identifiant unique du device (généré client-side)
   - `profile.device_locked_until` = now() + 30 days
2. On set un cookie httpOnly `crew_session` (signé) contenant `profile_id` et `device_id`
3. Middleware Next.js vérifie le cookie sur chaque route protégée
4. Si cookie valide ET `device_locked_until > now()` → accès direct au dashboard
5. Si expiré ou absent → redirect vers `/`
6. Possibilité de "Changer de profil" → invalide le device lock côté server

### Logique technique

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('crew_session');

  // Routes auth (toujours accessibles)
  if (request.nextUrl.pathname.startsWith('/code') || request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  // Routes protégées
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const session = await verifySession(sessionCookie.value);
  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Tests automatisés

```typescript
describe('Device locking', () => {
  it('locks device for 30 days on successful auth', async () => {
    const profile = await loginAs('Chana', '4729');
    expect(profile.device_locked_until).toBeAfter(addDays(new Date(), 29));
  });

  it('redirects to home if session expired', async () => {
    // Mock une session expirée
    const response = await fetch('/calendar', {
      headers: { Cookie: 'crew_session=expired-token' }
    });
    expect(response.url).toContain('/');
  });
});
```

### ✅ Checklist humaine

- [ ] Après login, je peux fermer/rouvrir le navigateur et revenir directement sur le dashboard
- [ ] Le device est bien "lié" à mon profil
- [ ] Bouton "Changer de profil" m'amène vers la sélection initiale
- [ ] Quelqu'un d'autre sur un autre device doit retaper le code

---

## 🔄 Vérification de fin de Sprint 1

Avant de passer au Sprint 2, l'agent revérifie :

```bash
npm run test       # Tous les tests unitaires passent
npm run test:e2e   # Tous les tests E2E passent
npm run lint       # Pas d'erreur lint
npm run build      # Build production OK
```

**Toutes les features 1.1 → 1.5 doivent avoir 3 cases cochées avant de continuer.**

---

# Sprint 2 — Dashboard membre + Calendrier

**Objectif** : Le membre peut voir son dashboard, valider son mois (swipe par card), consulter sa vue mensuelle, et annuler un engagement.

**Durée estimée** : 1 semaine

---

## Feature 2.1 — Layout membre + Bottom nav

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Layout `(member)/layout.tsx` avec :
   - DeviceFrame mobile 390px (centrée sur desktop, full-width sur mobile)
   - Header optionnel selon la page
   - Bottom nav fixe en bas avec 2-3 onglets (Accueil, Calendrier, +Service Day contextuel)
2. Bottom nav règles :
   - Accueil (toujours)
   - Calendrier (toujours)
   - Service Day → visible **seulement** si événement dans les 24h (samedi soir + dimanche, ou veille de culte semaine/call)
3. Active state : pastille noire pour l'onglet actif
4. Animations : `layoutId` Framer pour la pastille qui glisse

### Tests

```typescript
describe('Member BottomNav', () => {
  it('shows Service Day tab on Saturday evening', () => {
    vi.setSystemTime(new Date('2025-06-22T19:00:00'));  // samedi soir
    render(<BottomNav nextEventDate="2025-06-23" />);
    expect(screen.getByLabelText('Service Day')).toBeInTheDocument();
  });

  it('hides Service Day tab on Tuesday with no event', () => {
    vi.setSystemTime(new Date('2025-06-17T10:00:00'));
    render(<BottomNav nextEventDate="2025-06-23" />);
    expect(screen.queryByLabelText('Service Day')).not.toBeInTheDocument();
  });
});
```

### ✅ Checklist humaine

- [ ] Bottom nav visible en bas sur toutes les pages membre
- [ ] L'icône active est en pastille noire avec icône blanche
- [ ] Service Day apparaît bien le samedi/dimanche
- [ ] Service Day disparaît le lundi
- [ ] Tap sur un onglet anime la pastille qui glisse

---

## Feature 2.2 — Dashboard membre v3

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Reproduire fidèlement la maquette validée :

1. Header "Hey [Prénom]" + sous-titre contextuel ("Juin commence", "Dimanche approche", etc.) + avatar avec pulse dot sage
2. **Bloc validation mensuelle (conditionnel)** : fond noir, glow animation, visible **uniquement** si le mois n'est pas validé. Bouton sage "Voir et valider"
3. **Bloc pensée de la semaine** : fond sage, label uppercase + verset + référence
4. **Bloc mini-calendrier mensuel** : grille 7 colonnes, pastilles colorées par event_type (sage=culte, menthe=semaine, lilas=call), jour actuel en noir avec dot sage pulse
5. **Bloc prochain événement** : illustration menthe avec icône skill + badge "Dans X jours" + badge skill, infos + équipe + thème
6. **Bloc appréciation reçue** (la dernière)
7. Animation stagger d'entrée

### Hooks à créer

```typescript
// src/hooks/use-monthly-validation.ts
export function useMonthlyValidation(profileId: string) {
  return useQuery({
    queryKey: ['monthly-validation', profileId, currentMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from('monthly_validations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();
      return data;  // null = pas encore validé
    },
  });
}

// src/hooks/use-next-event.ts
// src/hooks/use-monthly-events.ts
// src/hooks/use-weekly-thought.ts
// src/hooks/use-last-appreciation.ts
```

### Tests

```typescript
describe('Member Dashboard', () => {
  it('shows validation block when month not validated', async () => {
    mockSupabase.monthly_validations = null;
    render(<MemberDashboard profile={chana} />);
    expect(await screen.findByText('Valide ton mois')).toBeInTheDocument();
  });

  it('hides validation block when month validated', async () => {
    mockSupabase.monthly_validations = { validated_at: new Date() };
    render(<MemberDashboard profile={chana} />);
    expect(screen.queryByText('Valide ton mois')).not.toBeInTheDocument();
  });

  it('displays next event with countdown', async () => {
    mockSupabase.nextEvent = {
      service_date: '2025-06-23',
      title: 'Dimanche 23 juin',
    };
    vi.setSystemTime(new Date('2025-06-19'));
    render(<MemberDashboard profile={isaac} />);
    expect(await screen.findByText(/Dans 4 jours/)).toBeInTheDocument();
  });
});

// E2E
test('Member sees their dashboard with proper data', async ({ page }) => {
  await loginAs(page, 'Chana', '4729');
  await expect(page.getByText('Hey Chana')).toBeVisible();
  await expect(page.getByText(/Pensée de la semaine/i)).toBeVisible();
  await expect(page.locator('[data-testid="mini-calendar"]')).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] "Hey Chana" (ou autre prénom) bien personnalisé
- [ ] Avatar avec pulse dot sage visible
- [ ] Bloc validation noir présent quand mois pas validé, avec glow subtil
- [ ] Pensée de la semaine en sage avec icône sparkles noire
- [ ] Mini-calendrier coloré par event_type
- [ ] Jour J en noir avec dot sage qui pulse
- [ ] Prochain événement avec illustration + countdown
- [ ] Appréciation reçue en bas si présente
- [ ] Animations stagger fluides à l'ouverture

### 📖 Scénario narratif

> "Tu te connectes en tant que Chana début juin. Tu vois immédiatement : un bloc noir te dit 'Valide ton mois de juin', le mois en mini-calendrier est coloré comme une fresque, ton prochain dimanche est mis en valeur. Tu sens que l'app respecte ton temps : tout est là, rien n'est noyé."

---

## Feature 2.3 — Vue mensuelle — Validation initiale (swipe)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Page `/calendar/validate`
2. Atteinte via tap sur le bloc validation du dashboard
3. Mini-calendrier compact en haut (jours d'événement en pointillés)
4. Liste de cards swipeables (1 par événement du mois)
5. **Swipe droite > 70px** = "Je serai là" (présent), card sort à droite, jour devient plein sur calendrier
6. **Swipe gauche > 70px** = "Pas dispo" (absent), card sort à gauche, jour devient rouge tamisé barré
7. Bouton "Tout valider" en haut à droite = swipe right en cascade (120ms entre chaque)
8. Barre de progression "X sur Y validés" + bar animée
9. État final = écran de succès avec checkmark animé
10. À la fin → INSERT dans `monthly_validations` + UPDATE des `assignments`

### Composant SwipeCard

```typescript
// src/components/member/swipe-card.tsx
'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';

interface SwipeCardProps {
  event: ServiceEvent;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

const THRESHOLD = 70;

export function SwipeCard({ event, onSwipeRight, onSwipeLeft }: SwipeCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > THRESHOLD) {
      setExiting('right');
      setTimeout(onSwipeRight, 350);
    } else if (info.offset.x < -THRESHOLD) {
      setExiting('left');
      setTimeout(onSwipeLeft, 350);
    }
  };

  return (
    <motion.div
      drag={exiting ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, opacity }}
      onDragEnd={handleDragEnd}
      animate={exiting ? { x: exiting === 'right' ? 400 : -400, opacity: 0 } : {}}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="swipe-card"
    >
      {/* Card content */}
    </motion.div>
  );
}
```

### Tests

```typescript
describe('SwipeCard', () => {
  it('triggers onSwipeRight when swiped > 70px right', async () => {
    const onSwipeRight = vi.fn();
    render(<SwipeCard event={mockEvent} onSwipeRight={onSwipeRight} onSwipeLeft={vi.fn()} />);

    const card = screen.getByTestId('swipe-card');
    fireEvent.mouseDown(card, { clientX: 0 });
    fireEvent.mouseMove(card, { clientX: 100 });
    fireEvent.mouseUp(card);

    await waitFor(() => expect(onSwipeRight).toHaveBeenCalled());
  });

  it('does not trigger when swiped < 70px', async () => {
    // ...
  });
});

// E2E
test('Chana validates her month via swipe', async ({ page }) => {
  await loginAs(page, 'Chana', '4729');
  await page.click('text=Voir et valider');

  await expect(page).toHaveURL(/\/calendar\/validate/);
  await expect(page.locator('text=0 sur')).toBeVisible();

  // Swipe la première card
  await page.locator('[data-testid="swipe-card"]').first().swipe('right', 100);
  await expect(page.locator('text=1 sur')).toBeVisible();

  // Tout valider en raccourci
  await page.click('text=Tout valider');
  await expect(page.locator('text=Ton mois est validé')).toBeVisible({ timeout: 3000 });
});
```

### ✅ Checklist humaine

- [ ] J'arrive sur la page avec un mini-calendrier en pointillés
- [ ] Je vois mes cards d'engagements à valider
- [ ] Je peux swiper une card vers la droite → elle sort, le jour devient plein
- [ ] Je peux swiper une card vers la gauche → elle sort, le jour devient rouge barré
- [ ] Si je swipe à moitié (< 70px) la card revient à sa place
- [ ] La barre de progression se met à jour
- [ ] Bouton "Tout valider" déclenche un swipe right en cascade
- [ ] Après tout validé → "Ton mois est validé. Merci [Prénom], on compte sur toi 🙏"
- [ ] Quand je reviens sur le dashboard, le bloc noir validation a disparu

### 📖 Scénario narratif

> "Tu reçois la notif 'Voici ton mois de juin'. Tu ouvres l'app. Tu vois tes 5 engagements. Tu swipes 3 fois à droite, 1 fois à gauche (le 16, t'as un rdv médical), puis tu vois la dernière card et tu swipes encore à droite. L'écran te félicite. Tu te sens engagée mais pas oppressée. C'est ton mois, tu l'as construit avec sens."

---

## Feature 2.4 — Vue mensuelle — Mode consultation

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. Page `/calendar` (mode consultation = mois validé)
2. Sélecteur de mois en haut (← Mai · Juin · Juillet →) avec badge "Validé" sage sur fond noir
3. Mini-calendrier avec 4 états :
   - Passé présent (sage atténué + barré)
   - Passé absent (rouge tamisé + barré)
   - À venir présent (couleur pleine selon event_type)
   - Prochain événement (noir + dot sage pulse)
4. Stats triptyque (engagements / présent / absent)
5. Section "À venir" : cards d'événements futurs (la plus proche avec bordure noire)
6. Section "Passés" : lignes compactes avec icône statut
7. Tap sur une card future → modal d'annulation
8. Modal avec phrase chaleureuse rappelant les coéquipiers + bouton "Je ne pourrai pas" rouge tamisé

### Modal d'annulation

```typescript
// src/components/member/cancel-modal.tsx
export function CancelModal({ event, onConfirm, onClose }: Props) {
  const teammates = event.assignments
    .filter(a => a.profile_id !== currentUser.id)
    .map(a => a.profile.display_name);

  const message = teammates.length > 0
    ? `${teammates.join(' et ')} compte${teammates.length > 1 ? 'nt' : ''} sur toi pour ce service. Si tu ne peux pas, dis-le-nous, Alpha trouvera quelqu'un.`
    : `Si tu ne peux pas être là, dis-le-nous, Alpha trouvera quelqu'un.`;

  return (
    <BottomSheet onClose={onClose}>
      <h3>{event.title}</h3>
      <p>{message}</p>
      <Button.Danger onClick={onConfirm}>Je ne pourrai pas</Button.Danger>
      <Button.Ghost onClick={onClose}>Annuler</Button.Ghost>
    </BottomSheet>
  );
}
```

### Tests

```typescript
describe('CalendarConsultation', () => {
  it('shows month with validated badge', async () => {
    render(<CalendarConsultation profileId="chana-id" />);
    expect(await screen.findByText('Juin 2025')).toBeInTheDocument();
    expect(screen.getByText('Validé')).toBeInTheDocument();
  });

  it('navigates to next month', async () => {
    const { user } = render(<CalendarConsultation profileId="chana-id" />);
    await user.click(screen.getByLabelText('Mois suivant'));
    expect(await screen.findByText('Juillet 2025')).toBeInTheDocument();
  });

  it('opens cancel modal on card click', async () => {
    const { user } = render(<CalendarConsultation profileId="chana-id" />);
    await user.click(screen.getByText(/Dimanche 23 juin/));
    expect(await screen.findByText(/comptent sur toi/)).toBeInTheDocument();
  });

  it('cancels assignment on confirm', async () => {
    // INSERT update sur assignments
  });
});
```

### ✅ Checklist humaine

- [ ] Sélecteur de mois fonctionnel (← →)
- [ ] Badge "Validé" sage présent
- [ ] Mini-calendrier affiche bien les 4 états (passé présent, passé absent, à venir, prochain)
- [ ] Stats triptyque cohérentes avec les données
- [ ] Card du prochain événement a bordure noire + countdown
- [ ] Tap sur une card → modal s'ouvre avec phrase chaleureuse
- [ ] Le message mentionne bien les noms des coéquipiers
- [ ] Bouton "Je ne pourrai pas" en rouge tamisé
- [ ] Confirmation d'annulation met à jour la DB (statut `cancelled`)
- [ ] Notif push envoyée à Alpha (à implémenter Sprint 5)

### 📖 Scénario narratif

> "On est le 18 juin, le dimanche approche. Tu viens dans ton calendrier. Tu vois ton mois en couleurs : 3 passés en sage tamisé, 1 rouge barré (tu t'étais absentée), et 3 à venir. Le 23 juin ressort en noir, c'est dans 5 jours. Tu cliques dessus, l'app te rappelle 'Chana et Dave comptent sur toi'. Tu sais que si tu annules, c'est pas grave mais c'est pas neutre. Tu fais un choix éclairé."

---

## 🔄 Vérification de fin de Sprint 2

```bash
npm run test:all
```

**Toutes les features 2.1 → 2.4 doivent être ✅ Code ✅ Tests ✅ Validé.**

---

# Sprint 3 — Mode Service Day + Console admin

**Objectif** : Le membre voit son Mode Service Day chaleureux le jour J, et Alpha accède à sa console admin avec vue d'ensemble.

**Durée estimée** : 1 semaine

---

## Feature 3.1 — Mode Service Day (membre)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Page `/service-day` accessible uniquement quand un événement est dans les 24h. Reproduit fidèlement la maquette validée :

1. Header "Hey [Prénom]" + label "Jour de service"
2. **Bloc hero countdown noir** :
   - Badge sage "Aujourd'hui" avec pulse (ou "Demain" la veille avec heure)
   - Date "Dimanche 23 juin"
   - Heure de début EN GIGANTESQUE (38px, weight 700)
   - "Tu arrives à 13h30" en sage
3. **Bloc "Aujourd'hui tu es à la [Skill]"** :
   - Hero illustration menthe avec icône skill
   - Badge "Ton poste" noir
   - Skill en gros (28px, weight 700)
4. **Bloc "L'équipe du jour"** : 3 lignes (toi + 2 autres) avec avatars + skills + heures d'arrivée. Badge check sage sur ton avatar.
5. **Bloc thème spirituel** : fond sage avec verset + référence
6. **Bloc infos pratiques** : Lieu (avec bouton GPS noir/sage), Arrivée (avec justification), Contacter Alpha (bouton sage téléphone)

**Pas de check-in**. Pas de feedback. C'est un écran de moment.

### Logique d'affichage du countdown

```typescript
// src/lib/countdown.ts
export function getCountdownLabel(eventDate: Date, now = new Date()): string {
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return `Demain à ${formatTime(eventDate)}`;
  if (diffDays > 0 && diffDays < 7) return `Dans ${diffDays} jours`;
  return formatDateLong(eventDate);
}
```

### Tests

```typescript
describe('Countdown logic', () => {
  it('returns "Aujourd\'hui" for same day', () => {
    expect(getCountdownLabel(new Date('2025-06-23T14:00:00'), new Date('2025-06-23T10:00:00'))).toBe('Aujourd\'hui');
  });

  it('returns "Demain à 14h00" for next day', () => {
    expect(getCountdownLabel(new Date('2025-06-23T14:00:00'), new Date('2025-06-22T10:00:00'))).toBe('Demain à 14h00');
  });

  it('returns "Dans 4 jours" for 4 days ahead', () => {
    expect(getCountdownLabel(new Date('2025-06-23T14:00:00'), new Date('2025-06-19T10:00:00'))).toBe('Dans 4 jours');
  });
});

// E2E
test('Isaac sees Service Day on Sunday morning', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-06-23T10:00:00'));
  await loginAs(page, 'Isaac', '4729');
  await page.click('[aria-label="Service Day"]');

  await expect(page.getByText('Aujourd\'hui')).toBeVisible();
  await expect(page.getByText('14h00')).toBeVisible();
  await expect(page.getByText('Tu arrives à 13h30')).toBeVisible();
  await expect(page.getByText('Aujourd\'hui tu es à la')).toBeVisible();
  await expect(page.getByText('Sono')).toBeVisible();
  await expect(page.getByText('L\'équipe du jour')).toBeVisible();
  await expect(page.getByText('Isaac · toi')).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] Le bloc noir countdown est imposant et cinématique
- [ ] L'heure (14h00) ressort visuellement
- [ ] "Aujourd'hui" pulse en sage
- [ ] Le bloc "tu es à la [Sono]" met en valeur ton poste
- [ ] L'équipe du jour montre les 3 personnes avec leur skill
- [ ] Ton avatar a un check sage (toi)
- [ ] Le thème spirituel est en gros avec verset
- [ ] Le bouton GPS lance Google Maps natif
- [ ] Le bouton "Appeler Alpha" lance `tel:`

### 📖 Scénario narratif

> "Dimanche matin, 10h. Isaac ouvre Crew. L'écran le frappe par sa solennité chaleureuse : '14h00' en gigantesque, le bloc noir comme une scène. Il sait qu'il est à la Sono, son équipe est là (Chana, Dave). Le thème 'L'unité' lui donne du sens. Il sait à 13h30 il doit être à la salle principale. S'il a un problème, le bouton sage 'Contacter Alpha' est là. Il sort de son tel prêt à servir, fier."

---

## Feature 3.2 — Layout admin + Bottom nav admin

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Layout `(admin)/layout.tsx` avec :

1. Bottom nav admin 4 onglets : Console / Services / Équipe / Spirituel
2. **FAB (Floating Action Button)** noir en bas à droite avec icône "+" sage et glow animé
3. Tap sur FAB → menu rapide de création (créer dimanche, semaine, call, pensée)
4. Bouton "Voir comme membre" en header → bascule sur le layout (member)

### Tests

```typescript
describe('Admin Layout', () => {
  it('renders 4 nav items', () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByLabelText('Console')).toBeInTheDocument();
    expect(screen.getByLabelText('Services')).toBeInTheDocument();
    expect(screen.getByLabelText('Équipe')).toBeInTheDocument();
    expect(screen.getByLabelText('Spirituel')).toBeInTheDocument();
  });

  it('shows FAB with create menu', async () => {
    const { user } = render(<AdminLayout><div /></AdminLayout>);
    const fab = screen.getByLabelText('Créer');
    await user.click(fab);
    expect(await screen.findByText('Créer un dimanche')).toBeInTheDocument();
  });

  it('shows admin badge in header', () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText('RESPONSABLE')).toBeInTheDocument();
  });
});
```

### ✅ Checklist humaine

- [ ] Bottom nav admin a 4 onglets distincts du layout membre
- [ ] FAB visible en bas-droite avec glow sage qui respire
- [ ] Tap FAB ouvre un menu avec 4 options de création
- [ ] Bouton "Voir comme membre" présent dans le header

---

## Feature 3.3 — Dashboard admin

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Reproduire fidèlement la maquette validée :

1. **Header** : "Hey Alpha" + badge noir "RESPONSABLE" + date + bouton oeil "Voir comme membre" + avatar noir
2. **Bloc Prochain événement** : card avec bordure noire 2px, illustration menthe, badges "Dans X jours" + "Prochain", compteur 5/6 validés, liste 3 assignés avec badges sage "OK", CTA "Voir et gérer le service"
3. **Bloc Actions à mener (conditionnel)** :
   - Header avec icône alerte + compteur d'alertes
   - Cards d'alertes avec bordure gauche colorée (rouge / ambre)
   - Chaque alerte : avatar + nom + texte explicatif + CTA
   - Si 0 alerte → bloc affiche un message sage "Tout va bien 🌟" (ou masqué)
4. **Bloc "Ton planning de servant"** (double casquette B) : fond sage avec date + skill + équipe + icône skill
5. **Stats triptyque** : 6 membres / 4 services / 92% présence (sage)
6. **Bloc vue d'ensemble** : liste compacte des 3 prochains événements avec ratio confirmations
7. **Bloc pensée publiée** : rappel de ce qui est en ligne

### Tests

```typescript
describe('Admin Dashboard', () => {
  it('shows alerts section when actions required', async () => {
    mockSupabase.alerts = [
      { type: 'cancellation', member: 'Dave', date: '2025-06-30' },
      { type: 'unvalidated_month', member: 'Stéphanie' },
      { type: 'disengaged', member: 'Gloria', weeks_since_last: 3 },
    ];
    render(<AdminDashboard />);
    expect(await screen.findByText('Actions à mener')).toBeInTheDocument();
    expect(screen.getByText(/Dave a annulé/)).toBeInTheDocument();
    expect(screen.getByText(/Stéphanie n'a pas validé/)).toBeInTheDocument();
    expect(screen.getByText(/Gloria décroche/)).toBeInTheDocument();
  });

  it('hides alerts section when no actions', async () => {
    mockSupabase.alerts = [];
    render(<AdminDashboard />);
    expect(screen.queryByText('Actions à mener')).not.toBeInTheDocument();
  });

  it('shows servant planning block', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText('Ton planning de servant')).toBeInTheDocument();
  });
});

// E2E
test('Alpha sees full admin dashboard', async ({ page }) => {
  await loginAs(page, 'Alpha', '9182');
  await expect(page).toHaveURL('/admin');
  await expect(page.getByText('Hey Alpha')).toBeVisible();
  await expect(page.getByText('RESPONSABLE')).toBeVisible();
  await expect(page.getByText(/Prochain événement/i)).toBeVisible();
  await expect(page.getByText(/Ton planning de servant/i)).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] Badge "RESPONSABLE" en noir/sage à côté du nom
- [ ] Avatar noir avec icône clé visible
- [ ] Card prochain événement avec bordure noire ressort comme prioritaire
- [ ] Compteur 5/6 validés en gros à droite
- [ ] Bloc alertes apparaît si actions à mener (Dave annulé, Stéphanie pas validé, Gloria décroche)
- [ ] Chaque alerte a son CTA personnalisé ("Réassigner", "Lui envoyer un mot", "Prendre des nouvelles")
- [ ] Bloc sage "Ton planning de servant" intégré
- [ ] Stats triptyque cohérent
- [ ] FAB en bas à droite avec glow
- [ ] Bouton oeil ouvre vue membre quand tappé

### 📖 Scénario narratif

> "Mardi 18 juin, 8h du matin. Tu (Alpha) ouvres l'app. En 3 secondes tu sais tout : ton dimanche est dans 5 jours, Stéphanie n'a pas validé son mois, Gloria décroche, et Dave a annulé le 30 juin. Tu sais quoi faire : trois CTA chaleureux te guident. Tu sens que l'app pense pour toi, pas contre toi."

---

## 🔄 Vérification de fin de Sprint 3

```bash
npm run test:all
```

**Toutes les features 3.1 → 3.3 doivent être ✅ Code ✅ Tests ✅ Validé.**

---

# Sprint 4 — Détail service + Assignations + IA

**Objectif** : Le cœur du métier admin. Construire une équipe pour un service, gérer les annulations, profiter de la proposition IA.

**Durée estimée** : 1.5 semaines (sprint le plus complexe)

---

## Feature 4.1 — Algorithme IA de proposition d'équipe

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Fonction `proposeTeam(serviceId)` qui retourne pour chaque slot non assigné un candidat optimal.

**Règles de scoring** :

```typescript
interface CandidateScore {
  profile_id: string;
  score: number;
  reasons: string[];  // ["Autonome sur ce poste", "N'a pas servi depuis 2 semaines"]
  requires_pairing: boolean;  // true si apprenti
  suggested_pair?: string;  // profile_id du formateur suggéré
}

function scoreCandidate(profile, skill, date, history): CandidateScore {
  let score = 0;
  const reasons = [];

  // 1. Compétence (REQUIS)
  const memberSkill = profile.skills.find(s => s.skill_id === skill.id);
  if (!memberSkill) return { score: -Infinity };  // pas compétent

  if (memberSkill.level === 'autonomous' || memberSkill.level === 'trainer') {
    score += 100;
    reasons.push(`Autonome sur ${skill.name}`);
  } else if (memberSkill.level === 'learning') {
    score += 50;  // apprenti = OK mais nécessite binôme
    reasons.push(`En apprentissage sur ${skill.name}`);
  }

  // 2. Disponibilité (REQUIS)
  const isUnavailable = profile.availabilities.some(a =>
    isWithinRange(date, a.unavailable_from, a.unavailable_to)
  );
  if (isUnavailable) return { score: -Infinity };

  // 3. Équilibrage de charge mensuelle
  const servicesThisMonth = history.filter(a => isSameMonth(a.service.service_date, date)).length;
  if (servicesThisMonth < 2) score += 30;
  else if (servicesThisMonth > 4) score -= 20;

  // 4. Re-engagement (n'a pas servi depuis longtemps)
  const lastService = history.sort((a, b) => b.service.service_date - a.service.service_date)[0];
  if (lastService) {
    const daysSinceLastService = daysBetween(lastService.service.service_date, date);
    if (daysSinceLastService > 21) {
      score += 40;
      reasons.push(`Pas servi depuis ${Math.floor(daysSinceLastService / 7)} semaines`);
    } else if (daysSinceLastService > 14) {
      score += 20;
    }
  } else {
    score += 50;  // jamais servi
    reasons.push('Première occasion de servir');
  }

  // 5. Pairing requis pour apprenti
  const requires_pairing = memberSkill.level === 'learning';

  return { profile_id: profile.id, score, reasons, requires_pairing };
}
```

### Fonction d'explanation chaleureuse

```typescript
function explainProposal(candidate: CandidateScore, skill: Skill, profile: Profile): string {
  if (candidate.reasons.includes(`Pas servi depuis 2 semaines`) || candidate.reasons.some(r => r.includes('semaines'))) {
    return `${profile.display_name.split(' ')[0]} maîtrise ${skill.name.toLowerCase()} et n'a pas servi récemment. C'est l'occasion de la réinviter.`;
  }
  if (candidate.reasons.includes('Première occasion de servir')) {
    return `${profile.display_name.split(' ')[0]} pourrait commencer à servir sur ${skill.name}.`;
  }
  return `${profile.display_name.split(' ')[0]} maîtrise ${skill.name.toLowerCase()} et est disponible.`;
}
```

### Tests

```typescript
describe('IA assignment scorer', () => {
  it('returns -Infinity for non-skilled member', () => {
    const isaac = { skills: [{ skill_id: 'sono', level: 'autonomous' }] };
    const camera = { id: 'camera', name: 'Caméra' };
    expect(scoreCandidate(isaac, camera, new Date(), []).score).toBe(-Infinity);
  });

  it('returns -Infinity for unavailable member', () => {
    const gloria = {
      skills: [{ skill_id: 'camera', level: 'autonomous' }],
      availabilities: [{ unavailable_from: '2025-06-23', unavailable_to: '2025-06-25' }]
    };
    expect(scoreCandidate(gloria, camera, new Date('2025-06-23'), []).score).toBe(-Infinity);
  });

  it('boosts score for member not served in 2+ weeks', () => {
    const chrisciana = {
      skills: [{ skill_id: 'diffusion', level: 'autonomous' }]
    };
    const history = [{ service: { service_date: '2025-06-09' } }];
    const result = scoreCandidate(chrisciana, diffusionSkill, new Date('2025-06-30'), history);
    expect(result.score).toBeGreaterThan(100);
    expect(result.reasons.some(r => r.includes('semaines'))).toBe(true);
  });

  it('marks learners as requiring pairing', () => {
    const stephanie = {
      skills: [{ skill_id: 'diffusion', level: 'learning' }]
    };
    const result = scoreCandidate(stephanie, diffusionSkill, new Date(), []);
    expect(result.requires_pairing).toBe(true);
  });
});

describe('proposeTeam', () => {
  it('builds full team for a service with all autonomous', async () => {
    const team = await proposeTeam('service-23-juin');
    expect(team.sono).toMatchObject({ profile_id: 'isaac' });
    expect(team.camera).toMatchObject({ profile_id: 'chana' });
    expect(team.diffusion).toMatchObject({ profile_id: 'chrisciana' });  // après annulation Dave
  });

  it('proposes apprenti + trainer pair when no autonomous available', async () => {
    // Setup : seul Stéphanie (apprentie) est dispo en diffusion
    const team = await proposeTeam('service-with-only-learner');
    expect(team.diffusion.requires_pairing).toBe(true);
    expect(team.diffusion.suggested_pair).toBeDefined();
  });
});
```

### API Route

```typescript
// src/app/api/ai/propose-team/route.ts
export async function POST(request: Request) {
  const { service_id } = await request.json();
  const proposals = await proposeTeam(service_id);
  return Response.json({ proposals });
}
```

### ✅ Checklist humaine

- [ ] Quand je crée un dimanche, l'IA propose 3 noms cohérents
- [ ] Si Dave a annulé, l'IA propose un remplaçant pour Diffusion (probablement Chrisciana)
- [ ] L'explication est chaleureuse ("C'est l'occasion de la réinviter")
- [ ] Si la seule option est un apprenti, l'IA propose un binôme
- [ ] L'IA jamais ne propose quelqu'un en vacances déclarées

### 📖 Scénario narratif

> "Tu (Alpha) crées le service du 6 juillet. L'app te dit 'On a composé une équipe : Isaac, Chana, Chrisciana. Charge équilibrée, 1 occasion de re-engager Gloria sur le 13'. Tu valides. Tu ne perds pas 15 minutes à choisir, l'app fait le boulot intelligent et chaleureux."

---

## Feature 4.2 — Détail service avec assignations

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Page `/admin/services/[id]`. Reproduit fidèlement la maquette validée :

1. **Header noir** : type d'événement (badge), date, heure, lieu, thème
2. **Bloc progression** : mini-cercle SVG noir + "X/Y postes pourvus" + bouton "Aperçu" (voir comme membre)
3. **Section "Postes à pourvoir"** :
   - Pour chaque skill du service : icône colorée + label + badge "Pourvu" sage ou "À pourvoir" rouge
   - Si pourvu : card du membre assigné avec badge niveau (Autonome/Apprenti) + menu 3 points
   - Si à pourvoir : card du désistement (membre barré rouge) + **bloc proposition IA** (border shimmer animé)
4. **Bloc proposition IA** : icône sparkles + label "Proposition" + avatar + nom + badge niveau + raison chaleureuse + boutons "L'assigner" (noir plein) et "Autres"
5. **Section "Équipe complète"** : 3 cards compactes avec statut (Dispo / Vacances / Admin)
6. **Modal "Assigner à [Skill]"** : ouverte au tap sur "Autres"
   - Reco IA en haut avec border shimmer + badge "RECO"
   - Autres autonomes
   - Apprentis avec mention "Binôme requis"
   - Section "Indisponibles" en bas (barrés, opacity 0.5)
7. **Bouton sticky bottom "Publier et notifier l'équipe"** :
   - Désactivé (opacity 0.5) si postes manquants
   - Actif (noir plein) quand tout assigné
   - Au clic : update status `published`, envoie push notifs à tous les assignés

### Tests

```typescript
describe('Service detail', () => {
  it('shows progression circle with 2/3', async () => {
    render(<ServiceDetail serviceId="2025-06-23" />);
    expect(await screen.findByText('2/3')).toBeInTheDocument();
  });

  it('shows AI proposal for vacant slot', async () => {
    render(<ServiceDetail serviceId="2025-06-23" />);
    expect(await screen.findByText('Proposition')).toBeInTheDocument();
    expect(screen.getByText(/Chrisciana/)).toBeInTheDocument();
  });

  it('disables publish button when slots empty', async () => {
    render(<ServiceDetail serviceId="2025-06-23" />);
    const btn = screen.getByText(/Publier et notifier/);
    expect(btn).toBeDisabled();
  });

  it('opens member modal on "Autres" click', async () => {
    const { user } = render(<ServiceDetail serviceId="2025-06-23" />);
    await user.click(screen.getByText('Autres'));
    expect(await screen.findByText(/Assigner à Diffusion/)).toBeInTheDocument();
    expect(screen.getByText('RECO')).toBeInTheDocument();
  });

  it('publishes service when all slots filled', async () => {
    // Assigner Chrisciana
    // Cliquer Publier
    // Vérifier que status = 'published' en DB
    // Vérifier que les push notifs sont envoyées
  });
});

// E2E
test('Alpha reassigns Dave with AI proposal', async ({ page }) => {
  await loginAs(page, 'Alpha', '9182');
  await page.goto('/admin');
  await page.click('text=Voir et gérer le service');

  // Dave a annulé, Diffusion à pourvoir
  await expect(page.getByText('Dave')).toHaveClass(/line-through/);
  await expect(page.getByText('Chrisciana')).toBeVisible();
  await page.click('text=L\'assigner');

  await expect(page.getByText('3/3')).toBeVisible();
  await expect(page.getByText('Publier et notifier')).toBeEnabled();
});
```

### ✅ Checklist humaine

- [ ] Header noir avec date + heure + lieu + thème lisible
- [ ] Cercle de progression visible et fonctionnel
- [ ] Postes pourvus en sage, postes manquants en rouge tamisé
- [ ] Card de Dave barré rouge dans le poste Diffusion
- [ ] Card IA avec border shimmer animé (visible)
- [ ] Tap "L'assigner" → Chrisciana assignée, card sage "Pourvu" apparaît
- [ ] Tap "Autres" → modal avec liste complète + section indisponibles
- [ ] Apprentie Stéphanie marquée "Binôme requis" dans la modal
- [ ] Bouton "Publier" désactivé tant qu'il manque un poste
- [ ] Une fois tout pourvu, bouton actif noir
- [ ] Tap "Publier" → service passe en `published`, notifs envoyées

### 📖 Scénario narratif

> "Tu reçois la notif 'Dave a annulé le 30 juin'. Tu ouvres l'app, le détail du service. Tu vois Dave barré, et juste en dessous, dans une card avec une lumière sage qui bouge, l'app te propose Chrisciana. Le texte te dit pourquoi : 'Elle maîtrise et n'a pas servi récemment'. Tu cliques 'L'assigner'. Tu passes 30 secondes là-dessus au lieu de 10 minutes."

---

## 🔄 Vérification de fin de Sprint 4

**Sprint le plus critique. Triple vérification :**

```bash
npm run test:all
npm run test:coverage  # > 70% sur lib/ai/
```

**Toutes les features 4.1 → 4.2 doivent être ✅ Code ✅ Tests ✅ Validé.**

---

# Sprint 5 — Gestion équipe + Création événement

**Objectif** : Alpha peut gérer son équipe (niveaux, infos perso, alertes) et créer des événements en série avec assignation auto.

**Durée estimée** : 1 semaine

---

## Feature 5.1 — Gestion équipe (liste + fiche)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Page `/admin/team` :

1. Header "Console admin / Ton équipe" + bouton noir "+ Inviter"
2. Stats triptyque : 6 membres / 5 autonomes / 4 apprentissages
3. **Filtres horizontaux scrollables** : Tous (avec compteur) / Sono / Caméra / Diffusion / Apprentis
4. **Liste des 6 membres** : chaque card avec avatar + nom + badges compétences (sage = autonome, ambre = apprenti) + stats compactes (X services ce mois, dernière fois servi) + chevron
5. **Badges contextuels** en haut à droite (max 3 types sur mobile) :
   - "Annulé [date]" (rouge tamisé) si annulation récente
   - "À relancer" (ambre) si mois non validé
   - "Décroche" (ambre) si pas servi depuis 3+ semaines
6. Tap sur card → modal bottom sheet avec **fiche détaillée** :
   - Avatar 64px + nom + "Dans l'équipe depuis [date]"
   - **Bloc Infos perso** : téléphone, anniversaire, "pourquoi je sers" en italique
   - **Bloc Compétences** : 3 lignes (1 par skill) avec niveau actuel + bouton "Modifier" explicite
   - **Bloc Activité** : 3 stats (ce mois / cette année / présence %)
   - Bouton noir "Lui écrire" (ouvre WhatsApp/SMS natif) + bouton ⋯ pour autres options

### Logique d'édition de niveau

```typescript
// Tap sur bouton "Modifier" → ouvre un picker
function SkillEditor({ memberSkill, onSave }: Props) {
  return (
    <BottomSheet>
      <h3>Niveau de {memberSkill.profile.display_name} en {memberSkill.skill.name}</h3>
      <div className="flex gap-2">
        <Button onClick={() => onSave('learning')}>Apprenti·e</Button>
        <Button onClick={() => onSave('autonomous')}>Autonome</Button>
        <Button onClick={() => onSave('trainer')}>Formateur·rice</Button>
      </div>
    </BottomSheet>
  );
}
```

### Lien WhatsApp / SMS natif

```typescript
function openMessage(phone: string) {
  // Détection plateforme
  const isMobile = /Android|iPhone/i.test(navigator.userAgent);
  if (!isMobile) {
    // Desktop : ouvrir WhatsApp Web
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
    return;
  }
  // Mobile : essayer WhatsApp, fallback SMS
  const whatsappUrl = `whatsapp://send?phone=${phone.replace(/\D/g, '')}`;
  const smsUrl = `sms:${phone}`;

  window.location.href = whatsappUrl;
  setTimeout(() => {
    window.location.href = smsUrl;  // fallback si WhatsApp pas installé
  }, 500);
}
```

### Tests

```typescript
describe('Team management', () => {
  it('displays 6 members', async () => {
    render(<TeamPage />);
    const cards = await screen.findAllByTestId('member-card');
    expect(cards).toHaveLength(6);
  });

  it('filters by skill', async () => {
    const { user } = render(<TeamPage />);
    await user.click(screen.getByRole('button', { name: 'Sono' }));
    expect(screen.queryByText('Chana')).not.toBeInTheDocument();  // Chana n'a pas Sono
    expect(screen.getByText('Isaac')).toBeInTheDocument();
    expect(screen.getByText('Gloria')).toBeInTheDocument();  // Apprentie Sono
  });

  it('shows contextual badges', () => {
    render(<TeamPage />);
    expect(screen.getByText(/Annulé 30\/06/i)).toBeInTheDocument();  // Dave
    expect(screen.getByText(/À relancer/i)).toBeInTheDocument();  // Stéphanie
    expect(screen.getByText(/Décroche/i)).toBeInTheDocument();  // Gloria
  });

  it('opens detail modal on card click', async () => {
    const { user } = render(<TeamPage />);
    await user.click(screen.getByText('Chana'));
    expect(await screen.findByText(/Dans l'équipe depuis/)).toBeVisible();
    expect(screen.getByText(/Pourquoi je sers/)).toBeVisible();
  });

  it('updates skill level on Modifier click', async () => {
    // Open Chana's detail
    // Click Modifier on Diffusion
    // Select "Autonome"
    // Vérifier que DB est mise à jour
    // Vérifier qu'une notif chaleureuse est envoyée à Chana
  });
});
```

### ✅ Checklist humaine

- [ ] Stats triptyque correct (6 / 5 / 4)
- [ ] Filtres scrollables fonctionnels
- [ ] Chaque membre affiche bien ses badges de compétence avec bon niveau
- [ ] Badges contextuels présents : Dave "Annulé", Stéphanie "À relancer", Gloria "Décroche"
- [ ] Tap sur Chana → modal détaillée avec ses 3 skills (Sono Non formée, Caméra Autonome, Diffusion Apprentie)
- [ ] Bouton "Modifier" sur chaque skill ouvre un picker
- [ ] Changement de niveau persiste en DB
- [ ] Bouton "Lui écrire" lance WhatsApp sur mobile

### 📖 Scénario narratif

> "Tu (Alpha) sens que Stéphanie progresse bien en diffusion. Tu ouvres sa fiche, tu cliques 'Modifier' sur Diffusion, tu choisis 'Autonome'. L'app lui envoie une notif 'Bravo Stéphanie, tu es maintenant autonome à la diffusion 🎉'. Tu sens que tu peux faire évoluer ton équipe sans paperasse."

---

## Feature 5.2 — Création d'événement (bottom sheet)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Bottom sheet ouvert depuis le FAB du Dashboard admin. Reproduit fidèlement la maquette validée :

1. **Type d'événement** : 3 chips (Dimanche / Semaine / Call) avec icônes colorées
2. **Bloc Série (visible si Dimanche choisi)** :
   - Fond sage + label "SÉRIE · [Mois en cours]"
   - Compteur "X dimanches"
   - 4 mini-cards horizontales (1 par dimanche du mois) avec check ou état "OFF" (désactivé)
   - Tap sur une mini-card pour la désactiver/activer
3. **Horaire** : 2 fields Début + Arrivée
4. **Lieu** : sélecteur ("Salle principale" par défaut)
5. **Postes à pourvoir** : chips colorés (Sono sage / Caméra menthe / Diffusion lilas) + chip "+ Autre"
6. **Thème spirituel** : optionnel, ouvre la bibliothèque Bible
7. **Bloc Proposition d'équipes IA** (visible après remplissage) : border shimmer + 3 mini-blocs (1 par dimanche) avec membres pré-assignés
8. **Boutons** : "Sans équipe" (outline) + "Créer 3 dimanches" (noir plein)

### Logique de création en série

```typescript
async function createSeriesEvents(input: {
  event_type: 'sunday_service' | 'midweek_service' | 'team_call';
  month: number;
  year: number;
  disabled_dates: string[];  // ["2025-07-20"]
  start_time: string;
  arrival_time: string;
  location: string;
  skills: string[];  // skill_ids
  with_team_proposal: boolean;
}) {
  const series_id = crypto.randomUUID();

  // Calculer toutes les dates de dimanche du mois
  const sundays = getAllSundaysInMonth(input.year, input.month)
    .filter(date => !input.disabled_dates.includes(date.toISOString().split('T')[0]));

  // INSERT en transaction
  const services = await supabase.from('services').insert(
    sundays.map(date => ({
      organization_id: ORG_ID,
      event_type: input.event_type,
      service_date: date.toISOString().split('T')[0],
      start_time: input.start_time,
      arrival_time: input.arrival_time,
      location: input.location,
      series_id,
      status: 'draft',
    }))
  ).select();

  // Pour chaque service, créer les slots
  for (const service of services.data) {
    await supabase.from('service_slots').insert(
      input.skills.map(skill_id => ({
        service_id: service.id,
        skill_id,
        positions_required: 1,
      }))
    );
  }

  // Si demandé : proposer une équipe
  if (input.with_team_proposal) {
    for (const service of services.data) {
      const proposals = await proposeTeam(service.id);
      // Pré-créer les assignments en statut 'pending_validation' admin
    }
  }

  return services.data;
}
```

### Tests

```typescript
describe('Series creation', () => {
  it('creates 4 services for July 2025', async () => {
    const result = await createSeriesEvents({
      event_type: 'sunday_service',
      month: 7,
      year: 2025,
      disabled_dates: [],
      // ...
    });
    expect(result).toHaveLength(4);  // 4 dimanches en juillet 2025
  });

  it('skips disabled date', async () => {
    const result = await createSeriesEvents({
      // ...
      disabled_dates: ['2025-07-20'],
    });
    expect(result).toHaveLength(3);
    expect(result.find(s => s.service_date === '2025-07-20')).toBeUndefined();
  });

  it('proposes team if requested', async () => {
    const result = await createSeriesEvents({ /* ... */ with_team_proposal: true });
    for (const service of result) {
      const assignments = await getAssignments(service.id);
      expect(assignments.length).toBeGreaterThan(0);
    }
  });
});

// E2E
test('Alpha creates a July series', async ({ page }) => {
  await loginAs(page, 'Alpha', '9182');
  await page.click('[aria-label="Créer"]');
  await page.click('text=Dimanche');

  // 4 dimanches affichés
  await expect(page.locator('[data-day]')).toHaveCount(4);

  // Désactiver le 20 juillet
  await page.click('[data-day="2025-07-20"]');
  await expect(page.locator('[data-day="2025-07-20"]')).toHaveClass(/disabled/);

  // Voir proposition IA
  await expect(page.getByText(/Proposition d'équipes/)).toBeVisible();

  // Créer
  await page.click('text=Créer 3 dimanches');
  await expect(page).toHaveURL('/admin/services');
  await expect(page.getByText('3 services créés')).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] Bottom sheet s'ouvre en glissant depuis le bas avec animation
- [ ] 3 chips de type d'événement (premier actif noir)
- [ ] Bloc sage série bien visible
- [ ] Je peux désactiver/activer un dimanche en cliquant
- [ ] Le dimanche désactivé apparaît barré pointillé
- [ ] Champs Horaire/Lieu/Postes pré-remplis avec valeurs par défaut
- [ ] Proposition IA apparaît avec border shimmer
- [ ] Les 3 équipes proposées sont cohérentes
- [ ] Bouton "Créer 3 dimanches" crée bien 3 services en DB
- [ ] Notifs push envoyées aux membres concernés

### 📖 Scénario narratif

> "Tu (Alpha) finis juin, tu veux préparer juillet. Tu cliques le FAB, tu choisis 'Dimanche'. L'app te montre les 4 dimanches du mois. Tu désactives le 20 (tu pars en vacances). Tu vois apparaître la proposition IA : 3 équipes pré-faites. Tu valides. 3 services créés en 30 secondes. Tu publies. Toute l'équipe est notifiée du nouveau mois."

---

## 🔄 Vérification de fin de Sprint 5

```bash
npm run test:all
```

**Toutes les features 5.1 → 5.2 doivent être ✅ Code ✅ Tests ✅ Validé.**

---

# Sprint 6 — Contenu spirituel + PWA + Polish

**Objectif** : Publier les pensées de la semaine, embarquer la Bible Segond 21, finaliser la PWA avec push notifications, et polish général.

**Durée estimée** : 1 semaine + bêta avec l'équipe

---

## Feature 6.1 — Contenu spirituel (Pensée de la semaine + Bibliothèque)

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

Page `/admin/spiritual` :

1. **Bouton "Publier"** noir en haut à droite
2. **Card "Publiée cette semaine"** : fond sage + badge "EN LIGNE" + verset + référence + date + boutons "Modifier" et "Aperçu membre"
3. **Section "Historique"** : 3-5 cards compactes avec icône sparkles colorée alternée + extrait + référence + date relative

### Modal "Composer"

1. Header "Composer"
2. Champ texte de la pensée (textarea) avec bouton sage "Piocher dans la Bible"
3. Champ référence biblique (optionnel)
4. Programmation : 3 chips (Maintenant / Lundi 8h / Choisir)
5. Boutons "Brouillon" (outline) et "Publier" (noir)

### Modal "Bible Segond 21"

1. Barre de recherche
2. Recherche full-text dans `bible_verses` (français)
3. Résultats avec mots-clés en `<strong>` (mise en valeur)
4. Tap sur un verset → bordure sage + check
5. Bouton "Utiliser [Référence]" en bas

### Logique de recherche Bible

```typescript
// src/lib/bible.ts
import bibleData from '@/../public/bible-segond21.json';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export function searchBible(query: string): BibleVerse[] {
  const normalized = query.toLowerCase().trim();

  // Recherche par référence ("Jean 3:16", "Psaume 133")
  const refMatch = normalized.match(/^([\d\s]*[a-zéè]+)\s+(\d+)(?::(\d+))?/);
  if (refMatch) {
    const [, book, chapter, verse] = refMatch;
    return bibleData.filter(v =>
      v.book.toLowerCase().includes(book.trim()) &&
      v.chapter === parseInt(chapter) &&
      (verse ? v.verse === parseInt(verse) : true)
    ).slice(0, 20);
  }

  // Recherche par mot-clé
  return bibleData
    .filter(v => v.text.toLowerCase().includes(normalized))
    .slice(0, 20);
}

export function highlightKeyword(text: string, keyword: string): string {
  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
}
```

### Tests

```typescript
describe('Bible search', () => {
  it('finds verses by reference', () => {
    const results = searchBible('Jean 3:16');
    expect(results[0].reference).toBe('Jean 3:16');
  });

  it('finds verses by keyword', () => {
    const results = searchBible('unité');
    expect(results.some(v => v.reference === 'Psaume 133:1')).toBe(true);
    expect(results.some(v => v.reference === 'Éphésiens 4:3')).toBe(true);
  });

  it('limits to 20 results', () => {
    const results = searchBible('Dieu');  // mot fréquent
    expect(results.length).toBeLessThanOrEqual(20);
  });
});

describe('Spiritual content publication', () => {
  it('publishes thought immediately', async () => {
    await publishWeeklyThought({
      verse_text: '...',
      verse_reference: '1 Pierre 4:10',
      schedule: 'now',
    });
    const { data } = await supabase
      .from('spiritual_content')
      .select('*')
      .eq('content_type', 'weekly_thought')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();
    expect(data.status).toBe('published');
  });

  it('schedules thought for Monday 8am', async () => {
    await publishWeeklyThought({
      verse_text: '...',
      schedule: 'monday_8am',
    });
    // Vérifier scheduled_for
  });
});

// E2E
test('Alpha publishes a new thought from Bible', async ({ page }) => {
  await loginAs(page, 'Alpha', '9182');
  await page.goto('/admin/spiritual');
  await page.click('text=Publier');

  await page.click('text=Piocher dans la Bible');
  await page.fill('[placeholder*="rechercher"]', 'unité');
  await page.click('text=Éphésiens 4:3');
  await page.click('text=Utiliser Éphésiens 4:3');

  await page.click('text=Maintenant');
  await page.click('text=Publier');

  await expect(page.getByText('Publiée cette semaine')).toBeVisible();
  await expect(page.getByText(/unité de l'Esprit/)).toBeVisible();
});
```

### ✅ Checklist humaine

- [ ] La pensée actuellement publiée s'affiche en sage avec badge "EN LIGNE"
- [ ] Bouton "Publier" ouvre la modal Composer
- [ ] Tap sur "Piocher dans la Bible" ouvre la modal Bible
- [ ] Recherche "unité" retourne 3 résultats pertinents
- [ ] Tap sur un verset le pré-sélectionne avec bordure sage
- [ ] Tap "Utiliser" remplit le champ texte de la pensée
- [ ] Programmation Maintenant / Lundi 8h fonctionnelle
- [ ] Tap "Publier" → la pensée passe en `published`, devient visible côté membre
- [ ] Historique affiche les pensées passées

### 📖 Scénario narratif

> "Tu (Alpha) prépares le mois d'août. Tu veux que le thème de la semaine soit 'persévérance'. Tu ouvres Spirituel, Publier, tu piocha dans la Bible, tu cherches 'persévérance'. Tu trouves Romains 5:3-4. Tu cliques, c'est dans le champ. Tu cliques 'Lundi 8h'. Tu cliques Publier. C'est fait. Lundi matin, tes 6 membres recevront cette pensée en notif."

---

## Feature 6.2 — PWA + Push notifications

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. **Manifest PWA** (`public/manifest.json`) avec icons, theme color (#16161B), background color (#F4F4F2)
2. **Service Worker** via `next-pwa` pour le cache offline
3. **Web Push API** :
   - Au login, demander la permission push
   - Si accordée, enregistrer la subscription en DB (`push_subscriptions`)
   - Edge Function Supabase pour envoyer les push
4. **Triggers de notifications** :
   - Service publié → tous les assignés
   - Pensée publiée → tous les membres
   - Membre annule → admin
   - Évolution de niveau → le membre concerné (avec ton chaleureux)
   - Validation mensuelle manquante (rappel J+3) → membre
5. **Splash screen** au lancement (logo Crew + couleurs Connectify)
6. **Install prompt** sur navigateurs compatibles

### Edge Function pour envoyer des push

```typescript
// supabase/functions/send-push/index.ts
import webpush from 'npm:web-push';

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

serve(async (req) => {
  const { profile_ids, title, body, url } = await req.json();

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('profile_id', profile_ids);

  await Promise.all(subs.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
      JSON.stringify({ title, body, url })
    )
  ));

  return new Response(JSON.stringify({ ok: true, sent: subs.length }));
});
```

### Tests

```typescript
describe('Push notifications', () => {
  it('registers subscription on permission grant', async () => {
    // Mock Notification.requestPermission = 'granted'
    // Mock PushManager.subscribe
    await registerPushSubscription('chana-id');
    const { data } = await supabase.from('push_subscriptions').select('*').eq('profile_id', 'chana-id');
    expect(data).toHaveLength(1);
  });

  it('sends notification on service publish', async () => {
    const sentSpy = vi.fn();
    await publishService('service-23-juin');
    expect(sentSpy).toHaveBeenCalledWith(expect.objectContaining({
      profile_ids: ['isaac', 'chana', 'dave'],
      title: expect.stringContaining('Dimanche 23 juin'),
    }));
  });
});

// E2E manuel : tester sur device réel
```

### ✅ Checklist humaine

- [ ] L'app peut être installée sur mon téléphone (icône sur l'écran d'accueil)
- [ ] Au premier login, la demande de permission push apparaît
- [ ] Si j'accepte, mon abonnement est créé en DB
- [ ] Quand Alpha publie un service où je suis assigné, je reçois une notif
- [ ] Le tap sur la notif ouvre la bonne page
- [ ] L'app fonctionne offline (au moins l'affichage des dernières données)
- [ ] Splash screen avec couleurs Connectify visible au lancement

### 📖 Scénario narratif

> "Tu (Chana) reçois une notif sur ton tel : 'Nouveau service · Dimanche 23 juin · Tu es à la caméra'. Tu cliques, l'app ouvre direct le détail du service. Tu valides en 5 secondes. L'app est devenue un réflexe."

---

## Feature 6.3 — Polish général + Bêta

**Statut** : ☐ Code · ☐ Tests · ☐ Validé

### Specs

1. **Audit accessibilité** : tous les labels ARIA, contrast ratios, navigation clavier
2. **Loading states** : skeletons partout, pas de spinners blancs
3. **Empty states** chaleureux : "Tout va bien 🌟" / "Personne ne t'attend ici pour l'instant"
4. **Error boundaries** Next.js sur chaque route
5. **Toasts** pour confirmation d'actions (création, annulation, etc.)
6. **Tests E2E sur device réel** (iPhone, Android)
7. **Bêta avec ton équipe** : invite Chana + Isaac + Chrisciana à utiliser l'app pendant 1 semaine
8. **Feedback form** in-app (bouton discret en bas du dashboard admin)

### Tests E2E finaux

```typescript
test.describe('Critical user flows', () => {
  test('Member full flow: login → see dashboard → validate month → cancel service', async ({ page }) => {
    // ...
  });

  test('Admin full flow: login → see alerts → reassign Dave → publish service', async ({ page }) => {
    // ...
  });

  test('Admin creates series → AI proposes → publishes → members notified', async ({ page }) => {
    // ...
  });
});
```

### ✅ Checklist humaine (bêta)

- [ ] J'ai invité 3 membres pour tester pendant 1 semaine
- [ ] J'ai collecté leur feedback (formulaire ou message direct)
- [ ] Bugs identifiés sont listés
- [ ] Aucun bug bloquant
- [ ] Loading states fluides partout
- [ ] Pas de console errors
- [ ] Performance Lighthouse > 90 sur mobile
- [ ] Accessibilité Lighthouse > 90

### 📖 Scénario narratif final

> "Ton équipe utilise Crew depuis 1 mois. Chana valide son mois en 30 secondes au lieu de répondre à 10 messages WhatsApp. Isaac arrive à la sono à 13h30 sans qu'on lui ait rappelé. Stéphanie a évolué d'apprentie à autonome en caméra, l'app l'a célébrée. Dave a annulé une fois, t'as réassigné Chrisciana en 1 clic. Personne n'utilise plus le groupe WhatsApp pour la prod. Tu sens que ton équipe est plus soudée, plus engagée, plus fière. Crew a réussi sa mission."

---

## 🔄 Vérification finale

```bash
npm run test:all
npm run test:coverage
npm run build
npm run lint
```

**Toutes les features 1.1 → 6.3 doivent être ✅ Code ✅ Tests ✅ Validé avant la mise en production.**

---

# Prompts Midjourney pour assets

## Avatars membres (7 avatars)

**Style commun à imposer dans tous les prompts** :

```
3D character portrait, Pixar style, soft pastel lighting, cinematic ambient light,
clean composition, simple background, friendly facial expression, looking forward,
shoulders up shot, --ar 1:1 --v 6.1 --style raw --stylize 200
```

### Prompts par membre

**Alpha (Admin, toi)**
```
3D character portrait Pixar style, [DESCRIBE: ton âge, genre, couleur de peau, style cheveux],
warm confident smile, soft pastel background (mint/sage gradient),
cinematic ambient light, professional yet approachable, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Chana**
```
3D character portrait Pixar style, [DESCRIBE Chana],
calm warm expression, soft mint pastel background,
cinematic ambient light, friendly approachable, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Isaac**
```
3D character portrait Pixar style, [DESCRIBE Isaac],
focused gentle expression, soft lilac pastel background,
cinematic ambient light, kind eyes, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Chrisciana**
```
3D character portrait Pixar style, [DESCRIBE Chrisciana],
bright joyful expression, soft sage green pastel background,
cinematic ambient light, warm smile, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Dave**
```
3D character portrait Pixar style, [DESCRIBE Dave],
relaxed friendly expression, soft lilac pastel background,
cinematic ambient light, approachable, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Stéphanie**
```
3D character portrait Pixar style, [DESCRIBE Stéphanie],
curious bright expression, soft mint pastel background,
cinematic ambient light, learner attitude, --ar 1:1 --v 6.1 --style raw --stylize 200
```

**Gloria**
```
3D character portrait Pixar style, [DESCRIBE Gloria],
serene confident expression, soft sage green pastel background,
cinematic ambient light, warm presence, --ar 1:1 --v 6.1 --style raw --stylize 200
```

> **Instructions de remplacement** : Pour chaque `[DESCRIBE]`, ajoute :
> - Âge approximatif (20s / 30s / 40s)
> - Couleur de peau (pour la diversité)
> - Style de cheveux (court, long, tresses, etc.)
> - Lunettes ou pas
> - Tout signe distinctif (barbe, etc.)
>
> **Astuce cohérence** : Utilise la fonction `--cref [url-image]` pour garder la cohérence du style entre les 7 avatars. Génère Alpha d'abord, puis utilise son image comme référence.

## Illustrations skills (3 illustrations)

**Sono**
```
3D illustration Pixar style, professional audio mixing console with sliders and knobs,
warm sage green pastel background, soft cinematic light, clean composition,
floating slightly, modern church audio setup, --ar 4:3 --v 6.1 --style raw --stylize 250
```

**Caméra**
```
3D illustration Pixar style, professional video camera on tripod,
soft mint green pastel background, gentle ambient light, clean composition,
warm friendly aesthetic, --ar 4:3 --v 6.1 --style raw --stylize 250
```

**Diffusion**
```
3D illustration Pixar style, large screen display with media broadcasting interface,
soft lilac purple pastel background, cinematic ambient light, clean composition,
modern church streaming setup, --ar 4:3 --v 6.1 --style raw --stylize 250
```

## Conseils généraux Midjourney

1. **Génère d'abord les 3 illustrations skills** pour valider le style global
2. **Puis génère Alpha** en premier avatar — il deviendra ta référence pour la cohérence
3. **Utilise `--cref [url-alpha]`** sur les 6 autres avatars pour garder le style identique
4. **Si un avatar ne te plaît pas**, utilise `--cref` plus fort (multiplie par 2-3 le poids)
5. **Pour les arrière-plans pastels qui ne matchent pas exactement** : édite dans Photoshop ou utilise `--no` pour exclure des couleurs ("--no bright colors --no saturated")
6. **Format final** : exporte en PNG transparent + arrière-plan pour avoir 2 versions

---

# Tableau de suivi global

## Sprint 1 — Foundation
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 1.1 Setup initial | ☐ | ☐ | ☐ |
| 1.2 Schéma Supabase + Seed | ☐ | ☐ | ☐ |
| 1.3 Profile Picker | ☐ | ☐ | ☐ |
| 1.4 Saisie de code | ☐ | ☐ | ☐ |
| 1.5 Device locking | ☐ | ☐ | ☐ |

## Sprint 2 — Dashboard + Calendrier membre
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 2.1 Layout membre + Bottom nav | ☐ | ☐ | ☐ |
| 2.2 Dashboard membre v3 | ☐ | ☐ | ☐ |
| 2.3 Vue mensuelle validation | ☐ | ☐ | ☐ |
| 2.4 Vue mensuelle consultation | ☐ | ☐ | ☐ |

## Sprint 3 — Service Day + Console admin
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 3.1 Mode Service Day | ☐ | ☐ | ☐ |
| 3.2 Layout admin + Bottom nav | ☐ | ☐ | ☐ |
| 3.3 Dashboard admin | ☐ | ☐ | ☐ |

## Sprint 4 — Détail service + IA
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 4.1 Algo IA assignation | ☐ | ☐ | ☐ |
| 4.2 Détail service + assignations | ☐ | ☐ | ☐ |

## Sprint 5 — Équipe + Création
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 5.1 Gestion équipe (liste + fiche) | ☐ | ☐ | ☐ |
| 5.2 Création d'événement | ☐ | ☐ | ☐ |

## Sprint 6 — Spirituel + PWA + Bêta
| Feature | Code | Tests | Validé |
|---------|:----:|:-----:|:------:|
| 6.1 Contenu spirituel + Bible | ☐ | ☐ | ☐ |
| 6.2 PWA + Push notifications | ☐ | ☐ | ☐ |
| 6.3 Polish + Bêta équipe | ☐ | ☐ | ☐ |

---

## Règles strictes pour l'agent (rappel)

1. **Lis ce fichier en entier avant de commencer** — c'est ta source de vérité
2. **Avant chaque nouvelle feature**, vérifie que la précédente est ✅ ✅ ✅
3. **Si une feature précédente n'est pas validée**, retourne dessus avant d'avancer
4. **Mets à jour le tableau de suivi** en remplaçant ☐ par ✅ à chaque étape
5. **Lance `npm run test:all` après chaque feature** — bloque si ça ne passe pas
6. **Avertis Alpha quand une feature est prête** pour la validation humaine
7. **Ne te précipite pas** — chaque feature mérite ses 3 cases cochées

**Mantra** : *Un code qui marche + des tests qui passent + un humain qui valide = une feature terminée. Sinon, ce n'est pas fini.*

---

**Fin du plan de développement Crew.**

*Document généré par Claude. Version 1.0 — Mai 2026.*
*Mission : "Se sentir vu, valorisé, fier de servir."*
