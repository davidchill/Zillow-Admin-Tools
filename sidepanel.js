// ── Zillow Admin Tools – Side Panel v2.5 ──

const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';

// ── State ────────────────────────────────────────────────────────────────────
let currentTab     = 'impersonate';
let currentMode    = 'auto';
let spHistory      = [];
let spSettings     = { historyLimit: 5, zpidTabEnabled: true };
let pendingConfirm = null;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const spTabsEl     = document.getElementById('sp-tabs');
const spTabImp     = document.getElementById('sp-tab-imp');
const spTabZpid    = document.getElementById('sp-tab-zpid');
const spModeRow    = document.getElementById('sp-mode-row');
const spModeBtns   = spModeRow.querySelectorAll('.mode-btn');
const spInputLabel = document.getElementById('sp-input-label');
const spInput      = document.getElementById('sp-input');
const spGoBtn      = document.getElementById('sp-go-btn');
const spErrorMsg   = document.getElementById('sp-error-msg');
const spConfirmBar = document.getElementById('sp-confirm-bar');
const spConfirmTxt = document.getElementById('sp-confirm-text');
const spConfirmYes = document.getElementById('sp-confirm-yes');
const spConfirmNo  = document.getElementById('sp-confirm-no');
const spHistoryEl  = document.getElementById('sp-history');

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateEmail(email) {
  return /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i.test(email);
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

function detectMethod(input) {
  if (input.includes('@')) {
    return validateEmail(input) ? { method: 'email', value: input } : { error: 'Invalid email address.' };
  }
  if (/^\d+$/.test(input)) return { method: 'zuid', value: input };
  return { method: 'screenname', value: input };
}

// ── Storage ──────────────────────────────────────────────────────────────────
function loadFromStorage() {
  chrome.storage.local.get(['zillow_history_v3', 'zillow_settings'], data => {
    if (data.zillow_settings) {
      spSettings = data.zillow_settings;
      if (typeof spSettings.zpidTabEnabled === 'undefined') spSettings.zpidTabEnabled = true;
    }
    if (data.zillow_history_v3) {
      spHistory = data.zillow_history_v3;
    }
    applyZpidTabVisibility();
    renderHistory();
  });
}

function saveHistory() {
  chrome.storage.local.set({ zillow_history_v3: spHistory });
}

function requestScrape(tabId, historyId, historyType) {
  chrome.runtime.sendMessage({
    action: 'scrapeTab',
    tabId: tabId,
    historyId: historyId,
    historyType: historyType
  });
}

// ── ZPID tab visibility ───────────────────────────────────────────────────────
function applyZpidTabVisibility() {
  const show = spSettings.zpidTabEnabled !== false;
  spTabZpid.classList.toggle('hidden', !show);
  spTabsEl.classList.toggle('hidden', !show);
  if (!show && currentTab === 'zpid') {
    switchSearchTab('impersonate');
  }
}

// ── Search tab switching ──────────────────────────────────────────────────────
function switchSearchTab(tab) {
  currentTab = tab;
  spTabImp.classList.toggle('active', tab === 'impersonate');
  spTabZpid.classList.toggle('active', tab === 'zpid');
  spModeRow.classList.toggle('hidden', tab === 'zpid');
  spInput.value = '';
  spErrorMsg.textContent = '';
  spInput.classList.remove('has-error');
  hideConfirm();
  if (tab === 'zpid') {
    spInputLabel.textContent = 'Property ID (ZPID)';
    spInput.placeholder = 'e.g. 29122711';
  } else {
    updateImpersonateLabels();
  }
}

function updateImpersonateLabels() {
  const labels = {
    auto:       'Email, ZUID, or Screen Name',
    email:      'Email Address',
    zuid:       'User ID (ZUID)',
    screenname: 'Screen Name'
  };
  const placeholders = {
    auto:       'Email, ZUID, or Screen Name',
    email:      'e.g. user@example.com',
    zuid:       'e.g. 12345678',
    screenname: 'e.g. johndoe42'
  };
  spInputLabel.textContent = labels[currentMode];
  spInput.placeholder      = placeholders[currentMode];
}

// ── Mode switching ────────────────────────────────────────────────────────────
function switchMode(btn) {
  currentMode = btn.dataset.mode;
  spModeBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  spErrorMsg.textContent = '';
  spInput.classList.remove('has-error');
  hideConfirm();
  updateImpersonateLabels();
}

// ── Confirm bar ───────────────────────────────────────────────────────────────
function showConfirm(method, value) {
  const labels = { email: 'Email', zuid: 'ZUID', screenname: 'Screen Name' };
  pendingConfirm = { method, value };
  spConfirmTxt.innerHTML = 'Detected: <strong>' + escapeHtml(labels[method]) + '</strong> &mdash; &ldquo;' + escapeHtml(value) + '&rdquo;';
  spConfirmBar.classList.remove('hidden');
}

function hideConfirm() {
  pendingConfirm = null;
  spConfirmBar.classList.add('hidden');
}

// ── Error ─────────────────────────────────────────────────────────────────────
function showError(msg) {
  spErrorMsg.textContent = msg;
  spInput.classList.add('has-error');
}

// ── Search / Go ───────────────────────────────────────────────────────────────
function doSearch() {
  const raw = spInput.value.trim();
  if (!raw) return;
  spErrorMsg.textContent = '';
  spInput.classList.remove('has-error');
  hideConfirm();

  if (currentTab === 'zpid') {
    const cleanId = raw.replace(/\D/g, '');
    if (!cleanId) return;
    const url = 'https://www.zillow.com/homedetails/' + cleanId + '_zpid/';
    chrome.tabs.create({ url }, tab => { requestScrape(tab.id, cleanId, 'zpid'); });
    addToHistory('zpid', cleanId, 'zpid');
    spInput.value = '';
    return;
  }

  // Impersonate
  if (currentMode === 'auto') {
    const detected = detectMethod(raw);
    if (detected.error) { showError(detected.error); return; }
    showConfirm(detected.method, detected.value);
    return;
  }

  const method = currentMode;
  const value  = raw;
  if (method === 'email' && !validateEmail(value)) { showError('Please enter a valid email address.'); return; }
  if (method === 'zuid'  && !/^\d+$/.test(value))  { showError('ZUID must be numeric.'); return; }
  executeImpersonate(method, value);
  spInput.value = '';
}

function executeImpersonate(method, value) {
  const url = buildImpersonateUrl(method, value);
  chrome.tabs.create({ url }, tab => { requestScrape(tab.id, value, 'impersonate'); });
  addToHistory('impersonate', value, method);
}

// ── History ───────────────────────────────────────────────────────────────────
function addToHistory(type, id, method) {
  const limit = spSettings.historyLimit || 5;
  spHistory = [
    { type, id, method, label: '', timestamp: Date.now() }
  ].concat(
    spHistory.filter(h => !(h.id === id && h.type === type))
  ).slice(0, limit);
  saveHistory();
  renderHistory();
}

function buildItemHtml(item) {
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
}

function renderHistory() {
  const limit    = spSettings.historyLimit || 5;
  const showZpid = spSettings.zpidTabEnabled !== false;

  const imps  = spHistory.filter(h => h.type === 'impersonate').slice(0, limit);
  const zpids = spHistory.filter(h => h.type === 'zpid').slice(0, limit);

  const impHtml = imps.length
    ? imps.map(buildItemHtml).join('')
    : '<div class="empty">No recent impersonations</div>';

  let html = `
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Recent Impersonations
      </div>
      ${impHtml}
    </div>`;

  if (showZpid) {
    const zpidHtml = zpids.length
      ? zpids.map(buildItemHtml).join('')
      : '<div class="empty">No recent properties</div>';
    html += `
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Recent Properties
        </div>
        ${zpidHtml}
      </div>`;
  }

  spHistoryEl.innerHTML = html;

  spHistoryEl.querySelectorAll('.item').forEach(btn => {
    btn.addEventListener('click', () => { chrome.tabs.create({ url: btn.dataset.url }); });
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────
spTabImp.addEventListener('click',  () => switchSearchTab('impersonate'));
spTabZpid.addEventListener('click', () => switchSearchTab('zpid'));

spModeBtns.forEach(btn => btn.addEventListener('click', () => switchMode(btn)));

spGoBtn.addEventListener('click', doSearch);
spInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

spConfirmYes.addEventListener('click', () => {
  if (!pendingConfirm) return;
  executeImpersonate(pendingConfirm.method, pendingConfirm.value);
  hideConfirm();
  spInput.value = '';
});
spConfirmNo.addEventListener('click', () => { hideConfirm(); spInput.focus(); });

// ── Init + live reload ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadFromStorage);

chrome.storage.onChanged.addListener(changes => {
  if (changes.zillow_history_v3) {
    spHistory = changes.zillow_history_v3.newValue || [];
    renderHistory();
  }
  if (changes.zillow_settings) {
    spSettings = changes.zillow_settings.newValue || spSettings;
    applyZpidTabVisibility();
    renderHistory();
  }
});
