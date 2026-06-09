#!/usr/bin/env node
/*
 * Génère tous les secrets nécessaires à l'auto-hébergement de Supabase :
 *  - POSTGRES_PASSWORD
 *  - JWT_SECRET (signe les tokens)
 *  - ANON_KEY et SERVICE_ROLE_KEY (JWT HS256 signés avec JWT_SECRET)
 *  - DASHBOARD_PASSWORD (accès Studio)
 *  - SECRET_KEY_BASE / VAULT_ENC_KEY (Realtime / Vault)
 *
 * Aucune dépendance externe : utilise uniquement le module `crypto` de Node.
 *
 * Usage :
 *   node generate-keys.mjs            # affiche les valeurs
 *   node generate-keys.mjs --write    # écrit/merge dans le fichier .env voisin
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const base64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const signJwt = (payload, secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
};

// Caractères alphanumériques uniquement : évite les soucis de quoting dans .env.
const randomAlnum = (len) => {
  let out = '';
  while (out.length < len) {
    out += crypto.randomBytes(len).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }
  return out.slice(0, len);
};

const jwtSecret = randomAlnum(48);
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60 * 24 * 365 * 10; // valable 10 ans

const anonKey = signJwt({ role: 'anon', iss: 'supabase', iat, exp }, jwtSecret);
const serviceRoleKey = signJwt({ role: 'service_role', iss: 'supabase', iat, exp }, jwtSecret);

const values = {
  POSTGRES_PASSWORD: randomAlnum(32),
  JWT_SECRET: jwtSecret,
  ANON_KEY: anonKey,
  SERVICE_ROLE_KEY: serviceRoleKey,
  DASHBOARD_USERNAME: 'supabase',
  DASHBOARD_PASSWORD: randomAlnum(20),
  SECRET_KEY_BASE: randomAlnum(64),
  VAULT_ENC_KEY: randomAlnum(32),
};

const shouldWrite = process.argv.includes('--write');

if (shouldWrite) {
  const envPath = path.join(__dirname, '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  for (const [key, val] of Object.entries(values)) {
    const line = `${key}=${val}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  }

  fs.writeFileSync(envPath, content.startsWith('\n') ? content.slice(1) : content);
  console.log(`✅ Secrets écrits dans ${envPath}`);
} else {
  console.log('# Copie ces valeurs dans infra/supabase-nas/.env\n');
  for (const [key, val] of Object.entries(values)) {
    console.log(`${key}=${val}`);
  }
  console.log('\n# Pour écrire directement dans .env : node generate-keys.mjs --write');
}
