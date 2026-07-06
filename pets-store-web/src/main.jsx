import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app';
import '@/app/styles/index.css';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { App as AntApp, ConfigProvider } from 'antd';
import { useIsMobile } from '@/shared/lib';

// На мобильной ширине поднимаем базовый размер шрифта antd на ~15% (14 → 16).
// От него antd пересчитывает всю типографику и размеры иконок внутри компонентов
// (кнопки, поля, дроверы, модалки), поэтому текст и иконки крупнее по всему мобильному UI.
const Root = () => {
  const isMobile = useIsMobile();
  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            borderRadiusLG: 14,
          },
          Button: {
            borderRadius: 8,
          },
        },
        cssVars: true,
        token: {
          colorPrimary: '#9850fd',
          colorInfo: '#9850fd',
          colorError: '#b80306',
          colorSuccess: '#52c41a',
          borderRadius: 10,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: isMobile ? 16 : 14,
        },
      }}
    >
      <AntApp>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </AntApp>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('app')).render(<Root />);
