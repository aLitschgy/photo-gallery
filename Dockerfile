FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build the SvelteKit app
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]