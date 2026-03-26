# Zillow Admin Tools – README

# Zillow Admin Tools

A Chrome extension for Zillow internal use that provides fast impersonation, ZPID lookup, and address search — directly from the browser toolbar or a floating side panel.

---

## Features

- **Impersonate by Email, ZUID, or Screen Name** — auto-detect or choose a specific mode
- **ZPID Lookup** — open a listing in Zillow, Phoenix Admin, or DIT with one click
- **Address Autocomplete** — type an address and get live Zillow suggestions
- **Context Menu Support** — right-click any selected text, email link, or profile URL to impersonate instantly
- **Side Panel** — floating action button on any page opens a persistent side panel
- **History Tracking** — recent impersonations and listing searches saved locally, with copy-to-clipboard support
- **Smart Post-Impersonation Redirect** — automatically routes to the correct page after impersonating: Consumer accounts land on Account.htm; Premier Agent accounts are detected via ZPA-specific header items and redirected to Profile.htm
- **Dark / Light / Auto Theme** — configurable via the settings panel
- **Passive Impersonation Tracker** — records impersonation events regardless of how they were initiated

---

## Installation

This extension is not published to the Chrome Web Store. Install it manually:

1. Download or clone this repository.

```
git clone https://github.com/davidchill/Zillow-Admin-Tools.git
```

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the cloned folder.
4. The Zillow Admin Tools icon will appear in your Chrome toolbar.

---

## Usage

### Impersonate Tab

- Select a mode: **Auto**, **Email**, **ZUID**, or **Screen Name**
- Enter the identifier and press **Go** or hit **Enter**
- In Auto mode, the extension detects the type and shows a confirmation before proceeding

### ZPID / Listing Tab

- Enter a **ZPID** to open the listing in your chosen tool (Zillow, Phoenix, or DIT)
- Use the **Address** field to search by street address with live autocomplete

### Context Menu

- Select an email address, ZUID, or screen name on any page
- Right-click and choose **Zillow - Impersonate**
- Also works on `mailto:` links and Zillow profile page URLs

### Side Panel

- Click the floating **Z** button on any page to open the side panel
- The side panel mirrors the popup functionality and persists while you browse

---

## Settings

Access settings via the gear icon in the popup.

| Setting | Description |
| --- | --- |
| History Limit | Number of recent items to retain (5–20) |
| ZPID Tab | Show or hide the listing lookup tab |
| Floating Button | Show or hide the floating side panel button |
| Redirect After Impersonate | Smart redirect after impersonation — Consumer accounts go to Account.htm; Premier Agent accounts go to Profile.htm |
| History Recording | Enable or disable search history |
| Theme | Auto, Light, or Dark mode |

---

## File Structure

```
Zillow-Admin-Tools/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker: context menus, tab scraping, autocomplete
├── content.js           # Injected script: floating action button
├── popup.html           # Toolbar popup UI
├── popup.js             # Popup logic
├── sidepanel.html       # Side panel UI
├── sidepanel.js         # Side panel logic
├── icons/               # Extension icons (16, 48, 128px)
└── fonts/               # Local fonts
```

---

## Permissions Used

| Permission | Reason |
| --- | --- |
| `contextMenus` | Right-click impersonation menu |
| `activeTab` | Access the current tab for scripting |
| `tabs` | Open new tabs and listen for navigation events |
| `scripting` | Execute scripts to scrape page titles and run autocomplete in Zillow tabs |
| `storage` | Save history and settings locally |
| `sidePanel` | Open and close the side panel |

---

## Notes

- This is an **internal tool** intended for Zillow support/ops team use only.
- No data is sent to any external server. All history and settings are stored locally in `chrome.storage.local`.
- The extension is currently at **v0.7.5**.

---

## Author

Built and maintained by David Rodriguez — Zillow Group, Customer/Partner Support Operations.
