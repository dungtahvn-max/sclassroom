import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "Cannot set property fetch of #<Window> which has only a getter"
// This can happen if a library tries to polyfill fetch in an environment where it's read-only.
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
