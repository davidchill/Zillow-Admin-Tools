// ── Zillow Admin Tools – Background Service Worker v2.1 ──
// Context-menu impersonation + page scraping for history labels

const IMPERSONATE_URL = 'https://www.zillow.com/user/Impersonate.htm';

// Email validation (same regex used in the popup)
function validateEmail(email) {
  const re = /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
  return re.test(email);
}

// Build the impersonation URL with both modern and legacy query params
function buildImpersonateUrl(method, value) {
  const params = new URLSearchParams();
  switch (method) {
    case 'email':
      params.set('pEmail', value);
      params.set('email', value);
      break;
    case 'zuid':
      params.set('pZuid', value);
      params.set('zuid', value);
      params.set('action', 'impersonate');
      params.set('confirm', '1');
      break;
    case 'screenname':
      params.set('pScreenName', value);
      params.set('screenName', value);
      break;
  }
  return IMPERSONATE_URL + '?' + params.toString();
}

function openInNewTab(url) {
  chrome.tabs.create({ url });
}

function showAlert(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg) => { alert(msg); },
    args: [message]
  });
}

const ERROR_MESSAGE =
  'A valid e-mail address, Zillow User ID (ZUID), or screen name is not selected. ' +
  'Please first select one of these and try again.';

// ══════════════════════════════════════════
// PAGE SCRAPING – runs in the service worker
// so it persists after the popup closes
// ══════════════════════════════════════════

function scrapeTabForLabel(tabId, historyId, historyType) {
  function onUpdated(updatedTabId, changeInfo) {
    if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(onUpdated);

    // Give the page a moment to render its full title
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const result = { title: document.title };
          const addrEl = document.querySelector('[data-testid="bdp-bed-bath-beyond"] h1') ||
                         document.querySelector('h1.ds-address-container') ||
                         document.querySelector('h1');
          if (addrEl) result.heading = addrEl.textContent.trim();
          return result;
        }
      }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) return;
        const data = results[0].result;
        if (!data) return;

        let label = '';
        if (historyType === 'zpid') {
          // Title format: "123 Main St, City, ST 12345 | Zillow"
          const title = data.title || '';
          const pipeIdx = title.indexOf(' |');
          const dashIdx = title.indexOf(' -');
          const cutIdx = pipeIdx > 0 ? pipeIdx : (dashIdx > 0 ? dashIdx : -1);
          label = cutIdx > 0 ? title.substring(0, cutIdx).trim() : (data.heading || '');
        } else {
          // For impersonation pages, try to extract user info from the title
          const title = data.title || '';
          if (title && title !== 'Zillow' && !title.includes('Impersonate')) {
            label = title.replace(/ \|.*$/, '').replace(/ -.*$/, '').trim();
          }
        }

        if (label) {
          // Update the matching history item in chrome.storage
          chrome.storage.local.get('zillow_history_v3', (storageData) => {
            const history = storageData.zillow_history_v3 || [];
            let updated = false;
            for (let i = 0; i < history.length; i++) {
              if (history[i].id === historyId && history[i].type === historyType && !history[i].label) {
                history[i].label = label;
                updated = true;
                break;
              }
            }
            if (updated) {
              chrome.storage.local.set({ zillow_history_v3: history });
            }
          });
        }
      });
    }, 3000);
  }

  chrome.tabs.onUpdated.addListener(onUpdated);

  // Safety: remove listener after 20s to avoid leaks
  setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(onUpdated);
  }, 20000);
}

// ══════════════════════════════════════════
// ZPID ADDRESS FETCH – background fetch of the Zillow listing page to
// extract the property address for listing history items (zpid / phx / dit).
// Runs entirely in the service worker; updates storage when done so that
// the popup and side panel re-render with the address sub-line.
// ══════════════════════════════════════════

async function fetchZpidAddress(zpid, historyType) {
  const url = 'https://www.zillow.com/homedetails/' + zpid + '_zpid/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!res.ok) return;
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (!titleMatch) return;
    const title    = titleMatch[1];
    const pipeIdx  = title.indexOf(' |');
    const dashIdx  = title.indexOf(' -');
    const cutIdx   = pipeIdx > 0 ? pipeIdx : (dashIdx > 0 ? dashIdx : -1);
    const label    = cutIdx > 0 ? title.substring(0, cutIdx).trim() : title.trim();
    if (!label || /zillow/i.test(label) || /page not found/i.test(label)) return;

    chrome.storage.local.get('zillow_history_v3', (storageData) => {
      const history = storageData.zillow_history_v3 || [];
      let updated = false;
      for (let i = 0; i < history.length; i++) {
        if (history[i].id === zpid && history[i].type === historyType && !history[i].label) {
          history[i].label = label;
          updated = true;
          break;
        }
      }
      if (updated) chrome.storage.local.set({ zillow_history_v3: history });
    });
  } catch (e) {
    // silently fail — address display is best-effort
  }
}

// ── Zillow autocomplete ──
// Primary path: inject fetch into an active Zillow tab so the request
// carries Origin: https://www.zillow.com (accepted by zillowstatic.com CDN).
// The extension's own origin is rejected with 403, so direct fetch is only
// used as a last-resort fallback.
function fetchAutocompleteInTab(query, callback) {
  chrome.tabs.query({ url: 'https://www.zillow.com/*' }, function (tabs) {
    if (!tabs || tabs.length === 0) { callback(null); return; }
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (q) {
        var url = 'https://www.zillowstatic.com/autocomplete/v3/suggestions' +
          '?q=' + encodeURIComponent(q) +
          '&abKey=&resultTypes=allhomes&resultCount=6';
        return fetch(url, { credentials: 'omit' })
          .then(function (r) { return r.ok ? r.json() : { results: [] }; })
          .then(function (data) { return data.results || []; })
          .catch(function () { return []; });
      },
      args: [query]
    }, function (injectionResults) {
      if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
        callback([]);
      } else {
        callback(injectionResults[0].result || []);
      }
    });
  });
}

// Fallback: direct fetch from the service worker (may be blocked by CDN CORS)
async function fetchAutocomplete(query) {
  const url =
    'https://www.zillowstatic.com/autocomplete/v3/suggestions' +
    '?q=' + encodeURIComponent(query) +
    '&abKey=&resultTypes=allhomes&resultCount=6';
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://www.zillow.com/'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

// ── Message listener ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Scrape requests from the popup
  if (message.action === 'scrapeTab') {
    scrapeTabForLabel(message.tabId, message.historyId, message.historyType);
    sendResponse({ ok: true });
  }
  // Background address fetch for listing history items (zpid / phx / dit)
  if (message.action === 'fetchAddress') {
    fetchZpidAddress(message.zpid, message.historyType);
    sendResponse({ ok: true });
  }
  // FAB click on any page — open the Side Panel
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
    sendResponse({ ok: true });
  }
  // Autocomplete address query — primary path runs inside a Zillow tab
  // so the request carries Origin: https://www.zillow.com
  if (message.action === 'autocomplete') {
    fetchAutocompleteInTab(message.query, function (tabResults) {
      if (tabResults && tabResults.length > 0) {
        sendResponse({ ok: true, results: tabResults });
      } else {
        // Fall back to direct service-worker fetch
        fetchAutocomplete(message.query)
          .then(function (r) { sendResponse({ ok: true, results: r }); })
          .catch(function ()  { sendResponse({ ok: false, results: [] }); });
      }
    });
    return true; // keep message channel open for async response
  }
});

// ══════════════════════════════════════════
// PASSIVE IMPERSONATION TRACKER
// Watches every tab for navigation to Impersonate.htm and records it in
// history — whether the extension initiated it or not (direct URL, bookmark,
// context menu, external script, etc.).
//
// Duplicate prevention: if the same id+method was already added within the
// last 5 seconds (e.g. by the popup/sidepanel before opening the tab), the
// entry is skipped to avoid double-counting extension-initiated impersonations.
// ══════════════════════════════════════════

function parseImpersonateUrl(url) {
  if (!url || !url.includes('Impersonate.htm')) return null;
  try {
    const params = new URL(url).searchParams;
    const email      = params.get('pEmail')      || params.get('email');
    if (email) return { method: 'email', value: email };
    const zuid       = params.get('pZuid')       || params.get('zuid');
    if (zuid)  return { method: 'zuid',  value: zuid };
    const screenName = params.get('pScreenName') || params.get('screenName');
    if (screenName) return { method: 'screenname', value: screenName };
    return null;
  } catch (e) {
    return null;
  }
}

function addPassiveImpersonation(method, value) {
  chrome.storage.local.get(['zillow_history_v3', 'zillow_settings'], (data) => {
    const settings = data.zillow_settings || {};
    const limit    = Math.min(20, Math.max(5, settings.historyLimit || 5));
    const history  = data.zillow_history_v3 || [];
    const now      = Date.now();

    // Skip if an identical entry was added in the last 5 seconds
    const isDupe = history.some(h =>
      h.type === 'impersonate' && h.id === value && h.method === method &&
      (now - h.timestamp) < 5000
    );
    if (isDupe) return;

    const updated = [{ type: 'impersonate', id: value, method, label: '', timestamp: now }]
      .concat(history.filter(h => !(h.type === 'impersonate' && h.id === value && h.method === method)))
      .slice(0, limit);
    chrome.storage.local.set({ zillow_history_v3: updated });
  });
}

// NEW tab created with an Impersonate URL (context menu, popup, sidepanel — all
// call chrome.tabs.create, so onUpdated never gets changeInfo.url for these).
// tab.pendingUrl holds the destination URL before the page even starts loading.
chrome.tabs.onCreated.addListener((tab) => {
  const url = tab.pendingUrl || tab.url || '';
  const parsed = parseImpersonateUrl(url);
  if (parsed) {
    addPassiveImpersonation(parsed.method, parsed.value);
    scrapeTabForLabel(tab.id, parsed.value, 'impersonate');
  }
});

// EXISTING tab navigating to an Impersonate URL (address bar, bookmark, etc.)
// changeInfo.url is only populated when the URL changes in an already-open tab.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  const parsed = parseImpersonateUrl(changeInfo.url);
  if (parsed) addPassiveImpersonation(parsed.method, parsed.value);
});

// ── Context menu click handler ──
chrome.contextMenus.onClicked.addListener((info, tab) => {

  // ── Zillow - Impersonate ──
  if (info.menuItemId === 'zillow-impersonate') {
    // 1. User selected text
    if (info.selectionText) {
      const text = info.selectionText.trim();

      if (text.includes('@')) {
        if (validateEmail(text)) {
          openInNewTab(buildImpersonateUrl('email', text));
        } else {
          showAlert(tab.id,
            'A valid e-mail address is not selected. Please select a valid e-mail address or click an e-mail link.');
        }
      } else if (/^\d+$/.test(text)) {
        openInNewTab(buildImpersonateUrl('zuid', text));
      } else {
        openInNewTab(buildImpersonateUrl('screenname', text));
      }
      return;
    }

    // 2. Right-clicked a link
    if (info.linkUrl) {
      if (/^mailto:/i.test(info.linkUrl)) {
        const email = info.linkUrl.replace(/^mailto:/i, '');
        openInNewTab(buildImpersonateUrl('email', email));
      } else {
        // Assume profile link – extract screen name from second-to-last path segment
        const parts = info.linkUrl.split('/');
        const screenName = parts[parts.length - 2];
        openInNewTab(buildImpersonateUrl('screenname', screenName));
      }
      return;
    }

    // 3. Right-clicked on a profile page (no selection, no link)
    if (info.pageUrl && info.pageUrl.includes('profile')) {
      const parts = info.pageUrl.split('/');
      const screenName = parts[parts.length - 2];
      openInNewTab(buildImpersonateUrl('screenname', screenName));
      return;
    }

    // 4. Nothing useful to extract
    showAlert(tab.id, ERROR_MESSAGE);
    return;
  }

});

// ── Create context menu entries on install ──
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'zillow-impersonate',
    title: 'Zillow - Impersonate',
    contexts: ['page', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });
});
