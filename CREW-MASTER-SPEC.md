# 🚀 CREW — Specification Complète du Projet

> **À LIRE EN PREMIER, AVANT TOUTE LIGNE DE CODE.**
> Ce document est ta seule source de vérité. Tu vas construire ce produit en autonomie, en suivant les phases dans l'ordre, sans sauter d'étape.

---

## 📋 Comment utiliser ce document

Tu es Claude Code. Tu vas développer un produit complet en suivant ce document.

**Règles d'exécution :**

1. **Lis ce document en entier avant de commencer.** Ne saute aucune section.
2. **Respecte l'ordre des phases.** Phase 0 → 1 → 2 → 3 → 4. Pas de raccourci.
3. **À la fin de chaque phase, fais un point** : ce qui est fait, ce qui reste, et demande validation avant de continuer.
4. **Commit Git après chaque sous-tâche** avec un message clair.
5. **Teste en local après chaque feature** avant d'enchaîner.
6. **Si tu hésites sur une décision technique**, relis les Principes Directeurs (§2) — ils sont le juge de paix.
7. **Le code doit être production-ready dès le début** : typé, gestion d'erreurs, accessible, mobile-first.
8. **Tu parles français** dans toute l'UI et tous les messages utilisateur.

---

## 🎯 PARTIE 1 — VISION & CONTEXTE

### Le projet en une phrase

**Crew** est une plateforme PWA pour les équipes de service à l'église — un système vivant qui transforme la logistique froide du planning en moments d'engagement chaleureux.

### Qui je suis (le client)

- Prénom : **Thithi**
- Rôle : responsable d'une équipe de production (son, caméra, diffusion) dans une église
- Équipe : 7 personnes incluant moi
- Fréquence : 1 culte le dimanche + 1 culte en semaine
- Localisation : France (Paris)
- Niveau technique : pas développeur, je m'appuie sur toi

### Le problème que je résous

Mon équipe a du mal à être présente, engagée, ponctuelle. Les outils existants (Planning Center, etc.) sont :
- Froids, anglophones, type "RH d'église"
- Centrés sur la planification, pas sur l'humain
- Ignorent la dimension spirituelle et la dynamique de groupe

### Ce que Crew n'est PAS

❌ Un WhatsApp amélioré
❌ Un Google Sheet en plus joli
❌ Un outil RH froid avec des KPIs
❌ Un outil exhaustif qui fait tout

### Ce que Crew EST

✅ Une plateforme de **vie d'équipe**
✅ Un système qui **valorise** les membres
✅ Un outil qui **infuse** le spirituel partout (pas dans un module isolé)
✅ Une expérience **chaleureuse, simple, mobile-first**

---

## 🧭 PARTIE 2 — PRINCIPES DIRECTEURS (à respecter dans CHAQUE décision)

### Mission en une phrase

> **Faire en sorte que chaque membre de l'équipe se sente vu, valorisé et fier de servir.**

### Les 5 principes non-négociables

#### 1. Chaleur > Efficacité
- ❌ "Service du 14/06 — confirmer ?"
- ✅ "Hey Isaac, dimanche tu seras à la sono avec Chana. Tu confirmes ?"

#### 2. Friction zéro pour le membre
Toute la complexité repose sur l'admin, jamais sur le membre.
- ✅ Notif push → tap → fini
- ❌ "Connecte-toi, va dans tes services, clique, choisis…"

#### 3. Reconnaître plus que rappeler
Ratio cible : **60% reconnaissance / 40% logistique**.
Pour chaque "tu dois X", au moins un "merci pour Y" ou "tu as accompli Z".

#### 4. Le spirituel n'est pas un module, c'est le ciment
Pas de page "Spirituel" isolée. Le spirituel s'infuse :
- Verset le lundi dans la notif
- Pensée de la semaine dans le dashboard
- Thème spirituel sur chaque service
- "Qu'est-ce que Dieu a fait ?" après le service

#### 5. Construit pour la durée, pas pour la démo
Privilégier ce qui sera utilisé chaque semaine pendant 3 ans, pas ce qui fait "wow" la première fois.

### Règles de ton

**Pour les membres :**
- Tutoiement systématique
- Prénom préféré (pas nom complet)
- Jamais "vous"
- Jamais "bénévole" → toujours "équipe", "servir"
- Émojis dosés (max 1-2 par message)
- Phrases courtes, verbes d'action

**Pour le responsable :**
- Plus factuel mais toujours bienveillant
- ✅ "3 personnes n'ont pas confirmé — veux-tu leur envoyer un mot ?"
- ❌ "Taux de confirmation : 60%"

### Les 8 moments d'engagement à toujours soigner

1. **Découverte du planning** → personnel, chaleureux, en 1 tap
2. **Déclaration des dispos** → rapide, sans culpabilisation
3. **Semaine du service** → séquence relationnelle
4. **Jour J (Service Day)** → ultra-clair, check-in, feedback léger
5. **Après-service** → reconnaissance immédiate
6. **Progression long terme** → visible, jalons célébrés
7. **Sens spirituel** → diffus, partout
8. **Communication** → annonces ≠ chat

### Filtre de décision

Avant chaque feature, pose-toi : **"Est-ce que ce moment fait que mon membre se sent vu, valorisé, fier de servir ?"**
Si non → ne pas construire.

---

## 🏗️ PARTIE 3 — STACK TECHNIQUE

### Choix imposés (ne pas dévier)

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Moderne, SSR, PWA facile |
| Langage | **TypeScript** (strict) | Robustesse |
| Styling | **Tailwind CSS** + **shadcn/ui** | Rapide, accessible, beau |
| Backend/DB | **Supabase** | Auth + Postgres + Realtime + Edge Functions |
| Hosting | **Vercel** | Déploiement 1-clic, gratuit pour l'usage |
| Notifications | **Web Push API** (PWA) | Gratuit, immédiat, pas de Twilio |
| Animations | **Framer Motion** | Subtilité élégante |
| Dates | **date-fns** + locale `fr` | Standard en français |
| Icons | **Lucide React** | Cohérent avec shadcn |
| Forms | **react-hook-form** + **zod** | Validation propre |

### Choix esthétiques imposés

- **Palette** : base `slate` + accent chaleureux **ambre** (#F59E0B) pour l'humain, **émeraude** (#10B981) pour le spirituel
- **Typo** : `Inter` pour le corps, `Fraunces` ou `Crimson Pro` pour les titres (touche chaleureuse, pas froid corporate)
- **Border radius** : généreux (rounded-2xl par défaut)
- **Mobile-first** : tout doit être nickel sur iPhone 13 (390px) avant d'être beau sur desktop
- **Pas de dark mode au MVP** — focus sur un mode clair impeccable d'abord

### Structure des dossiers

```
crew/
├── src/
│   ├── app/                      # App Router Next.js
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (member)/             # Layout membre
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── dispos/
│   │   │   ├── parcours/
│   │   │   └── annonces/
│   │   ├── (admin)/              # Layout admin
│   │   │   ├── services/
│   │   │   ├── equipe/
│   │   │   └── spirituel/
│   │   ├── service/[id]/         # Mode Service Day (public)
│   │   └── api/
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── member/               # Composants espace membre
│   │   ├── admin/                # Composants espace admin
│   │   └── service-day/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── notifications/
│   │   │   └── push.ts
│   │   ├── tone.ts               # Helpers pour ton chaleureux
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts           # Types générés depuis Supabase
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/                # Edge Functions
│   │   ├── send-push/
│   │   ├── weekly-reminders/
│   │   └── sunday-thanks/
│   └── seed.sql
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icons/
├── .env.local.example
└── README.md
```

---

## 🗄️ PARTIE 4 — SCHÉMA DE BASE DE DONNÉES

Crée le fichier `supabase/migrations/001_initial_schema.sql` avec ce contenu **exact** :

```sql
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
```

Crée `supabase/seed.sql` :

```sql
-- À PERSONNALISER avec ton nom d'église réel
insert into organizations (name, slug, greeting_style) 
values ('Mon Église', 'mon-eglise', 'warm');

do $$
declare org_id uuid;
begin
  select id into org_id from organizations where slug = 'mon-eglise';
  
  insert into skills (organization_id, name, icon, display_order) values
    (org_id, 'Sono', '🎚️', 1),
    (org_id, 'Caméra', '🎥', 2),
    (org_id, 'Diffusion', '📺', 3);
end $$;
```

---

## 🎨 PARTIE 5 — DESIGN SYSTEM

### Tokens Tailwind à configurer

Dans `tailwind.config.ts` :

```ts
theme: {
  extend: {
    colors: {
      // Palette principale via shadcn (slate)
      // Accents personnalisés :
      warmth: {
        50: '#FFFBEB',
        500: '#F59E0B',
        600: '#D97706',
      },
      spirit: {
        50: '#ECFDF5',
        500: '#10B981',
        600: '#059669',
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Fraunces', 'Georgia', 'serif'],
    },
    borderRadius: {
      DEFAULT: '0.75rem',
      '2xl': '1.25rem',
    }
  }
}
```

### Composants UI à respecter

- **Cards** : `rounded-2xl shadow-sm border border-slate-200 bg-white p-5`
- **Boutons primaires** : couleur `warmth-500`, arrondis généreux
- **Boutons confirmation** : vert émeraude
- **Boutons décliner** : `outline` slate, pas rouge agressif
- **Badges** : `rounded-full px-3 py-1 text-xs`
- **Espacement** : généreux, jamais collé (`space-y-4` minimum)
- **États vides** : illustration douce + message chaleureux ("Aucune indispo, super 🌟")

### Helpers de ton

Crée `src/lib/tone.ts` avec ces utilitaires :

```ts
// Salutations selon l'heure
export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Hey ${name} ☀️`
  if (hour < 18) return `Salut ${name} 👋`
  return `Bonsoir ${name} 🌙`
}

// Messages contextuels positifs
export function getServiceCountMessage(count: number): string {
  if (count === 1) return "Premier service ce mois — bienvenue 🌱"
  if (count <= 3) return `${count}e service ce mois, merci 🙏`
  return `${count}e service ce mois — tu es une star 🌟`
}

// Formats de dates en français naturel
export function formatServiceDate(date: Date): string {
  // "Dimanche 14 juin à 14h"
}
```

---

## 📱 PARTIE 6 — LES ÉCRANS À CONSTRUIRE

### Routes complètes

| Route | Accès | Description |
|---|---|---|
| `/login` | Public | Magic link |
| `/` | Membre | Dashboard |
| `/dispos` | Membre | Calendrier indispos |
| `/parcours` | Membre | Ma progression |
| `/annonces` | Membre | Feed annonces |
| `/admin/services` | Leader | Liste + création services |
| `/admin/services/[id]` | Leader | Détail + assignations |
| `/admin/equipe` | Leader | Gestion membres |
| `/admin/spirituel` | Leader | Gestion contenu spirituel |
| `/service/[id]` | Public (token) | Mode Service Day |

### Maquettes textuelles des écrans clés

#### Dashboard membre (`/`)

```
┌─────────────────────────────────────────┐
│  Hey Isaac ☀️                            │
│                                          │
│  🙏 Pensée de la semaine                 │
│  ┌───────────────────────────────────┐  │
│  │ "Servons-nous les uns les autres" │  │
│  │ — 1 Pierre 4:10                    │  │
│  └───────────────────────────────────┘  │
│                                          │
│  📅 Prochain service                     │
│  ┌───────────────────────────────────┐  │
│  │ Dimanche 23 juin · 14h            │  │
│  │ 🎚️ Sono                            │  │
│  │ Avec Chana & Dave                  │  │
│  │ Thème : "L'unité"                  │  │
│  │                                    │  │
│  │ [✓ Je confirme] [Pas dispo]       │  │
│  └───────────────────────────────────┘  │
│                                          │
│  💝 Reçu cette semaine                   │
│  • Merci de ton aide dimanche — Marie    │
│                                          │
│  📊 Ce mois : 3 services · 100% confirmés│
└─────────────────────────────────────────┘
```

#### Page dispos (`/dispos`)

```
┌─────────────────────────────────────────┐
│  Mes indisponibilités                    │
│                                          │
│  [<]  Juin 2025  [>]                     │
│                                          │
│   L  M  M  J  V  S  D                    │
│            1  2  3  4                    │
│   5  6  7  8  9 10 11                    │
│  12 13 14 15 16 17 18                    │
│  19 20 21 22 23 24 25                    │
│  26 27 28 29 30                          │
│                                          │
│  En rouge = tu es indispo                │
│  Tap sur un jour pour basculer           │
│                                          │
│  Mes prochaines indispos :               │
│  • 15-20 juillet (vacances)              │
└─────────────────────────────────────────┘
```

#### Mode Service Day (`/service/[id]`)

```
┌─────────────────────────────────────────┐
│  Dimanche 23 juin                        │
│                                          │
│  📍 Lieu : Salle principale              │
│  🕜 Arrivée : 13h30                      │
│  🙏 Thème : L'unité                      │
│                                          │
│  L'équipe du jour                        │
│  ┌─────────────────────────────────┐    │
│  │ 🎚️ Sono — Isaac                  │    │
│  │ 🎥 Caméra — Dave                 │    │
│  │ 📺 Diffusion — Chana             │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [👋 Je suis là]                         │
│                                          │
│  Déjà arrivés : Dave, Chana              │
└─────────────────────────────────────────┘
```

#### Admin assignation (`/admin/services/[id]`)

```
┌─────────────────────────────────────────┐
│  Dimanche 23 juin · 14h                  │
│  [Éditer] [Annuler le service]           │
│                                          │
│  🎚️ Sono                                 │
│  ┌─────────────────────────────────┐    │
│  │ Isaac ✓ confirmé                 │    │
│  │ [+ Ajouter]                      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  🎥 Caméra                                │
│  ┌─────────────────────────────────┐    │
│  │ Dave ⏳ en attente               │    │
│  │ [+ Ajouter]                      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  📺 Diffusion                             │
│  ┌─────────────────────────────────┐    │
│  │ Aucun assigné                    │    │
│  │ Disponibles : Chana, Marie       │    │
│  │ [+ Ajouter]                      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Envoyer les notifs]                    │
└─────────────────────────────────────────┘
```

---

## 🗓️ PARTIE 7 — PHASES DE DÉVELOPPEMENT (ORDRE STRICT)

### PHASE 0 — Setup (1 session)

**Objectif** : projet initialisé, déployé, auth fonctionne.

Tâches dans l'ordre :

1. `npx create-next-app@latest crew --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. `cd crew && git init && git add . && git commit -m "init"`
3. Installer les dépendances :
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install date-fns
   npm install framer-motion
   npm install react-hook-form zod @hookform/resolvers
   npm install lucide-react
   ```
4. Init shadcn : `npx shadcn@latest init` (slate, CSS variables yes)
5. Ajouter les composants : `npx shadcn@latest add button card calendar dialog input label select toast badge avatar separator skeleton`
6. Créer `.env.local.example` avec les variables Supabase
7. Configurer Tailwind avec les tokens du §5
8. Créer les helpers Supabase (`src/lib/supabase/{client,server,middleware}.ts`)
9. Créer le middleware d'auth (`src/middleware.ts`)
10. Configurer le manifest PWA (`public/manifest.json`) et meta tags
11. Créer `src/lib/tone.ts` avec les helpers de ton
12. Implémenter `/login` avec magic link
13. Implémenter le callback auth
14. Push GitHub, déployer sur Vercel
15. Configurer les env vars sur Vercel

**Critère de sortie** : URL Vercel accessible, je peux me logger avec un email et arriver sur une page d'accueil (vide pour l'instant).

**Action de Thithi à demander à la fin de la phase** :
- Créer le projet Supabase
- Exécuter la migration et le seed
- Ajouter ses 7 membres comme profils
- Configurer ses pôles si différents (Sono/Caméra/Diffusion)

---

### PHASE 1 — Le Cœur (3-4 sessions)

**Objectif** : un membre peut voir son planning, confirmer, déclarer ses dispos.

#### 1.1 — Layout & navigation
- Layout membre avec bottom nav mobile : Accueil / Dispos / Parcours / Annonces
- Layout admin avec sidebar/top nav : Services / Équipe / Spirituel
- Header avec avatar + bouton déconnexion
- Détection automatique du rôle pour afficher le bon layout

#### 1.2 — Dashboard membre (`/`)
- Salutation chaleureuse (`getGreeting`)
- Bloc "Pensée de la semaine" (lit `spiritual_content` du jour)
- Bloc "Prochain service" :
  - Date naturelle, rôle, équipe, thème
  - Boutons confirmer / décliner
  - Animation Framer Motion à la confirmation
- Bloc "Reçu cette semaine" (appréciations récentes)
- Stats du mois en footer

#### 1.3 — Page dispos (`/dispos`)
- Composant calendrier mensuel personnalisé
- Navigation mois précédent / suivant
- Tap jour → toggle indispo (modal avec champ raison optionnel)
- Affichage en rouge des jours indispos
- Liste textuelle "Mes prochaines indispos" en dessous
- Bouton raccourci "Tout va bien ce mois 👍"

#### 1.4 — Admin services (`/admin/services`)
- Liste des services à venir (cards)
- Bouton "+ Créer un service"
- Modal de création : titre, date, heure, lieu, thème spirituel, notes
- Pour chaque service : statut visuel (combien confirmés / total)

#### 1.5 — Admin détail service (`/admin/services/[id]`)
- 3 colonnes (une par skill) — adaptative selon les skills de l'org
- Pour chaque colonne :
  - Liste des assignés avec leur statut
  - Bouton "+ Ajouter" qui montre les membres dispos
  - Indicateur des indispos
- Bouton "Envoyer les notifications de confirmation"
- Bouton "Mode Service Day" qui ouvre la vue publique

#### 1.6 — Édition de profil basique
- Page `/profil` : photo, prénom préféré, "pourquoi je sers", anniversaire
- Upload avatar via Supabase Storage

**Critère de sortie** : 7 membres connectés, dispos déclarées, planning créé pour dimanche, confirmations reçues.

---

### PHASE 2 — La Magie (3-4 sessions)

**Objectif** : transformer le planning froid en système engageant.

#### 2.1 — Mode Service Day (`/service/[id]`)
- Route accessible sans login via token public
- Vue ultra-épurée : lieu, heure, équipe avec photos
- Bouton "Je suis là 👋" (check-in) — visible uniquement après login
- Liste en temps réel des arrivés (Supabase realtime)
- À la fin du service : feedback rapide (😊 / 😐 / 😟)

#### 2.2 — Système d'appréciations
- Composant "Envoyer un merci" disponible partout
- Modal : choisir destinataire, écrire 1-2 phrases, valider
- Affichage des appréciations reçues sur le dashboard
- Notification push à la réception

#### 2.3 — Page parcours (`/parcours`)
- Mes compétences (skills) avec niveau visuel (3 paliers)
- Date d'atteinte de chaque niveau
- Qui m'a formé (lien vers profil)
- Stats personnelles : services accomplis (année, mois), check-ins, appréciations
- Badges discrets (1 an, 10 services, 50 services, etc.)

#### 2.4 — Contenu spirituel
- Page admin `/admin/spirituel` : ajouter verset/pensée/défi
- Champ publish_date pour planifier à l'avance
- Affichage automatique sur le dashboard à la date

#### 2.5 — Push notifications PWA
- Service worker (`public/sw.js`)
- Demande de permission au bon moment (après première action utile, pas au login)
- Gestion de la souscription côté serveur (`push_subscriptions`)
- Edge function `send-push` qui envoie une notification à un user

**Critère de sortie** : un dimanche complet vécu avec l'app — confirmations, check-in, mercis, feedback.

---

### PHASE 3 — Communication & Rituel (2-3 sessions)

**Objectif** : créer la séquence relationnelle de la semaine.

#### 3.1 — Annonces (`/annonces` + admin)
- Feed des annonces par ordre antéchronologique
- Création (admin) avec priorité
- Réactions emoji (👍 🙏 ❤️)
- Tracking des lectures
- Push automatique si priorité "important" ou "urgent"

#### 3.2 — Edge Functions schedulées (cron)
Implémenter 5 fonctions schedulées :

1. **`lundi-spirituel`** (lundi 9h) — push pensée de la semaine à toute l'équipe
2. **`mardi-confirmations`** (mardi 18h) — push aux assignés non confirmés
3. **`jeudi-recap-equipe`** (jeudi 12h) — push aux assignés du dimanche avec équipe complète
4. **`samedi-rappel`** (samedi 18h) — push rappel doux + heure d'arrivée
5. **`dimanche-merci`** (dimanche 20h) — push de remerciement automatique

Utiliser **pg_cron** sur Supabase + edge functions.

#### 3.3 — Page admin équipe (`/admin/equipe`)
- Liste des membres avec stats clés
- Indicateur de "santé" : qui décroche ? (n'a pas servi depuis X semaines)
- Édition rapide des skills d'un membre
- Désactivation d'un membre (soft delete via `is_active`)

**Critère de sortie** : la semaine se déroule "toute seule" — touches automatiques aux bons moments.

---

### PHASE 4 — Polissage & PWA (2 sessions)

**Objectif** : prêt pour le test réel sur l'équipe.

#### 4.1 — PWA installable
- Manifest complet (icônes 192/512, theme color, etc.)
- Service worker pour cache offline basique
- Instructions installation iOS / Android dans un onboarding

#### 4.2 — Onboarding
- Premier login : tour guidé (3-4 écrans max)
- Demander : prénom préféré, photo, "pourquoi je sers"
- Inviter à installer la PWA

#### 4.3 — États vides chaleureux
Chaque page doit avoir un état vide soigné :
- Pas d'indispos → "Tu es dispo tout le mois, super 🌟"
- Pas de service à venir → "Pas de service prévu — repose-toi bien 😌"
- Pas d'appréciations → "Les premiers mercis arrivent bientôt"

#### 4.4 — Accessibilité & perf
- Lighthouse score > 90 sur mobile
- Tous les boutons accessibles clavier
- ARIA labels propres
- Images optimisées (next/image)

#### 4.5 — Documentation utilisateur
- Page `/aide` avec FAQ courte
- Tutoriel "comment installer l'app"

**Critère de sortie** : prêt à donner l'URL à 7 personnes ce dimanche.

---

## 🧪 PARTIE 8 — TESTS

À chaque phase, implémenter des tests minimaux :

- **Vitest** pour les fonctions utilitaires (`tone.ts`, dates, formatages)
- **Playwright** pour 3 parcours critiques :
  1. Login → confirmer un service
  2. Déclarer une indispo
  3. Admin crée un service et assigne quelqu'un

Pas de TDD strict, mais ne pas livrer sans ces tests.

---

## 📦 PARTIE 9 — DÉPLOIEMENT & OPS

### Variables d'environnement (`.env.local.example`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Pour les edge functions / cron
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Push notifications (générer une paire VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:thithi@example.com

# App
NEXT_PUBLIC_APP_URL=https://crew.vercel.app
```

### Génération clés VAPID
```bash
npx web-push generate-vapid-keys
```

### Pipeline déploiement
- Push sur `main` → Vercel déploie auto
- Migrations Supabase via CLI ou dashboard
- Edge functions via `supabase functions deploy`

---

## ✅ PARTIE 10 — CHECKLIST DE FIN DE PROJET

Avant de dire "c'est prêt", vérifier :

- [ ] Toutes les routes du §6 sont fonctionnelles
- [ ] Auth magic link marche en prod
- [ ] Mobile (iPhone 13) impeccable
- [ ] PWA installable iOS et Android
- [ ] Push notifications fonctionnelles
- [ ] 5 cron jobs en place et testés
- [ ] RLS Supabase actives partout
- [ ] Au moins 3 tests Playwright passent
- [ ] Lighthouse mobile > 90 (perf + a11y)
- [ ] README clair pour Thithi (comment ajouter un membre, créer un service, etc.)
- [ ] Aucune chaîne de caractères en anglais dans l'UI
- [ ] Aucun "Lorem ipsum" ou placeholder oublié
- [ ] Toutes les notifs respectent le ton défini au §2
- [ ] Le mode Service Day se charge en < 1s

---

## 🆘 EN CAS DE DOUTE

Si tu hésites sur une décision :

1. **Relis le §2 (Principes Directeurs)** — il a la réponse 80% du temps
2. **Demande-toi : "Est-ce que ça sert un des 8 moments d'engagement ?"**
3. **Si toujours bloqué : pose une question précise à Thithi** plutôt que de coder à l'aveugle

---

## 🎯 RAPPEL FINAL

Tu construis pour **une équipe réelle de 7 personnes**, pas pour une démo. Chaque détail compte. Le ton d'une notification compte plus que la couleur d'un bouton. La chaleur d'un message d'accueil compte plus qu'un graphique de stats.

**Le succès, ce n'est pas que l'app soit complète. C'est que dimanche prochain, Isaac, Chana, Dave et les autres se sentent fiers de servir.**

Vas-y. Commence par la Phase 0. Bon courage 🚀
