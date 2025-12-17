FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]