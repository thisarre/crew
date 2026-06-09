#!/usr/bin/env bash
#
# Bootstrap d'une instance Supabase auto-hébergée pour le projet Crew.
#
# Ce script :
#   1. Récupère la stack docker officielle de Supabase (dossier `docker/`),
#      épinglée à une version stable, via un sparse-checkout git.
#   2. Génère les secrets (.env) s'ils n'existent pas encore.
#   3. Copie les migrations SQL du projet dans le dossier d'init de la base,
#      pour qu'elles soient appliquées au tout premier démarrage.
#
# À lancer depuis ce dossier (infra/supabase-nas/), sur le NAS ou en local :
#   ./bootstrap.sh
#
set -euo pipefail

# Version de Supabase épinglée (modifiable). Voir https://github.com/supabase/supabase/releases
SUPABASE_REF="${SUPABASE_REF:-v1.24.07}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="$SCRIPT_DIR/stack"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "▶ Bootstrap Supabase NAS (ref: $SUPABASE_REF)"

# 1. Récupération de la stack officielle ------------------------------------
if [ ! -d "$STACK_DIR/docker" ]; then
  echo "▶ Téléchargement de la stack Supabase officielle…"
  TMP_DIR="$(mktemp -d)"
  git clone --filter=blob:none --no-checkout --depth 1 --branch "$SUPABASE_REF" \
    https://github.com/supabase/supabase "$TMP_DIR/supabase"
  (
    cd "$TMP_DIR/supabase"
    git sparse-checkout init --cone
    git sparse-checkout set docker
    git checkout
  )
  mkdir -p "$STACK_DIR"
  cp -R "$TMP_DIR/supabase/docker" "$STACK_DIR/docker"
  rm -rf "$TMP_DIR"
  echo "✅ Stack copiée dans $STACK_DIR/docker"
else
  echo "✓ Stack déjà présente ($STACK_DIR/docker) — saut du téléchargement"
fi

# 2. Génération des secrets --------------------------------------------------
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "▶ Génération des secrets…"
  cp "$STACK_DIR/docker/.env.example" "$SCRIPT_DIR/.env"
  node "$SCRIPT_DIR/generate-keys.mjs" --write
  echo "✅ .env créé avec des secrets uniques"
else
  echo "✓ .env déjà présent — secrets conservés"
fi

# On fait pointer docker compose vers notre .env (en dehors du dossier stack/).
ln -sf "$SCRIPT_DIR/.env" "$STACK_DIR/docker/.env"

# 3. Migrations du projet appliquées à l'init de Postgres --------------------
INIT_DIR="$STACK_DIR/docker/volumes/db/init"
mkdir -p "$INIT_DIR"
if [ -d "$PROJECT_ROOT/supabase/migrations" ]; then
  echo "▶ Copie des migrations du projet vers l'init de Postgres…"
  idx=10
  for f in "$PROJECT_ROOT"/supabase/migrations/*.sql; do
    [ -e "$f" ] || continue
    cp "$f" "$INIT_DIR/$(printf '%02d' "$idx")-$(basename "$f")"
    idx=$((idx + 1))
  done
  echo "✅ Migrations copiées dans $INIT_DIR"
fi

cat <<EOF

──────────────────────────────────────────────────────────────
✅ Bootstrap terminé.

Démarrer la stack :
  cd "$STACK_DIR/docker"
  docker compose up -d

Studio (interface) :   http://<IP_DU_NAS>:8000
API / Auth / REST  :   http://<IP_DU_NAS>:8000

Identifiants Studio (voir .env) :
  DASHBOARD_USERNAME / DASHBOARD_PASSWORD

⚠️  Les migrations ne s'appliquent QU'AU PREMIER démarrage (volume db vide).
    Pour repartir de zéro : docker compose down -v puis up -d.
──────────────────────────────────────────────────────────────
EOF
