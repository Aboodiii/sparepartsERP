import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css'; // Ant Design's base styles
import App from './App.jsx';

// A small, intentional brand touch: deep green primary (a nod to Ethiopia),
// applied through Ant Design's theme tokens so the whole app stays consistent.
const theme = {
  token: {
    colorPrimary: '#0f7b3f',
    borderRadius: 8,
    fontSize: 14,
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
