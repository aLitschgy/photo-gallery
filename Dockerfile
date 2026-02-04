FROM node:24-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build the SvelteKit app
RUN npm run build

# Copy migration files and script for runtime
RUN cp -r /app/drizzle /app/build/drizzle
RUN cp /app/migrate.js /app/build/migrate.js

# Remove dev dependencies
RUN npm prune --omit=dev

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]