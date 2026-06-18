# CLAUDE.md — Backend (api-swagger)

REST API для Pets Store. **NestJS 10 + TypeORM + PostgreSQL**, аутентификация через **JWT** и **API-ключ**. Swagger-документация на `/docs`.

## Команды

Запускать из каталога `api-swagger/`:

```bash
npm install            # установка зависимостей
npm run start:dev      # dev-режим с авто-перезапуском (ts-node-dev), порт 3000
npm run build          # компиляция в dist/ (tsc -p tsconfig.build.json)
npm run start:prod     # прод-режим (node dist/main.js)
```

- Сервер слушает **порт 3000** (захардкожен в `src/main.ts`).
- Swagger UI: `http://localhost:3000/docs`.
- Тестов и линтера в проекте нет.
- Полная инструкция по локальному запуску на Windows (Node + Postgres без Docker) — в `WINDOWS_SETUP.md`.

## Окружение (`.env`)

Создаётся из `env.example`. Ключевые переменные:

| Переменная | Назначение |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | подключение к Postgres (по умолчанию `localhost:5432`, `app/app`, БД `petstore`) |
| `JWT_SECRET` | секрет для подписи JWT (fallback `change_me`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_API_KEY` | данные администратора, создаётся автоматически при старте |
| `UPLOAD_DIR` | каталог для загруженных файлов. **На Windows ставить `./uploads`** (значение из Docker — `/app/uploads`) |

При старте `UsersService.ensureAdminUser()` создаёт/обновляет admin-пользователя из этих переменных.

## Архитектура

Модуль на домен. Каждый домен — папка с `*.controller.ts`, `*.service.ts`, `*.module.ts` и вложенным `dto/`:

```
src/
  main.ts              # bootstrap: ValidationPipe, статика /uploads, Swagger, ensureAdminUser
  app.module.ts        # корневой модуль, TypeOrmModule.forRootAsync, подключение доменов
  auth/                # POST /auth/register, POST /auth/login, GET /auth/me; JwtStrategy
  migrations/          # TypeORM-миграции; data-source.ts (src/) — конфиг для CLI
  users/               # CRUD пользователей, findByApiKey, ensureAdminUser
  categories/          # категории животных
  animals/             # животные + загрузка изображений (multipart)
  orders/              # заказы (целиком под API-ключом)
  entities/            # ВСЕ TypeORM-сущности собраны здесь (User, Category, Animal, AnimalImage, Order)
  common/
    guards/            # jwt-auth.guard, api-key.guard, roles.guard
    decorators/        # @Roles(...)
```

### Модель данных
- `User` — `email`, `passwordHash` (bcrypt), профиль (`firstName`, `lastName`, `birthDate`, `address`, `paymentMethod`, `avatar`), `favorites` (jsonb — id избранных), `cart` (jsonb — `[{animalId, quantity}]`), `role`, уникальный `apiKey`.
  - **Роли**: `admin` | `moderator` | `seller` | `buyer` (по умолчанию `buyer`).
- `Animal` — основная сущность: `name`, `species`, `price`, `ageMonths`, `status` (`available` по умолчанию), связи `category`/`owner`/`images` (все `eager`).
- `AnimalImage` — изображения животного (`cascade`, `eager`), URL вида `/uploads/<uuid>.<ext>`.
- `Category`, `Order` — категории и заказы.

### Аутентификация и авторизация
Два независимых механизма, выбираются на уровне эндпоинта через guard'ы:

- **JWT (Bearer)** — `JwtAuthGuard` + `@ApiBearerAuth()`. Используется для логина и операций создания/обновления (`POST/PATCH /animals`, `/auth/me`). `JwtStrategy.validate` кладёт в `req.user` объект `{ userId, role }`.
- **API-ключ** — `ApiKeyGuard` + `@ApiSecurity('apiKey')`, заголовок `x-api-key`. Используется для `DELETE /animals/:id` и **всего** контроллера `orders`. Guard кладёт в `req.user` полную сущность `User`.
- **Роли** — `RolesGuard` + декоратор `@Roles('admin')` читают требуемые роли через `Reflector`. Без `@Roles` доступ открыт любому аутентифицированному пользователю.

> Важно: форма `req.user` различается между guard'ами — JWT даёт `{ userId, role }`, API-ключ даёт полную `User`. Учитывать при чтении `req.user` в контроллерах/сервисах.

### Регистрация и роли
- **Публичная регистрация** — `POST /auth/register` (`RegisterDto`). Роль ограничена значениями `buyer`/`seller` (через `@IsIn`), по умолчанию `buyer`. Возвращает сразу `accessToken` + `apiKey` (авто-логин). Дубликат email → `409 Conflict` (проверка в `UsersService.create`).
- **Модератор и админ** — создаются только админом через `POST /users` (контроллер под `@Roles('admin')`). `CreateUserDto` допускает все 4 роли.
- **Сид админа** — `UsersService.ensureAdminUser()` при старте поднимает/обновляет пользователя с ролью `admin` из `ADMIN_*`.

### Личный кабинет (self-service, всё под JWT)
- `GET /auth/me` — полный профиль; `PATCH /auth/me` (`UpdateProfileDto`) — имя/фамилия/дата рождения/адрес/способ оплаты + смена типа `role` **только в пределах buyer↔seller** (для admin/moderator → `403`).
- `POST /auth/change-password` — смена пароля (сверяет текущий).
- `POST /auth/me/avatar` — загрузка аватара (multipart, как у животных: `FileInterceptor` + `diskStorage`, URL `/uploads/<uuid>.<ext>`).
- `PUT /auth/me/favorites` — избранное хранится per-user на сервере (переживает выход/вход); фронт шлёт полный список id.
- `PUT /auth/me/cart` — корзина хранится per-user на сервере (тоже переживает выход/вход). Оформление заказа — `POST /orders` (по API-ключу) → запись попадает в историю покупок (`GET /orders`), после чего корзина очищается.

### Миграции (TypeORM)
- Схема управляется **миграциями**. `synchronize` выключен через `.env` (**`DB_SYNCHRONIZE=false`**); при старте Nest прогоняет миграции (`migrationsRun`, см. `app.module.ts`). Поставить `DB_SYNCHRONIZE=true` вернёт авто-sync (для быстрых экспериментов в dev).
- Команды (через `src/data-source.ts` — отдельный `DataSource` для CLI, читает `.env` через `dotenv`):
  ```bash
  npm run migration:run        # применить ожидающие
  npm run migration:revert     # откатить последнюю
  npm run migration:generate -- src/migrations/<Name>   # сгенерировать по диффу сущностей
  ```
- Миграции (`src/migrations/`, порядок по timestamp в имени):
  1. **`InitialSchema`** — базовая схема: 5 таблиц (`users`, `categories`, `animals`, `animal_images`, `orders`) + FK. `users.role` ещё с дефолтом `user`.
  2. **`AddUserProfileFields`** — добавляет `firstName`/`lastName`/`birthDate`, меняет дефолт роли на `buyer` и переносит `user → buyer`. SQL идемпотентный (`IF NOT EXISTS`).
  3. **`AddUserContactFields`** — добавляет `address`/`paymentMethod`/`avatar`.
  4. **`AddUserFavorites`** — добавляет `favorites` (jsonb, дефолт `[]`).
  5. **`AddUserCart`** — добавляет `cart` (jsonb, дефолт `[]`).
  6. **`AddImagePosition`** — добавляет `position` (int) в `animal_images`: порядок фото, первая (0) — обложка; существующим фото проставляет позиции по `id`.
- Существующая dev-БД уже переведена под контроль миграций (обе записаны в таблице `migrations`). Свежая БД с `DB_SYNCHRONIZE=false` соберётся миграциями с нуля.

### Особенности
- `ValidationPipe` глобальный с `whitelist: true` и `transform: true` — DTO с `class-validator` обязательны, лишние поля отбрасываются.
- Загруженные файлы раздаются статикой по `/uploads` (`express.static`). Загрузка через `FileInterceptor` + `diskStorage`, имя файла — `randomUUID()`.
- **Фото товара** (всё под JWT, проверка владельца либо `role === 'admin'`): `POST /animals/:id/images` — добавить (в конец); `DELETE /animals/:id/images/:imageId` — удалить (с переиндексацией); `PATCH /animals/:id/images/:imageId/cover` — назначить обложкой (позиция 0). Карточки возвращают фото отсортированными по `position`.
- Все query-параметры приходят строками — в `AnimalsController.findAll` они вручную приводятся к числам.

## Конвенции
- TypeScript, декораторы NestJS, `reflect-metadata` импортируется первым в `main.ts`.
- Новый домен = новый модуль (`*.module.ts`), подключается в `app.module.ts`. Сущность добавляется в `src/entities/` и в массив `entities` в `app.module.ts`.
- DTO — рядом с доменом в `dto/`, валидация через `class-validator`.
- Swagger-аннотации (`@ApiTags`, `@ApiBearerAuth`, `@ApiSecurity`, `@ApiQuery`) проставляются на контроллерах/методах.
