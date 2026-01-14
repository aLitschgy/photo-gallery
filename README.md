PhotoGallery is a simple web application to display a public gallery of photos. It allows users to upload images and view them in a responsive gallery format.

## Features

- Upload photos via a simple admin interface (/admin)
- Responsive gallery display
- Automatic thumbnail generation for faster loading

## Deployment

docker

```bash
docker run -d -p 3000:3000 -v ./gallery-data:/app/gallery-data --name photo-gallery -e PASSWORD=mypassword -e SESSION_SECRET=mysecret alitschgy/photo-gallery:latest
```

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
    volumes:
      - ./gallery-data:/app/gallery-data
    restart: unless-stopped
```
