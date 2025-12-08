PhotoGallery is a simple web application to display a public gallery of photos. It allows users to upload images and view them in a responsive gallery format.

## Features
- Upload photos via a simple admin interface (/admin)
- Responsive gallery display
- Automatic thumbnail generation for faster loading

## Deployment
docker
```bash
docker run -d -p 3000:3000 -v /path/to/your/photos:/app/public/photos --name photo-gallery -e PASSWORD=mypassword -e SESSION_SECRET=mysecret alitschgy/photo-gallery:latest
```

compose
```yaml
services:
  photo-gallery:
    image: alitschgy/photo-gallery:latest
    ports:
      - "3000:3000"
    volumes:
      - /path/to/your/photos:/app/public/photos
    environment:
      PASSWORD: mypassword
      SESSION_SECRET: mysecret
```
