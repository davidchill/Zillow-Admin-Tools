import { createRoot } from 'react-dom/client';
import App from '@/components/App';
import '@/assets/globals.css';

// Connect a named port so background.js can track whether the side panel is open.
// Reconnects automatically if the service worker is killed and revived.
function connectPort() {
  chrome.windows.getCurrent({ populate: false }, (win) => {
    if (!win?.id) return;
    const port = chrome.runtime.connect({ name: `zat-sidepanel-${win.id}` });
    port.onDisconnect.addListener(() => {
      // Reconnect after a short delay in case the SW restarted
      setTimeout(connectPort, 1000);
    });
  });
}
connectPort();

const root = document.getElementById('root')!;
createRoot(root).render(<App surface="sidepanel" />);
