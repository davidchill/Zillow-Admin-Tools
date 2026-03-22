// ── Zillow Admin Tools – Popup Script v2.1 ──

(function () {
  // ── State ──
  var currentTab = 'impersonate';
  var currentMode = 'auto';
  var history = [];
  var settings = { historyLimit: 5, zpidTabEnabled: true, floatingTabEnabled: true };
  var pendingConfirm = null; // { method, value }

  var IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';
  var METHOD_DISPLAY = { email: 'Email', zuid: 'ZUID', screenname: 'Screen Name' };

  // ── DOM refs ──
  var tabImp = document.getElementById('tab-imp');
  var tabZpid = document.getElementById('tab-zpid');
  var modeRow = document.getElementById('mode-row');
  var modeBtns = modeRow.querySelectorAll('.mode-btn');
  var inputLabel = document.getElementById('input-label');
  var mainInput = document.getElementById('main-input');
  var goBtn = document.getElementById('go-btn');
  var errorMsg = document.getElementById('error-msg');
  var historyLabel = document.getElementById('history-label');
  var historyList = document.getElementById('history-list');
  var clearBtn = document.getElementById('clear-btn');
  var footerText = document.getElementById('footer-text');
  var confirmBar = document.getElementById('confirm-bar');
  var confirmText = document.getElementById('confirm-text');
  var confirmYes = document.getElementById('confirm-yes');
  var confirmNo = document.getElementById('confirm-no');
  var settingsOpen = document.getElementById('settings-open');
  var settingsOverlay = document.getElementById('settings-overlay');
  var settingsClose = document.getElementById('settings-close');
  var settingHistoryLimit = document.getElementById('setting-history-limit');
  var settingZpidTab     = document.getElementById('setting-zpid-tab');
  var settingFloatingTab = document.getElementById('setting-floating-tab');
  var tabsRow = document.querySelector('.tabs');

  // ── Load settings + history from chrome.storage ──
  function loadFromStorage(callback) {
    chrome.storage.local.get(['zillow_history_v3', 'zillow_settings'], function (data) {
      if (data.zillow_settings) {
        settings = data.zillow_settings;
        settingHistoryLimit.value = String(settings.historyLimit || 5);
        if (typeof settings.zpidTabEnabled === 'undefined')    settings.zpidTabEnabled    = true;
        if (typeof settings.floatingTabEnabled === 'undefined') settings.floatingTabEnabled = true;
        settingZpidTab.checked     = settings.zpidTabEnabled;
        settingFloatingTab.checked = settings.floatingTabEnabled;
      }
      if (data.zillow_history_v3) {
        history = data.zillow_history_v3;
      }
      applyZpidTabVisibility();
      renderHistory();
      if (callback) callback();
    });
  }

  // Initial load
  loadFromStorage();

  // Re-load history every time the popup becomes visible (picks up labels added by background.js)
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      loadFromStorage();
    }
  });

  function saveHistory() {
    chrome.storage.local.set({ zillow_history_v3: history });
  }

  function saveSettings() {
    chrome.storage.local.set({ zillow_settings: settings });
  }

  // ── Email validation ──
  function validateEmail(email) {
    return /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i.test(email);
  }

  // ── Build impersonation URL ──
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

  // ── Auto-detect input type ──
  function detectMethod(input) {
    if (input.includes('@')) {
      return validateEmail(input) ? { method: 'email', value: input } : { error: 'Invalid email address format.' };
    }
    if (/^\d+$/.test(input)) return { method: 'zuid', value: input };
    return { method: 'screenname', value: input };
  }

  // ══════════════════════════════════════════
  // REQUEST SCRAPE FROM BACKGROUND.JS
  // The popup sends a message to the service
  // worker which persists after the popup closes.
  // ══════════════════════════════════════════

  function requestScrape(tabId, historyId, historyType) {
    chrome.runtime.sendMessage({
      action: 'scrapeTab',
      tabId: tabId,
      historyId: historyId,
      historyType: historyType
    });
  }

  // ══════════════════════════════
  // ZPID TAB VISIBILITY
  // ══════════════════════════════

  function applyZpidTabVisibility() {
    var show = settings.zpidTabEnabled;
    tabZpid.classList.toggle('hidden', !show);
    // If ZPID tab is hidden but currently active, switch to impersonate
    if (!show && currentTab === 'zpid') {
      switchTab('impersonate');
    }
    // If only one tab visible, hide the tab bar entirely for a cleaner look
    tabsRow.classList.toggle('hidden', !show);
  }

  // ══════════════════════════════
  // TAB SWITCHING
  // ══════════════════════════════

  function switchTab(tab) {
    currentTab = tab;
    tabImp.classList.toggle('active', tab === 'impersonate');
    tabZpid.classList.toggle('active', tab === 'zpid');
    modeRow.classList.toggle('hidden', tab === 'zpid');
    mainInput.value = '';
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
    hideConfirm();

    if (tab === 'zpid') {
      inputLabel.textContent = 'Property ID (ZPID)';
      mainInput.placeholder = 'e.g. 29122711';
      historyLabel.textContent = 'Recent Properties';
      footerText.textContent = 'The ZPID is a unique property ID found in Zillow listing URLs.';
    } else {
      updateImpersonateLabels();
      historyLabel.textContent = 'Recent Impersonations';
    }
    renderHistory();
  }

  tabImp.addEventListener('click', function () { switchTab('impersonate'); });
  tabZpid.addEventListener('click', function () { switchTab('zpid'); });

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
    mainInput.placeholder = placeholders[currentMode];
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

  confirmNo.addEventListener('click', function () {
    hideConfirm();
    mainInput.focus();
  });

  // ══════════════════════════════
  // SEARCH / GO
  // ══════════════════════════════

  function doSearch() {
    var raw = mainInput.value.trim();
    if (!raw) return;
    errorMsg.textContent = '';
    mainInput.classList.remove('has-error');
    hideConfirm();

    if (currentTab === 'zpid') {
      var cleanId = raw.replace(/\D/g, '');
      if (!cleanId) return;
      var url = 'https://www.zillow.com/homedetails/' + cleanId + '_zpid/';
      chrome.tabs.create({ url: url }, function (tab) {
        requestScrape(tab.id, cleanId, 'zpid');
      });
      addToHistory('zpid', cleanId, 'zpid');
      mainInput.value = '';
      return;
    }

    // Impersonate
    if (currentMode === 'auto') {
      var detected = detectMethod(raw);
      if (detected.error) { showError(detected.error); return; }
      // Show confirmation before proceeding
      showConfirm(detected.method, detected.value);
      return;
    }

    // Explicit mode — go directly
    var method = currentMode;
    var value = raw;
    if (method === 'email' && !validateEmail(value)) { showError('Please enter a valid email address.'); return; }
    if (method === 'zuid' && !/^\d+$/.test(value)) { showError('ZUID must be numeric.'); return; }

    executeImpersonate(method, value);
    mainInput.value = '';
  }

  function executeImpersonate(method, value) {
    var url = buildImpersonateUrl(method, value);
    chrome.tabs.create({ url: url }, function (tab) {
      requestScrape(tab.id, value, 'impersonate');
    });
    addToHistory('impersonate', value, method);
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

  function addToHistory(type, id, method) {
    var limit = settings.historyLimit || 5;
    history = [
      { type: type, id: id, method: method, label: '', timestamp: Date.now() }
    ].concat(
      history.filter(function (h) { return !(h.id === id && h.type === type); })
    ).slice(0, limit);
    saveHistory();
    renderHistory();
  }

  clearBtn.addEventListener('click', function () {
    history = [];
    saveHistory();
    renderHistory();
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderHistory() {
    var limit = settings.historyLimit || 5;
    var filtered = history.filter(function (h) { return h.type === currentTab; }).slice(0, limit);

    clearBtn.classList.toggle('hidden', filtered.length === 0);

    if (filtered.length === 0) {
      var emptyLabel = currentTab === 'zpid' ? 'searches' : 'impersonations';
      historyList.innerHTML = '<div class="empty-state"><p>No recent ' + emptyLabel + '</p></div>';
      return;
    }

    historyList.innerHTML = filtered.map(function (item) {
      var badgeClass = item.type === 'zpid' ? 'badge-zpid' : ('badge-' + (item.method || 'zuid'));
      var badgeText = item.type === 'zpid' ? 'ZPID' : (item.method === 'screenname' ? 'Screen' : (item.method || 'zuid').toUpperCase());
      var subLine = '';
      if (item.label) {
        subLine = '<div class="history-item-sub">' + escapeHtml(item.label) + '</div>';
      }
      return '<button class="history-item" data-type="' + escapeHtml(item.type) + '" data-id="' + escapeHtml(item.id) + '" data-method="' + escapeHtml(item.method || 'zuid') + '">' +
        '<div class="history-item-top">' +
          '<span class="history-item-id"><span class="badge ' + badgeClass + '">' + badgeText + '</span> ' + escapeHtml(item.id) + '</span>' +
          '<svg class="ext-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
        '</div>' +
        subLine +
      '</button>';
    }).join('');

    // Attach click listeners
    historyList.querySelectorAll('.history-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var type = el.dataset.type;
        var id = el.dataset.id;
        var method = el.dataset.method;
        var url = type === 'zpid'
          ? 'https://www.zillow.com/homedetails/' + id + '_zpid/'
          : buildImpersonateUrl(method, id);
        chrome.tabs.create({ url: url });
      });
    });
  }

  // ══════════════════════════════
  // SETTINGS
  // ══════════════════════════════

  settingsOpen.addEventListener('click', function () {
    settingsOverlay.classList.remove('hidden');
    settingHistoryLimit.value      = String(settings.historyLimit || 5);
    settingZpidTab.checked         = settings.zpidTabEnabled;
    settingFloatingTab.checked     = settings.floatingTabEnabled !== false;
  });

  settingsClose.addEventListener('click', function () {
    settingsOverlay.classList.add('hidden');
  });

  // Close settings when clicking the overlay background
  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.add('hidden');
    }
  });

  settingHistoryLimit.addEventListener('change', function () {
    var newLimit = parseInt(settingHistoryLimit.value, 10);
    settings.historyLimit = newLimit;
    saveSettings();
    // Trim history if needed
    if (history.length > newLimit) {
      history = history.slice(0, newLimit);
      saveHistory();
    }
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

})();
