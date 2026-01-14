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

# Supprimer les dossiers/fichiers par défaut s'ils existent
rm -rf /app/public/photos
rm -f /app/src/db/photos.json

# Créer des liens symboliques vers gallery-data
ln -sf /app/gallery-data/photos /app/public/photos
ln -sf /app/gallery-data/data/photos.json /app/src/db/photos.json

echo "Data mounted from gallery-data:"
echo "  - Photos: /app/gallery-data/photos -> /app/public/photos"
echo "  - Database: /app/gallery-data/data/photos.json -> /app/src/db/photos.json"

if [ -n "$CUSTOM_SCRIPT" ]; then
  sed "s|<!-- custom-script-placeholder -->|${CUSTOM_SCRIPT}|g" public/index.html > public/index.html.tmp && mv public/index.html.tmp public/index.html
fi

exec "$@"
