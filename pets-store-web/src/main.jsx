import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app';
import './index.css';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ConfigProvider } from 'antd';

ReactDOM.createRoot(document.getElementById('app')).render(
  <ConfigProvider
    theme={{
      components: {
        Button: {
          colorPrimary: '#9850fa',
          borderRadius: 8,
        },
        Tag: {
          defaultColor: '#9850fd',
          defaultBg: '#9850fd2d',
        },
      },
      cssVars: true,
      token: {
        colorPrimary: '#9850fd',
        colorInfo: '#9850fd',
        colorError: '#b80306',
        colorSuccess: '#6af624',
      },
    }}
  >
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
    ,
  </ConfigProvider>,
);
