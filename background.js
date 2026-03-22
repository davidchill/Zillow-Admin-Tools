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

// ── Message listener ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Scrape requests from the popup
  if (message.action === 'scrapeTab') {
    scrapeTabForLabel(message.tabId, message.historyId, message.historyType);
    sendResponse({ ok: true });
  }
  // FAB click on any page — open the Side Panel
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
    sendResponse({ ok: true });
  }
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
