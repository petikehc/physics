import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import './styles/global.css';
import './app/gsap';
import { App } from './app/App';

// On GitHub Pages, a deep link (e.g. /play/circle-area) is answered by 404.html, which sends it here as
// ?redirect=<path>. Put the real path back before the router reads it.
const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect !== null) window.history.replaceState(null, '', import.meta.env.BASE_URL + redirect);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
