# Changelog

All notable changes to Zillow Admin Tools are documented here.

Versions are tagged on `main` as `vX.Y.Z`.

Versioning follows:
- `0.x.y` — pre-release development builds
- `1.0.0` — first stable, production-ready release

---

## [0.8.9] – 2026-04-08

### Changed
- Header background replaced with a directional gradient (`#0f172a` → `#1a2740`) and a blue accent stripe (`border-top: 2px solid #3b82f6`)
- Header icon swapped from a house to a shield — better reflects the admin/internal nature of the tool
- Header subtitle text removed — frees vertical space for experienced users
- Tab bar active state changed from an underline to a pill indicator (`background: var(--accent-bg); border-radius: 8px`) with padding/gap between tabs
- Mode selector buttons in Impersonate and Listing tabs replaced with the existing segmented control component (`.zat-seg` / `.zat-seg-btn`) for visual consistency
- Quick link buttons now have a subtle resting shadow and lift with a blue glow on hover (`transform: translateY(-1px)`)
- Search button `border-radius` bumped from `8px` to `10px` to match inputs
- History item address/name sub-text color darkened from `--text-muted` to `--text-secondary` for better readability in light mode
- Input labels (`.zat-input-label`) and history section titles (`.zat-history-title`) bumped from `font-weight: 700` to `800` for stronger hierarchy

### Added
- Color-coded left border on history items — each type gets its own accent color (ZPID=amber, PHX=orange, DIT=pink, Zillow=cyan, Email=purple, ZUID=blue, Screen Name=green)
- Empty history state now shows a muted inbox icon above the placeholder text
- Highspot Search section gets a subtle blue tint gradient in light mode; reverts to `--bg-surface` in dark mode

---

## [0.8.8] – 2026-04-08

### Added
- Tab-contextual quick access button rows: each main tab now has its own row of relevant tool shortcuts, separated from the content below by a divider line, mirroring the style of the global quick links row
- **Listing Troubleshooting tab** — 3D Home Tours Tool and Address Change Tool buttons nested at the top of the tab
- **Impersonate / Profile Troubleshooting tab** — Merge Profiles Tool and Upgrade Account Tool buttons nested at the top of the tab
- **CXN Call Troubleshooting tab** — FAQT2 Test Calls (phone icon), Pearl Dashboard (gauge icon), and VoIP Dashboard (headset icon) buttons nested at the top of the tab; all three link to their respective internal tools
- Global Quick Links row expanded with two new buttons: Supportal (life buoy icon → `support.zillow-workspace.com/admin/users`) and Zuora Billing (credit card icon → `zuora.com/platform/webapp`)
- WIP tag added to the Pearl Lead Audit section heading in the CXN Call Troubleshooting tab

### Changed
- "Listing Search" tab renamed to "Listing Troubleshooting"
- "Impersonate / Find Agent" tab renamed to "Impersonate / Profile Troubleshooting"
- "CXN Call Testing" tab renamed to "CXN Call Troubleshooting"
- 3D Home Tours and Address Change Tool buttons moved out of the global Quick Links row and into the Listing Troubleshooting tab
- Merge Profiles and Upgrade Account Tool buttons moved out of the global Quick Links row and into the Impersonate / Profile Troubleshooting tab

---

## [0.8.7] – 2026-04-02

### Added
- PHX history items now include cross-link buttons to open the listing in DIT and Zillow
- DIT history items now include cross-link buttons to open the listing in PHX and Zillow

### Fixed
- PHX and DIT history items now show "Copy URL" (copying the full URL) instead of "Copy ZPID"
- External link button on PHX and DIT history items now shows "Open in PHX" / "Open in DIT" instead of the generic "Open listing"

---

## [0.8.6.2] – 2026-04-02

### Added
- ZPID, PHX, and DIT listing searches now appear in the "Recently Viewed Listings" history alongside passively-browsed properties, merged and sorted by time; the Clear button wipes both at once

### Changed
- "Viewed" badge on passively-browsed listing history items renamed to "Zillow"
- `buildAgentSearchUrl` now uses `URLSearchParams` for correct encoding — agent names containing `&`, `=`, or other special characters no longer produce malformed URLs

### Fixed
- `background.ts` message listener now uses the typed `BackgroundMessage` union from `types/index.ts`; non-null assertions (`!`) on message fields removed — TypeScript narrows each action branch correctly

---

## [0.8.6.1] – 2026-04-02

### Security
- `ChangelogModal`: HTML-escape all user-content values before injecting via `dangerouslySetInnerHTML` — version numbers, section headings, and list item text are now passed through an `escapeHtml` helper
- `background.ts`: Side panel open/closed state now uses a write-through cache — in-memory `Set` for the synchronous `sidePanel.open()` call (required by Chrome's user-gesture restriction), backed by `chrome.storage.session` for persistence across MV3 service worker restarts

### Fixed
- `background.ts`: Corrected a regression where `sidePanel.open()` was called inside an async `storage.session` read, causing Chrome to throw "may only be called in response to a user gesture"; the open/close decision is now synchronous again using the hydrated in-memory Set

---

## [0.8.6] – 2026-04-02

### Changed
- Extracted `SearchSVG` to a shared `components/icons.tsx`; `HighspotSearch`, `ImpersonateTab`, `ListingTab`, and `CxnTab` now import from there instead of each defining their own copy
- `background.ts` now imports `validateEmail`, `buildImpersonateUrl`, `PROFILE_REDIRECT`, and `CONSUMER_REDIRECT` from shared utils; inline duplicates removed
- `zpidTabEnabled` removed entirely — the setting was no longer surfaced in the Settings UI; the Listing Search tab is now unconditionally rendered
- `void tabId` parameter suppression in `background.ts` replaced with conventional `_tabId` naming
- FAB `mousedown` listener in `content.ts` now passes `{ signal: ctx.signal }` for consistent cleanup alongside `mousemove` and `mouseup`

### Removed
- Dead `CopyBtn` component and `CHECK_SVG` from `HistoryItem.tsx` (superseded by `SmartCopyBtn`)
- No-op `visibilitychange` `useEffect` from `App.tsx` (storage hooks already handle live updates via `onChanged`)
- Unused `addrError` state and its dead error display from `ListingTab.tsx`

---

## [0.8.5] – 2026-04-02

### Fixed
- TypeScript: removed unsafe type cast on `onAddToHistory` in `App.tsx`; widened `HistoryItem.method` and `addToHistory` to correctly include `'zpid' | 'phx' | 'dit'`
- TypeScript: added explicit type assertion for `chrome.sidePanel.close()` which exists in Chrome 116+ but is absent from the current `@types/chrome` definitions
- "Smart Redirect After Impersonate" setting description updated to "Redirects you to the profile page when impersonating agent profiles."

---

## [0.8.4] – 2026-04-01

### Changed
- Tooltips across all surfaces (quick links, copy buttons, open buttons) updated to a bold pill style — heavier font weight, rounded pill shape, and subtle drop shadow
- History section labels renamed: "Recently Viewed" → "Recently Viewed Listings", "Recently Impersonated" → "Recently Impersonated Profiles"
- Search section labels in all tabs now match the "Find an Agent" style — uppercase, bold, and consistent color
- Settings reordered: Theme, Default Tab, Record History, Floating Side Panel Button, Smart Redirect After Impersonate
- "History Limit" is now nested under "Record History" and only visible when recording is enabled
- "Default Tab" setting now includes a description explaining it controls the first tab shown on open
- Removed "Show Listing Search Tab" from Settings

### Fixed
- Tooltips on the first and last quick link buttons no longer clip outside the popup border
- Tooltip on the "Open in Zillow" button no longer clips outside the right popup border

---

## [0.8.3] – 2026-04-01

### Added
- `README.md` added to the repository — documents all features, surfaces, tech stack, project structure, storage schema, and build/install steps

### Fixed
- Impersonation base URL corrected to `/user/Impersonate.htm` (was `/Impersonate.htm`)
- ZUID impersonation requests now include `action=impersonate&confirm=1` parameters to ensure the impersonation completes without an extra confirmation step

---

## [0.8.2] – 2026-04-01

### Changed
- Migrated from plain HTML/JS to WXT + React + TypeScript
- Rebuilt all UI as React components with Tailwind CSS and strict TypeScript
- Popup and Side Panel now share a single `<App>` component via a `surface` prop
- All `chrome.storage` access moved to dedicated `useSettings` and `useHistory` hooks

---

## [0.8.1] – 2026-04-01

### Added
- Highspot Search bar — enter a query to search `zillow.highspot.com`

### Fixed
- Version badge no longer wraps in narrow popup widths

---

## [0.8.0] – 2026-03-27

### Added
- CXN Call Testing tab with Splunk ZUID log search and Pearl Lead Audit sections

---

## [0.7.5] – 2026-03-26

### Changed
- Post-impersonation redirect is now account-type-aware: Consumer accounts land on `Account.htm` directly; Premier Agent accounts are detected via ZPA-specific header items and redirected to `Profile.htm`
- Eliminated a redundant page reload that occurred when Zillow's handler had already navigated to `Account.htm`

---

## [0.7.4] – 2026-03-25

### Fixed
- Recently Viewed history now tracks listings clicked from search results pages
- Long email addresses in the Recently Impersonated section no longer overflow into action buttons

---

## [0.7.3] – 2026-03-25

### Added
- Version badge in the popup header showing the current version and release date

---

## [0.7.2] – 2026-03-25

### Added
- History sections in the Side Panel are now collapsible — click a section header to expand or collapse it

---

## [0.7.1] – 2026-03-24

### Added
- Settings panel added to the Side Panel

### Changed
- "Recently Viewed" is now the only history section shown in the Side Panel
- "Recent Impersonations" renamed to "Recently Impersonated"

---

## [0.7.0] – 2026-03-24

### Added
- MLS ID search field in the Listing Search panel (available in PHX mode)

---

## [0.6.0] – 2026-03-23

### Added
- Quick Access Links row with 5 shortcuts: 3D Home Tours, Address Change, Merge Profiles, Upgrade Account, and CaRP

---

## [0.5.0] – 2026-03-23

### Added
- Find Agent section on the Impersonate tab: search by first and last name

---

## [0.4.0] – 2026-03-23

### Added
- Action buttons on Recently Viewed items: Copy ZPID, Copy Address, Copy URL, Open PHX, Open DIT

---

## [0.3.0] – 2026-03-23

### Added
- Default tab setting: choose whether Listing Search or Impersonate opens by default

### Changed
- Listing Search moved to the left tab position

---

## [0.2.1] – 2026-03-23

### Changed
- Performance improvements

---

## [0.2.0] – 2026-03-23

### Added
- FAB now toggles the Side Panel open and closed
- Unified Record History toggle in Settings
- Turning history off clears all saved history immediately

---

## [0.1.0] – 2026-03-22

### Added
- Auto-redirect to Profile page after impersonation (toggleable in Settings)
- Settings panel with visibility and behavior toggles
- Copy-to-clipboard tooltips on history items

---

## [Earlier]

- Right-click context menu to impersonate from selected text, links, and profile pages
- Passive impersonation tracker watches all tabs for impersonation activity
- Floating tab and Side Panel integration
- ZPID search and address autocomplete; recently viewed property tracking
- PHX and DIT listing modes; address sub-line on history items
- Initial release
