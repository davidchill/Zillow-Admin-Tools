// ── Zillow Admin Tools – Content Script v2.5 ──
// Injects a floating tab on every page that opens the Chrome Side Panel.

(function () {
  'use strict';

  // Avoid duplicate injection on navigation
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
  fab.setAttribute('aria-label', 'Open Zillow Admin Tools');
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
  });

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
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });

})();
