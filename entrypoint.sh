#!/bin/sh
set -e

# Créer la structure gallery-data si elle n'existe pas
mkdir -p /app/gallery-data/photos/minias
mkdir -p /app/gallery-data/data

# Initialiser photos.json s'il n'existe pas
if [ ! -f /app/gallery-data/data/photos.json ]; then
  echo '[]' > /app/gallery-data/data/photos.json
  echo "Initialized photos.json"
fi

# Créer les liens symboliques pour les photos UNIQUEMENT
# Supprimer les anciens symlinks s'ils existent (pas tout le répertoire!)
rm -f /app/static/photos 2>/dev/null || true
rm -f /app/build/client/photos 2>/dev/null || true

# Créer les symlinks vers le volume monté
mkdir -p /app/static
ln -sf /app/gallery-data/photos /app/static/photos

mkdir -p /app/build/client
ln -sf /app/gallery-data/photos /app/build/client/photos

# Définir le chemin de la base de données via variable d'environnement
export DB_PATH=/app/gallery-data/data/photos.json

# Forcer une limite de taille de body généreuse pour les uploads (50 Mo) si non définie
: "${BODY_SIZE_LIMIT:=52428800}"
export BODY_SIZE_LIMIT

echo "SvelteKit data mounted from gallery-data:"
echo "  - Photos (symlink): /app/static/photos -> /app/gallery-data/photos"
echo "  - Photos (symlink): /app/build/client/photos -> /app/gallery-data/photos"
echo "  - Database: $DB_PATH"

if [ -n "$CUSTOM_SCRIPT" ]; then
  sed "s|<!-- custom-script-placeholder -->|${CUSTOM_SCRIPT}|g" src/app.html > src/app.html.tmp && mv src/app.html.tmp src/app.html
fi

exec "$@"
