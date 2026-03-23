// ── Zillow Admin Tools – Content Script v2.6 ──
// Injects a floating tab on every page that opens the Chrome Side Panel.
// Also tracks Zillow property page views for the "Recently Viewed" history.

(function () {
  'use strict';

  // ── Property view tracking ───────────────────────────────────────────────
  // Runs on every injection (before FAB dedup check) so re-visits are captured.
  // Match both URL formats:
  //   Modern: /homedetails/123-Main-St-Seattle-WA-98101/29122711_zpid/
  //   Legacy: /homedetails/123-Main-St_29122711_zpid/
  const zpidMatch = window.location.hostname === 'www.zillow.com'
    && window.location.pathname.match(/\/homedetails\/[^?]*\/(\d+)_zpid(?:\/|$)/i);

  if (zpidMatch) {
    const viewedZpid = zpidMatch[1];

    function doTrackView() {
      // Extract address from page title: "123 Main St, City, ST | Zillow" → "123 Main St, City, ST"
      const title    = document.title || '';
      const cutIdx   = title.indexOf(' |') > 0 ? title.indexOf(' |') : (title.indexOf(' -') > 0 ? title.indexOf(' -') : -1);
      const label    = cutIdx > 0 ? title.substring(0, cutIdx).trim() : title;

      chrome.storage.local.get(['zillow_history_v3', 'zillow_viewed_v3', 'zillow_settings'], data => {
        const settings = data.zillow_settings || {};
        const limit    = Math.min(20, Math.max(5, settings.historyLimit || 5));
        const searched = data.zillow_history_v3 || [];
        const viewed   = data.zillow_viewed_v3   || [];

        // Don't track if history recording is disabled
        if (settings.historyEnabled === false) return;

        // Don't track if already in searched history (avoid duplication)
        if (searched.some(h => h.type === 'zpid' && h.id === viewedZpid)) return;

        const existingIdx = viewed.findIndex(h => h.id === viewedZpid);
        let updated;

        if (existingIdx >= 0) {
          // Move to top, refresh label and timestamp
          const entry = { ...viewed[existingIdx], timestamp: Date.now(), label: label || viewed[existingIdx].label };
          updated = [entry].concat(viewed.filter((_, i) => i !== existingIdx)).slice(0, limit);
        } else {
          updated = [{ type: 'viewed', id: viewedZpid, method: 'viewed', label, timestamp: Date.now() }]
            .concat(viewed).slice(0, limit);
        }

        chrome.storage.local.set({ zillow_viewed_v3: updated });
      });
    }

    // Wait for title to settle (Zillow SPA updates it after initial render)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(doTrackView, 1500));
    } else {
      setTimeout(doTrackView, 1500);
    }
  }

  // Avoid duplicate FAB injection on navigation
  if (document.getElementById('zat-host')) return;

  const ICON_URL = chrome.runtime.getURL('icons/icon48.png');

  // ── Shadow Host ──────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'zat-host';
  Object.assign(host.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647'
  });
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ── Styles ───────────────────────────────────────────────────────────────
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
    .fab:hover {
      background: #1e293b;
      width: 39px;
    }
    .fab.dragging {
      cursor: grabbing;
      transition: background 0.15s;
    }
    .fab img {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      display: block;
    }
  `;
  shadow.appendChild(style);

  // ── FAB ──────────────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.setAttribute('aria-label', 'Open/Close Zillow Admin Tools');
  fab.innerHTML = `<img src="${ICON_URL}" alt="">`;
  fab.style.display = 'none'; // hidden until settings are checked
  shadow.appendChild(fab);

  // ── Vertical drag ─────────────────────────────────────────────────────────
  const FAB_H = 39;
  let fabTopPx = window.innerHeight / 2;
  let isDragging = false;
  let didDrag = false;
  let dragStartY = 0;
  let dragStartTop = 0;

  function applyPosition(topPx) {
    const clamped = Math.max(FAB_H / 2, Math.min(window.innerHeight - FAB_H / 2, topPx));
    fab.style.top = clamped + 'px';
    fab.style.transform = 'translateY(-50%)';
    return clamped;
  }

  // Load saved position and check floatingTabEnabled setting
  chrome.storage.local.get(['zillow_settings', 'zat_fab_top'], data => {
    const s = data.zillow_settings || {};
    if (s.floatingTabEnabled === false) return; // stay hidden
    fab.style.display = 'flex';
    fabTopPx = data.zat_fab_top || window.innerHeight / 2;
    applyPosition(fabTopPx);
  });

  // React to setting changes without a page reload
  chrome.storage.onChanged.addListener(changes => {
    if (changes.zillow_settings) {
      const newSettings = changes.zillow_settings.newValue || {};
      fab.style.display = newSettings.floatingTabEnabled === false ? 'none' : 'flex';
    }
  });

  fab.addEventListener('mousedown', e => {
    isDragging = true;
    didDrag = false;
    dragStartY = e.clientY;
    dragStartTop = fabTopPx;
    fab.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY;
    if (Math.abs(delta) > 3) didDrag = true;
    fabTopPx = applyPosition(dragStartTop + delta);
  }, { passive: true });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    fab.classList.remove('dragging');
    if (didDrag) {
      chrome.storage.local.set({ zat_fab_top: fabTopPx });
    }
  });

  // ── Click: open Side Panel via background.js ──────────────────────────────
  fab.addEventListener('click', e => {
    if (didDrag) return;
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
      void chrome.runtime.lastError; // suppress "receiving end does not exist" if SW is sleeping
    });
  });

})();
