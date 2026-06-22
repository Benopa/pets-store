# CLAUDE.md — Frontend (pets-store-web)

SPA магазина животных. **React 19 + Vite 8 + Redux Toolkit + React Router 7**, UI на **Ant Design 6**, стили на **Tailwind CSS v4**.

## Команды

Запускать из каталога `pets-store-web/`:

```bash
npm install            # установка зависимостей
npm run dev            # dev-сервер Vite (по умолчанию http://localhost:5173)
npm run build          # прод-сборка в dist/
npm run preview        # предпросмотр прод-сборки
npm run lint           # ESLint по src и vite.config.js
npm run lint:fix       # ESLint с автофиксом
npm run format         # Prettier --write по всему проекту
npm run format:check   # проверка форматирования
```

Для работы нужен запущенный backend (`api-swagger`) на `http://localhost:3000`.

## Связь с API

- Vite-прокси (`vite.config.js`): запросы на **`/api/*`** проксируются на `http://localhost:3000`, префикс `/api` срезается при проксировании.
- Поэтому в коде запросы идут через axios на `/api/...` (например `axios.get('/api/animals')`), а реальный путь на сервере — без `/api`.
- **Изображения** животных грузятся напрямую с backend: `http://localhost:3000${img.url}` (прокси не используется), см. `photo-gallery.jsx`.
- JWT-токен после логина сохраняется в `localStorage` (`token`) и подставляется в заголовок `Authorization: Bearer ...` в thunk'ах.

## Архитектура

Структура по **Feature-Sliced Design (FSD)** — слои `app / pages / widgets / entities / shared`.
В каждом слайсе есть `index.js` (публичный API). Алиас **`@` → `src`** (`vite.config.js`); импорты
между слоями — только через public API: `@/entities/<x>`, `@/widgets/<x>`, `@/shared/<x>`, `@/pages`,
`@/app/store`. Внутри слайса — относительные пути.

```
src/
  main.jsx                      # точка входа: ConfigProvider (antd) → Provider (redux) → BrowserRouter
  app/                          # слой app: композиция приложения
    app.component.jsx           #   роуты + HOC PrivateRoute/GuestRoute/StaffRoute, начальная загрузка
    store.js                    #   configureStore: { animal, auth, favorites, orders, cart, moderators, shops, notifications }
    styles/index.css            #   глобальные стили (Tailwind)
  pages/                        # страницы (композиция entities/widgets)
    home/      # home.page.jsx + components/filter
    account/   # account.page.jsx + components/: contact-form, favorites-grid, purchase-history,
               #   products-manager, product-edit-modal, moderators-manager, stores-manager
    cart/ login/ register/ moderation/
  widgets/
    header/ui/header.jsx        # шапка (корзина из state.cart, меню «Модерация» для персонала)
  entities/                     # бизнес-сущности: model (slice+thunks) [+ ui]
    animal/    model/ + ui/ (animal-card, photo-gallery)   # fetchAnimals, approve/reject, CATEGORY_COLOR…
    auth/      model/   # login/register/fetchMe/updateProfile/changePassword/uploadAvatar, logout
    cart/      model/   # addToCart/setCartQty/removeFromCart/clearCart/checkout → PUT /auth/me/cart, POST /orders
    favorites/ model/   # toggleFavorite → PUT /auth/me/favorites
    order/     model/   # fetchOrders → GET /orders (x-api-key)
    notification/ model/ # лента уведомлений (JWT): fetchNotifications + mark(All)Read; «колокольчик» в header, polling 30с в app.component
    moderator/ model/   # CRUD модераторов (GET/POST/DELETE /users)
    shop/      model/   # CRUD справочника магазинов (/shops)
  shared/                       # переиспользуемое, не привязанное к домену
    api/    # axios + bearer()/errMessage()/authToken()
    config/ # API_ORIGIN = 'http://localhost:3000' (база для картинок/аватаров)
```

### Состояние (Redux Toolkit)
- Слайсы (`entities/*/model`): `animal`, `auth`, `favorites`, `orders`, `cart`, `moderators`, `shops`. Асинхронные операции — `createAsyncThunk` + `axios` (общий `bearer/errMessage` из `@/shared/api`). Ключи стора неизменны.
- **Профиль/избранное/корзина** грузятся с бэкенда через `fetchMe` (диспатчится в `app.component` при наличии токена) и сохраняются на бэкенде — переживают выход/вход.
- `cart`: `[{animalId, quantity}]`; операции оптимистичны и сразу персистятся (`saveCart`). `checkout` → `POST /orders` → чистит корзину → `fetchOrders` (история).
- `auth`: `accessToken`, профиль, `apiKey` (нужен для заказов).

### Роутинг и доступ
- `PrivateRoute` пускает на `/` только при наличии `accessToken`, иначе редирект на `/login`.
- `GuestRoute` оборачивает `/login` и `/register` — если уже залогинен, редиректит на `/`.
- **Регистрация** (`registerAuth`) шлёт `POST /api/auth/register` и при успехе так же кладёт токен в `localStorage` + стор (авто-логин). Роль выбирается `Segmented` (Покупатель/Продавец), дата рождения из antd `DatePicker` приводится к `YYYY-MM-DD` перед отправкой. Ошибки бэкенда (напр. занятый email) пробрасываются через `rejectWithValue`.

## Стилизация — важно

- **Tailwind CSS v4** (`@import 'tailwindcss';` в `src/app/styles/index.css`, плагин `@tailwindcss/postcss`). Конфиг — `tailwind.config.js`.
- В v4 модификатор `!important` — **суффиксом**: `w-full!`, `h-72!` (НЕ префиксом `!w-full` — это синтаксис v3).
- Стили задаются **Tailwind-утилитами прямо в JSX**. Проект уходит от `styled-components` и кастомных CSS-классов в пользу Tailwind — при правках приводи стили к Tailwind, не вводи новые `.styled.js`/именованные CSS-классы.
- Компоненты комбинируют **Ant Design + Tailwind** (Tailwind для лейаута/мелких правок поверх antd). Для переопределения стилей antd часто нужен `!` (например `!mb-0`, `w-full!`).
- Тема Ant Design настраивается в `main.jsx` через `ConfigProvider` (`token`). Брендовый цвет — фиолетовый **`#9850fd`** (`colorPrimary`).

## Конвенции
- Компоненты — `.jsx`, файлы slice/thunk/barrel — `.js`. Имена файлов в **kebab-case** (`animal-card.jsx`), экспорты — **именованные** (без `export default`).
- Импорты между слоями FSD — через публичные API слайсов: `@/entities/<x>`, `@/widgets/<x>`, `@/shared/<x>`, `@/pages`, `@/app/store` (не по глубоким путям). Внутри слайса — относительные.
- ESLint (flat-config `eslint.config.js`) + Prettier (`prettier.config.js`). Перед коммитом гонять `npm run lint` / `npm run format`.
- Тексты UI — на русском.
