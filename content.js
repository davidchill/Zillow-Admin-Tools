// ── Zillow Admin Tools – Content Script v2.2 ──
// Injects a floating tab into Zillow pages that expands into a history panel.

(function () {
  'use strict';

  // Avoid duplicate injection on navigation
  if (document.getElementById('zat-host')) return;

  const FONT_URL = chrome.runtime.getURL('fonts/NunitoSans-VariableFont.ttf');
  const ICON_URL = chrome.runtime.getURL('icons/icon48.png');
  const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';

  // ── Shadow Host ──────────────────────────────────────────────────────────
  // Zero-size fixed element so it never affects page layout.
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
    @font-face {
      font-family: 'Nunito Sans';
      src: url('${FONT_URL}') format('truetype');
      font-weight: 200 1000;
      font-style: normal;
      font-display: block;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }

    button {
      cursor: pointer;
      border: none;
      background: none;
    }

    /* ── Floating Tab (FAB) ── */
    .fab {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 52px;
      background: #0f172a;
      border-radius: 10px 0 0 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: -3px 2px 16px rgba(0,0,0,0.3);
      transition: width 0.2s ease, background 0.15s;
      z-index: 2147483646;
    }
    .fab:hover {
      background: #1e293b;
      width: 52px;
    }
    .fab img {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      display: block;
    }

    /* ── Panel ── */
    .panel {
      position: fixed;
      right: 44px;
      top: 50%;
      transform: translateY(-50%) translateX(16px);
      width: 290px;
      max-height: 72vh;
      background: white;
      border-radius: 14px 0 0 14px;
      box-shadow: -6px 0 28px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      z-index: 2147483645;
      overflow: hidden;
      font-family: 'Nunito Sans', system-ui, sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .panel.open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(-50%) translateX(0);
    }

    /* Panel header */
    .panel-header {
      background: #0f172a;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .panel-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel-header img {
      width: 18px;
      height: 18px;
      display: block;
    }
    .panel-title {
      font-size: 14px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.2px;
    }
    .close-btn {
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .close-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      display: block;
    }

    /* Panel body */
    .panel-body {
      overflow-y: auto;
      flex: 1;
      padding: 14px;
    }
    .panel-body::-webkit-scrollbar { width: 4px; }
    .panel-body::-webkit-scrollbar-track { background: transparent; }
    .panel-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

    /* Sections */
    .section + .section { margin-top: 16px; }

    .section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .section-title svg {
      width: 11px;
      height: 11px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }

    /* History items */
    .item {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 9px 10px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
      margin-bottom: 5px;
    }
    .item:last-child { margin-bottom: 0; }
    .item:hover { background: #f1f5f9; }

    .item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .item-id {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
    }
    .item-sub {
      font-size: 10px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-left: 1px;
      margin-top: 1px;
    }
    .ext-icon {
      width: 11px;
      height: 11px;
      fill: none;
      stroke: #cbd5e1;
      stroke-width: 2;
      flex-shrink: 0;
      transition: stroke 0.15s;
    }
    .item:hover .ext-icon { stroke: #3b82f6; }

    /* Badges */
    .badge {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 5px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      flex-shrink: 0;
    }
    .badge-email     { background: #f3e8ff; color: #7c3aed; }
    .badge-zuid      { background: #dbeafe; color: #2563eb; }
    .badge-screenname { background: #dcfce7; color: #16a34a; }
    .badge-zpid      { background: #fef3c7; color: #d97706; }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 14px 0;
      font-size: 12px;
      color: #94a3b8;
    }
  `;
  shadow.appendChild(style);

  // ── FAB ──────────────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.setAttribute('aria-label', 'Zillow Admin Tools');
  fab.innerHTML = `<img src="${ICON_URL}" alt="">`;
  shadow.appendChild(fab);

  // ── Panel ─────────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-left">
        <img src="${ICON_URL}" alt="">
        <span class="panel-title">Zillow Admin Tools</span>
      </div>
      <button class="close-btn" id="zat-close">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="panel-body" id="zat-body"></div>
  `;
  shadow.appendChild(panel);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildImpersonateUrl(method, value) {
    const p = new URLSearchParams();
    if (method === 'email') {
      p.set('pEmail', value); p.set('email', value);
    } else if (method === 'zuid') {
      p.set('pZuid', value); p.set('zuid', value);
      p.set('action', 'impersonate'); p.set('confirm', '1');
    } else {
      p.set('pScreenName', value); p.set('screenName', value);
    }
    return IMPERSONATE_BASE + '?' + p.toString();
  }

  // ── Render history items ──────────────────────────────────────────────────
  function renderItems(items, type) {
    if (!items.length) {
      return `<div class="empty">No recent ${type === 'zpid' ? 'properties' : 'impersonations'}</div>`;
    }
    return items.map(item => {
      const isZpid = item.type === 'zpid';
      const badgeClass = isZpid ? 'badge-zpid' : ('badge-' + (item.method || 'zuid'));
      const badgeText  = isZpid ? 'ZPID' : (item.method === 'screenname' ? 'Screen' : (item.method || 'ZUID').toUpperCase());
      const url = isZpid
        ? `https://www.zillow.com/homedetails/${encodeURIComponent(item.id)}_zpid/`
        : buildImpersonateUrl(item.method, item.id);
      const sub = item.label
        ? `<div class="item-sub">${escapeHtml(item.label)}</div>`
        : '';
      return `
        <button class="item" data-url="${escapeHtml(url)}">
          <div class="item-top">
            <span class="item-id">
              <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
              ${escapeHtml(item.id)}
            </span>
            <svg class="ext-icon" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
          ${sub}
        </button>`;
    }).join('');
  }

  // ── Load and render panel contents ────────────────────────────────────────
  function loadAndRender() {
    chrome.storage.local.get(['zillow_history_v3', 'zillow_settings'], data => {
      const settings   = data.zillow_settings   || {};
      const history    = data.zillow_history_v3 || [];
      const limit      = settings.historyLimit  || 5;
      const showZpid   = settings.zpidTabEnabled !== false;

      const imps  = history.filter(h => h.type === 'impersonate').slice(0, limit);
      const zpids = history.filter(h => h.type === 'zpid').slice(0, limit);

      const body = shadow.getElementById('zat-body');

      let html = `
        <div class="section">
          <div class="section-title">
            <svg viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Recent Impersonations
          </div>
          ${renderItems(imps, 'impersonate')}
        </div>
      `;

      if (showZpid) {
        html += `
          <div class="section">
            <div class="section-title">
              <svg viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Recent Properties
            </div>
            ${renderItems(zpids, 'zpid')}
          </div>
        `;
      }

      body.innerHTML = html;

      // Attach click handlers after render
      body.querySelectorAll('.item').forEach(btn => {
        btn.addEventListener('click', () => {
          window.open(btn.dataset.url, '_blank');
        });
      });
    });
  }

  // ── Open / Close ──────────────────────────────────────────────────────────
  let isOpen = false;

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    loadAndRender();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
  }

  fab.addEventListener('click', e => {
    e.stopPropagation();
    isOpen ? closePanel() : openPanel();
  });

  shadow.getElementById('zat-close').addEventListener('click', closePanel);

  // Close when clicking anywhere outside the panel or fab
  document.addEventListener('click', e => {
    if (!isOpen) return;
    if (!e.composedPath().some(el => el === fab || el === panel)) {
      closePanel();
    }
  });

  // Auto-refresh panel when storage changes (e.g. popup adds a history item)
  chrome.storage.onChanged.addListener(changes => {
    if (isOpen && (changes.zillow_history_v3 || changes.zillow_settings)) {
      loadAndRender();
    }
  });

})();
