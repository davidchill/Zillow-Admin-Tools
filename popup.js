// ── Zillow Admin Tools – Popup Script v2.7 ──

(function () {
  // ── State ──
  var currentTab   = 'impersonate';
  var currentMode  = 'zuid';
  var listingMode  = 'zillow';
  var history = [];
  var viewedHistory = [];
  var settings = { historyLimit: 5, zpidTabEnabled: true, floatingTabEnabled: true, redirectEnabled: true, themeMode: 'auto', historyEnabled: true };
  var pendingConfirm = null;

  var IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';
  var METHOD_DISPLAY = { email: 'Email', zuid: 'ZUID', screenname: 'Screen Name' };

  // ── DOM refs ──
  var tabImp              = document.getElementById('tab-imp');
  var tabZpid             = document.getElementById('tab-zpid');
  var modeRow             = document.getElementById('mode-row');
  var modeBtns            = modeRow.querySelectorAll('.mode-btn');
  var inputLabel          = document.getElementById('input-label');
  var mainInput           = document.getElementById('main-input');
  var goBtn               = document.getElementById('go-btn');
  var errorMsg            = document.getElementById('error-msg');
  var impSearch           = document.getElementById('imp-search');
  var listingSearch       = document.getElementById('listing-search');
  var zpidInput           = document.getElementById('zpid-input');
  var zpidGoBtn           = document.getElementById('zpid-go-btn');
  var zpidErrorMsg        = document.getElementById('zpid-error-msg');
  var addrInput           = document.getElementById('addr-input');
  var addrGoBtn           = document.getElementById('addr-go-btn');
  var addrErrorMsg        = document.getElementById('addr-error-msg');
  var historyHeader       = document.getElementById('history-header');
  var historyLabel        = document.getElementById('history-label');
  var historyList         = document.getElementById('history-list');
  var clearBtn            = document.getElementById('clear-btn');
  var footerText          = document.getElementById('footer-text');
  var confirmBar          = document.getElementById('confirm-bar');
  var confirmText         = document.getElementById('confirm-text');
  var confirmYes          = document.getElementById('confirm-yes');
  var confirmNo           = document.getElementById('confirm-no');
  var settingsOpen        = document.getElementById('settings-open');
  var settingsOverlay     = document.getElementById('settings-overlay');
  var settingsClose       = document.getElementById('settings-close');
  var settingHistoryLimit = document.getElementById('setting-history-limit');
  var settingZpidTab      = document.getElementById('setting-zpid-tab');
  var settingFloatingTab       = document.getElementById('setting-floating-tab');
  var settingRedirectProfile   = document.getElementById('setting-redirect-profile');
  var settingHistory           = document.getElementById('setting-history');
  var settingTheme             = document.getElementById('setting-theme');
  var tabsRow             = document.querySelector('.tabs');
  var acDropdown          = document.getElementById('ac-dropdown');
  var listingModeRow      = document.getElementById('listing-mode-row');
  var listingModeBtns     = listingModeRow.querySelectorAll('.mode-btn');
  var addrSearch          = document.getElementById('addr-search');

  // ── Autocomplete state ──
  var acDebounceTimer = null;
  var acResults = [];
  var acActiveIdx = -1;

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
        settingZpidTab.checked          = settings.zpidTabEnabled;
        settingFloatingTab.checked      = settings.floatingTabEnabled;
        settingRedirectProfile.checked  = settings.redirectEnabled;
        settingHistory.checked          = settings.historyEnabled;
        applyTheme(settings.themeMode);
      }
      if (data.zillow_history_v3) history = data.zillow_history_v3;
      if (data.zillow_viewed_v3)  viewedHistory = data.zillow_viewed_v3;
      applyZpidTabVisibility();
      renderHistory();
      if (callback) callback();
    });
  }

  loadFromStorage();

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
    var p = new URLSearchParams();
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
    // Address search only shown in Zillow mode
    addrSearch.classList.toggle('hidden', mode !== 'zillow');
    // Clear ZPID input and errors
    zpidInput.value = '';
    zpidErrorMsg.textContent = '';
    zpidInput.classList.remove('has-error');
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
    var filtered = viewedHistory.filter(function (h) { return h.id !== zpid; });
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
      var meta      = r.metaData || {};
      var address   = meta.addressString || r.display || '';
      var cityState = meta.cityStateZip  || '';
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
    var meta = result.metaData || {};
    var zpid = meta.zpid ? String(meta.zpid) : null;
    if (!zpid) { hideAcDropdown(); return; }

    var url   = 'https://www.zillow.com/homedetails/' + zpid + '_zpid/';
    var label = result.display || '';
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
    var slug = address.trim().replace(/,/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    chrome.tabs.create({ url: 'https://www.zillow.com/homes/for_sale/' + slug + '_rb/' });
    addrInput.value = '';
    hideAcDropdown();
  }

  // ══════════════════════════════
  // ZPID TAB VISIBILITY
  // ══════════════════════════════

  function applyZpidTabVisibility() {
    var show = settings.zpidTabEnabled;
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
    addrInput.value = '';
    addrErrorMsg.textContent = '';
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
    var labels = { auto: 'Email, ZUID, or Screen Name', email: 'Email Address', zuid: 'User ID (ZUID)', screenname: 'Screen Name' };
    var placeholders = { auto: 'Email, ZUID, or Screen Name', email: 'e.g. user@example.com', zuid: 'e.g. 12345678', screenname: 'e.g. johndoe42' };
    var footers = {
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
    var raw = zpidInput.value.trim();
    zpidErrorMsg.textContent = '';
    zpidInput.classList.remove('has-error');
    if (!raw) return;
    var cleanId = raw.replace(/\D/g, '');
    if (!cleanId) {
      zpidErrorMsg.textContent = 'Please enter a numeric ZPID.';
      zpidInput.classList.add('has-error');
      return;
    }
    var url = buildListingUrl(listingMode, cleanId);
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
      var q = addrInput.value.trim();
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
      var q = addrInput.value.trim();
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
    var raw = mainInput.value.trim();
    if (!raw) return;
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
    hideConfirm();

    if (currentMode === 'auto') {
      var detected = detectMethod(raw);
      if (detected.error) { showError(detected.error); return; }
      showConfirm(detected.method, detected.value);
      return;
    }

    var method = currentMode;
    var value  = raw;
    if (method === 'email' && !validateEmail(value)) { showError('Please enter a valid email address.'); return; }
    if (method === 'zuid'  && !/^\d+$/.test(value))  { showError('ZUID must be numeric.'); return; }
    executeImpersonate(method, value);
    mainInput.value = '';
  }

  function executeImpersonate(method, value) {
    var url = buildImpersonateUrl(method, value);
    chrome.tabs.create({ url: url }, function (tab) {
      requestScrape(tab.id, value, 'impersonate');
    });
    if (settings.historyEnabled !== false) addToHistory('impersonate', value, method);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    mainInput.classList.add('has-error');
  }

  goBtn.addEventListener('click', doSearch);
  mainInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  // ══════════════════════════════
  // HISTORY
  // ══════════════════════════════

  function addToHistory(type, id, method, label) {
    var limit = Math.min(20, Math.max(5, settings.historyLimit || 5));
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
        var id = span.dataset.copyId;
        navigator.clipboard.writeText(id).then(function () {
          var svg = span.querySelector('svg');
          svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
          span.classList.add('copy-ok');
          setTimeout(function () {
            svg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
            span.classList.remove('copy-ok');
          }, 1500);
        });
      });
    });
  }

  function renderHistoryItemHtml(item) {
    var badgeClass, badgeText;
    if      (item.type === 'viewed')     { badgeClass = 'badge-viewed'; badgeText = 'Viewed'; }
    else if (item.type === 'zpid')       { badgeClass = 'badge-zpid';   badgeText = 'ZPID'; }
    else if (item.type === 'phx')        { badgeClass = 'badge-phx';    badgeText = 'PHX'; }
    else if (item.type === 'dit')        { badgeClass = 'badge-dit';    badgeText = 'DIT'; }
    else { // impersonate
      badgeClass = 'badge-' + (item.method || 'zuid');
      badgeText  = item.method === 'screenname' ? 'Screen' : (item.method || 'ZUID').toUpperCase();
    }
    var subLine   = item.label ? '<div class="history-item-sub">' + escapeHtml(item.label) + '</div>' : '';
    var dataAttrs = 'data-type="' + escapeHtml(item.type) + '" data-id="' + escapeHtml(item.id) + '"' +
      (item.method ? ' data-method="' + escapeHtml(item.method) + '"' : '');
    var copyLabel;
    if (item.type === 'zpid' || item.type === 'phx' || item.type === 'dit' || item.type === 'viewed') {
      copyLabel = 'Copy ZPID';
    } else if (item.method === 'email') {
      copyLabel = 'Copy Email';
    } else if (item.method === 'screenname') {
      copyLabel = 'Copy Screen Name';
    } else {
      copyLabel = 'Copy ZUID';
    }
    var copySpan = '<span class="copy-btn" data-copy-id="' + escapeHtml(item.id) + '" data-tip="' + copyLabel + '">' +
      '<svg class="copy-icon" viewBox="0 0 24 24">' +
        '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
      '</svg></span>';
    return '<button class="history-item" ' + dataAttrs + '>' +
      '<div class="history-item-top">' +
        '<span class="history-item-id"><span class="badge ' + badgeClass + '">' + badgeText + '</span> ' + escapeHtml(item.id) + '</span>' +
        '<div style="display:flex;align-items:center;gap:4px;">' +
          copySpan +
          '<svg class="ext-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
        '</div>' +
      '</div>' +
      subLine +
      '</button>';
  }

  function renderSection(titleText, iconSvg, items, clearId, emptyText) {
    var html = '<div class="listing-section">';
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
    var limit = Math.min(20, Math.max(5, settings.historyLimit || 5));

    if (currentTab === 'listing') {
      historyHeader.style.display = 'none';
      var searches = history.filter(function (h) { return h.type === 'zpid' || h.type === 'phx' || h.type === 'dit'; }).slice(0, limit);
      var viewed   = viewedHistory.slice(0, limit);

      var searchIcon = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
      var eyeIcon    = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

      var offMsg = 'History recording is off. Enable it in Settings.';
      historyList.innerHTML =
        renderSection('Recent Searches', searchIcon, searches, 'clear-searches-btn', settings.historyEnabled === false ? offMsg : 'No recent searches') +
        renderSection('Recently Viewed',  eyeIcon,    viewed,   'clear-viewed-btn',   settings.historyEnabled === false ? offMsg : 'No recently viewed properties');

      var csBtn = document.getElementById('clear-searches-btn');
      if (csBtn) csBtn.addEventListener('click', function () {
        history = history.filter(function (h) { return h.type !== 'zpid' && h.type !== 'phx' && h.type !== 'dit'; });
        saveHistory();
        renderHistory();
      });

      var cvBtn = document.getElementById('clear-viewed-btn');
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
    historyLabel.textContent = 'Recent Impersonations';
    var filtered = history.filter(function (h) { return h.type === 'impersonate'; }).slice(0, limit);
    clearBtn.classList.toggle('hidden', filtered.length === 0);

    if (!filtered.length) {
      var emptyMsg = settings.historyEnabled === false
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
  });

  settingsClose.addEventListener('click', function () {
    settingsOverlay.classList.add('hidden');
  });

  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
  });

  settingHistoryLimit.addEventListener('change', function () {
    var raw     = parseInt(settingHistoryLimit.value, 10);
    var clamped = Math.min(20, Math.max(5, isNaN(raw) ? 5 : raw));
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
    var btn = e.target.closest('.theme-btn');
    if (!btn) return;
    var mode = btn.dataset.themeVal;
    settings.themeMode = mode;
    saveSettings();
    applyTheme(mode);
    updateThemeButtons(mode);
  });

  // ── Live storage updates (e.g. address label populated after background fetch) ──
  chrome.storage.onChanged.addListener(function (changes) {
    var needsRender = false;
    if (changes.zillow_history_v3) { history       = changes.zillow_history_v3.newValue || []; needsRender = true; }
    if (changes.zillow_viewed_v3)  { viewedHistory = changes.zillow_viewed_v3.newValue  || []; needsRender = true; }
    if (needsRender) renderHistory();
  });

})();
