PhotoGallery is a simple web application to display a public gallery of photos. It allows users to upload images and view them in a responsive gallery format.

The admin interface provides an easy way to manage photos, including uploading, reordering, and tagging. The gallery is built with SvelteKit.

## Features

- Upload photos via a simple admin interface (/admin)
- Responsive gallery display with justified layout
- PhotoSwipe lightbox for viewing images
- Drag & drop reordering of photos
- Automatic thumbnail generation for faster loading

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
