// ── Zillow Admin Tools – Background Service Worker ──

import { validateEmail } from '@/utils/validation';
import { buildImpersonateUrl, PROFILE_REDIRECT, CONSUMER_REDIRECT } from '@/utils/urls';
import type { BackgroundMessage } from '@/types';

export default defineBackground(() => {
  // ── Side Panel state tracking ──────────────────────────────────────────────
  //
  // Write-through cache: openPanelWindows is the in-memory Set used for the
  // synchronous open/close decision (chrome.sidePanel.open() must be called
  // within a synchronous user-gesture handler — an async read would lose that
  // context). chrome.storage.session is written on every change and read once
  // on SW startup so the toggle state survives MV3 service worker restarts.
  // storage.session is cleared on browser restart, matching tab/panel lifetime.

  const SESSION_PANELS_KEY = 'zat_open_panels';
  let openPanelWindows = new Set<number>();

  // Hydrate from session storage when the service worker wakes up.
  // Note: sidePanel.open/close requires a synchronous user gesture, so this
  // async read cannot gate the openSidePanel handler. In the rare cold-start
  // race (SW wakes up, message arrives before this callback fires), the Set
  // is empty and the toggle opens instead of closes — it self-corrects on the
  // next click via the onConnect port tracking.
  chrome.storage.session.get(SESSION_PANELS_KEY, (data) => {
    openPanelWindows = new Set<number>((data[SESSION_PANELS_KEY] as number[]) || []);
  });

  function savePanelWindows() {
    chrome.storage.session.set({ [SESSION_PANELS_KEY]: [...openPanelWindows] });
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (!port.name.startsWith('zat-sidepanel-')) return;
    const windowId = parseInt(port.name.replace('zat-sidepanel-', ''), 10);
    if (!isNaN(windowId)) {
      openPanelWindows.add(windowId);
      savePanelWindows();
      port.onDisconnect.addListener(() => {
        openPanelWindows.delete(windowId);
        savePanelWindows();
      });
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function openInNewTab(url: string) {
    chrome.tabs.create({ url });
  }

  function showAlert(tabId: number, message: string) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (msg: string) => { alert(msg); },
      args: [message],
    });
  }

  const ERROR_MESSAGE =
    'A valid e-mail address, Zillow User ID (ZUID), or screen name is not selected. ' +
    'Please first select one of these and try again.';

  // ── Post-Impersonation Smart Redirect ──────────────────────────────────────
  //
  // Consumer  →  Account.htm  (one hop)
  // Agent     →  Account.htm  →  Profile.htm  (ZPA items detected)

  function redirectAfterImpersonate(tabId: number) {
    let impersonateDone = false;
    function onImpersonateComplete(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
      impersonateDone = true;
      chrome.tabs.onUpdated.removeListener(onImpersonateComplete);

      chrome.storage.local.get('zillow_settings', (data) => {
        const settings = (data.zillow_settings as Record<string, unknown>) || {};
        if (settings.redirectEnabled === false) return;

        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) return;
          const currentUrl = tab.url || '';

          if (currentUrl.includes('/myzillow/')) {
            runDetection(tabId);
          } else {
            chrome.tabs.update(tabId, { url: CONSUMER_REDIRECT }, () => {
              if (chrome.runtime.lastError) return;
              // Use onDOMContentLoaded instead of tabs 'complete' so we trigger
              // detection as soon as the HTML is parsed — before images and
              // third-party scripts finish loading.  A 300 ms buffer gives React
              // time to hydrate ZPA nav elements before the DOM query runs.
              function onDomReady(
                details: chrome.webNavigation.WebNavigationFramedCallbackDetails
              ) {
                if (details.tabId !== tabId || details.frameId !== 0) return;
                chrome.webNavigation.onDOMContentLoaded.removeListener(onDomReady);
                setTimeout(() => runDetection(tabId), 300);
              }
              chrome.webNavigation.onDOMContentLoaded.addListener(onDomReady);
              setTimeout(
                () => chrome.webNavigation.onDOMContentLoaded.removeListener(onDomReady),
                25000
              );
            });
          }
        });
      });
    }

    chrome.tabs.onUpdated.addListener(onImpersonateComplete);
    setTimeout(() => {
      if (!impersonateDone) {
        impersonateDone = true;
        chrome.tabs.onUpdated.removeListener(onImpersonateComplete);
      }
    }, 20000);
  }

  function runDetection(tabId: number) {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const title = document.title || '';
          const headerEl = document.querySelector('header');
          const headerText = headerEl ? headerEl.innerText || '' : '';
          const isZPA =
            title.toLowerCase().includes('premier agent') ||
            headerText.includes('Property Tools') ||
            headerText.includes('Inbox');
          return { isZPA, title, headerSnippet: headerText.substring(0, 120) };
        },
      },
      (results) => {
        if (
          chrome.runtime.lastError ||
          !results ||
          !results[0] ||
          results[0].result == null
        )
          return;
        const { isZPA } = results[0].result as {
          isZPA: boolean;
          title: string;
          headerSnippet: string;
        };
        if (isZPA) {
          chrome.tabs.update(tabId, { url: PROFILE_REDIRECT });
        }
      }
    );
  }

  // ── Tab Scraping ───────────────────────────────────────────────────────────

  function scrapeTabForLabel(
    tabId: number,
    historyId: string,
    historyType: string
  ) {
    let scrapeDone = false;
    function onUpdated(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
      scrapeDone = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);

      setTimeout(() => {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: () => {
              const result: { title: string; heading?: string } = {
                title: document.title,
              };
              const addrEl =
                document.querySelector(
                  '[data-testid="bdp-bed-bath-beyond"] h1'
                ) ||
                document.querySelector('h1.ds-address-container') ||
                document.querySelector('h1');
              if (addrEl)
                result.heading = (addrEl as HTMLElement).textContent?.trim();
              return result;
            },
          },
          (results) => {
            if (chrome.runtime.lastError || !results || !results[0]) return;
            const data = results[0].result as {
              title: string;
              heading?: string;
            } | null;
            if (!data) return;

            let label = '';
            if (historyType === 'zpid') {
              const title = data.title || '';
              const pipeIdx = title.indexOf(' |');
              const dashIdx = title.indexOf(' -');
              const cutIdx =
                pipeIdx > 0 ? pipeIdx : dashIdx > 0 ? dashIdx : -1;
              label =
                cutIdx > 0
                  ? title.substring(0, cutIdx).trim()
                  : data.heading || '';
            } else {
              const title = data.title || '';
              if (title && title !== 'Zillow' && !title.includes('Impersonate')) {
                label = title
                  .replace(/ \|.*$/, '')
                  .replace(/ -.*$/, '')
                  .trim();
              }
            }

            if (label) {
              chrome.storage.local.get('zillow_history_v3', (storageData) => {
                const history: Array<{
                  id: string;
                  type: string;
                  label: string;
                }> = storageData.zillow_history_v3 || [];
                let updated = false;
                for (let i = 0; i < history.length; i++) {
                  if (
                    history[i].id === historyId &&
                    history[i].type === historyType &&
                    !history[i].label
                  ) {
                    history[i].label = label;
                    updated = true;
                    break;
                  }
                }
                if (updated) chrome.storage.local.set({ zillow_history_v3: history });
              });
            }
          }
        );
      }, 3000);
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    setTimeout(() => {
      if (!scrapeDone) {
        scrapeDone = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);
      }
    }, 20000);
  }

  // ── ZPID Address Fetch ─────────────────────────────────────────────────────

  async function fetchZpidAddress(zpid: string, historyType: string) {
    const url = `https://www.zillow.com/homedetails/${zpid}_zpid/`;
    try {
      const res = await fetch(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Range: 'bytes=0-4095',
        },
      });
      if (!res.ok) return;
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (!titleMatch) return;
      const title = titleMatch[1];
      const pipeIdx = title.indexOf(' |');
      const dashIdx = title.indexOf(' -');
      const cutIdx = pipeIdx > 0 ? pipeIdx : dashIdx > 0 ? dashIdx : -1;
      const label =
        cutIdx > 0 ? title.substring(0, cutIdx).trim() : title.trim();
      if (!label || /zillow/i.test(label) || /page not found/i.test(label))
        return;

      chrome.storage.local.get('zillow_history_v3', (storageData) => {
        const history: Array<{ id: string; type: string; label: string }> =
          storageData.zillow_history_v3 || [];
        let updated = false;
        for (let i = 0; i < history.length; i++) {
          if (
            history[i].id === zpid &&
            history[i].type === historyType &&
            !history[i].label
          ) {
            history[i].label = label;
            updated = true;
            break;
          }
        }
        if (updated) chrome.storage.local.set({ zillow_history_v3: history });
      });
    } catch {
      // silently fail — address display is best-effort
    }
  }

  // ── Autocomplete ───────────────────────────────────────────────────────────

  function fetchAutocompleteInTab(
    query: string,
    callback: (results: unknown[] | null) => void
  ) {
    chrome.tabs.query({ url: 'https://www.zillow.com/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        callback(null);
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id! },
          func: (q: string) => {
            const url =
              'https://www.zillowstatic.com/autocomplete/v3/suggestions' +
              '?q=' +
              encodeURIComponent(q) +
              '&abKey=&resultTypes=allhomes&resultCount=6';
            return fetch(url, { credentials: 'omit' })
              .then((r) => (r.ok ? r.json() : { results: [] }))
              .then((data: { results?: unknown[] }) => data.results || [])
              .catch(() => []);
          },
          args: [query],
        },
        (injectionResults) => {
          if (
            chrome.runtime.lastError ||
            !injectionResults ||
            !injectionResults[0]
          ) {
            callback([]);
          } else {
            callback(
              (injectionResults[0].result as unknown[]) || []
            );
          }
        }
      );
    });
  }

  async function fetchAutocomplete(query: string): Promise<unknown[]> {
    const url =
      'https://www.zillowstatic.com/autocomplete/v3/suggestions' +
      '?q=' +
      encodeURIComponent(query) +
      '&abKey=&resultTypes=allhomes&resultCount=6';
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Referer: 'https://www.zillow.com/',
        },
      });
      if (!res.ok) return [];
      const data = await res.json() as { results?: unknown[] };
      return data.results || [];
    } catch {
      return [];
    }
  }

  // ── Message Listener ───────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const msg = message as BackgroundMessage;

    // Fire-and-forget: these kick off async work but callers don't await the
    // result — sendResponse({ ok: true }) just acknowledges receipt.
    if (msg.action === 'scrapeTab') {
      scrapeTabForLabel(msg.tabId, msg.historyId, msg.historyType);
      sendResponse({ ok: true });
      return;
    }

    if (msg.action === 'fetchAddress') {
      fetchZpidAddress(msg.zpid, msg.historyType);
      sendResponse({ ok: true });
      return;
    }

    if (msg.action === 'openSidePanel') {
      const windowId = sender.tab?.windowId;
      if (windowId != null) {
        // sidePanel.open/close must be called synchronously in the message
        // handler to preserve the user gesture context — no async allowed here.
        // openPanelWindows may be empty on a cold SW start (hydration race),
        // but that edge case causes open-instead-of-close at worst; it never
        // crashes and self-corrects on the next click via the onConnect port.
        if (openPanelWindows.has(windowId)) {
          // chrome.sidePanel.close() was added in Chrome 116 but is missing
          // from the current @types/chrome definitions — cast to unblock tsc.
          (chrome.sidePanel as unknown as { close: (opts: { windowId: number }) => void }).close({ windowId });
        } else {
          chrome.sidePanel.open({ windowId });
        }
      }
      sendResponse({ ok: true });
      return;
    }

    if (msg.action === 'autocomplete') {
      fetchAutocompleteInTab(msg.query, (tabResults) => {
        if (tabResults && (tabResults as unknown[]).length > 0) {
          sendResponse({ ok: true, results: tabResults });
        } else {
          fetchAutocomplete(msg.query)
            .then((r) => sendResponse({ ok: true, results: r }))
            .catch(() => sendResponse({ ok: false, results: [] }));
        }
      });
      return true; // keep channel open for async response
    }

    sendResponse({ error: 'unknown action' });
  });

  // ── Passive Impersonation Tracker ──────────────────────────────────────────

  function parseImpersonateUrl(
    url: string
  ): { method: string; value: string } | null {
    if (!url || !url.includes('Impersonate.htm')) return null;
    try {
      const params = new URL(url).searchParams;
      const email = params.get('pEmail') || params.get('email');
      if (email) return { method: 'email', value: email };
      const zuid = params.get('pZuid') || params.get('zuid');
      if (zuid) return { method: 'zuid', value: zuid };
      const screenName =
        params.get('pScreenName') || params.get('screenName');
      if (screenName) return { method: 'screenname', value: screenName };
      return null;
    } catch {
      return null;
    }
  }

  function addPassiveImpersonation(method: string, value: string) {
    chrome.storage.local.get(
      ['zillow_history_v3', 'zillow_settings'],
      (data) => {
        const settings =
          (data.zillow_settings as Record<string, unknown>) || {};
        const limit = Math.min(
          20,
          Math.max(5, (settings.historyLimit as number) || 5)
        );
        const history: Array<{
          type: string;
          id: string;
          method: string;
          label: string;
          timestamp: number;
        }> = data.zillow_history_v3 || [];
        const now = Date.now();

        if (settings.historyEnabled === false) return;

        const isDupe = history.some(
          (h) =>
            h.type === 'impersonate' &&
            h.id === value &&
            h.method === method &&
            now - h.timestamp < 5000
        );
        if (isDupe) return;

        const updated = [
          { type: 'impersonate', id: value, method, label: '', timestamp: now },
        ]
          .concat(
            history.filter(
              (h) =>
                !(
                  h.type === 'impersonate' &&
                  h.id === value &&
                  h.method === method
                )
            )
          )
          .slice(0, limit);

        chrome.storage.local.set({ zillow_history_v3: updated });
      }
    );
  }

  chrome.tabs.onCreated.addListener((tab) => {
    const url = tab.pendingUrl || tab.url || '';
    const parsed = parseImpersonateUrl(url);
    if (parsed) {
      addPassiveImpersonation(parsed.method, parsed.value);
      redirectAfterImpersonate(tab.id!);
      scrapeTabForLabel(tab.id!, parsed.value, 'impersonate');
    }
  });

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (!changeInfo.url) return;
    const parsed = parseImpersonateUrl(changeInfo.url);
    if (parsed) addPassiveImpersonation(parsed.method, parsed.value);
  });

  // ── Context Menu ───────────────────────────────────────────────────────────

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'zillow-impersonate') return;

    if (info.selectionText) {
      const text = info.selectionText.trim();
      if (text.includes('@')) {
        if (validateEmail(text)) {
          openInNewTab(buildImpersonateUrl('email', text));
        } else {
          showAlert(
            tab!.id!,
            'A valid e-mail address is not selected. Please select a valid e-mail address or click an e-mail link.'
          );
        }
      } else if (/^\d+$/.test(text)) {
        openInNewTab(buildImpersonateUrl('zuid', text));
      } else {
        openInNewTab(buildImpersonateUrl('screenname', text));
      }
      return;
    }

    if (info.linkUrl) {
      if (/^mailto:/i.test(info.linkUrl)) {
        const email = info.linkUrl.replace(/^mailto:/i, '');
        openInNewTab(buildImpersonateUrl('email', email));
      } else {
        const parts = info.linkUrl.split('/');
        const screenName = parts[parts.length - 2];
        openInNewTab(buildImpersonateUrl('screenname', screenName));
      }
      return;
    }

    if (info.pageUrl && info.pageUrl.includes('profile')) {
      const parts = info.pageUrl.split('/');
      const screenName = parts[parts.length - 2];
      openInNewTab(buildImpersonateUrl('screenname', screenName));
      return;
    }

    showAlert(tab!.id!, ERROR_MESSAGE);
  });

  // ── SPA Navigation Tracking ────────────────────────────────────────────────

  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    try {
      const url = new URL(details.url);
      if (url.hostname !== 'www.zillow.com') return;
      const match = url.pathname.match(
        /\/homedetails\/[^?]*\/(\d+)_zpid(?:\/|$)/i
      );
      if (!match) return;
      chrome.tabs.sendMessage(
        details.tabId,
        { action: 'trackZpid', zpid: match[1] },
        () => {
          void chrome.runtime.lastError;
        }
      );
    } catch {
      // ignore
    }
  });

  // ── Install ────────────────────────────────────────────────────────────────

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'zillow-impersonate',
      title: 'Zillow - Impersonate',
      contexts: [
        'page',
        'selection',
        'link',
        'editable',
        'image',
        'video',
        'audio',
      ],
    });
  });
});
