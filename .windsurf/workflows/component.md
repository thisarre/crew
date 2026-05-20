---
description: Génère un composant React TypeScript respectant le design system Crew
---

Tu vas créer un composant React TypeScript pour le projet Crew.

## Avant de coder, vérifie
1. Le composant n'existe-t-il pas déjà dans `src/components/` ?
2. Est-ce un composant **membre** (`src/components/member/`), **admin** (`src/components/admin/`), **service-day** (`src/components/service-day/`), ou **ui générique** (`src/components/ui/`) ?
3. A-t-il besoin d'interactivité ? Si non → Server Component (pas de `"use client"`)

## Règles strictes
- TypeScript strict, props typées avec interface explicite
- Mobile-first iPhone 13 (390px) avant desktop
- Tailwind uniquement, pas de CSS custom
- shadcn/ui pour les primitives (Button, Card, Dialog, etc.)
- `rounded-2xl` par défaut sur les conteneurs
- Card standard : `rounded-2xl shadow-sm border border-slate-200 bg-white p-5`
- Couleurs : `warmth-500` pour le primaire humain, `spirit-500` pour le spirituel, `slate` pour le neutre
- Texte en français, tutoiement, ton chaleureux
- Émojis max 1-2 par bloc UI
- État de chargement si données async (Skeleton de shadcn)
- État vide chaleureux si liste vide
- Accessibilité : ARIA, navigation clavier, focus visible

## Structure attendue
\`\`\`tsx
// src/components/[section]/nom-composant.tsx

interface NomComposantProps {
  // props typées
}

export function NomComposant({ ... }: NomComposantProps) {
  return (
    // JSX
  )
}
\`\`\`

## Tâche
[Décris ici le composant à créer : son rôle, ses props, son emplacement dans l'UI]

## Modèle conseillé
GPT-5.1-Codex (0 crédit) suffit dans 95% des cas. Passe à Sonnet 4.6 uniquement si le composant a une logique complexe (calculs, états multiples, animations Framer Motion non triviales).