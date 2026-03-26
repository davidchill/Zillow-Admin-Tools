# Zillow Admin Tools

A Chrome extension for Zillow internal use — fast impersonation, listing lookup, address search, and quick admin access, directly from the browser toolbar or a persistent side panel.

---

## Features

- **Impersonate by Email, ZUID, or Screen Name** — auto-detect or choose a specific mode, with a confirmation step in auto mode
- **ZPID Lookup** — open any listing in Zillow, Phoenix Admin (PHX), or DIT with one click
- **MLS ID Search** — look up listings by MLS ID via the Phoenix admin tool (PHX mode only)
- **Address Autocomplete** — live Zillow suggestions as you type; falls back to a search URL if no match
- **Find Agent** — search Zillow's agent directory by first and last name
- **Quick Access Links** — one-click buttons for 3D Home Tours, Address Change, Merge Profiles, Upgrade Account, and CaRP tools
- **Context Menu Support** — right-click any selected text, `mailto:` link, or Zillow profile URL to impersonate instantly
- **Side Panel** — floating action button on any page opens a persistent, full-featured side panel
- **Collapsible History Sections** — Recently Impersonated and Recently Viewed collapse and expand; state persists within the session
- **History Tracking** — recent impersonations and viewed listings saved locally; per-item copy, open, and link actions
- **Passive Impersonation Tracker** — records impersonation events regardless of how they were initiated (popup, side panel, context menu, bookmark, etc.)
- **SPA Navigation Tracking** — tracks listing views from Zillow search results pages, which use `history.pushState` and don't trigger a full page load
- **Smart Post-Impersonation Redirect** — automatically routes to the correct page after impersonating: Consumer accounts land on Account.htm; Premier Agent accounts are detected via ZPA-specific header items and redirected to Profile.htm
- **Version Badge** — displays the current extension version and release date in the popup header
- **Dark / Light / Auto Theme** — configurable via the settings panel

---

## Installation

This extension is not published to the Chrome Web Store. Install it manually:

1. Clone the repository:

```
git clone https://github.com/davidchill/Zillow-Admin-Tools.git
```

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the cloned folder.
4. The Zillow Admin Tools icon will appear in your Chrome toolbar.

---

## Usage

### Impersonate / Find Agent Tab

- Select a mode: **Auto**, **Email**, **ZUID**, or **Screen Name**
- Enter the identifier and press **Go** or hit **Enter**
- In Auto mode, the extension detects the type and shows a confirmation before proceeding
- Use the **Find Agent** section to search by first and/or last name — opens Zillow's agent directory in a new tab

### Listing Search Tab

- Enter a **ZPID** to open the listing in your chosen tool: **Zillow**, **PHX**, or **DIT**
- In **Zillow** mode, use the **Address** field to search by street address with live autocomplete
- In **PHX** mode, use the **MLS ID** field to look up a listing by MLS ID

### Quick Access Links

A row of icon buttons sits above the tab panels for fast access to common admin tools:

| Button | Destination |
| --- | --- |
| 3D Home Tours | Phoenix 3D tour admin |
| Address Change | Address change tool |
| Merge Profiles | Profile merge tool |
| Upgrade Account | Account upgrade tool |
| CaRP | CaRP tool |

### Context Menu

- Select an email address, ZUID, or screen name on any page
- Right-click and choose **Zillow - Impersonate**
- Also works on `mailto