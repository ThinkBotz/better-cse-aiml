import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPWAAutoUpdate } from './pwaUpdateManager';

// Initialize automatic PWA updates for iOS Home Screen, Android PWA/APK & browsers
initPWAAutoUpdate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
