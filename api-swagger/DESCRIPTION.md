# Petstore NestJS (All-in-One Docker)

This container provides a ready-to-run Petstore-like REST API for local frontend development and API testing.  
It ships with a NestJS backend, PostgreSQL inside the same container, JWT authentication, and API key access.

## What it is for
- Fast local backend for frontend development
- Swagger UI + Postman testing without extra setup
- Single container, no external database required

## Features
- Users with roles (`admin`, `user`)
- Admin-only user management
- Animals CRUD with categories
- Animal images upload (multipart/form-data)
- Orders CRUD (only owner can access via API key)
- Pagination, filtering, sorting for animals list
- JWT auth + API key auth
- Swagger UI with request examples

## Swagger
Swagger UI is available at:
```
http://localhost:3000/docs
```

## Authentication
- **JWT**: `Authorization: Bearer <token>`
- **API key**: `x-api-key: <apiKey>`

Login endpoint:
```
POST /auth/login
```

## Default admin user
Created on first start (can be overridden by env vars):
- Email: `admin@example.com`
- Password: `admin123`

## Run with Docker Hub image
```
docker pull vmalkov/petstore-nest:latest
docker run -p 3000:3000 --env-file env.example vmalkov/petstore-nest:latest
```

Or pass variables manually:
```
docker run -p 3000:3000 \
  -e JWT_SECRET=change_me \
  -e DB_PASSWORD=app \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=admin123 \
  vmalkov/petstore-nest:latest
```

## Build locally
```
docker build -t petstore-nest .
docker run -p 3000:3000 --env-file env.example petstore-nest
```

## Environment variables
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_API_KEY`
- `UPLOAD_DIR`

