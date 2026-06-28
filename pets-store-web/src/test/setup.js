// Глобальная настройка Vitest: jest-dom матчеры (toBeInTheDocument и т.п.),
// авто-очистка React Testing Library и сброс localStorage/моков между тестами.
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
});
