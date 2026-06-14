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

Feature-ориентированная структура, в каждой папке есть `index.js` (barrel-реэкспорт). Алиас **`@` → `src`** (`vite.config.js`).

```
src/
  main.jsx             # точка входа: Provider (redux), BrowserRouter, antd ConfigProvider (тема)
  app/app.component.jsx# роуты + HOC PrivateRoute/GuestRoute, начальная загрузка данных
  store/index.js       # configureStore: { animal, auth, favorites, orders, cart }
  features/
    header/            # шапка (badge корзины из state.cart, переход на /cart и /account)
    animal/model/      # redux-логика (все слайсы под animal/model, реэкспорт через барели):
      animal/          #   animal.slice.js, animal.thunks.js (fetchAnimals, fetchCategories)
      auth/            #   auth.slice.js, auth.thunk.js (login/register/fetchMe/updateProfile/changePassword/uploadAvatar)
      favorites/       #   favorites.slice + thunk (toggleFavorite → PUT /auth/me/favorites)
      orders/          #   orders.slice + thunk (fetchOrders → GET /orders по x-api-key)
      cart/            #   cart.slice + thunk (addToCart/setCartQty/removeFromCart/clearCart/checkout → PUT /auth/me/cart, POST /orders)
  pages/
    home/              # home.page.jsx + components/ (animal-card, filter, photo-gallery)
    login/ register/   # вход / регистрация (покупатель/продавец)
    account/           # личный кабинет: components/ (contact-form, favorites-grid, purchase-history)
    cart/              # cart.page.jsx — корзина + «Итог заказа» + оформление
```

### Состояние (Redux Toolkit)
- Слайсы: `animal`, `auth`, `favorites`, `orders`, `cart`. Асинхронные операции — `createAsyncThunk` + `axios`.
- **Профиль/избранное/корзина** грузятся с бэкенда через `fetchMe` (диспатчится в `app.component` при наличии токена) и сохраняются на бэкенде — переживают выход/вход.
- `cart`: `[{animalId, quantity}]`; операции оптимистичны и сразу персистятся (`saveCart`). `checkout` → `POST /orders` → чистит корзину → `fetchOrders` (история).
- `auth`: `accessToken`, профиль, `apiKey` (нужен для заказов).

### Роутинг и доступ
- `PrivateRoute` пускает на `/` только при наличии `accessToken`, иначе редирект на `/login`.
- `GuestRoute` оборачивает `/login` и `/register` — если уже залогинен, редиректит на `/`.
- **Регистрация** (`registerAuth`) шлёт `POST /api/auth/register` и при успехе так же кладёт токен в `localStorage` + стор (авто-логин). Роль выбирается `Segmented` (Покупатель/Продавец), дата рождения из antd `DatePicker` приводится к `YYYY-MM-DD` перед отправкой. Ошибки бэкенда (напр. занятый email) пробрасываются через `rejectWithValue`.

## Стилизация — важно

- **Tailwind CSS v4** (`@import 'tailwindcss';` в `src/index.css`, плагин `@tailwindcss/postcss`). Конфиг — `tailwind.config.js`.
- В v4 модификатор `!important` — **суффиксом**: `w-full!`, `h-72!` (НЕ префиксом `!w-full` — это синтаксис v3).
- Стили задаются **Tailwind-утилитами прямо в JSX**. Проект уходит от `styled-components` и кастомных CSS-классов в пользу Tailwind — при правках приводи стили к Tailwind, не вводи новые `.styled.js`/именованные CSS-классы.
- Компоненты комбинируют **Ant Design + Tailwind** (Tailwind для лейаута/мелких правок поверх antd). Для переопределения стилей antd часто нужен `!` (например `!mb-0`, `w-full!`).
- Тема Ant Design настраивается в `main.jsx` через `ConfigProvider` (`token`). Брендовый цвет — фиолетовый **`#9850fd`** (`colorPrimary`).

## Конвенции
- Компоненты — `.jsx`, файлы slice/thunk/barrel — `.js`. Имена файлов в **kebab-case** (`animal-card.jsx`), экспорты — **именованные** (без `export default`).
- Импорты между фичами — через barrel'ы (`from '../features'`, `from '@/store'`), а не по глубоким путям.
- ESLint (flat-config `eslint.config.js`) + Prettier (`prettier.config.js`). Перед коммитом гонять `npm run lint` / `npm run format`.
- Тексты UI — на русском.
