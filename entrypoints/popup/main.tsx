import { createRoot } from 'react-dom/client';
import App from '@/components/App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/assets/globals.css';

const root = document.getElementById('root')!;
createRoot(root).render(
  <ErrorBoundary>
    <App surface="popup" />
  </ErrorBoundary>
);
