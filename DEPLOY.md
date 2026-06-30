# Деплой Pets Store через Docker Compose

Стек из трёх сервисов:

| Сервис | Образ / сборка | Назначение |
| --- | --- | --- |
| `db`  | `postgres:18` | БД, инициализируется дампом `db/init/01-petstore-dump.sql` (схема + данные + таблица `migrations`) |
| `api` | `api-swagger/Dockerfile.prod` | NestJS-бэкенд на :3000 (внутри сети), подключается к `db` |
| `web` | `pets-store-web/Dockerfile` | nginx: раздаёт собранный SPA и проксирует `/api` и `/uploads` на `api` |

Всё на одном origin — CORS не нужен. Картинки и аватары идут на относительный `/uploads/...`.

## Запуск на сервере

```bash
git clone <repo> pets-store && cd pets-store

# 1) Первый запуск создаст .env из примера и остановится:
./deploy.sh

# 2) Отредактируй секреты:
nano .env        # JWT_SECRET, ADMIN_PASSWORD, DB_PASSWORD, при желании WEB_PORT

# 3) Подними стек:
./deploy.sh
```

Открыть: `http://<server-ip>/` (или порт из `WEB_PORT`). Swagger — `/docs`.

## Данные

- **Схема + данные** заливаются дампом `db/init/` — но **только при первом старте**, пока том `db-data` пуст. Повторные `up` дамп не трогают (данные уже в томе).
- **Картинки товаров** (`api-swagger/uploads`, 77 файлов) вшиты в образ `api` и наследуются томом `uploads` при первом создании. Новые загрузки пользователей остаются в томе.
- Бэкенд при старте прогоняет миграции (`migrationsRun`). В дампе все 19 миграций уже отмечены применёнными, поэтому это no-op; новые миграции, добавленные позже, накатятся автоматически.

## Команды

```bash
./deploy.sh            # собрать и поднять (db + api + web)
./deploy.sh --rebuild  # пересобрать образы без кэша и перезапустить
./deploy.sh --down     # остановить (тома с данными сохраняются)
./deploy.sh --logs     # логи всех сервисов
```

## Перезалить БД из свежего дампа

Дамп применяется только на пустой том. Чтобы накатить новый `db/init/*.sql` начисто
(**удалит текущие данные БД!**):

```bash
docker compose down
docker volume rm pets-store_db-data
./deploy.sh
```

Том `uploads` при этом не трогается — картинки сохранятся.

## Обновление кода

```bash
git pull
./deploy.sh --rebuild
```

## Обновить дамп перед коммитом (на машине разработки)

```bash
pg_dump -h localhost -U app -d petstore \
  --no-owner --no-privileges --no-comments \
  -f db/init/01-petstore-dump.sql
```
