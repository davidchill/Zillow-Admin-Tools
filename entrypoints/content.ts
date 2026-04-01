// ── Zillow Admin Tools – Content Script ──
// Injects a floating action button (FAB) on every page to toggle the Side Panel.
// Also tracks Zillow property page views for the "Recently Viewed" history.

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',

  main(ctx) {
    // ── Property view tracking ───────────────────────────────────────────────

    function doTrackView(viewedZpid: string) {
      const title = document.title || '';
      const cutIdx =
        title.indexOf(' |') > 0
          ? title.indexOf(' |')
          : title.indexOf(' -') > 0
          ? title.indexOf(' -')
          : -1;
      const label =
        cutIdx > 0 ? title.substring(0, cutIdx).trim() : title;

      chrome.storage.local.get(
        ['zillow_history_v3', 'zillow_viewed_v3', 'zillow_settings'],
        (data) => {
          const settings =
            (data.zillow_settings as Record<string, unknown>) || {};
          const limit = Math.min(
            20,
            Math.max(5, (settings.historyLimit as number) || 5)
          );
          const searched: Array<{ type: string; id: string }> =
            data.zillow_history_v3 || [];
          const viewed: Array<{
            id: string;
            type: string;
            method: string;
            label: string;
            timestamp: number;
          }> = data.zillow_viewed_v3 || [];

          if (settings.historyEnabled === false) return;
          if (searched.some((h) => h.type === 'zpid' && h.id === viewedZpid))
            return;

          const existingIdx = viewed.findIndex((h) => h.id === viewedZpid);
          let updated;

          if (existingIdx >= 0) {
            const entry = {
              ...viewed[existingIdx],
              timestamp: Date.now(),
              label: label || viewed[existingIdx].label,
            };
            updated = [entry]
              .concat(viewed.filter((_, i) => i !== existingIdx))
              .slice(0, limit);
          } else {
            updated = [
              {
                type: 'viewed',
                id: viewedZpid,
                method: 'viewed',
                label,
                timestamp: Date.now(),
              },
            ]
              .concat(viewed)
              .slice(0, limit);
          }

          chrome.storage.local.set({ zillow_viewed_v3: updated });
        }
      );
    }

    function checkAndTrackZpid() {
      if (window.location.hostname !== 'www.zillow.com') return;
      const match = window.location.pathname.match(
        /\/homedetails\/[^?]*\/(\d+)_zpid(?:\/|$)/i
      );
      if (!match) return;
      const viewedZpid = match[1];
      setTimeout(() => doTrackView(viewedZpid), 1500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndTrackZpid);
    } else {
      checkAndTrackZpid();
    }

    chrome.runtime.onMessage.addListener((msg: { action?: string; zpid?: string }) => {
      if (msg.action !== 'trackZpid') return;
      setTimeout(() => doTrackView(msg.zpid!), 1500);
    });

    // ── FAB Injection ────────────────────────────────────────────────────────
    // Avoid duplicate injection on SPA navigation
    if (document.getElementById('zat-host')) return;

    const ICON_URL = chrome.runtime.getURL('icons/icon48.png');

    const host = document.createElement('div');
    host.id = 'zat-host';
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
    });
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      button { cursor: pointer; border: none; background: none; }

      .fab {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 33px;
        height: 39px;
        background: #0f172a;
        border-radius: 8px 0 0 8px;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: -3px 2px 16px rgba(0,0,0,0.3);
        transition: width 0.2s ease, background 0.15s;
        z-index: 2147483646;
      }
      .fab:hover { background: #1e293b; width: 39px; }
      .fab.dragging { cursor: grabbing; transition: background 0.15s; }
      .fab img { width: 16px; height: 16px; flex-shrink: 0; display: block; }
    `;
    shadow.appendChild(style);

    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'Open/Close Zillow Admin Tools');
    fab.innerHTML = `<img src="${ICON_URL}" alt="">`;
    fab.style.display = 'none';
    shadow.appendChild(fab);

    // ── Drag ────────────────────────────────────────────────────────────────
    const FAB_H = 39;
    let fabTopPx = window.innerHeight / 2;
    let isDragging = false;
    let didDrag = false;
    let dragStartY = 0;
    let dragStartTop = 0;

    function applyPosition(topPx: number): number {
      const clamped = Math.max(
        FAB_H / 2,
        Math.min(window.innerHeight - FAB_H / 2, topPx)
      );
      fab.style.top = clamped + 'px';
      fab.style.transform = 'translateY(-50%)';
      return clamped;
    }

    chrome.storage.local.get(['zillow_settings', 'zat_fab_top'], (data) => {
      const s = (data.zillow_settings as Record<string, unknown>) || {};
      if (s.floatingTabEnabled === false) return;
      fab.style.display = 'flex';
      fabTopPx = (data.zat_fab_top as number) || window.innerHeight / 2;
      applyPosition(fabTopPx);
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.zillow_settings) {
        const newSettings =
          (changes.zillow_settings.newValue as Record<string, unknown>) || {};
        fab.style.display =
          newSettings.floatingTabEnabled === false ? 'none' : 'flex';
      }
    });

    fab.addEventListener('mousedown', (e) => {
      isDragging = true;
      didDrag = false;
      dragStartY = e.clientY;
      dragStartTop = fabTopPx;
      fab.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener(
      'mousemove',
      (e) => {
        if (!isDragging) return;
        const delta = e.clientY - dragStartY;
        if (Math.abs(delta) > 3) didDrag = true;
        fabTopPx = applyPosition(dragStartTop + delta);
      },
      { passive: true, signal: ctx.signal }
    );

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      fab.classList.remove('dragging');
      if (didDrag) {
        chrome.storage.local.set({ zat_fab_top: fabTopPx });
      }
    }, { signal: ctx.signal });

    fab.addEventListener('click', (e) => {
      if (didDrag) return;
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
        void chrome.runtime.lastError;
      });
    });
  },
});
