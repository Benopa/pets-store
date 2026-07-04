import { useEffect, useState } from 'react';

// Мобильная ширина — до md-брейкпоинта Tailwind (768px), тем же порогом, что и
// max-md:/md: в разметке. Нужен, когда от ширины зависит поведение, а не только
// стили (напр. открыть календарь в Drawer вместо обычного поповера).
const MOBILE_QUERY = '(max-width: 767.98px)';

export const useIsMobile = () => {
  // Читаем matchMedia синхронно при инициализации — на десктопе не мигаем мобильной версткой.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    // Начальное значение уже прочитано в useState; здесь только следим за изменениями ширины.
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (event) => setIsMobile(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};
