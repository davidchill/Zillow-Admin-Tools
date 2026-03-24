# Changelog

All notable changes to Zillow Admin Tools are documented here.
Versions are tracked via git tags; see `manifest.json` for the current version.

---

## [3.6] – 2026-03-23
### Added
- Five action buttons on each Recently Viewed item (in both popup and Side Panel): Copy ZPID, Copy Address (hidden when no address label is available), Copy URL, Open PHX, Open DIT — each with a hover tooltip
- "Open in Zillow" tooltip moved to the existing external-link icon rather than a separate text button, saving row space; clicking the icon opens the Zillow listing in a new tab
- `.open-btn` CSS component (text + icon wrappers) with matching tooltip styling in both `popup.html` and `sidepanel.html`
- `attachCopyHandlers` extended to support `data-copy-text` attribute (used by Copy Address and Copy URL) and `.open-btn` click-to-open behavior

---

## [3.5] – 2026-03-23
### Added
- "Default tab" setting in the Settings panel (segmented control: Listing Search / Impersonate)
- Listing Search is now the default tab on open; users can switch the default back to Impersonate in Settings
- Default tab preference is respected by both the popup and the Side Panel on every open
- `.editorconfig` for consistent indentation, line endings, and trailing-whitespace rules across editors
- `CHANGELOG.md` (this file)

### Changed
- Swapped tab order: Listing Search now appears on the left, Impersonate on the right
- Standardized all `var` declarations to `const`/`let` throughout `popup.js`
- Removed inline version strings from JS file header comments (version is now tracked exclusively via git tags and `manifest.json`)

---

## [3.4] – 2026-03-23
### Changed
- `content.js`: marked `mousemove` drag listener as `{ passive: true }` so Chrome skips scroll-cancelation overhead on every tab
- `background.js`: added `Range: bytes=0-4095` header to `fetchZpidAddress` to cap the background HTML fetch at ~4 KB instead of the full listing page

---

## [3.3] – 2026-03-23
### Added
- FAB (Floating Action Button) now toggles the Side Panel open **and** closed — background service worker tracks open windows via named port connections
- Unified "Record history" toggle in Settings covers impersonations, listing searches, and recently viewed properties
- Toggling history off auto-clears all saved history immediately
- Empty history sections display "History recording is off. Enable it in Settings." when the toggle is off
- Settings panel gains scroll support (`max-height` + `overflow-y: auto`) as the list grows

### Changed
- Dark mode text tiers brightened for improved readability (`--text-tertiary`, `--text-muted`, `--text-faint`)
- Replaced two separate history toggles (ZPID + ZUID) with a single consolidated toggle

---

## [3.2] – 2026-03-22
### Added
- Auto-redirect to Profile page after impersonation (toggleable in Settings)
- Settings panel with toggles for: ZPID tab visibility, Floating Tab, Redirect to Profile
- Instant copy-to-clipboard tooltips on history items

---

## [3.1] – 2026-03-22
### Fixed
- Name/label association in impersonation history now works correctly for both popup and context-menu initiated impersonations

---

## [3.0] – 2026-03-22
### Changed
- ZUID is now the default impersonation mode on open
- Reordered impersonate mode buttons
- Context-aware copy tooltips (shows "Copy Email", "Copy ZUID", or "Copy Screen Name" depending on entry type)

### Added
- WIP badge on Auto-detect mode button

---

## [2.8] – 2026-03-21
### Added
- Copy-to-clipboard button on all history items
- PHX (Phoenix Admin Tool) and DIT listing modes alongside Zillow
- Address/name sub-line display in Recent Searches history

---

## [2.7] – 2026-03-21
### Added
- Dual listing search: ZPID direct entry and address autocomplete (via Zillow's suggestion API)
- Separated history into tabbed sections: Recent Impersonations and Listing Search
- Recently Viewed property tracking via content script on Zillow listing pages

---

## [2.5] – 2026-03-20
### Added
- Full search functionality in the Side Panel (mirrors popup)
- Floating Tab toggle setting to show/hide the FAB

---

## [2.4] – 2026-03-20
### Added
- Chrome Side Panel integration (`chrome.sidePanel`)
- Floating Action Button (FAB) injected on all pages via content script to open the Side Panel

---

## [2.3] – 2026-03-20
### Changed
- FAB is now draggable vertically; position persists via `chrome.storage.local`
- FAB size reduced

---

## [2.2] – 2026-03-19
### Added
- Floating tab content script
- History panel in the Side Panel

---

## [2.1] – 2026-03-19
### Added
- Right-click context menu: "Zillow - Impersonate" on selected text, links, and profile pages
- Passive impersonation tracker: background service worker watches all tabs for navigation to `Impersonate.htm` and records entries regardless of how they were initiated

---

## [Earlier]
- Initial release: popup with ZPID search and impersonation by Email, ZUID, or Screen Name; basic history; manifest v3 service worker architecture
