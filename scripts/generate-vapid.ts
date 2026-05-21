/**
 * Génère une paire de clés VAPID pour les push notifications.
 * Usage : npm run generate:vapid
 *
 * Si tu lances ça après-coup, copie les valeurs dans .env.local :
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT="mailto:ton@email.com"
 */
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

// eslint-disable-next-line no-console
console.log(`
✅ Clés VAPID générées. Ajoute ces lignes dans .env.local :

NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"
VAPID_PRIVATE_KEY="${keys.privateKey}"
VAPID_SUBJECT="mailto:ton-email@exemple.com"

Si des subscriptions existent déjà avec d'anciennes clés, elles deviendront invalides.
`);
