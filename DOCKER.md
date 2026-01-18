# Docker Setup - SvelteKit

## Configuration Docker mise à jour

Le Dockerfile a été adapté pour SvelteKit :

### Changements principaux

1. **Build command** : `npm run build` génère maintenant dans `/build` (adapter-node)
2. **Start command** : `node build` au lieu de `npm start`
3. **Chemins** : Liens symboliques vers `static/` et `src/lib/server/db/` au lieu de `public/` et `backend/`
4. **Port** : Variable d'environnement `PORT=3000`

## Utilisation

### Build et démarrage

```bash
# Build l'image
docker build -t photo-gallery .

# Ou avec docker-compose
docker-compose up --build
```

### Variables d'environnement

Dans `.env` ou `docker-compose.yml` :

```env
PASSWORD=votre_mot_de_passe
SESSION_SECRET=votre_secret_jwt_long_et_aleatoire
PORT=3000
```

### Volumes

Le dossier `gallery-data/` est monté pour persister :

- `gallery-data/photos/` → Photos uploadées
- `gallery-data/data/photos.json` → Base de données JSON

```yaml
volumes:
  - ./gallery-data:/app/gallery-data
```

## Structure dans le conteneur

```
/app/
├── build/                    # SvelteKit build output
├── src/                      # Code source
│   └── lib/server/db/
│       └── photos.json       # Symlink → /app/gallery-data/data/photos.json
├── static/
│   └── photos/               # Symlink → /app/gallery-data/photos/
├── gallery-data/             # Volume monté
│   ├── photos/
│   │   └── minias/
│   └── data/
│       └── photos.json
└── package.json
```

## Commandes utiles

```bash
# Logs
docker-compose logs -f

# Accéder au conteneur
docker-compose exec photo-gallery sh

# Rebuild
docker-compose up --build

# Stop
docker-compose down

# Cleanup complet
docker-compose down -v
```

## Adapter-node

SvelteKit utilise `@sveltejs/adapter-node` qui :

- Génère un serveur Node.js standalone dans `/build`
- Écoute sur le port défini par `process.env.PORT` (défaut: 3000)
- Sert les fichiers statiques depuis `/build/client`
- Exécute le code serveur de `/build/server`

Le serveur est démarré avec `node build` qui lance `/build/index.js`.
