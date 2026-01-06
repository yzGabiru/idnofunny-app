import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setupIonicReact } from '@ionic/react';

// FIX: Expose React globally for libraries that expect it (like react-filerobot-image-editor)
window.React = React;

// --- HACK: Filter out noisy styled-components warnings from the library ---
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && (
    msg.includes('looks like an unknown prop') || 
    msg.includes('Received `false` for a non-boolean attribute') ||
    msg.includes('Received `true` for a non-boolean attribute') ||
    msg.includes('React does not recognize the') ||
    msg.includes('prop on a DOM element')
  )) {
    return;
  }
  originalConsoleError(...args);
};
// --------------------------------------------------------------------------

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Inicializa o Ionic */
setupIonicReact({
  mode: 'md' // Força modo Material Design para melhor controle de estilos
});

// Força modo escuro globalmente
document.body.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)