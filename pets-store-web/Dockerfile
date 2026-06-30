# ---- build stage ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Прод-сборка: фронт, API и картинки обслуживаются с одного origin.
# Пустой VITE_API_ORIGIN => картинки грузятся по относительному /uploads/...,
# который nginx проксирует на backend (см. nginx.conf). API-запросы идут на /api/*.
ENV VITE_API_ORIGIN=""
RUN npm run build

# ---- runtime stage (nginx) ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
