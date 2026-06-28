import { defineConfig } from 'cypress';

// E2E-тесты гоняются против запущенного фронта (Vite на :5173) + бэка (Nest на :3000) + Postgres.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    // Бэкенд для прямых API-запросов из команд (логин/регистрация) — без vite-прокси.
    env: { apiUrl: 'http://localhost:3000' },
  },
});
