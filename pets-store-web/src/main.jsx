import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app';
import '@/app/styles/index.css';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { App as AntApp, ConfigProvider } from 'antd';

ReactDOM.createRoot(document.getElementById('app')).render(
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
  </ConfigProvider>,
);
