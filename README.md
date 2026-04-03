# Zillow Admin Tools

**Version 0.8.7** — Internal Chrome extension for Zillow support staff.

Provides account impersonation, listing lookup, CXN call testing, Highspot search, and quick-access admin tools — all from a popup or persistent side panel.

---

## Features

### Impersonate / Find Agent tab
Look up and impersonate any Zillow account by ZUID, email address, or screen name. An **Auto** mode (WIP) detects the input type automatically and prompts for confirmation before proceeding. After impersonation, **Smart Redirect** inspects the account type and routes to the correct landing page (`Profile.htm` for ZPA / Premier Agent accounts, `Account.htm` for Consumer accounts). A **Find an Agent** section opens the Zillow agent directory pre-filtered by name.

### Listing Search tab
Search for any property by ZPID, with support for three environments:
- **Zillow** — opens the standard `homedetails` listing page
- **PHX** — opens the Phoenix Admin Tool (also supports MLS ID lookup)
- **DIT** — opens the DIT environment for the given ZPID

Address search with live **autocomplete** (debounced, proxied through the background service worker to work around CORS) lets you find properties by street address without knowing the ZPID in advance. Can be disabled in Settings.

### CXN Call Testing tab
Two utilities for diagnosing connection call issues:
- **Zuid → Splunk** — opens the Splunk connections dashboard filtered by a given ZUID
- **Pearl Lead Audit** — opens the Pearl concierge audit page for a given lead ID

### Highspot Search
A persistent search bar at the top of every view that opens `zillow.highspot.com` pre-queried with whatever you type.

### Quick Links
A row of five icon buttons for one-click access to frequently used internal admin tools:
- 3D Home Tours Tool
- Address Change Tool
- Merge Profiles Tool
- Upgrade Account Tool
- CaRP Tool (Referral Pricing Admin Portal)

### Floating Action Button (FAB)
A draggable button injected onto all Zillow pages (via content script, Shadow DOM) that opens the side panel. Position is saved per-session. Can be disabled in Settings.

### Context Menu
Right-clicking on any page provides quick impersonation and listing actions via the browser context menu (handled by the background service worker).

---

## Surfaces

The extension runs in two surfaces that share identical functionality:

| Surface | How to open |
|---|---|
| **Popup** | Click the extension icon in the Chrome toolbar |
| **Side Panel** | Click the FAB on any Zillow page, or open via the browser side panel menu |

Both mount the same `<App>` component — there is no duplicated logic between them.

---

## Settings

Accessible via the gear icon in the header.

| Setting | Description |
|---|---|
| History Limit | Number of items to retain in history lists (5–20) |
| Show Listing Search Tab | Toggle the Listing Search tab on/off |
| Floating Side Panel Button | Show/hide the draggable FAB on all Zillow pages |
| Smart Redirect After Impersonate | Auto-route to the correct post-impersonation page |
| Record History | Enable/disable impersonation and listing view history |
| Theme | Auto / Light / Dark |
| Default Tab | Which tab opens first (Listing, Impersonate, or CXN) |

---

## Tech Stack

| | |
|---|---|
| Framework | [WXT](https://wxt.dev/) v0.19 (Manifest V3) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS + custom CSS variables (`assets/globals.css`) |
| Bundler | Vite (via WXT) |

---

## Project Structure

```
entrypoints/
  background.ts       # Service worker — context menu, impersonation tracking,
                      # smart redirect, autocomplete proxy, SPA nav tracking
  content.ts          # Injected on all pages — FAB, property view tracking
  popup/              # Popup entry point
  sidepanel/          # Side panel entry point

components/
  App.tsx             # Root component shared by popup + sidepanel
  Header.tsx          # Top bar — logo, version, changelog, settings buttons
  HighspotSearch.tsx  # Highspot search bar
  QuickLinks.tsx      # Quick-access admin tool buttons
  ImpersonateTab.tsx  # Impersonate + Find an Agent
  ListingTab.tsx      # ZPID / address / PHX / DIT search
  CxnTab.tsx          # CXN Splunk + Pearl Lead tools
  SettingsModal.tsx   # Settings overlay
  ChangelogModal.tsx  # What's New overlay (reads CHANGELOG_UI.md)
  HistorySection.tsx  # Reusable history list
  HistoryItem.tsx     # Single history row
  AutocompleteDropdown.tsx
  ConfirmBar.tsx

hooks/
  useSettings.ts      # Reads/writes settings via chrome.storage
  useHistory.ts       # Reads/manages impersonation + listing view history

utils/
  urls.ts             # URL builders for all search types
  validation.ts       # Email, ZUID, and screen name validators

types/
  index.ts            # Shared TypeScript types and interfaces
```

---

## Storage

All data is stored in `chrome.storage.local`.

| Key | Type | Contents |
|---|---|---|
| `zillow_history_v3` | `HistoryItem[]` | Impersonation history |
| `zillow_viewed_v3` | `HistoryItem[]` | Recently viewed listings |
| `zillow_settings` | `Settings` | User preferences |
| `zat_fab_top` | `number` | FAB vertical position (px) |

---

## Build & Install

```bash
# Install dependencies (first time only)
npm install

# Build the extension
npm run build

# Watch mode (hot reload during development)
npm run dev

# Type check without emitting
npm run typecheck
```

After building, load the extension from `.output/chrome-mv3/` in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** and select `.output/chrome-mv3/`
4. After any rebuild, click the reload icon on the extension card

---

## Internal Use Only

This extension is built for Zillow internal staff and accesses internal admin URLs. It is not published to the Chrome Web Store.
