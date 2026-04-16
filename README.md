# Zillow Admin Tools

**v0.9.14** — Internal Chrome extension for Zillow support and operations staff.

Consolidates frequently used admin workflows — account impersonation, listing lookup, connection management, and quick navigation to internal tools — into a single popup and persistent side panel, reducing tabs, bookmarks, and manual URL construction during daily support work.

> **Internal use only.** This extension accesses internal Zillow admin URLs and is not published to the Chrome Web Store. Requires an active Zillow SSO session.

---

## Features

### Impersonate Tab
Look up and impersonate any Zillow partner account by email address, ZUID, or screen name. After impersonation, **Smart Redirect** inspects the account type and routes to the correct landing page (`Profile.htm` for Premier Agent accounts, `Account.htm` for Consumer accounts). Each impersonation is logged to local history with a display label scraped from the page title. A **Find an Agent** section opens the Zillow agent directory pre-filtered by name.

### Listing Lookup Tab
Search for any property by ZPID or street address.
- **ZPID search** — navigates to the internal admin listing page
- **Address autocomplete** — live suggestions debounced and proxied through the background service worker to work around CORS; results open a Zillow search in a new tab
- **Splunk search** — opens a pre-configured Splunk query scoped to the current ZPID
- **Recently viewed** — properties you visit on Zillow are automatically tracked and surfaced here

### Connections Tab (CxnTab)
Quick navigation to internal connection-management and partner admin pages.
- **PHX Search** — opens the Phoenix Admin Tool for a given identifier
- **DIT Search** — opens the Data Integration Tool admin page for a given identifier
- **Pearl Lead lookup** — opens the Pearl Lead admin page by lead ID
- **Viewed listing lookup** — opens the viewed listing admin page for a ZPID

### Highspot Search
A persistent search bar above the tab content area that opens `zillow.highspot.com` pre-queried with your search term. Can be toggled on/off in Settings.

### Quick Links Bar
A row of icon buttons for one-click access to frequently used internal Zillow admin tools. Each button opens the target URL in a new tab.

### Floating Action Button (FAB)
A draggable button injected onto every page via the content script (Shadow DOM isolated) that opens the side panel without navigating away from your current page. Position is saved to `chrome.storage.local`. Can be disabled in Settings.

### Context Menu
Right-clicking any link on any page provides a context menu option to extract identifiers (screen names, ZPIDs) from the URL and perform an admin lookup directly.

### Changelog Modal
The **What's New** button in the header displays a parsed changelog from `CHANGELOG_UI.md` using native React elements — no `dangerouslySetInnerHTML`.

---

## Extension Surfaces

Both surfaces mount the same `<App>` component. There is no duplicated logic between them.

| Surface | Entry Point | How to Open |
|---|---|---|
| **Popup** | `entrypoints/popup/main.tsx` | Click the extension icon in the Chrome toolbar |
| **Side Panel** | `entrypoints/sidepanel/main.tsx` | Click the FAB on any page, or open via the browser side panel menu |

---

## Settings

Accessible via the gear icon in the header.

| Setting | Description |
|---|---|
| Theme | Light / Dark / System (auto-detect) |
| Default Tab | Which tab opens first (Listing, Impersonate, or Connections) |
| History Limit | Number of items to retain per history list (5–20, slider) |
| Highspot Search | Show/hide the Highspot search bar |
| Floating Side Panel Button | Show/hide the draggable FAB on all pages |
| Smart Redirect After Impersonate | Auto-route to the correct post-impersonation page |
| Record History | Enable/disable history tracking |
| Clear History | Removes all stored history entries |

---

## Tech Stack

| | |
|---|---|
| Build Framework | [WXT](https://wxt.dev/) (Manifest V3) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS 3.x + custom CSS variables (`assets/globals.css`) |
| Bundler | Vite (via WXT) |

---

## Project Structure

```
entrypoints/
  background.ts         # Service worker — context menu, impersonation tracking,
                        #   smart redirect, autocomplete proxy, SPA nav tracking,
                        #   side panel open/close state
  content.ts            # Injected on all pages — FAB (Shadow DOM), property
                        #   view tracking, PHX/DIT visit tracking
  popup/
    index.html
    main.tsx            # Mounts <App surface="popup" />
  sidepanel/
    index.html
    main.tsx            # Mounts <App surface="sidepanel" />

components/
  App.tsx               # Root component shared by popup + sidepanel
  Header.tsx            # Top bar — logo, version, changelog, settings buttons
  HighspotSearch.tsx    # Highspot search bar
  QuickLinks.tsx        # Quick-access admin tool icon buttons
  ImpersonateTab.tsx    # Impersonate + Find an Agent
  ListingTab.tsx        # ZPID / address search + recently viewed
  CxnTab.tsx            # PHX / DIT / Pearl Lead / viewed listing tools
  SettingsModal.tsx     # Settings overlay
  ChangelogModal.tsx    # What's New overlay (parses CHANGELOG_UI.md)
  HistorySection.tsx    # Reusable history list
  HistoryItem.tsx       # Single history row with copy/open actions
  AutocompleteDropdown.tsx
  ConfirmBar.tsx
  icons.tsx             # Shared SVG icon components

hooks/
  useSettings.ts        # Reads/writes settings via chrome.storage
  useHistory.ts         # Reads/manages impersonation + listing view history

utils/
  urls.ts               # URL builders for all search/admin types
  validation.ts         # Email, ZUID, and screen name validators

types/
  index.ts              # Shared TypeScript types and interfaces

assets/
  globals.css           # CSS custom properties, component styles, theming
```

---

## Data Storage

All data is stored locally in `chrome.storage.local`. Nothing is transmitted externally.

| Key | Type | Contents | PII? |
|---|---|---|---|
| `zillow_history_v3` | `HistoryItem[]` | Impersonation + PHX/DIT visit history | Yes — emails, ZUIDs, screen names |
| `zillow_viewed_v3` | `HistoryItem[]` | Recently viewed listing history | Possibly — property addresses |
| `zillow_settings` | `Settings` | User preferences | No |
| `zat_fab_top` | `number` | FAB vertical position (px) | No |

Side panel open/close state is tracked in `chrome.storage.session` (current session only).

---

## Build & Install

```bash
# Install dependencies (first time only, or after pulling new deps)
npm install

# Build the extension
npm run build

# Watch mode with hot reload during development
npm run dev

# Type check without emitting
npm run typecheck
```

After building, load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** and select `.output/chrome-mv3/`
4. After any rebuild, click the **reload icon** on the extension card

---

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | History, preferences, FAB position, panel state |
| `tabs` | Tab creation, URL reading, tab updates |
| `sidePanel` | Persistent docked side panel surface |
| `contextMenus` | Right-click context menu integration |
| `scripting` | Autocomplete CORS-bypass proxy, smart redirect detection |
| `activeTab` | Scripting into the active tab |
| `webNavigation` | SPA navigation tracking on Zillow pages |

**Host permissions:** `*://*/*` — Required for the content script to detect ZPIDs across all Zillow subdomains and internal environments, and for the FAB to be accessible on any page a support agent may be viewing.
