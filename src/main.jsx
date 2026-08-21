import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Automatically recover from Vite Chunk Load Errors and Service Worker Stale Module script crashes
window.addEventListener('error', (e) => {
  const isChunkError = /chunk|dynamically\s+imported\s+module|failed\s+to\s+load\s+module|mime/i.test(e.message || '') || 
                       (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK'));
  if (isChunkError) {
    console.warn('Stale assets or script load error detected. Triggering hard reload...');
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const isChunkError = /chunk|dynamically\s+imported\s+module|failed\s+to\s+load\s+module/i.test(e.reason?.toString() || '');
  if (isChunkError) {
    console.warn('Unhandled chunk rejection detected. Triggering hard reload...');
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('PWA Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('PWA Service Worker registration failed:', err));
  });
}
