---
description: Travail sur la couche PWA (service worker, push, manifest, offline)
---

Tu vas travailler sur la couche PWA et notifications de Crew.

## Contexte
- Web Push API native (VAPID), pas de Firebase ni Twilio
- Service worker dans `public/sw.js`
- Manifest dans `public/manifest.json`
- Subscription côté serveur dans table `push_subscriptions`
- Edge Function `send-push` pour envoyer les notifs
- Support iOS Safari 16.4+ (PWA installée requise sur iOS pour le push)

## Règles strictes push notifications
- **Demander la permission AU BON MOMENT** : après une première action utile (ex: après avoir confirmé un premier service), JAMAIS au login
- Toujours expliquer pourquoi avant de demander ("Reçois un mot doux le dimanche soir et un rappel le samedi")
- VAPID keys depuis l'env : `NEXT_PUBLIC_VAPID_PUBLIC_KEY` côté client, `VAPID_PRIVATE_KEY` côté serveur
- Subject : `mailto:thithi@example.com`
- TTL raisonnable (24h max pour rappels, 1h pour notifs temps réel)
- Payload concise : title + body + url, pas de data lourde

## Règles service worker
- Minimal — cache uniquement les assets statiques essentiels
- Stratégie : `NetworkFirst` pour les API, `CacheFirst` pour les assets
- Versionnage du cache (`CACHE_NAME = 'crew-v1'`) pour invalider proprement
- Listener `push` qui affiche la notif avec icône, badge, vibrate
- Listener `notificationclick` qui ouvre `/` ou l'URL de la notif

## Règles manifest PWA
- `name` : "Crew"
- `short_name` : "Crew"
- `start_url` : "/"
- `display` : "standalone"
- `theme_color` : "#F59E0B" (warmth-500)
- `background_color` : "#FFFFFF"
- `lang` : "fr"
- `dir` : "ltr"
- Icônes : 192x192 et 512x512 (maskable + any)
- `categories` : ["productivity", "lifestyle"]

## Ton des notifications (NON-NÉGOCIABLE)
Suivre les principes du fichier `rules/project.md` :
- Tutoiement, prénom préféré
- Chaleur > efficacité
- Exemples bons :
  - "Hey Isaac, dimanche tu seras à la sono avec Chana 🎚️ Tu confirmes ?"
  - "Merci pour ton service de dimanche ✨ L'équipe a senti ta présence."
- Exemples interdits :
  - "Rappel : service à 14h"
  - "Veuillez confirmer votre présence"

## iOS spécifique
- Le push fonctionne UNIQUEMENT si l'app est installée sur l'écran d'accueil
- Détecter iOS et afficher un onboarding spécifique ("Ajoute Crew à ton écran d'accueil pour recevoir les rappels")
- `apple-touch-icon` dans le head
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

## Tests à effectuer
- Installation sur iOS (Safari → Partager → Ajouter à l'écran d'accueil)
- Installation sur Android (Chrome → menu → Installer)
- Réception push iOS (PWA installée requise)
- Réception push Android
- Click sur notif → ouvre la bonne URL
- Comportement offline minimal

## Tâche
[Décris ici la tâche PWA : service worker, push, manifest, offline...]

## Modèle conseillé
**Claude Opus 4.6 (6 crédits)** sur la première implémentation complète — la couche PWA est notoirement piégeuse (iOS quirks, VAPID, service worker lifecycle). Une fois la base posée et qui marche, repasse à Sonnet 4.6 (2 cr) pour les ajustements. Ne jamais faire ça avec un modèle gratuit la première fois — tu vas perdre du temps à débugger.