// Origin бэкенда — для прямой загрузки картинок/аватаров мимо vite-прокси (/api).
// Используется при формировании абсолютных URL: `${API_ORIGIN}${img.url}`.
// В dev по умолчанию http://localhost:3000; в прод-сборке (Docker) задаём
// VITE_API_ORIGIN="" — картинки идут на относительный /uploads/..., который
// nginx проксирует на backend (один origin, без CORS).
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:3000';
