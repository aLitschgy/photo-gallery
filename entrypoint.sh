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

# Définir le chemin de la base de données via variable d'environnement
export DB_PATH=/app/gallery-data/data/photos.json

# Forcer une limite de taille de body généreuse pour les uploads (50 Mo) si non définie
: "${BODY_SIZE_LIMIT:=52428800}"
export BODY_SIZE_LIMIT

echo "Photo Gallery Server Starting:"
echo "  - Database: $DB_PATH"
echo "  - Photos directory: /app/gallery-data/photos"
echo "  - Static content served by Express via /photos"

if [ -n "$CUSTOM_SCRIPT" ]; then
  sed "s|<!-- custom-script-placeholder -->|${CUSTOM_SCRIPT}|g" src/app.html > src/app.html.tmp && mv src/app.html.tmp src/app.html
fi

exec "$@"
