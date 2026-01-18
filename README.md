PhotoGallery is a simple web application to display a public gallery of photos. It allows users to upload images and view them in a responsive gallery format.

**The application has been migrated to SvelteKit for a modern, unified full-stack framework.**

## Features

- Upload photos via a simple admin interface (/admin)
- Responsive gallery display with justified layout
- PhotoSwipe lightbox for viewing images
- Drag & drop reordering of photos
- Automatic thumbnail generation for faster loading
- JWT authentication
- Built with SvelteKit (previously Svelte + Express)

## Development

### Prerequisites

- Node.js 20.11+
- npm

### Running in development mode

```bash
npm run dev
```

Then open your browser at `http://localhost:5173`

### Building for production

```bash
npm run build
```

This generates optimized files in the `build/` folder.

### Running production build

```bash
npm start
```

## Deployment

### Docker

```bash
docker run -d -p 3000:3000 -v ./gallery-data:/app/gallery-data --name photo-gallery -e PASSWORD=mypassword -e SESSION_SECRET=mysecret alitschgy/photo-gallery:latest
```

### Docker Compose

`compose.yml`

```yaml
services:
  photo-gallery:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PASSWORD=${PASSWORD:-mypassword}
      - SESSION_SECRET=${SESSION_SECRET:-supersecret}
      # Optional:
      - BODY_SIZE_LIMIT=52428800 # 50 MB upload limit
    volumes:
      - ./gallery-data:/app/gallery-data
    restart: unless-stopped
```
