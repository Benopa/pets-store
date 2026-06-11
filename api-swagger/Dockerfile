FROM node:20-bullseye

ENV NODE_ENV=development
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-13 postgresql-client-13 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npm install

COPY src ./src
RUN npm run build \
  && npm prune --omit=dev

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

ENV NODE_ENV=production \
  DB_HOST=localhost \
  DB_PORT=5432 \
  DB_USERNAME=app \
  DB_NAME=petstore \
  ADMIN_EMAIL=admin@example.com \
  UPLOAD_DIR=/app/uploads

CMD ["/start.sh"]
