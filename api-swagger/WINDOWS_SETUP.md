# Windows запуск без Docker

Ниже — последовательность установок и команд для запуска сервера и БД локально на Windows.

## 1) Установки
1. **Node.js LTS** (вместе с npm): https://nodejs.org/
2. **PostgreSQL 13+** (включая psql): https://www.postgresql.org/download/windows/
3. **Git** (если нужно клонировать репозиторий): https://git-scm.com/downloads

После установки PostgreSQL убедись, что `psql` доступен в PATH.

## 2) Подготовка проекта
Открой PowerShell в корне проекта и выполни:
```powershell
npm install
```

Создай `.env` на основе примера:
```powershell
Copy-Item env.example .env
```

Открой `.env` и для Windows задай:
```
UPLOAD_DIR=./uploads
```

## 3) Создание БД и пользователя
Выполни команды (пароль пользователя `postgres` зависит от твоей установки):
```powershell
psql -U postgres -h localhost -p 5432
```

В открывшейся консоли psql:
```sql
CREATE USER app WITH PASSWORD 'app';
CREATE DATABASE petstore OWNER app;
```
Выйти из psql:
```sql
\q
```

## 4) Запуск сервера
Режим разработки:
```powershell
npm run start:dev
```

Продакшн‑режим:
```powershell
npm run build
npm run start:prod
```

## 5) Проверка
Swagger UI:
```
http://localhost:3000/docs
```
