import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global interceptor: Redirect "soho_user" storage calls to sessionStorage
// to isolate user login sessions per browser tab (enables multi-role local testing)
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.getItem = function (key: string) {
  if (key === "soho_user") {
    return sessionStorage.getItem(key);
  }
  return originalGetItem(key);
};

localStorage.setItem = function (key: string, value: string) {
  if (key === "soho_user") {
    sessionStorage.setItem(key, value);
    return;
  }
  originalSetItem(key, value);
};

localStorage.removeItem = function (key: string) {
  if (key === "soho_user") {
    sessionStorage.removeItem(key);
    return;
  }
  originalRemoveItem(key);
};

document.title = "SOHO PERFUME";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
