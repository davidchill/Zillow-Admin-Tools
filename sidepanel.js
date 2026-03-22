// ── Zillow Admin Tools – Side Panel v2.4 ──

const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';

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

function renderItems(items, type) {
  if (!items.length) {
    return `<div class="empty">No recent ${type === 'zpid' ? 'properties' : 'impersonations'}</div>`;
  }
  return items.map(item => {
    const isZpid     = item.type === 'zpid';
    const badgeClass = isZpid ? 'badge-zpid' : ('badge-' + (item.method || 'zuid'));
    const badgeText  = isZpid ? 'ZPID' : (item.method === 'screenname' ? 'Screen' : (item.method || 'ZUID').toUpperCase());
    const url        = isZpid
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

function renderPanel() {
  chrome.storage.local.get(['zillow_history_v3', 'zillow_settings'], data => {
    const settings = data.zillow_settings   || {};
    const history  = data.zillow_history_v3 || [];
    const limit    = settings.historyLimit  || 5;
    const showZpid = settings.zpidTabEnabled !== false;

    const imps  = history.filter(h => h.type === 'impersonate').slice(0, limit);
    const zpids = history.filter(h => h.type === 'zpid').slice(0, limit);

    const body = document.getElementById('panel-body');

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

    body.querySelectorAll('.item').forEach(btn => {
      btn.addEventListener('click', () => {
        chrome.tabs.create({ url: btn.dataset.url });
      });
    });
  });
}

// Initial render
document.addEventListener('DOMContentLoaded', renderPanel);

// Auto-refresh when history or settings change
chrome.storage.onChanged.addListener(changes => {
  if (changes.zillow_history_v3 || changes.zillow_settings) {
    renderPanel();
  }
});
