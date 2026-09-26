# CLAUDE.md — Backend (api-swagger)

REST API для Pets Store. **NestJS 10 + TypeORM + PostgreSQL**, аутентификация через **JWT** (Bearer). Swagger-документация на `/docs`.

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
- Юнит-тесты на **Jest** + ts-jest (`npm test`): сервисы (`src/**/*.service.spec.ts`) инстанцируются напрямую с мок-репозиториями (без Nest DI). Линтера нет.
- Полная инструкция по локальному запуску на Windows (Node + Postgres без Docker) — в `WINDOWS_SETUP.md`.

## Окружение (`.env`)

Создаётся из `.env.example`. Ключевые переменные:

| Переменная | Назначение |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | подключение к Postgres (по умолчанию `localhost:5432`, `app/app`, БД `petstore`) |
| `JWT_SECRET` | секрет для подписи JWT (fallback `change_me`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | данные администратора, создаётся автоматически при старте |
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
  users/               # CRUD пользователей, ensureAdminUser
  categories/          # категории животных
  animals/             # животные + загрузка изображений (multipart)
  orders/              # заказы (целиком под JWT); при создании уведомляет продавцов купленных питомцев
  shops/               # справочник магазинов (CRUD)
  notifications/       # уведомления пользователю (GET лента/счётчик, PATCH прочтения); сервис экспортируется
  chat/                # чат: REST (диалоги/сообщения/read/скрытие/upload) + ChatGateway (Socket.IO, JWT в handshake)
  entities/            # ВСЕ TypeORM-сущности собраны здесь (User, Category, Animal, AnimalImage, Order, Shop, Notification, Conversation, ChatMessage)
  common/
    guards/            # jwt-auth.guard, roles.guard
    decorators/        # @Roles(...)
```

### Модель данных
- `User` — `email`, `passwordHash` (bcrypt), профиль (`firstName`, `lastName`, `birthDate`, `address`, `paymentMethod`, `avatar`), `favorites` (jsonb — id избранных), `cart` (jsonb — `[{animalId, quantity}]`), `role`.
  - **Роли**: `admin` | `moderator` | `seller` | `buyer` | `courier` (по умолчанию `buyer`).
- `Animal` — основная сущность: `name`, `species`, `price`, `ageMonths`, `status` (`available` по умолчанию), связи `category`/`owner`/`images` (все `eager`).
  - **Цена и комиссия**: продавец указывает базовую цену `basePrice`; покупательская `price` = `basePrice + floor(basePrice * commissionRate)` (комиссия округляется **вниз до целых рублей**). Для товаров продавцов `commissionRate = 0.05` (5% в сторону сайта), для админских — `0`. Цена пересчитывается в `AnimalsService` при создании и при правке цены (хелпер `withCommission`).
- `AnimalImage` — изображения животного (`cascade`, `eager`), URL вида `/uploads/<uuid>.<ext>`.
- `Category`, `Order` — категории и заказы.
- **Чат** — `Conversation` (4 вида: `buyer-seller` / `buyer-support` / `seller-support` / `admin-moderator`; support-чаты видят ВСЕ модераторы и админы; «удаление» = per-user скрытие через jsonb `deletedFor`, новое сообщение очищает его) и `ChatMessage` (`senderRole` — «сторона» отправителя, `attachments` jsonb, `isRead`). Реалтайм — `ChatGateway` (Socket.IO, путь по умолчанию `/socket.io`): JWT из `handshake.auth.token`, комнаты `user:<id>` / `staff` / `admins`; события `message:send`/`message:new`, `conversation:read`. Матрица прав создания диалогов — в `ChatService.findOrCreateConversation` (продавец не может первым написать покупателю). Пользователь — одна сущность с переключаемым кабинетом buyer↔seller, поэтому доступ/видимость диалогов и «сторона» сообщений считаются **по участию (ID)**, а не по текущей роли: список включает все диалоги, где `buyerId=я` или `sellerId=я`; получателем товарного чата может быть и владелец, временно переключившийся в «покупателя». По сокету сущности сериализуются через `instanceToPlain` (PII не утекает).

### Аутентификация и авторизация
Все защищённые эндпоинты — на **JWT (Bearer)**:

- **JWT (Bearer)** — `JwtAuthGuard` + `@ApiBearerAuth()`. Используется везде: логин, создание/обновление (`POST/PATCH /animals`, `/auth/me`), `DELETE /animals/:id` и **весь** контроллер `orders`. `JwtStrategy.validate` кладёт в `req.user` объект `{ id, userId, role }` (`id` === `userId`); **`role` читается из БД**, а не из payload — кабинет buyer↔seller переключается без перевыпуска токена. (`ChatGateway` при подключении сокета намеренно берёт роль из payload — синхронно, без гонки с первым emit; для сокет-логики устаревание buyer↔seller безвредно, там всё по ID.)
- **Роли** — `RolesGuard` + декоратор `@Roles('admin')` читают требуемые роли через `Reflector`. Без `@Roles` доступ открыт любому аутентифицированному пользователю.

> Авторизация по `x-api-key` удалена (миграция `RemoveUserApiKey`). В контроллерах `req.user.userId`/`req.user.id` — один и тот же идентификатор; orders/animals(delete) используют `req.user` как `User` (берут `.id`/`.role`).

### Регистрация и роли
- **Публичная регистрация** — `POST /auth/register` (`RegisterDto`). Роль ограничена значениями `buyer`/`seller` (через `@IsIn`), по умолчанию `buyer`. Возвращает сразу `accessToken` (авто-логин). Дубликат email → `409 Conflict` (проверка в `UsersService.create`).
- **Модератор и админ** — создаются только админом через `POST /users` (контроллер под `@Roles('admin')`). `CreateUserDto` допускает все 5 ролей (включая `courier`).
- **Сид админа** — `UsersService.ensureAdminUser()` при старте поднимает/обновляет пользователя с ролью `admin` из `ADMIN_*`.

### Личный кабинет (self-service, всё под JWT)
- `GET /auth/me` — полный профиль; `PATCH /auth/me` (`UpdateProfileDto`) — имя/фамилия/дата рождения/адрес/способ оплаты + смена типа `role` **только в пределах buyer↔seller** (для admin/moderator → `403`).
- `POST /auth/change-password` — смена пароля (сверяет текущий).
- `POST /auth/me/avatar` — загрузка аватара (multipart, как у животных: `FileInterceptor` + `diskStorage`, URL `/uploads/<uuid>.<ext>`).
- `PUT /auth/me/favorites` — избранное хранится per-user на сервере (переживает выход/вход); фронт шлёт полный список id.
- `PUT /auth/me/cart` — корзина хранится per-user на сервере (тоже переживает выход/вход). Оформление заказа — `POST /orders` (под JWT) → запись попадает в историю покупок (`GET /orders`), после чего корзина очищается.

### Миграции (TypeORM)
- Схема управляется **миграциями**. `synchronize` выключен через `.env` (**`DB_SYNCHRONIZE=false`**); при старте Nest прогоняет миграции (`migrationsRun`, см. `app.module.ts`). Поставить `DB_SYNCHRONIZE=true` вернёт авто-sync (для быстрых экспериментов в dev).
- Команды (через `src/data-source.ts` — отдельный `DataSource` для CLI, читает `.env` через `dotenv`):
  ```bash
  npm run migration:run        # применить ожидающие
  npm run migration:revert     # откатить последнюю
  npm run migration:generate -- src/migrations/<Name>   # сгенерировать по диффу сущностей
  ```
- Миграции (`src/migrations/`, порядок по timestamp в имени; SQL идемпотентный — `IF NOT EXISTS`). Сгруппированно:
  - **`InitialSchema`** — базовая схема: 5 таблиц (`users`, `categories`, `animals`, `animal_images`, `orders`) + FK.
  - Пользователь: **`AddUserProfileFields`** (имя/фамилия/дата рождения, дефолт роли → `buyer`), **`AddUserContactFields`** (адрес/оплата/аватар), **`AddUserFavorites`**, **`AddUserCart`** (jsonb), **`RemoveUserApiKey`** (отказ от x-api-key), **`AddPasswordReset`** (токен сброса пароля).
  - Товары: **`AddImagePosition`** (порядок фото, 0 — обложка), **`AddAnimalModeration`**, **`AddAnimalStock`**, **`AddAnimalCommission`** + **`ApplyCommissionToExistingAnimals`** + **`RoundExistingAnimalCommission`**, **`AddAnimalShop`**, **`AddAnimalProposedCategory`**.
  - Магазины: **`AddShops`**, **`AssignAdminAnimalsToShop`**.
  - Заказы: **`AddOrderAddress`**, **`AddOrderPayment`**, **`AddOrderCancelReason`**.
  - Уведомления: **`AddNotifications`**.
  - Чат: **`AddChat`** — таблицы `conversations` + `chat_messages` (FK на `users`/`conversations`, каскадное удаление).
- Существующая dev-БД уже переведена под контроль миграций. Свежая БД с `DB_SYNCHRONIZE=false` соберётся миграциями с нуля.

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
