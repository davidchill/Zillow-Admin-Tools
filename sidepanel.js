// ── Zillow Admin Tools – Side Panel ──

const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';

// ── State ────────────────────────────────────────────────────────────────────
let currentTab      = 'impersonate';
let currentMode     = 'zuid';
let listingMode     = 'zillow';
let spHistory       = [];
let spViewed        = [];
let spSettings      = { historyLimit: 5, zpidTabEnabled: true, historyEnabled: true, defaultTab: 'listing' };
let pendingConfirm  = null;
let sectionCollapsed = { imps: false, viewed: false };
let acDebounceTimer = null;
let acResults       = [];
let acActiveIdx     = -1;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const spTabsEl        = document.getElementById('sp-tabs');
const spTabImp        = document.getElementById('sp-tab-imp');
const spTabZpid       = document.getElementById('sp-tab-zpid');
const spModeRow       = document.getElementById('sp-mode-row');
const spModeBtns      = spModeRow.querySelectorAll('.mode-btn');
const spInputLabel    = document.getElementById('sp-input-label');
const spInput         = document.getElementById('sp-input');
const spGoBtn         = document.getElementById('sp-go-btn');
const spErrorMsg      = document.getElementById('sp-error-msg');
const spImpSearch     = document.getElementById('sp-imp-search');
const spListingSearch = document.getElementById('sp-listing-search');
const spZpidInput     = document.getElementById('sp-zpid-input');
const spZpidGoBtn     = document.getElementById('sp-zpid-go-btn');
const spZpidErrorMsg  = document.getElementById('sp-zpid-error-msg');
const spMlsSearch     = document.getElementById('sp-mls-search');
const spMlsInput      = document.getElementById('sp-mls-input');
const spMlsGoBtn      = document.getElementById('sp-mls-go-btn');
const spMlsErrorMsg   = document.getElementById('sp-mls-error-msg');
const spAddrInput     = document.getElementById('sp-addr-input');
const spAddrGoBtn     = document.getElementById('sp-addr-go-btn');
const spAddrErrorMsg  = document.getElementById('sp-addr-error-msg');
const spConfirmBar    = document.getElementById('sp-confirm-bar');
const spConfirmTxt    = document.getElementById('sp-confirm-text');
const spConfirmYes    = document.getElementById('sp-confirm-yes');
const spConfirmNo     = document.getElementById('sp-confirm-no');
const spHistoryEl     = document.getElementById('sp-history');
const spAcDropdown        = document.getElementById('sp-ac-dropdown');
const spListingModeRow    = document.getElementById('sp-listing-mode-row');
const spListingModeBtns   = spListingModeRow.querySelectorAll('.mode-btn');
const spAddrSearch        = document.getElementById('sp-addr-search');
const spAgentFirstInput   = document.getElementById('sp-agent-first');
const spAgentLastInput    = document.getElementById('sp-agent-last');
const spAgentGoBtn        = document.getElementById('sp-agent-go-btn');
const spAgentErrorMsg     = document.getElementById('sp-agent-error-msg');
const spSettingsOpen         = document.getElementById('sp-settings-open');
const spSettingsOverlay      = document.getElementById('sp-settings-overlay');
const spSettingsClose        = document.getElementById('sp-settings-close');
const spSettingHistoryLimit  = document.getElementById('sp-setting-history-limit');
const spSettingZpidTab       = document.getElementById('sp-setting-zpid-tab');
const spSettingFloatingTab   = document.getElementById('sp-setting-floating-tab');
const spSettingRedirectProfile = document.getElementById('sp-setting-redirect-profile');
const spSettingHistory       = document.getElementById('sp-setting-history');
const spSettingTheme         = document.getElementById('sp-setting-theme');
const spSettingDefaultTab    = document.getElementById('sp-setting-default-tab');

// ── Background registration (FAB toggle support) ─────────────────────────────
// Opens a named port so background.js knows the panel is open in this window.
// Reconnects automatically if the service worker restarts while the panel is up.
(function registerPanel() {
  chrome.windows.getCurrent(win => {
    const port = chrome.runtime.connect({ name: 'zat-sidepanel-' + win.id });
    port.onDisconnect.addListener(() => setTimeout(registerPanel, 500));
  });
})();

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
  chrome.storage.local.get(['zillow_history_v3', 'zillow_viewed_v3', 'zillow_settings'], data => {
    if (data.zillow_settings) {
      spSettings = data.zillow_settings;
      if (typeof spSettings.zpidTabEnabled      === 'undefined') spSettings.zpidTabEnabled      = true;
      if (typeof spSettings.floatingTabEnabled  === 'undefined') spSettings.floatingTabEnabled  = true;
      if (typeof spSettings.redirectEnabled     === 'undefined') spSettings.redirectEnabled     = true;
      if (typeof spSettings.themeMode           === 'undefined') spSettings.themeMode           = 'auto';
      if (typeof spSettings.historyEnabled      === 'undefined') spSettings.historyEnabled      = true;
      if (typeof spSettings.defaultTab          === 'undefined') spSettings.defaultTab          = 'listing';
      applyTheme(spSettings.themeMode);
      spSettingHistoryLimit.value          = String(spSettings.historyLimit || 5);
      spSettingZpidTab.checked             = spSettings.zpidTabEnabled !== false;
      spSettingFloatingTab.checked         = spSettings.floatingTabEnabled !== false;
      spSettingRedirectProfile.checked     = spSettings.redirectEnabled !== false;
      spSettingHistory.checked             = spSettings.historyEnabled !== false;
      updateThemeButtons(spSettings.themeMode || 'auto');
      updateDefaultTabButtons(spSettings.defaultTab || 'listing');
    }
    if (data.zillow_history_v3) spHistory = data.zillow_history_v3;
    if (data.zillow_viewed_v3)  spViewed  = data.zillow_viewed_v3;
    // Switch to the user's chosen default tab first, then apply visibility rules
    switchSearchTab(spSettings.defaultTab || 'listing');
    applyZpidTabVisibility();
  });
}

function saveSettings() {
  chrome.storage.local.set({ zillow_settings: spSettings });
}

function saveHistory() {
  chrome.storage.local.set({ zillow_history_v3: spHistory });
}

function requestScrape(tabId, historyId, historyType) {
  chrome.runtime.sendMessage({ action: 'scrapeTab', tabId, historyId, historyType });
}

function removeFromViewed(zpid) {
  const filtered = spViewed.filter(h => h.id !== zpid);
  if (filtered.length !== spViewed.length) {
    spViewed = filtered;
    chrome.storage.local.set({ zillow_viewed_v3: spViewed });
  }
}

// ── ZPID tab visibility ───────────────────────────────────────────────────────
function applyZpidTabVisibility() {
  const show = spSettings.zpidTabEnabled !== false;
  spTabZpid.classList.toggle('hidden', !show);
  spTabsEl.classList.toggle('hidden', !show);
  if (!show && currentTab === 'listing') switchSearchTab('impersonate');
}

// ── Search tab switching ──────────────────────────────────────────────────────
function switchSearchTab(tab) {
  currentTab = tab;
  spTabImp.classList.toggle('active',  tab === 'impersonate');
  spTabZpid.classList.toggle('active', tab === 'listing');
  spModeRow.classList.toggle('hidden', tab === 'listing');
  spConfirmBar.classList.add('hidden');
  pendingConfirm = null;

  // Show/hide the correct input area
  spImpSearch.classList.toggle('hidden', tab === 'listing');
  spListingSearch.classList.toggle('hidden', tab !== 'listing');

  // Clear all inputs and errors
  spInput.value = '';
  spErrorMsg.textContent = '';
  spInput.classList.remove('has-error');
  spZpidInput.value = '';
  spZpidErrorMsg.textContent = '';
  spZpidInput.classList.remove('has-error');
  spMlsInput.value = '';
  spMlsErrorMsg.textContent = '';
  spMlsInput.classList.remove('has-error');
  spAddrInput.value = '';
  spAddrErrorMsg.textContent = '';
  spAgentFirstInput.value = '';
  spAgentLastInput.value  = '';
  spAgentErrorMsg.textContent = '';
  spAgentFirstInput.classList.remove('has-error');
  spAgentLastInput.classList.remove('has-error');
  hideAcDropdown();

  if (tab === 'listing') {
    switchListingMode('zillow');
  } else {
    updateImpersonateLabels();
  }
  renderHistory();
}

function updateImpersonateLabels() {
  const labels = { auto: 'Email, ZUID, or Screen Name', email: 'Email Address', zuid: 'User ID (ZUID)', screenname: 'Screen Name' };
  const placeholders = { auto: 'Email, ZUID, or Screen Name', email: 'e.g. user@example.com', zuid: 'e.g. 12345678', screenname: 'e.g. johndoe42' };
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

function showError(msg) {
  spErrorMsg.textContent = msg;
  spInput.classList.add('has-error');
}

// ── Autocomplete (address input only) ────────────────────────────────────────
function showAcDropdown(results) {
  acResults   = results;
  acActiveIdx = -1;
  if (!results || !results.length) { hideAcDropdown(); return; }

  spAcDropdown.innerHTML = results.map((r, i) => {
    const meta      = r.metaData || {};
    const address   = meta.addressString || r.display || '';
    const cityState = meta.cityStateZip  || '';
    return `<button class="ac-item" data-idx="${i}">` +
      `<div class="ac-item-main">${escapeHtml(address)}</div>` +
      (cityState ? `<div class="ac-item-sub">${escapeHtml(cityState)}</div>` : '') +
      `</button>`;
  }).join('');

  spAcDropdown.querySelectorAll('.ac-item').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      selectAcResult(acResults[parseInt(btn.dataset.idx, 10)]);
    });
  });

  spAcDropdown.classList.remove('hidden');
}

function hideAcDropdown() {
  spAcDropdown.classList.add('hidden');
  acResults   = [];
  acActiveIdx = -1;
}

function updateAcActive() {
  spAcDropdown.querySelectorAll('.ac-item').forEach((btn, i) => {
    btn.classList.toggle('ac-active', i === acActiveIdx);
  });
}

function selectAcResult(result) {
  if (!result) return;
  const meta  = result.metaData || {};
  const zpid  = meta.zpid ? String(meta.zpid) : null;
  if (!zpid) { hideAcDropdown(); return; }

  const url   = `https://www.zillow.com/homedetails/${zpid}_zpid/`;
  const label = result.display || '';
  spAddrInput.value = '';
  hideAcDropdown();
  removeFromViewed(zpid);
  if (spSettings.historyEnabled !== false) addToHistory('zpid', zpid, 'zpid', label);
  chrome.tabs.create({ url });
}

function triggerAutocomplete(query) {
  clearTimeout(acDebounceTimer);
  if (!query || query.length < 2) { hideAcDropdown(); return; }
  acDebounceTimer = setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'autocomplete', query }, response => {
      if (chrome.runtime.lastError) { hideAcDropdown(); return; }
      showAcDropdown((response && response.results) || []);
    });
  }, 300);
}

// Fallback when no autocomplete result is available: search Zillow by address text
function doAddressSearch(address) {
  const slug = address.trim().replace(/,/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  chrome.tabs.create({ url: 'https://www.zillow.com/homes/for_sale/' + slug + '_rb/' });
  spAddrInput.value = '';
  hideAcDropdown();
}

// ── Copy to clipboard ────────────────────────────────────────────────────────
function attachCopyHandlers(container) {
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const text = btn.dataset.copyText !== undefined ? btn.dataset.copyText : btn.dataset.copyId;
      navigator.clipboard.writeText(text).then(() => {
        const svg = btn.querySelector('svg');
        svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        btn.classList.add('copy-ok');
        setTimeout(() => {
          svg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
          btn.classList.remove('copy-ok');
        }, 1500);
      });
    });
  });
  container.querySelectorAll('.open-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const url = btn.dataset.openUrl;
      if (url) chrome.tabs.create({ url });
    });
  });
}

// ── Listing mode (Zillow / PHX / DIT) ────────────────────────────────────────
function buildListingUrl(type, id) {
  if (type === 'phx') return 'https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=' + id;
  if (type === 'dit') return 'https://prm.in.zillow.net/zpid/edit?zpid=' + id;
  return `https://www.zillow.com/homedetails/${id}_zpid/`;
}

function switchListingMode(mode) {
  listingMode = mode;
  spListingModeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lmode === mode);
  });
  // Address search only shown in Zillow mode; MLS search only shown in PHX mode
  spAddrSearch.classList.toggle('hidden', mode !== 'zillow');
  spMlsSearch.classList.toggle('hidden', mode !== 'phx');
  // Clear ZPID and MLS inputs and errors
  spZpidInput.value = '';
  spZpidErrorMsg.textContent = '';
  spZpidInput.classList.remove('has-error');
  spMlsInput.value = '';
  spMlsErrorMsg.textContent = '';
  spMlsInput.classList.remove('has-error');
  hideAcDropdown();
}

// ── ZPID Search ───────────────────────────────────────────────────────────────
function doZpidSearch() {
  const raw = spZpidInput.value.trim();
  spZpidErrorMsg.textContent = '';
  spZpidInput.classList.remove('has-error');
  if (!raw) return;
  const cleanId = raw.replace(/\D/g, '');
  if (!cleanId) {
    spZpidErrorMsg.textContent = 'Please enter a numeric ZPID.';
    spZpidInput.classList.add('has-error');
    return;
  }
  const url = buildListingUrl(listingMode, cleanId);
  if (listingMode === 'zillow') {
    removeFromViewed(cleanId);
    if (spSettings.historyEnabled !== false) {
      addToHistory('zpid', cleanId, 'zpid');
      chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: 'zpid' });
    }
    chrome.tabs.create({ url });
  } else {
    if (spSettings.historyEnabled !== false) {
      addToHistory(listingMode, cleanId, listingMode);
      chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: listingMode });
    }
    chrome.tabs.create({ url });
  }
  spZpidInput.value = '';
}

spZpidGoBtn.addEventListener('click', doZpidSearch);
spZpidInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doZpidSearch();
});

// ── MLS ID Search ─────────────────────────────────────────────────────────────
function doMlsSearch() {
  const raw = spMlsInput.value.trim();
  spMlsErrorMsg.textContent = '';
  spMlsInput.classList.remove('has-error');
  if (!raw) return;
  chrome.tabs.create({ url: 'https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?mlsID=' + encodeURIComponent(raw) });
  spMlsInput.value = '';
}

spMlsGoBtn.addEventListener('click', doMlsSearch);
spMlsInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doMlsSearch();
});

spListingModeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchListingMode(btn.dataset.lmode));
});

// ── Address Search ────────────────────────────────────────────────────────────
spAddrGoBtn.addEventListener('click', () => {
  if (acResults.length && !spAcDropdown.classList.contains('hidden')) {
    // Dropdown is open — select the highlighted item (or first)
    selectAcResult(acActiveIdx >= 0 ? acResults[acActiveIdx] : acResults[0]);
  } else {
    const q = spAddrInput.value.trim();
    if (q.length >= 2) doAddressSearch(q);
  }
});

spAddrInput.addEventListener('keydown', e => {
  if (acResults.length && !spAcDropdown.classList.contains('hidden')) {
    if (e.key === 'ArrowDown') { e.preventDefault(); acActiveIdx = Math.min(acActiveIdx + 1, acResults.length - 1); updateAcActive(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); acActiveIdx = Math.max(acActiveIdx - 1, -1); updateAcActive(); return; }
    if (e.key === 'Escape')    { hideAcDropdown(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      selectAcResult(acActiveIdx >= 0 ? acResults[acActiveIdx] : acResults[0]);
      return;
    }
  }
  if (e.key === 'Enter') {
    const q = spAddrInput.value.trim();
    if (q.length >= 2) doAddressSearch(q);
  }
});

spAddrInput.addEventListener('input', () => {
  triggerAutocomplete(spAddrInput.value.trim());
});

spAddrInput.addEventListener('blur', () => { setTimeout(hideAcDropdown, 150); });

// ── Impersonate Search ────────────────────────────────────────────────────────
function doSearch() {
  const raw = spInput.value.trim();
  if (!raw) return;
  spErrorMsg.textContent = '';
  spInput.classList.remove('has-error');
  hideConfirm();

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
  if (spSettings.historyEnabled !== false) addToHistory('impersonate', value, method);
}

function doAgentSearch() {
  const first = spAgentFirstInput.value.trim();
  const last  = spAgentLastInput.value.trim();
  spAgentErrorMsg.textContent = '';
  spAgentFirstInput.classList.remove('has-error');
  spAgentLastInput.classList.remove('has-error');
  if (!first && !last) {
    spAgentErrorMsg.textContent = 'Enter at least a first or last name.';
    spAgentFirstInput.classList.add('has-error');
    spAgentLastInput.classList.add('has-error');
    return;
  }
  const nameParam = [first, last]
    .filter(Boolean)
    .map(n => n.replace(/\s+/g, '+'))
    .join('+');
  chrome.tabs.create({ url: 'https://www.zillow.com/professionals/real-estate-agent-reviews/?name=' + nameParam });
  spAgentFirstInput.value = '';
  spAgentLastInput.value  = '';
}

// ── History ───────────────────────────────────────────────────────────────────
function addToHistory(type, id, method, label) {
  const limit = Math.min(20, Math.max(5, spSettings.historyLimit || 5));
  spHistory = [
    { type, id, method, label: label || '', timestamp: Date.now() }
  ].concat(
    spHistory.filter(h => !(h.id === id && h.type === type))
  ).slice(0, limit);
  saveHistory();
  renderHistory();
}

function buildItemHtml(item) {
  const isListing = item.type === 'zpid' || item.type === 'viewed' || item.type === 'phx' || item.type === 'dit';
  let badgeClass, badgeText;
  if      (item.type === 'viewed') { badgeClass = 'badge-viewed'; badgeText = 'Viewed'; }
  else if (item.type === 'zpid')   { badgeClass = 'badge-zpid';   badgeText = 'ZPID'; }
  else if (item.type === 'phx')    { badgeClass = 'badge-phx';    badgeText = 'PHX'; }
  else if (item.type === 'dit')    { badgeClass = 'badge-dit';    badgeText = 'DIT'; }
  else { // impersonate
    badgeClass = 'badge-' + (item.method || 'zuid');
    badgeText  = item.method === 'screenname' ? 'Screen' : (item.method || 'ZUID').toUpperCase();
  }
  const url = isListing
    ? buildListingUrl(item.type, item.id)
    : buildImpersonateUrl(item.method, item.id);
  const sub = item.label ? `<div class="item-sub">${escapeHtml(item.label)}</div>` : '';
  let copyLabel;
  if (item.type === 'zpid' || item.type === 'phx' || item.type === 'dit' || item.type === 'viewed') {
    copyLabel = 'Copy ZPID';
  } else if (item.method === 'email') {
    copyLabel = 'Copy Email';
  } else if (item.method === 'screenname') {
    copyLabel = 'Copy Screen Name';
  } else {
    copyLabel = 'Copy ZUID';
  }
  const copyIconSvg = `<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const extIconSvg  = `<svg class="ext-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  let actionButtons, extIconHtml;
  if (item.type === 'viewed') {
    const zpidUrl = `https://www.zillow.com/homedetails/${item.id}_zpid/`;
    const phxUrl  = `https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=${item.id}`;
    const ditUrl  = `https://prm.in.zillow.net/zpid/edit?zpid=${item.id}`;
    actionButtons =
      `<span class="copy-btn" data-copy-id="${escapeHtml(item.id)}" data-tip="Copy ZPID">${copyIconSvg}</span>` +
      (item.label ? `<span class="copy-btn" data-copy-text="${escapeHtml(item.label)}" data-tip="Copy Address">${copyIconSvg}</span>` : '') +
      `<span class="copy-btn" data-copy-text="${escapeHtml(zpidUrl)}" data-tip="Copy URL">${copyIconSvg}</span>` +
      `<span class="open-btn" data-open-url="${escapeHtml(phxUrl)}" data-tip="Open in PHX">PHX</span>` +
      `<span class="open-btn" data-open-url="${escapeHtml(ditUrl)}" data-tip="Open in DIT">DIT</span>`;
    extIconHtml = `<span class="open-btn" data-open-url="${escapeHtml(zpidUrl)}" data-tip="Open in Zillow">${extIconSvg}</span>`;
  } else {
    actionButtons = `<span class="copy-btn" data-copy-id="${escapeHtml(item.id)}" data-tip="${copyLabel}">${copyIconSvg}</span>`;
    extIconHtml = extIconSvg;
  }

  return `
    <button class="item" data-url="${escapeHtml(url)}">
      <div class="item-top">
        <span class="item-id">
          <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
          ${escapeHtml(item.id)}
        </span>
        <div style="display:flex;align-items:center;gap:2px;">
          ${actionButtons}
          ${extIconHtml}
        </div>
      </div>
      ${sub}
    </button>`;
}

function renderSectionBlock(titleSvg, titleText, items, clearId, emptyText, collapsed) {
  const itemsHtml = items.length
    ? items.map(buildItemHtml).join('')
    : `<div class="empty">${emptyText}</div>`;
  const clearBtn = items.length
    ? `<button class="section-clear" id="${clearId}">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        Clear
       </button>`
    : '';
  const chevron = `<svg class="section-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
  const collapsedClass = collapsed ? ' collapsed' : '';
  return `
    <div class="section${collapsedClass}">
      <div class="section-header section-toggle-header">
        <div class="section-title">
          ${titleSvg}
          ${titleText}
          ${chevron}
        </div>
        ${clearBtn}
      </div>
      <div class="section-body">
        ${itemsHtml}
      </div>
    </div>`;
}

function renderHistory() {
  const limit = Math.min(20, Math.max(5, spSettings.historyLimit || 5));

  const personSvg = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const eyeSvg    = `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

  let html = '';

  if (currentTab === 'listing') {
    const viewed = spViewed.slice(0, limit);
    const offMsg = 'History recording is off. Enable it in Settings.';
    html = renderSectionBlock(eyeSvg, 'Recently Viewed', viewed, 'sp-clear-viewed', spSettings.historyEnabled === false ? offMsg : 'No recently viewed properties', sectionCollapsed.viewed);
  } else {
    const imps = spHistory.filter(h => h.type === 'impersonate').slice(0, limit);
    const offMsg = 'History recording is off. Enable it in Settings.';
    html = renderSectionBlock(personSvg, 'Recently Impersonated', imps, 'sp-clear-imps', spSettings.historyEnabled === false ? offMsg : 'No recent impersonations', sectionCollapsed.imps);
  }

  spHistoryEl.innerHTML = html;

  // ── Collapsible toggle ──────────────────────────────────────────────────────
  spHistoryEl.querySelectorAll('.section-toggle-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('.section-clear')) return;
      const section = header.closest('.section');
      section.classList.toggle('collapsed');
      const key = currentTab === 'listing' ? 'viewed' : 'imps';
      sectionCollapsed[key] = section.classList.contains('collapsed');
    });
  });

  const clearImps = document.getElementById('sp-clear-imps');
  if (clearImps) clearImps.addEventListener('click', () => {
    spHistory = spHistory.filter(h => h.type !== 'impersonate');
    saveHistory(); renderHistory();
  });

  const clearViewed = document.getElementById('sp-clear-viewed');
  if (clearViewed) clearViewed.addEventListener('click', () => {
    spViewed = [];
    chrome.storage.local.set({ zillow_viewed_v3: [] }); renderHistory();
  });

  spHistoryEl.querySelectorAll('.item').forEach(btn => {
    btn.addEventListener('click', () => { chrome.tabs.create({ url: btn.dataset.url }); });
  });
  attachCopyHandlers(spHistoryEl);
}

// ── Event listeners ───────────────────────────────────────────────────────────
spTabImp.addEventListener('click',  () => switchSearchTab('impersonate'));
spTabZpid.addEventListener('click', () => switchSearchTab('listing'));

spModeBtns.forEach(btn => btn.addEventListener('click', () => switchMode(btn)));

spGoBtn.addEventListener('click', doSearch);
spInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

spAgentGoBtn.addEventListener('click', doAgentSearch);
spAgentFirstInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAgentSearch(); });
spAgentLastInput.addEventListener('keydown',  e => { if (e.key === 'Enter') doAgentSearch(); });

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => { chrome.tabs.create({ url: btn.dataset.url }); });
});

spConfirmYes.addEventListener('click', () => {
  if (!pendingConfirm) return;
  executeImpersonate(pendingConfirm.method, pendingConfirm.value);
  hideConfirm();
  spInput.value = '';
});
spConfirmNo.addEventListener('click', () => { hideConfirm(); spInput.focus(); });

// ── Settings helpers ──────────────────────────────────────────────────────────
function updateThemeButtons(mode) {
  spSettingTheme.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === mode);
  });
}

function updateDefaultTabButtons(tab) {
  spSettingDefaultTab.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tabVal === tab);
  });
}

// ── Settings event handlers ───────────────────────────────────────────────────
spSettingsOpen.addEventListener('click', () => {
  spSettingsOverlay.classList.remove('hidden');
  spSettingHistoryLimit.value          = String(spSettings.historyLimit || 5);
  spSettingZpidTab.checked             = spSettings.zpidTabEnabled !== false;
  spSettingFloatingTab.checked         = spSettings.floatingTabEnabled !== false;
  spSettingRedirectProfile.checked     = spSettings.redirectEnabled !== false;
  spSettingHistory.checked             = spSettings.historyEnabled !== false;
  updateThemeButtons(spSettings.themeMode || 'auto');
  updateDefaultTabButtons(spSettings.defaultTab || 'listing');
});

spSettingsClose.addEventListener('click', () => {
  spSettingsOverlay.classList.add('hidden');
});

spSettingsOverlay.addEventListener('click', e => {
  if (e.target === spSettingsOverlay) spSettingsOverlay.classList.add('hidden');
});

spSettingHistoryLimit.addEventListener('change', () => {
  const raw     = parseInt(spSettingHistoryLimit.value, 10);
  const clamped = Math.min(20, Math.max(5, isNaN(raw) ? 5 : raw));
  spSettingHistoryLimit.value = String(clamped);
  spSettings.historyLimit = clamped;
  saveSettings();
  if (spHistory.length > clamped) { spHistory = spHistory.slice(0, clamped); saveHistory(); }
  if (spViewed.length  > clamped) { spViewed  = spViewed.slice(0, clamped);  chrome.storage.local.set({ zillow_viewed_v3: spViewed }); }
  renderHistory();
});

spSettingZpidTab.addEventListener('change', () => {
  spSettings.zpidTabEnabled = spSettingZpidTab.checked;
  saveSettings();
  applyZpidTabVisibility();
});

spSettingFloatingTab.addEventListener('change', () => {
  spSettings.floatingTabEnabled = spSettingFloatingTab.checked;
  saveSettings();
});

spSettingRedirectProfile.addEventListener('change', () => {
  spSettings.redirectEnabled = spSettingRedirectProfile.checked;
  saveSettings();
});

spSettingHistory.addEventListener('change', () => {
  spSettings.historyEnabled = spSettingHistory.checked;
  saveSettings();
  if (!spSettings.historyEnabled) {
    spHistory = [];
    spViewed  = [];
    chrome.storage.local.set({ zillow_history_v3: [], zillow_viewed_v3: [] });
    renderHistory();
  }
});

spSettingTheme.addEventListener('click', e => {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  const mode = btn.dataset.themeVal;
  spSettings.themeMode = mode;
  saveSettings();
  applyTheme(mode);
  updateThemeButtons(mode);
});

spSettingDefaultTab.addEventListener('click', e => {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  spSettings.defaultTab = btn.dataset.tabVal;
  saveSettings();
  updateDefaultTabButtons(spSettings.defaultTab);
});

// ── Version badge ─────────────────────────────────────────────────────────────
const RELEASE_DATE = 'Mar 24, 2026';
const spVersionTag = document.getElementById('sp-version-tag');
if (spVersionTag) {
  const v = chrome.runtime.getManifest().version;
  spVersionTag.textContent = 'v' + v + ' · ' + RELEASE_DATE;
}

// ── Init + live reload ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadFromStorage);

chrome.storage.onChanged.addListener(changes => {
  let needsRender = false;
  if (changes.zillow_history_v3) { spHistory  = changes.zillow_history_v3.newValue || []; needsRender = true; }
  if (changes.zillow_viewed_v3)  { spViewed   = changes.zillow_viewed_v3.newValue  || []; needsRender = true; }
  if (changes.zillow_settings) {
    const prev = spSettings;
    spSettings = changes.zillow_settings.newValue || spSettings;
    applyZpidTabVisibility();
    applyTheme(spSettings.themeMode || 'auto');

    // Clear all history when the recording toggle is turned off
    if (prev.historyEnabled !== false && spSettings.historyEnabled === false) {
      spHistory = [];
      spViewed  = [];
      chrome.storage.local.set({ zillow_history_v3: [], zillow_viewed_v3: [] });
    }

    needsRender = true;
  }
  if (needsRender) renderHistory();
});
