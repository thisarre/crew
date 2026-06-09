# Supabase auto-hébergé sur NAS UGREEN (Crew)

Héberge **toute la stack Supabase** (Postgres + Auth + Realtime + Storage + Studio + API Kong) dans Docker sur ton **UGREEN DXP4800 Plus** (UGOS Pro). L'app Crew se connecte ensuite à cette instance au lieu du cloud Supabase.

## Prérequis

- UGOS Pro avec l'application **Docker** installée (Centre d'applications).
- Accès **SSH** au NAS activé (Panneau de configuration → Terminal/SSH), ou un terminal via l'app Docker.
- Une IP locale fixe pour le NAS (ex. `192.168.1.50`).
- `git`, `docker` et `docker compose` disponibles (inclus avec l'app Docker d'UGOS).
- `node` (≥ 18) pour générer les secrets — sinon génère-les sur ton Mac et copie le `.env`.

## Architecture des fichiers

```
infra/supabase-nas/
├── bootstrap.sh           # télécharge la stack officielle + génère secrets + migrations
├── generate-keys.mjs      # génère POSTGRES_PASSWORD, JWT_SECRET, ANON/SERVICE keys…
├── crew-app.env.sample    # variables à mettre dans le .env.local de l'app
├── .env                   # (généré, NON commité) secrets de la stack
└── stack/docker/          # (généré) stack Supabase officielle + docker-compose.yml
```

> `.env`, `stack/` et le dossier `volumes/` de la base contiennent des secrets et des données : ils sont **ignorés par git**.

## Installation pas à pas

### 1. Récupérer le projet sur le NAS

En SSH sur le NAS, place le repo dans un dossier persistant (ex. un volume de stockage) :

```bash
cd /volume1/docker            # adapte au chemin de ton volume UGREEN
git clone git@github.com:thisarre/crew.git
cd crew/infra/supabase-nas
```

### 2. Lancer le bootstrap

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

Le script :
1. télécharge la stack Docker Supabase officielle (épinglée à une version stable) dans `stack/docker/` ;
2. génère un `.env` avec des secrets uniques (mot de passe Postgres, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, identifiants Studio) ;
3. copie les migrations du projet (`supabase/migrations/*.sql`) dans l'init de Postgres pour qu'elles s'appliquent au **premier** démarrage.

> Sans Node sur le NAS : lance `node generate-keys.mjs --write` sur ton Mac depuis ce dossier, puis copie le `.env` obtenu sur le NAS.

### 3. Démarrer la stack

```bash
cd stack/docker
docker compose up -d
```

Vérifie que tout tourne :

```bash
docker compose ps
```

### 4. Accéder à Supabase Studio

Ouvre `http://<IP_DU_NAS>:8000` dans un navigateur. Identifiants dans `infra/supabase-nas/.env` :

- `DASHBOARD_USERNAME` (par défaut `supabase`)
- `DASHBOARD_PASSWORD`

### 5. Connecter l'app Crew au NAS

Sur la machine qui fait tourner l'app (Mac en dev, ou serveur de prod), crée/édite `.env.local` à la **racine du repo** en t'inspirant de `crew-app.env.sample` :

```bash
NEXT_PUBLIC_SUPABASE_URL="http://<IP_DU_NAS>:8000"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<ANON_KEY du .env de la stack>"
SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY du .env de la stack>"
```

Puis :

```bash
npm run dev          # l'app utilise désormais le Supabase du NAS
npm run db:seed      # (optionnel) données de démo Alpha
```

## Opérations courantes

| Action | Commande (depuis `stack/docker/`) |
| --- | --- |
| Démarrer | `docker compose up -d` |
| Arrêter | `docker compose down` |
| Logs | `docker compose logs -f` |
| Mettre à jour les images | `docker compose pull && docker compose up -d` |
| **Reset complet** (efface les données) | `docker compose down -v && docker compose up -d` |

### Appliquer de nouvelles migrations

Les fichiers d'init de Postgres ne s'exécutent qu'au **tout premier** démarrage (volume vide). Pour une base déjà en place, applique les migrations via le CLI Supabase depuis ton poste de dev en pointant sur le NAS, ou exécute le SQL directement :

```bash
# Exemple : appliquer un fichier SQL sur la base du NAS
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/<fichier>.sql
```

## Sauvegardes

Sauvegarde régulière de la base (à automatiser via une tâche planifiée UGOS) :

```bash
docker compose exec -T db pg_dumpall -U postgres > crew-backup-$(date +%F).sql
```

Restauration :

```bash
cat crew-backup-AAAA-MM-JJ.sql | docker compose exec -T db psql -U postgres
```

## Sécurité

- Ne commite **jamais** `infra/supabase-nas/.env` (déjà gitignoré).
- Pour un accès hors réseau local, place la stack derrière un **reverse proxy HTTPS** (ex. l'app reverse proxy d'UGOS, ou Traefik/Caddy) plutôt que d'exposer le port `8000` directement.
- Change `DASHBOARD_PASSWORD` et garde `SERVICE_ROLE_KEY` strictement côté serveur (jamais exposée au navigateur).
