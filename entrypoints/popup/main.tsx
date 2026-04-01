import { createRoot } from 'react-dom/client';
import App from '@/components/App';
import '@/assets/globals.css';

const root = document.getElementById('root')!;
createRoot(root).render(<App surface="popup" />);
