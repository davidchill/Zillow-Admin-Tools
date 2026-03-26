// ── Zillow Admin Tools – Popup Script ──

(function () {
  // ── State ──
  let currentTab   = 'impersonate';
  let currentMode  = 'zuid';
  let listingMode  = 'zillow';
  let history = [];
  let viewedHistory = [];
  let settings = { historyLimit: 5, zpidTabEnabled: true, floatingTabEnabled: true, redirectEnabled: true, themeMode: 'auto', historyEnabled: true, defaultTab: 'listing' };
  let pendingConfirm = null;

  const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';
  const METHOD_DISPLAY = { email: 'Email', zuid: 'Zuid', screenname: 'Screen Name' };

  // ── DOM refs ──
  const tabImp              = document.getElementById('tab-imp');
  const tabZpid             = document.getElementById('tab-zpid');
  const modeRow             = document.getElementById('mode-row');
  const modeBtns            = modeRow.querySelectorAll('.mode-btn');
  const inputLabel          = document.getElementById('input-label');
  const mainInput           = document.getElementById('main-input');
  const goBtn               = document.getElementById('go-btn');
  const errorMsg            = document.getElementById('error-msg');
  const impSearch           = document.getElementById('imp-search');
  const listingSearch       = document.getElementById('listing-search');
  const zpidInput           = document.getElementById('zpid-input');
  const zpidGoBtn           = document.getElementById('zpid-go-btn');
  const zpidErrorMsg        = document.getElementById('zpid-error-msg');
  const mlsSearch           = document.getElementById('mls-search');
  const mlsInput            = document.getElementById('mls-input');
  const mlsGoBtn            = document.getElementById('mls-go-btn');
  const mlsErrorMsg         = document.getElementById('mls-error-msg');
  const addrInput           = document.getElementById('addr-input');
  const addrGoBtn           = document.getElementById('addr-go-btn');
  const addrErrorMsg        = document.getElementById('addr-error-msg');
  const historyHeader       = document.getElementById('history-header');
  const historyLabel        = document.getElementById('history-label');
  const historyList         = document.getElementById('history-list');
  const clearBtn            = document.getElementById('clear-btn');
  const footerText          = document.getElementById('footer-text');
  const confirmBar          = document.getElementById('confirm-bar');
  const confirmText         = document.getElementById('confirm-text');
  const confirmYes          = document.getElementById('confirm-yes');
  const confirmNo           = document.getElementById('confirm-no');
  const changelogOpen       = document.getElementById('changelog-open');
  const changelogOverlay    = document.getElementById('changelog-overlay');
  const changelogClose      = document.getElementById('changelog-close');
  const changelogBody       = document.getElementById('changelog-body');
  const settingsOpen        = document.getElementById('settings-open');
  const settingsOverlay     = document.getElementById('settings-overlay');
  const settingsClose       = document.getElementById('settings-close');
  const settingHistoryLimit = document.getElementById('setting-history-limit');
  const settingZpidTab      = document.getElementById('setting-zpid-tab');
  const settingFloatingTab       = document.getElementById('setting-floating-tab');
  const settingRedirectProfile   = document.getElementById('setting-redirect-profile');
  const settingHistory           = document.getElementById('setting-history');
  const settingTheme             = document.getElementById('setting-theme');
  const settingDefaultTab        = document.getElementById('setting-default-tab');
  const tabsRow             = document.querySelector('.tabs');
  const acDropdown          = document.getElementById('ac-dropdown');
  const listingModeRow      = document.getElementById('listing-mode-row');
  const listingModeBtns     = listingModeRow.querySelectorAll('.mode-btn');
  const addrSearch          = document.getElementById('addr-search');
  const agentFirstInput     = document.getElementById('agent-first');
  const agentLastInput      = document.getElementById('agent-last');
  const agentGoBtn          = document.getElementById('agent-go-btn');
  const agentErrorMsg       = document.getElementById('agent-error-msg');

  // ── Autocomplete state ──
  let acDebounceTimer = null;
  let acResults = [];
  let acActiveIdx = -1;

  // ── Theme ──
  function applyTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function updateThemeButtons(mode) {
    settingTheme.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.themeVal === mode);
    });
  }

  function updateDefaultTabButtons(tab) {
    settingDefaultTab.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tabVal === tab);
    });
  }

  // ── Load settings + history from chrome.storage ──
  function loadFromStorage(callback) {
    chrome.storage.local.get(['zillow_history_v3', 'zillow_viewed_v3', 'zillow_settings'], function (data) {
      if (data.zillow_settings) {
        settings = data.zillow_settings;
        settingHistoryLimit.value = String(settings.historyLimit || 5);
        if (typeof settings.zpidTabEnabled    === 'undefined') settings.zpidTabEnabled    = true;
        if (typeof settings.floatingTabEnabled  === 'undefined') settings.floatingTabEnabled  = true;
        if (typeof settings.redirectEnabled     === 'undefined') settings.redirectEnabled     = true;
        if (typeof settings.themeMode       === 'undefined') settings.themeMode       = 'auto';
        if (typeof settings.historyEnabled  === 'undefined') settings.historyEnabled  = true;
        if (typeof settings.defaultTab      === 'undefined') settings.defaultTab      = 'listing';
        settingZpidTab.checked          = settings.zpidTabEnabled;
        settingFloatingTab.checked      = settings.floatingTabEnabled;
        settingRedirectProfile.checked  = settings.redirectEnabled;
        settingHistory.checked          = settings.historyEnabled;
        applyTheme(settings.themeMode);
        updateDefaultTabButtons(settings.defaultTab);
      }
      if (data.zillow_history_v3) history = data.zillow_history_v3;
      if (data.zillow_viewed_v3)  viewedHistory = data.zillow_viewed_v3;
      // Switch to the user's chosen default tab first, then apply visibility rules
      // (applyZpidTabVisibility will override back to Impersonate if Listing tab is disabled)
      switchTab(settings.defaultTab || 'listing');
      applyZpidTabVisibility();
      if (callback) callback();
    });
  }

  loadFromStorage();

  // ── Version badge ──
  const RELEASE_DATE = 'Mar 25, 2026';
  const versionTag = document.getElementById('version-tag');
  if (versionTag) {
    const v = chrome.runtime.getManifest().version;
    versionTag.textContent = 'v' + v + ' · ' + RELEASE_DATE;
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) loadFromStorage();
  });

  function saveHistory() {
    chrome.storage.local.set({ zillow_history_v3: history });
  }

  function saveSettings() {
    chrome.storage.local.set({ zillow_settings: settings });
  }

  // ── Helpers ──
  function validateEmail(email) {
    return /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i.test(email);
  }

  function buildImpersonateUrl(method, value) {
    const p = new URLSearchParams();
    if (method === 'email') {
      p.set('pEmail', value); p.set('email', value);
    } else if (method === 'zuid') {
      p.set('pZuid', value); p.set('zuid', value); p.set('action', 'impersonate'); p.set('confirm', '1');
    } else {
      p.set('pScreenName', value); p.set('screenName', value);
    }
    return IMPERSONATE_BASE + '?' + p.toString();
  }

  function buildListingUrl(type, id) {
    if (type === 'phx') return 'https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=' + id;
    if (type === 'dit') return 'https://prm.in.zillow.net/zpid/edit?zpid=' + id;
    return 'https://www.zillow.com/homedetails/' + id + '_zpid/';
  }

  function switchListingMode(mode) {
    listingMode = mode;
    listingModeBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lmode === mode);
    });
    // Address search only shown in Zillow mode; MLS search only shown in PHX mode
    addrSearch.classList.toggle('hidden', mode !== 'zillow');
    mlsSearch.classList.toggle('hidden', mode !== 'phx');
    // Clear ZPID and MLS inputs and errors
    zpidInput.value = '';
    zpidErrorMsg.textContent = '';
    zpidInput.classList.remove('has-error');
    mlsInput.value = '';
    mlsErrorMsg.textContent = '';
    mlsInput.classList.remove('has-error');
    hideAcDropdown();
  }

  function detectMethod(input) {
    if (input.includes('@')) {
      return validateEmail(input) ? { method: 'email', value: input } : { error: 'Invalid email address format.' };
    }
    if (/^\d+$/.test(input)) return { method: 'zuid', value: input };
    return { method: 'screenname', value: input };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function requestScrape(tabId, historyId, historyType) {
    chrome.runtime.sendMessage({ action: 'scrapeTab', tabId: tabId, historyId: historyId, historyType: historyType });
  }

  // ── Remove a ZPID from viewed history when user explicitly searches it ──
  function removeFromViewed(zpid) {
    const filtered = viewedHistory.filter(function (h) { return h.id !== zpid; });
    if (filtered.length !== viewedHistory.length) {
      viewedHistory = filtered;
      chrome.storage.local.set({ zillow_viewed_v3: viewedHistory });
    }
  }

  // ══════════════════════════════
  // AUTOCOMPLETE (address input only)
  // ══════════════════════════════

  function showAcDropdown(results) {
    acResults = results;
    acActiveIdx = -1;
    if (!results || !results.length) { hideAcDropdown(); return; }

    acDropdown.innerHTML = results.map(function (r, i) {
      const meta      = r.metaData || {};
      const address   = meta.addressString || r.display || '';
      const cityState = meta.cityStateZip  || '';
      return '<button class="ac-item" data-idx="' + i + '">' +
        '<div class="ac-item-main">' + escapeHtml(address) + '</div>' +
        (cityState ? '<div class="ac-item-sub">' + escapeHtml(cityState) + '</div>' : '') +
        '</button>';
    }).join('');

    acDropdown.querySelectorAll('.ac-item').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        selectAcResult(acResults[parseInt(btn.dataset.idx, 10)]);
      });
    });

    acDropdown.classList.remove('hidden');
  }

  function hideAcDropdown() {
    acDropdown.classList.add('hidden');
    acResults   = [];
    acActiveIdx = -1;
  }

  function updateAcActive() {
    acDropdown.querySelectorAll('.ac-item').forEach(function (btn, i) {
      btn.classList.toggle('ac-active', i === acActiveIdx);
    });
  }

  function selectAcResult(result) {
    if (!result) return;
    const meta = result.metaData || {};
    const zpid = meta.zpid ? String(meta.zpid) : null;
    if (!zpid) { hideAcDropdown(); return; }

    const url   = 'https://www.zillow.com/homedetails/' + zpid + '_zpid/';
    const label = result.display || '';
    addrInput.value = '';
    hideAcDropdown();
    removeFromViewed(zpid);
    if (settings.historyEnabled !== false) addToHistory('zpid', zpid, 'zpid', label);
    chrome.tabs.create({ url: url });
  }

  function triggerAutocomplete(query) {
    clearTimeout(acDebounceTimer);
    if (!query || query.length < 2) { hideAcDropdown(); return; }
    acDebounceTimer = setTimeout(function () {
      chrome.runtime.sendMessage({ action: 'autocomplete', query: query }, function (response) {
        if (chrome.runtime.lastError) { hideAcDropdown(); return; }
        showAcDropdown((response && response.results) || []);
      });
    }, 300);
  }

  // Fallback when no autocomplete result is available: search Zillow by address text
  function doAddressSearch(address) {
    const slug = address.trim().replace(/,/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    chrome.tabs.create({ url: 'https://www.zillow.com/homes/for_sale/' + slug + '_rb/' });
    addrInput.value = '';
    hideAcDropdown();
  }

  // ══════════════════════════════
  // ZPID TAB VISIBILITY
  // ══════════════════════════════

  function applyZpidTabVisibility() {
    const show = settings.zpidTabEnabled;
    tabZpid.classList.toggle('hidden', !show);
    if (!show && currentTab === 'listing') switchTab('impersonate');
    tabsRow.classList.toggle('hidden', !show);
  }

  // ══════════════════════════════
  // TAB SWITCHING
  // ══════════════════════════════

  function switchTab(tab) {
    currentTab = tab;
    tabImp.classList.toggle('active',  tab === 'impersonate');
    tabZpid.classList.toggle('active', tab === 'listing');
    modeRow.classList.toggle('hidden', tab === 'listing');
    confirmBar.classList.add('hidden');
    pendingConfirm = null;

    // Show/hide the correct input area
    impSearch.classList.toggle('hidden', tab === 'listing');
    listingSearch.classList.toggle('hidden', tab !== 'listing');

    // Clear all inputs and errors
    mainInput.value = '';
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
    zpidInput.value = '';
    zpidErrorMsg.textContent = '';
    zpidInput.classList.remove('has-error');
    mlsInput.value = '';
    mlsErrorMsg.textContent = '';
    mlsInput.classList.remove('has-error');
    addrInput.value = '';
    addrErrorMsg.textContent = '';
    agentFirstInput.value = '';
    agentLastInput.value  = '';
    agentErrorMsg.textContent = '';
    agentFirstInput.classList.remove('has-error');
    agentLastInput.classList.remove('has-error');
    hideAcDropdown();

    if (tab === 'listing') {
      switchListingMode('zillow');
      footerText.textContent = 'Enter a ZPID to navigate directly, or type an address for autocomplete suggestions.';
    } else {
      updateImpersonateLabels();
    }
    renderHistory();
  }

  tabImp.addEventListener('click',  function () { switchTab('impersonate'); });
  tabZpid.addEventListener('click', function () { switchTab('listing'); });

  document.querySelectorAll('.quick-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      chrome.tabs.create({ url: btn.dataset.url });
    });
  });

  // ══════════════════════════════
  // MODE SWITCHING
  // ══════════════════════════════

  function switchMode(btn) {
    currentMode = btn.dataset.mode;
    modeBtns.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
    hideConfirm();
    updateImpersonateLabels();
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { switchMode(btn); });
  });

  function updateImpersonateLabels() {
    const labels = { auto: 'Email, ZUID, or Screen Name', email: 'Email Address', zuid: 'User ID (ZUID)', screenname: 'Screen Name' };
    const placeholders = { auto: 'Email, ZUID, or Screen Name', email: 'e.g. user@example.com', zuid: 'e.g. 12345678', screenname: 'e.g. johndoe42' };
    const footers = {
      auto: 'Auto-detect mode: emails (contains @), ZUIDs (all digits), or screen names (everything else).',
      email: 'Impersonating by Email. Both modern (pEmail) and legacy (email) params are sent.',
      zuid: 'Impersonating by ZUID. Both modern (pZuid) and legacy (zuid) params are sent.',
      screenname: 'Impersonating by Screen Name. Both modern (pScreenName) and legacy (screenName) params are sent.'
    };
    inputLabel.textContent = labels[currentMode];
    mainInput.placeholder  = placeholders[currentMode];
    footerText.textContent = footers[currentMode];
  }

  // ══════════════════════════════
  // CONFIRM BAR (auto-detect)
  // ══════════════════════════════

  function showConfirm(method, value) {
    pendingConfirm = { method: method, value: value };
    confirmText.innerHTML = 'Detected: <strong>' + escapeHtml(METHOD_DISPLAY[method]) + '</strong> &mdash; "' + escapeHtml(value) + '"';
    confirmBar.classList.remove('hidden');
  }

  function hideConfirm() {
    pendingConfirm = null;
    confirmBar.classList.add('hidden');
  }

  confirmYes.addEventListener('click', function () {
    if (!pendingConfirm) return;
    executeImpersonate(pendingConfirm.method, pendingConfirm.value);
    hideConfirm();
    mainInput.value = '';
  });

  confirmNo.addEventListener('click', function () { hideConfirm(); mainInput.focus(); });

  // ══════════════════════════════
  // ZPID SEARCH (listing tab)
  // ══════════════════════════════

  function doZpidSearch() {
    const raw = zpidInput.value.trim();
    zpidErrorMsg.textContent = '';
    zpidInput.classList.remove('has-error');
    if (!raw) return;
    const cleanId = raw.replace(/\D/g, '');
    if (!cleanId) {
      zpidErrorMsg.textContent = 'Please enter a numeric ZPID.';
      zpidInput.classList.add('has-error');
      return;
    }
    const url = buildListingUrl(listingMode, cleanId);
    if (listingMode === 'zillow') {
      removeFromViewed(cleanId);
      if (settings.historyEnabled !== false) {
        addToHistory('zpid', cleanId, 'zpid');
        chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: 'zpid' });
      }
      chrome.tabs.create({ url: url });
    } else {
      if (settings.historyEnabled !== false) {
        addToHistory(listingMode, cleanId, listingMode);
        chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: listingMode });
      }
      chrome.tabs.create({ url: url });
    }
    zpidInput.value = '';
  }

  zpidGoBtn.addEventListener('click', doZpidSearch);
  zpidInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doZpidSearch();
  });

  // ══════════════════════════════
  // MLS ID SEARCH (listing tab)
  // ══════════════════════════════

  function doMlsSearch() {
    const raw = mlsInput.value.trim();
    mlsErrorMsg.textContent = '';
    mlsInput.classList.remove('has-error');
    if (!raw) return;
    chrome.tabs.create({ url: 'https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?mlsID=' + encodeURIComponent(raw) });
    mlsInput.value = '';
  }

  mlsGoBtn.addEventListener('click', doMlsSearch);
  mlsInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doMlsSearch();
  });

  listingModeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { switchListingMode(btn.dataset.lmode); });
  });

  // ══════════════════════════════
  // ADDRESS SEARCH (listing tab)
  // ══════════════════════════════

  addrGoBtn.addEventListener('click', function () {
    if (acResults.length && !acDropdown.classList.contains('hidden')) {
      // Dropdown is open — select the highlighted item (or first)
      selectAcResult(acActiveIdx >= 0 ? acResults[acActiveIdx] : acResults[0]);
    } else {
      const q = addrInput.value.trim();
      if (q.length >= 2) doAddressSearch(q);
    }
  });

  addrInput.addEventListener('keydown', function (e) {
    if (acResults.length && !acDropdown.classList.contains('hidden')) {
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
      const q = addrInput.value.trim();
      if (q.length >= 2) doAddressSearch(q);
    }
  });

  addrInput.addEventListener('input', function () {
    triggerAutocomplete(addrInput.value.trim());
  });

  addrInput.addEventListener('blur', function () {
    setTimeout(hideAcDropdown, 150);
  });

  // ══════════════════════════════
  // IMPERSONATE SEARCH
  // ══════════════════════════════

  function doSearch() {
    const raw = mainInput.value.trim();
    if (!raw) return;
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
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
    mainInput.value = '';
  }

  function executeImpersonate(method, value) {
    const url = buildImpersonateUrl(method, value);
    chrome.tabs.create({ url: url }, function (tab) {
      requestScrape(tab.id, value, 'impersonate');
    });
    if (settings.historyEnabled !== false) addToHistory('impersonate', value, method);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    mainInput.classList.add('has-error');
  }

  function doAgentSearch() {
    const first = agentFirstInput.value.trim();
    const last  = agentLastInput.value.trim();
    agentErrorMsg.textContent = '';
    agentFirstInput.classList.remove('has-error');
    agentLastInput.classList.remove('has-error');
    if (!first && !last) {
      agentErrorMsg.textContent = 'Enter at least a first or last name.';
      agentFirstInput.classList.add('has-error');
      agentLastInput.classList.add('has-error');
      return;
    }
    const nameParam = [first, last]
      .filter(Boolean)
      .map(function (n) { return n.replace(/\s+/g, '+'); })
      .join('+');
    chrome.tabs.create({ url: 'https://www.zillow.com/professionals/real-estate-agent-reviews/?name=' + nameParam });
    agentFirstInput.value = '';
    agentLastInput.value  = '';
  }

  goBtn.addEventListener('click', doSearch);
  mainInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  agentGoBtn.addEventListener('click', doAgentSearch);
  agentFirstInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAgentSearch(); });
  agentLastInput.addEventListener('keydown',  function (e) { if (e.key === 'Enter') doAgentSearch(); });

  // ══════════════════════════════
  // HISTORY
  // ══════════════════════════════

  function addToHistory(type, id, method, label) {
    const limit = Math.min(20, Math.max(5, settings.historyLimit || 5));
    history = [
      { type: type, id: id, method: method, label: label || '', timestamp: Date.now() }
    ].concat(
      history.filter(function (h) { return !(h.id === id && h.type === type); })
    ).slice(0, limit);
    saveHistory();
    renderHistory();
  }

  function attachCopyHandlers(container) {
    container.querySelectorAll('.copy-btn').forEach(function (span) {
      span.addEventListener('click', function (e) {
        e.stopPropagation();
        const text = span.dataset.copyText !== undefined ? span.dataset.copyText : span.dataset.copyId;
        navigator.clipboard.writeText(text).then(function () {
          const svg = span.querySelector('svg');
          svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
          span.classList.add('copy-ok');
          setTimeout(function () {
            svg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
            span.classList.remove('copy-ok');
          }, 1500);
        });
      });
    });
    container.querySelectorAll('.open-btn').forEach(function (span) {
      span.addEventListener('click', function (e) {
        e.stopPropagation();
        const url = span.dataset.openUrl;
        if (url) chrome.tabs.create({ url: url });
      });
    });
  }

  function renderHistoryItemHtml(item) {
    let badgeClass, badgeText;
    if      (item.type === 'viewed')     { badgeClass = 'badge-viewed'; badgeText = 'Viewed'; }
    else if (item.type === 'zpid')       { badgeClass = 'badge-zpid';   badgeText = 'ZPID'; }
    else if (item.type === 'phx')        { badgeClass = 'badge-phx';    badgeText = 'PHX'; }
    else if (item.type === 'dit')        { badgeClass = 'badge-dit';    badgeText = 'DIT'; }
    else { // impersonate
      badgeClass = 'badge-' + (item.method || 'zuid');
      badgeText  = item.method === 'screenname' ? 'Screen' : (item.method || 'ZUID').toUpperCase();
    }
    const subLine   = item.label ? '<div class="history-item-sub">' + escapeHtml(item.label) + '</div>' : '';
    const dataAttrs = 'data-type="' + escapeHtml(item.type) + '" data-id="' + escapeHtml(item.id) + '"' +
      (item.method ? ' data-method="' + escapeHtml(item.method) + '"' : '');
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
    const copyIconSvg = '<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const copySpan = '<span class="copy-btn" data-copy-id="' + escapeHtml(item.id) + '" data-tip="' + copyLabel + '">' + copyIconSvg + '</span>';

    const extIconSvg = '<svg class="ext-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    let actionButtons, extIconHtml;
    if (item.type === 'viewed') {
      const zpidUrl = 'https://www.zillow.com/homedetails/' + item.id + '_zpid/';
      const phxUrl  = 'https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=' + item.id;
      const ditUrl  = 'https://prm.in.zillow.net/zpid/edit?zpid=' + item.id;
      actionButtons =
        '<span class="copy-btn" data-copy-id="' + escapeHtml(item.id) + '" data-tip="Copy ZPID">' + copyIconSvg + '</span>' +
        (item.label ? '<span class="copy-btn" data-copy-text="' + escapeHtml(item.label) + '" data-tip="Copy Address">' + copyIconSvg + '</span>' : '') +
        '<span class="copy-btn" data-copy-text="' + escapeHtml(zpidUrl) + '" data-tip="Copy URL">' + copyIconSvg + '</span>' +
        '<span class="open-btn" data-open-url="' + escapeHtml(phxUrl) + '" data-tip="Open in PHX">PHX</span>' +
        '<span class="open-btn" data-open-url="' + escapeHtml(ditUrl) + '" data-tip="Open in DIT">DIT</span>';
      extIconHtml = '<span class="open-btn" data-open-url="' + escapeHtml(zpidUrl) + '" data-tip="Open in Zillow">' + extIconSvg + '</span>';
    } else {
      actionButtons = copySpan;
      extIconHtml = extIconSvg;
    }

    return '<button class="history-item" ' + dataAttrs + '>' +
      '<div class="history-item-top">' +
        '<span class="history-item-id"><span class="badge ' + badgeClass + '">' + badgeText + '</span><span class="history-item-id-text">' + escapeHtml(item.id) + '</span></span>' +
        '<div style="display:flex;align-items:center;gap:2px;">' +
          actionButtons +
          extIconHtml +
        '</div>' +
      '</div>' +
      subLine +
      '</button>';
  }

  function renderSection(titleText, iconSvg, items, clearId, emptyText) {
    let html = '<div class="listing-section">';
    html += '<div class="history-header" style="margin-top:0;margin-bottom:10px;">';
    html += '<div class="history-title">' + iconSvg + '<span>' + titleText + '</span></div>';
    if (items.length) {
      html += '<button class="clear-btn" id="' + clearId + '">';
      html += '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
      html += 'Clear</button>';
    }
    html += '</div>';
    if (!items.length) {
      html += '<div class="empty-state"><p>' + emptyText + '</p></div>';
    } else {
      items.forEach(function (item) { html += renderHistoryItemHtml(item); });
    }
    html += '</div>';
    return html;
  }

  function renderHistory() {
    const limit = Math.min(20, Math.max(5, settings.historyLimit || 5));

    if (currentTab === 'listing') {
      historyHeader.style.display = 'none';
      const viewed = viewedHistory.slice(0, limit);

      const eyeIcon = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

      const offMsg = 'History recording is off. Enable it in Settings.';
      historyList.innerHTML =
        renderSection('Recently Viewed', eyeIcon, viewed, 'clear-viewed-btn', settings.historyEnabled === false ? offMsg : 'No recently viewed properties');

      const cvBtn = document.getElementById('clear-viewed-btn');
      if (cvBtn) cvBtn.addEventListener('click', function () {
        viewedHistory = [];
        chrome.storage.local.set({ zillow_viewed_v3: [] });
        renderHistory();
      });

      historyList.querySelectorAll('.history-item[data-type]').forEach(function (el) {
        el.addEventListener('click', function () {
          chrome.tabs.create({ url: buildListingUrl(el.dataset.type, el.dataset.id) });
        });
      });
      attachCopyHandlers(historyList);
      return;
    }

    // Impersonate tab
    historyHeader.style.display = '';
    historyLabel.textContent = 'Recently Impersonated';
    const filtered = history.filter(function (h) { return h.type === 'impersonate'; }).slice(0, limit);
    clearBtn.classList.toggle('hidden', filtered.length === 0);

    if (!filtered.length) {
      const emptyMsg = settings.historyEnabled === false
        ? 'History recording is off. Enable it in Settings.'
        : 'No recent impersonations';
      historyList.innerHTML = '<div class="empty-state"><p>' + emptyMsg + '</p></div>';
      return;
    }

    historyList.innerHTML = filtered.map(renderHistoryItemHtml).join('');
    historyList.querySelectorAll('.history-item').forEach(function (el) {
      el.addEventListener('click', function () {
        chrome.tabs.create({ url: buildImpersonateUrl(el.dataset.method, el.dataset.id) });
      });
    });
    attachCopyHandlers(historyList);
  }

  clearBtn.addEventListener('click', function () {
    history = history.filter(function (h) { return h.type !== 'impersonate'; });
    saveHistory();
    renderHistory();
  });

  // ══════════════════════════════
  // CHANGELOG
  // ══════════════════════════════

  function parseChangelog(md) {
    const lines = md.split('\n');
    let html = '';
    let inList = false;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line === '---') {
        if (inList) { html += '</ul>'; inList = false; }
        continue;
      }
      // Skip top-level heading and meta prose
      if (line.startsWith('# ') || line.startsWith('All notable') ||
          line.startsWith('Versions are') || line.startsWith('Versioning follows') ||
          line.startsWith('- `0.') || line.startsWith('- `1.')) {
        continue;
      }
      // [Earlier] section
      if (/^## \[Earlier\]/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="cl-version"><span class="cl-version-num">Earlier</span></div>';
        continue;
      }
      // Version header: ## [0.7.3] – 2026-03-25
      const vMatch = line.match(/^## \[(.+?)\]\s*[–-]\s*(.+)/);
      if (vMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<div class="cl-version"><span class="cl-version-num">v${vMatch[1]}</span><span class="cl-version-date">${vMatch[2]}</span></div>`;
        continue;
      }
      // Section header: ### Added / ### Changed / ### Fixed
      const sMatch = line.match(/^### (.+)/);
      if (sMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<div class="cl-section">${sMatch[1]}</div><ul class="cl-list">`;
        inList = true;
        continue;
      }
      // List item
      const iMatch = line.match(/^- (.+)/);
      if (iMatch) {
        if (!inList) { html += '<ul class="cl-list">'; inList = true; }
        html += `<li>${iMatch[1]}</li>`;
        continue;
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  let changelogLoaded = false;

  changelogOpen.addEventListener('click', function () {
    changelogOverlay.classList.remove('hidden');
    if (!changelogLoaded) {
      fetch(chrome.runtime.getURL('CHANGELOG.md'))
        .then(function (r) { return r.text(); })
        .then(function (md) {
          changelogBody.innerHTML = parseChangelog(md);
          changelogLoaded = true;
        })
        .catch(function () {
          changelogBody.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-faint);font-size:13px;">Could not load changelog.</div>';
        });
    }
  });

  changelogClose.addEventListener('click', function () {
    changelogOverlay.classList.add('hidden');
  });

  changelogOverlay.addEventListener('click', function (e) {
    if (e.target === changelogOverlay) changelogOverlay.classList.add('hidden');
  });

  // ══════════════════════════════
  // SETTINGS
  // ══════════════════════════════

  settingsOpen.addEventListener('click', function () {
    settingsOverlay.classList.remove('hidden');
    settingHistoryLimit.value  = String(settings.historyLimit || 5);
    settingZpidTab.checked         = settings.zpidTabEnabled;
    settingFloatingTab.checked     = settings.floatingTabEnabled !== false;
    settingRedirectProfile.checked = settings.redirectEnabled !== false;
    settingHistory.checked         = settings.historyEnabled !== false;
    updateThemeButtons(settings.themeMode || 'auto');
    updateDefaultTabButtons(settings.defaultTab || 'listing');
  });

  settingsClose.addEventListener('click', function () {
    settingsOverlay.classList.add('hidden');
  });

  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
  });

  settingHistoryLimit.addEventListener('change', function () {
    const raw     = parseInt(settingHistoryLimit.value, 10);
    const clamped = Math.min(20, Math.max(5, isNaN(raw) ? 5 : raw));
    settingHistoryLimit.value = String(clamped);
    settings.historyLimit = clamped;
    saveSettings();
    if (history.length > clamped)       { history       = history.slice(0, clamped);       saveHistory(); }
    if (viewedHistory.length > clamped) { viewedHistory  = viewedHistory.slice(0, clamped); chrome.storage.local.set({ zillow_viewed_v3: viewedHistory }); }
    renderHistory();
  });

  settingZpidTab.addEventListener('change', function () {
    settings.zpidTabEnabled = settingZpidTab.checked;
    saveSettings();
    applyZpidTabVisibility();
  });

  settingFloatingTab.addEventListener('change', function () {
    settings.floatingTabEnabled = settingFloatingTab.checked;
    saveSettings();
  });

  settingRedirectProfile.addEventListener('change', function () {
    settings.redirectEnabled = settingRedirectProfile.checked;
    saveSettings();
  });

  settingHistory.addEventListener('change', function () {
    settings.historyEnabled = settingHistory.checked;
    saveSettings();
    if (!settings.historyEnabled) {
      history = [];
      viewedHistory = [];
      chrome.storage.local.set({ zillow_history_v3: [], zillow_viewed_v3: [] });
      renderHistory();
    }
  });

  settingTheme.addEventListener('click', function (e) {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    const mode = btn.dataset.themeVal;
    settings.themeMode = mode;
    saveSettings();
    applyTheme(mode);
    updateThemeButtons(mode);
  });

  settingDefaultTab.addEventListener('click', function (e) {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    settings.defaultTab = btn.dataset.tabVal;
    saveSettings();
    updateDefaultTabButtons(settings.defaultTab);
  });

  // ── Live storage updates (e.g. address label populated after background fetch) ──
  chrome.storage.onChanged.addListener(function (changes) {
    let needsRender = false;
    if (changes.zillow_history_v3) { history       = changes.zillow_history_v3.newValue || []; needsRender = true; }
    if (changes.zillow_viewed_v3)  { viewedHistory = changes.zillow_viewed_v3.newValue  || []; needsRender = true; }
    if (needsRender) renderHistory();
  });

})();
