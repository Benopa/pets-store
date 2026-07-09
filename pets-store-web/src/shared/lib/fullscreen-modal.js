// Пропсы antd Modal для полноэкранного режима на мобильной версии: модалка
// раскрывается от края до края (без отступов и скруглений) и минимум на высоту
// экрана; длинный контент прокручивается стандартным скроллом обёртки Modal.
// centerBody — контент центрируется по вертикали (для просмотровых модалок,
// где контента меньше экрана); длинному контенту центрирование не мешает —
// body растёт вместе с ним. На десктопе возвращает пустой объект.
export const fullscreenModalProps = (isMobile, { centerBody = false } = {}) =>
  isMobile
    ? {
        // 100% от обёртки, а не 100vw: vw включает полосу прокрутки обёртки,
        // из-за чего появлялся горизонтальный скролл.
        width: '100%',
        style: { top: 0, margin: 0, maxWidth: '100%', paddingBottom: 0 },
        // Панель модалки в antd 6 — семантический ключ `container` (бывший `content`).
        // container — flex-колонка, body растягивается: при коротком контенте
        // футер с кнопками прижат к низу экрана.
        styles: {
          container: {
            minHeight: '100dvh',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
          },
          body: {
            flex: 1,
            ...(centerBody && {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }),
          },
        },
      }
    : {};
