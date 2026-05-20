# Crew — Design Tokens & Composants

> **Source de vérité absolue pour le design de Crew.**
> Ce fichier prime sur toute autre interprétation visuelle.
> Les maquettes HTML dans ce dossier sont conformes à ces tokens.

---

## 🎨 Palette de couleurs

### Pastels signature (Connectify)

```css
--color-sage: #DAF4AA;   /* Vert pastel — actions positives, célébration, validation */
--color-mint: #96D8D0;   /* Menthe — informatif neutre, illustrations */
--color-lilac: #D2B4F1;  /* Lilas — catégorie call/spirituel, contraste */
```

### Neutres

```css
--color-ink: #16161B;            /* Quasi-noir — texte principal, CTA forts, fonds hero */
--color-bg: #F4F4F2;             /* Beige cassé — fond principal de l'app */
--color-white: #FFFFFF;          /* Cards */
--color-text-secondary: #6B6B6F; /* Texte secondaire */
--color-text-muted: #9C9CA0;     /* Texte tertiaire, dates */
--color-border: #DDDDDA;         /* Bordures */
--color-border-soft: #EEEEEC;    /* Bordures internes, séparateurs */
```

### Sémantiques (jamais agressifs)

```css
--color-error-bg: #FCEBEB;
--color-error-fg: #A32D2D;
--color-error-border: #E24B4A;

--color-warning-bg: #FAEEDA;
--color-warning-fg: #854F0B;
--color-warning-accent: #BA7517;
```

### Règle stricte
- **Jamais de rouge vif ou saturé**
- **Pas de couleurs néon ou flashy**
- Le rouge reste **tamisé** (`#FCEBEB` / `#A32D2D`)

---

## ✍️ Typographie

### Famille de police

```css
font-family: 'Gilroy', -apple-system, 'Segoe UI', sans-serif;
/* Fallback acceptable si Gilroy non disponible : Inter, Plus Jakarta Sans */
```

### Échelle typographique

| Token | Taille | Usage |
|-------|--------|-------|
| `text-xs` | 10px | Labels micro, légendes |
| `text-sm` | 11px | Labels uppercase, badges |
| `text-base` | 13px | Texte secondaire, descriptions |
| `text-md` | 14px | Texte courant |
| `text-lg` | 17px | Titres de section |
| `text-xl` | 22px | Titres de page |
| `text-2xl` | 28px | Salutations, hero titles |
| `text-3xl` | 38px | Countdown Service Day uniquement |

### Weights

```css
--weight-medium: 500;     /* Texte courant chaleureux */
--weight-semibold: 600;   /* Sous-titres, boutons secondaires */
--weight-bold: 700;       /* Titres, CTA forts, badges */
```

### Line-heights

```css
--lh-tight: 1.15;    /* Titres */
--lh-normal: 1.4;    /* Texte courant */
--lh-relaxed: 1.5;   /* Paragraphes longs */
```

### Letter-spacing

```css
--ls-tight: -0.5px;  /* Titres taille xl, 2xl, 3xl */
--ls-normal: -0.3px; /* Titres taille lg */
--ls-caps: 0.5px;    /* Labels uppercase, badges */
--ls-caps-wide: 1.2px; /* Headers uppercase importants */
```

---

## 📐 Border radius

```css
--radius-xs: 8px;       /* Très petits éléments */
--radius-sm: 10px;      /* Cellules calendrier */
--radius-md: 12px;      /* Champs input, badges large */
--radius-lg: 14px;      /* Cards intérieures, boutons larges */
--radius-xl: 18px;      /* Cards secondaires, blocs alertes */
--radius-2xl: 22px;     /* Cards principales (services, membres, avatars) */
--radius-3xl: 28px;     /* Hero blocks (Service Day) */
--radius-modal: 24px 24px 0 0;  /* Bottom sheet (top corners only) */
--radius-full: 100px;   /* Pills, avatars circulaires, boutons CTA */
```

### Règles
- **Cards principales** : toujours `radius-2xl` (22px)
- **Boutons CTA** : toujours `radius-full` (pills)
- **Bottom sheets** : `radius-modal` (24px en haut uniquement)
- **Avatars** : `border-radius: 50%` (circulaires) sauf avatars carrés du Profile Picker (`radius-2xl`)

---

## 📏 Spacings

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

### Conventions de spacing
- **Padding cards principales** : 16-20px verticales, 18-20px horizontales
- **Gap entre éléments d'une liste** : 8-12px
- **Gap entre sections** : 16-24px
- **Padding pages** : 20px horizontal sur mobile

---

## ✨ Animations

### Easing signature

```ts
// Toutes les animations utilisent cette courbe par défaut
easings.premium = [0.16, 1, 0.3, 1]  // ease-out-expo, signature iOS/Linear/Vercel

// Variantes secondaires
easings.smooth = [0.4, 0, 0.2, 1]
easings.spring = { type: 'spring', stiffness: 400, damping: 30 }
```

### Durées

```ts
durations.fast = 0.15s        // Tap interactions
durations.normal = 0.25s      // Modal open, card hover
durations.slow = 0.35s        // Page transitions
durations.storytelling = 0.5s // Entry animations
```

### Patterns d'animation obligatoires

#### Page entry (stagger)
```ts
// Chaque bloc principal de la page entre en cascade
delay = 0.05s, 0.12s, 0.20s, 0.28s, 0.36s, 0.44s, 0.52s
animation = fadeUp 0.5s ease-out-expo
fadeUp = { opacity: 0 → 1, translateY: 12px → 0 }
```

#### Tap interactions
```ts
// Tous les boutons et cards cliquables
onTap = scale 0.96 + spring back
// Durée: 0.15s
```

#### Hover (desktop only)
```ts
// Cards: légère élévation
hover = translateY(-2px), transition 0.25s
```

#### Notifications/badges
```ts
// Dots de notification
animation = pulse infinite, 3s loop
// Badge urgent
animation = ping radial 2s loop
```

#### CTA importants (FAB, shimmer)
```ts
// FAB Floating Action Button
animation = glow shadow infinite, 2.5s loop
// AI proposals borders
animation = shimmer linear infinite, 4s loop
background = linear-gradient(110deg, sage 0%, darker-sage 50%, sage 100%)
background-size = 200% auto
```

#### Confirmations success
```ts
// Checkmark pop
keyframes = scale 0 → 1.2 → 1, rotation -45° → 0°
duration = 0.5s ease-out-expo
```

---

## 🧩 Composants — Inventaire exhaustif

### Layout

#### `DeviceFrame` (mobile container)
- **Largeur** : 100% (pas de max-width artificiel)
- **Background** : `--color-bg` (#F4F4F2)
- **Padding** : 24px horizontal, 24px top, 88px bottom (pour bottom nav)
- **Min-height** : 100vh

#### `BottomNav`
- **Position** : fixed bottom
- **Background** : white
- **Padding** : 14px top, 18px bottom, 28px horizontal
- **Border-top** : 1px solid rgba(0,0,0,0.04)
- **Display** : flex space-around
- **Onglets** : 2-3 pour membre, 4 pour admin
- **Onglet actif** : pastille noire ronde 44x44px avec icône blanche
- **Onglet inactif** : transparent, icône #6B6B6F
- **Notif dot** : 8x8px sage avec ping radial

#### `PageHeader`
- **Padding** : 24px 20px 20px
- **Layout** : flex justify-between
- **Titre principal** : 28px, weight 700, ink, letter-spacing -0.5px
- **Sous-titre** : 14px, secondary

#### `BottomSheet` (modal)
- **Animation** : slideUp 0.35s ease-out-expo
- **Overlay** : rgba(22,22,27,0.5)
- **Background** : white ou #F4F4F2
- **Border-radius** : 24px 24px 0 0
- **Padding** : 20px 20px 24px
- **Max-height** : 88vh
- **Handle** : barre grise 36x4px centrée en haut, color #DDDDDA

---

### Buttons

#### `Button.Primary` (CTA fort)
```css
background: #16161B;
color: #FFFFFF;
border: none;
border-radius: 100px;
padding: 13px 16px;
font-size: 14px;
font-weight: 700;
display: flex; align-items: center; gap: 6px;
transition: transform 0.15s;
&:active { transform: scale(0.96); }
```

#### `Button.Sage` (CTA validation)
```css
background: #DAF4AA;
color: #16161B;
border: none;
border-radius: 100px;
padding: 13px 16px;
font-size: 14px;
font-weight: 700;
```

#### `Button.Secondary` (outline)
```css
background: transparent;
color: #6B6B6F;
border: 1px solid #DDDDDA;
border-radius: 100px;
padding: 13px 16px;
font-size: 14px;
font-weight: 600;
```

#### `Button.Ghost` (texte seul)
```css
background: transparent;
border: none;
color: #6B6B6F;
font-size: 13px;
font-weight: 500;
```

#### `Button.Icon` (rond)
```css
background: white | transparent;
width: 38px; height: 38px;  /* ou 44px */
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
```

#### `FAB` (Floating Action Button)
```css
position: fixed;
bottom: 86px;  /* au-dessus du bottom nav */
right: 30px;
width: 56px; height: 56px;
border-radius: 50%;
background: #16161B;
color: #DAF4AA;  /* icône */
box-shadow: 0 8px 24px rgba(22,22,27,0.18);
animation: fab-glow 2.5s ease-in-out infinite;
```

---

### Cards

#### `Card.Base`
```css
background: #FFFFFF;
border-radius: 22px;
padding: 18px 20px;
transition: transform 0.25s ease-out-expo;
&:hover { transform: translateY(-2px); }
```

#### `Card.Hero` (avec illustration)
```css
background: #FFFFFF;
border-radius: 24px;
overflow: hidden;
padding: 0;

.hero-image {
  height: 100-140px;
  background: pastel color (sage/mint/lilac);
  position: relative;
  display: flex; align-items: center; justify-content: center;
}

.hero-content {
  padding: 18px 20px 20px;
}
```

#### `Card.Action` (avec CTA bottom)
- Comme `Card.Base` + bouton primary en bas pleine largeur

#### `Card.Alert` (alerte admin)
```css
background: #FFFFFF;
border: 1px solid /* color du contexte */;
border-left: 4px solid /* color principale */;
border-radius: 14px;
padding: 12px 14px;

/* Rouge : Dave annulé */
border-color: #FCEBEB;
border-left-color: #A32D2D;

/* Ambre : à relancer / décroche */
border-color: #FAEEDA;
border-left-color: #BA7517;
```

#### `Card.Member` (gestion équipe)
```css
background: #FFFFFF;
border-radius: 22px;
padding: 16px 18px;
display: flex; align-items: center; gap: 12px;
cursor: pointer;
position: relative;

.avatar { width: 46px; height: 46px; border-radius: 50%; }
.contextual-badge {
  position: absolute; top: 12px; right: 12px;
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.3px;
}
```

---

### Forms

#### `Input.Text`
```css
background: #F4F4F2;
border: none;
border-radius: 14px;
padding: 12px 14px;
font-size: 14px;
color: #16161B;
font-weight: 500;
width: 100%;
&:focus { outline: 2px solid #16161B; outline-offset: 0; }
```

#### `Input.Time` (segmented)
```css
display: flex; gap: 6px;
.segment {
  flex: 1;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 10px 12px;
}
.label { font-size: 9px; color: #6B6B6F; font-weight: 600; }
.value { font-size: 14px; font-weight: 700; color: #16161B; }
```

#### `PinInput` (4 chiffres)
```css
.dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 2px solid #DDDDDA;
  background: transparent;
}
.dot--filled {
  background: #16161B;
  border-color: #16161B;
  animation: scaleIn 0.25s ease-out-expo;
}

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-width: 300px;
  margin: 0 auto;
}
.key {
  aspect-ratio: 1.4;
  background: #FFFFFF;
  border-radius: 20px;
  font-size: 28px;
  font-weight: 600;
  &:active { transform: scale(0.92); background: #DDDDDA; }
}
```

#### `SelectChip` (chip-based selector)
```css
display: flex; gap: 6px; flex-wrap: wrap;

.chip {
  background: pastel color | #FFFFFF;
  border-radius: 100px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #16161B;
  display: flex; align-items: center; gap: 4px;
}
.chip--active { /* background pastel selon catégorie */ }
.chip--inactive { background: transparent; border: 1.5px dashed #DDDDDA; }
```

---

### Feedback

#### `Badge` (statut visuel)
```css
display: inline-flex; align-items: center; gap: 4px;
padding: 2px 7px | 3px 8px;
border-radius: 100px;
font-size: 9-11px;
font-weight: 700;
letter-spacing: 0.3-0.5px;
```

**Variantes** :
- **Sage** : background #DAF4AA, color #16161B (succès, autonome, présent)
- **Mint** : background #96D8D0, color #16161B (informatif)
- **Lilac** : background #D2B4F1, color #16161B (catégorie call)
- **Warning** : background #FAEEDA, color #854F0B (apprenti, à relancer)
- **Error** : background #FCEBEB, color #A32D2D (annulé, absent)
- **Dark** : background #16161B, color #DAF4AA (RESPONSABLE, RECO)
- **Sage-on-dark** : background #16161B, color #DAF4AA, dans bloc noir

#### `Avatar`
```css
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
font-weight: 700;
color: #16161B;
```

**Tailles** :
- **xs** : 22x22px, font 9px
- **sm** : 28x28px, font 10px
- **md** : 36x36px, font 12px
- **lg** : 46x46px, font 15px (default Card.Member)
- **xl** : 64x64px, font 22px (modale détail)
- **2xl** : 84x84px, font 38px (écran code)

**Couleurs de fond par membre** :
- Alpha (admin) : #16161B avec text #DAF4AA
- Chana : #96D8D0
- Isaac : #D2B4F1
- Chrisciana : #DAF4AA
- Dave : #D2B4F1
- Stéphanie : #96D8D0
- Gloria : #DAF4AA

#### `AvatarStack` (avatars superposés)
```css
display: flex; align-items: center;
.avatar { border: 2px solid #FFFFFF; }
.avatar:not(:first-child) { margin-left: -7px; }
/* z-index décroissant pour superposition correcte */
```

#### `StatTile` (chiffres clés)
```css
background: #FFFFFF | #DAF4AA;
border-radius: 16px;
padding: 12px 10px;
text-align: center;

.number {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1;
}
.label {
  font-size: 10px;
  color: #6B6B6F | #16161B;
  font-weight: 500;
  margin-top: 4px;
}
```

#### `MiniCalendar` (grille mensuelle compacte)
```css
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3-4px;
}

.weekday-label {
  font-size: 10px;
  font-weight: 600;
  color: #9C9CA0;
  text-align: center;
}

.day {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  font-size: 11-13px;
  font-weight: 500-700;
}

/* États */
.day--empty { color: transparent; }
.day--regular { color: #6B6B6F; }
.day--event-sunday { background: #DAF4AA; border-radius: 10-12px; color: #16161B; font-weight: 700; }
.day--event-week { background: #96D8D0; }
.day--event-call { background: #D2B4F1; }
.day--today {
  background: #16161B; color: #FFFFFF;
  position: relative;
}
.day--today::after {
  content: '';
  position: absolute; top: -3px; right: -3px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #DAF4AA;
  border: 1.5px solid #FFFFFF;
  animation: pulse 3s infinite;
}
.day--past-present { opacity: 0.5; text-decoration: line-through; }
.day--past-absent {
  background: rgba(252,235,235,0.6);
  border: 1.5px solid #E24B4A;
  color: #A32D2D;
  text-decoration: line-through;
}
.day--pending { /* validation initiale */
  background: rgba(218,244,170,0.4);
  border: 2px dashed #DAF4AA;
}
```

---

### Special

#### `SwipeCard` (validation mensuelle)
```css
position: relative;
background: #FFFFFF;
border-radius: 22px;
padding: 16px 18px;
overflow: hidden;
touch-action: pan-y;
cursor: grab;

/* Background révélé pendant swipe */
.bg-yes {
  position: absolute; inset: 0;
  background: #DAF4AA;
  display: flex; align-items: center;
  padding-left: 24px;
  opacity: 0; /* augmente avec drag */
}
.bg-no {
  background: #FCEBEB;
  padding-right: 24px; /* aligné à droite */
}

/* Seuil de validation */
THRESHOLD = 70px
```

#### `AIProposal` (shimmer border)
```css
.wrapper {
  background: linear-gradient(110deg,
    #DAF4AA 0%,
    #C5E895 50%,
    #DAF4AA 100%
  );
  background-size: 200% auto;
  animation: shimmer 4s linear infinite;
  border-radius: 16px;
  padding: 2px; /* pour révéler la bordure */
}

.inner {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 12px 13px;
}
```

#### `ServiceDayHero` (countdown noir)
```css
background: #16161B;
border-radius: 28px;
padding: 24px 24px 28px;
position: relative;
overflow: hidden;

/* Cercles décoratifs subtils */
.glow-1 {
  position: absolute;
  top: -40px; right: -40px;
  width: 180px; height: 180px;
  border-radius: 50%;
  background: rgba(218,244,170,0.08);
}

.label-pill {
  display: inline-flex;
  background: rgba(218,244,170,0.15);
  border-radius: 100px;
  padding: 5px 12px;
  color: #DAF4AA;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.time {
  font-size: 38px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -1.5px;
  line-height: 1;
}
```

---

## 🎯 Iconographie

**Library** : `@tabler/icons-react` exclusivement.

### Icônes utilisées (à importer)

```tsx
import {
  // Navigation
  IconHome, IconCalendar, IconUsers, IconSparkles, IconBell,
  IconLayoutGrid, IconChevronLeft, IconChevronRight, IconChevronDown,
  IconArrowLeft, IconArrowRight, IconArrowBarToRight,

  // Actions
  IconCheck, IconX, IconPlus, IconPencil, IconSend,
  IconDots, IconDotsVertical, IconKey, IconEye, IconSearch,

  // Skills (Crew specific)
  IconHeadphones,    // Sono
  IconVideo,         // Caméra
  IconDeviceTv,      // Diffusion

  // Sémantique
  IconHeart, IconMessageCircle, IconPhone, IconMapPin, IconBuilding,
  IconClock, IconClockPlay, IconClockCheck, IconNavigation,
  IconAlertCircle, IconSeedling, IconBackspace,
  IconChurch, IconTrophy, IconCake, IconUser,
  IconBook, IconBookmark, IconCalendarEvent,
} from '@tabler/icons-react';
```

### Tailles standards
- **xs** : 11-13px (badges, labels)
- **sm** : 14-16px (boutons icônes, inline)
- **md** : 18-22px (navigation, headers)
- **lg** : 28-32px (hero icons, illustrations)

---

## 📋 Règles d'or visuelles (à appliquer partout)

1. **Pas de bordures sauf nécessaire** — on utilise les fonds colorés pour distinguer les sections
2. **Radius généreux** — toujours 18px+ sur les cards, 100px sur les pills
3. **Padding interne minimum** — 16px pour cards principales, 12px pour secondaires
4. **Couleurs jamais saturées** — toujours pastels ou neutres profonds
5. **Texte principal = ink (#16161B)** — jamais de gris pour le texte principal
6. **Hiérarchie par contraste** — pas par taille seulement
7. **Animations partout mais discrètes** — la signature Connectify
8. **Avatars colorés par membre** — chaque membre a sa couleur dédiée (cohérence)
9. **Hero blocks importants = noir** — pour créer le sentiment "moment" (countdown, header service)
10. **Sage = positif, Ambre = attention, Rouge tamisé = problème** — jamais de rouge agressif

---

## 🚀 Conversion CSS → Tailwind

Pour Windsurf qui code en Tailwind, voici les classes utilitaires correspondantes :

### Couleurs
```
bg-sage → bg-[#DAF4AA]
bg-mint → bg-[#96D8D0]
bg-lilac → bg-[#D2B4F1]
bg-ink → bg-[#16161B]
text-ink → text-[#16161B]
text-secondary → text-[#6B6B6F]
text-muted → text-[#9C9CA0]
```

### Radius
```
rounded-2xl → rounded-[22px]
rounded-3xl → rounded-[28px]
rounded-full → rounded-[100px]
```

### Configuration Tailwind recommandée

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        sage: '#DAF4AA',
        mint: '#96D8D0',
        lilac: '#D2B4F1',
        ink: '#16161B',
        bg: '#F4F4F2',
        'text-secondary': '#6B6B6F',
        'text-muted': '#9C9CA0',
        'border-soft': '#EEEEEC',
        'error-bg': '#FCEBEB',
        'error-fg': '#A32D2D',
        'warning-bg': '#FAEEDA',
        'warning-fg': '#854F0B',
      },
      borderRadius: {
        '2xl': '22px',
        '3xl': '28px',
        'card': '22px',
        'hero': '28px',
        'pill': '100px',
      },
      fontFamily: {
        sans: ['Gilroy', 'Inter', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulseDot 3s ease-in-out infinite',
        'ping-dot': 'pingDot 2s ease-out infinite',
        'shimmer': 'shimmer 4s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'fab-glow': 'fabGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.7' },
        },
        pingDot: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fabGlow: {
          '0%, 100%': { boxShadow: '0 8px 24px rgba(22,22,27,0.18), 0 0 0 0 rgba(218,244,170,0.5)' },
          '50%': { boxShadow: '0 8px 24px rgba(22,22,27,0.18), 0 0 0 8px rgba(218,244,170,0)' },
        },
      },
    },
  },
};
```

---

## 📁 Maquettes de référence dans ce dossier

| Fichier | Description | Feature liée |
|---------|-------------|--------------|
| `01-profile-picker.html` | Grille 6 avatars + bouton admin | 1.3 |
| `02-saisie-code.html` | Pavé numérique 4 dots | 1.4 |
| `03-dashboard-membre.html` | Validation mensuelle + calendrier compact | 2.2 |
| `04-vue-mensuelle-validation.html` | Cards swipeables | 2.3 |
| `05-vue-mensuelle-consultation.html` | Mois validé + stats | 2.4 |
| `06-mode-service-day.html` | Hero noir countdown | 3.1 |
| `07-dashboard-admin.html` | Console avec alertes | 3.3 |
| `08-detail-service.html` | Assignations + IA proposition | 4.2 |
| `09-gestion-equipe.html` | Liste 6 membres + badges | 5.1 |
| `10-creation-evenement.html` | Bottom sheet création | 5.2 |
| `11-contenu-spirituel.html` | Pensée + bibliothèque | 6.1 |

**Pour chaque feature** : ouvrir le HTML dans le navigateur pour visualiser, puis reproduire en React + Tailwind + Framer Motion en suivant les tokens de ce fichier.

---

**Fin du fichier design-tokens.md**

*Source de vérité unique pour le design de Crew. Toute interprétation visuelle qui contredit ce fichier doit être corrigée.*
