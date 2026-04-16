# Changelog

All notable changes to Zillow Admin Tools are documented here.

Versions are tagged on `main` as `vX.Y.Z`.

Versioning follows:
- `0.x.y` — pre-release development builds
- `1.0.0` — first stable, production-ready release

---

## [0.9.12] – 2026-04-15 (patch)

### Fixed
- `components/App.tsx`: Removed the double-divider between the Quick Access links and the tab bar — an empty `zat-section-label` div was producing two 1px lines (one per pseudo-element) with the page background color bleeding through the gap between them; replaced with a single `1px` border line

### Changed
- `components/SettingsModal.tsx`, `assets/globals.css`: "History Limit" setting converted from a number input to a range slider (min 5, max 20, step 1) — the label hint now shows the live selected value (e.g. "10 items") instead of the static "5 – 20 items" range text; slider styled with a 4px track and a 16px accent-blue thumb with scale + glow on hover

---

## [0.9.11] – 2026-04-14 (patch)

### Added
- `components/SettingsModal.tsx`, `types/index.ts`, `components/App.tsx`: Added "Highspot Search" toggle to the bottom of the Settings panel — when disabled, the Highspot search bar is hidden and the space collapses; defaults to enabled

### Changed
- `assets/globals.css`: Increased text contrast across light and dark themes — light mode text tiers (`--text-secondary` through `--text-faint`) shifted three steps darker toward `#0f172a`; dark mode text tiers shifted three steps lighter toward `#ffffff` for equivalent contrast gain
- `assets/globals.css`: History items (`zat-history-item`) now use `--bg-surface` (white) and `--border` for background and border in light mode — previously used `--bg-input` and `--border-light`, which were near-identical to the page background and produced no visible separation
- `assets/globals.css`: History item vertical padding reduced by 2px (`10px` → `9px` top/bottom)
- `assets/globals.css`: Search input vertical padding reduced by 5px (`8px 12px` → `6px 12px 5px`); search button reduced from `34×34px` to `29×29px` to match
- `assets/globals.css`: Empty history state icon now centers correctly — `zat-empty-state` switched from `text-align: center` to flexbox column layout; `text-align` does not center block-level SVG elements
- `components/Header.tsx`, `components/SettingsModal.tsx`, `components/App.tsx`: Theme picker moved out of the Settings modal and into the header as an icon-only pill (sun / monitor / moon); order is Light → System → Dark
- `components/Header.tsx`: Right side of header restructured as a two-row column — Changelog and Settings buttons on top, theme pill below, both center-aligned; logo and title vertically centered against the column height; header padding reduced to tighten overall height
- `assets/globals.css`: Fixed Dark mode rendering not matching System (auto) mode — `html[data-theme="dark"]` text variable block retained original pre-contrast values because its 2-space indentation never matched the 4-space `@media` block during earlier `replace_all` edits; explicit dark block now mirrors the System block exactly

---

## [0.9.10] – 2026-04-13 (patch)

### Added
- `components/CxnTab.tsx`: Added "DataDog - Events by ZUID" search section between Splunk and Pearl Lead Audit — input accepts a numeric ZUID and opens the DataDog Partner Support PA App Events dashboard (`premier-agent.datadoghq.com`) filtered to that ZUID; validates numeric-only input with an inline error, matching the Splunk section's behavior
- `utils/urls.ts`: Added `DATADOG_EVENTS_BASE` constant — full DataDog dashboard URL with all required query parameters pre-set; ZUID appended at the end

---


## [0.9.9] – 2026-04-10 (patch)

### Fixed
- `entrypoints/content.ts`: PHX and DIT page visits are now tracked in Recently Viewed Listings history — `checkAndTrackZpid()` previously had an unconditional early return for any non-`www.zillow.com` hostname, so visits to `phoenix-admin-tool.dna-compute-prod.zg-int.net` and `prm.in.zillow.net` were silently ignored; both hostnames are now detected and the ZPID is extracted from the `?zpid=` query parameter
- `entrypoints/content.ts`: PHX/DIT page-visit entries now write to `zillow_history_v3` with `type: 'phx'` or `type: 'dit'` (via new `doTrackPhxDit()`) rather than reusing `doTrackView()` — using the correct type ensures that clicking a history item re-opens the PHX or DIT URL rather than falling back to `www.zillow.com/homedetails/...`; a `fetchAddress` message is sent to background after saving so the property address label is backfilled from Zillow
- `components/CxnTab.tsx`: Restored missing `pearlError` / `setPearlError` state declaration — the Pearl Lead input's `onChange` handler called `setPearlError('')` but the state was never declared, causing a TypeScript compile error

---

## [0.9.8] – 2026-04-09 (patch)

### Fixed
- `CxnTab.tsx`: Removed dead `pearlError` state — `setPearlError` was never called with a non-empty value, making the error display div unreachable; state variable, setter, `has-error` class binding, and error div all removed
- `icons.tsx`: Replaced `ListingTabIcon` with a house/home SVG — the export was an exact copy of `SearchSVG` (magnifying glass), a copy-paste oversight from when the tab icons were added; now shows a semantically appropriate home icon

---

## [0.9.8] – 2026-04-09

### Changed
- `RELEASE_DATE` in `utils/constants.ts` is now derived from the `releaseDate` field in `package.json` — version and release date are now co-located in one file; no more separate constant to update on each release
- `ImpersonateTab.tsx`: "Auto" impersonation mode is now hidden from the mode selector — the `wip: true` flag causes it to be filtered out at render time so users are not exposed to an incomplete feature; the underlying logic remains in place for future use
- `useHistory.ts`: `addToHistory` method parameter type is now derived as `HistoryItem['method']` rather than being spelled out manually — stays in sync with the discriminated union automatically

### Added
- `ErrorBoundary` class component wraps both the popup and side panel entry points — if a React render error occurs, users see a plain error message instead of a blank UI
- `components/icons.tsx` now exports `ListingTabIcon`, `ImpersonateTabIcon`, and `CxnTabIcon` — the three inline SVGs previously defined in `App.tsx` are moved here; `ImpersonateTab.tsx` was using an identical copy of `ImpersonateTabIcon` as `UserSVG`, now imports the shared export

---

## [0.9.7] – 2026-04-09

### Fixed
- `ChangelogModal.tsx`: Eliminated `dangerouslySetInnerHTML` XSS risk — `parseChangelog` now returns `JSX.Element[]` directly instead of an HTML string; the `escapeHtml` helper is removed and React's built-in escaping handles all text content
- `types/index.ts`: Replaced the flat `HistoryItem` interface with a discriminated union — each `type` value (`impersonate`, `zpid`, `phx`, `dit`, `viewed`) now constrains the allowed `method` values, making invalid combinations like `{ type: 'zpid', method: 'email' }` a compile error; `HistoryItemType` retained as a derived alias (`HistoryItem['type']`) so no import sites required changes

---

## [0.9.6] – 2026-04-09

### Fixed
- `background.ts`: Removed hardcoded spoofed macOS/Chrome User-Agent header from `fetchZpidAddress` — fetch now uses the extension's natural headers, eliminating fingerprinting risk
- `background.ts`: Replaced fragile `setTimeout`-only listener cleanup with boolean flag guards (`impersonateDone`, `scrapeDone`) in `redirectAfterImpersonate` and `scrapeTabForLabel` — both the self-detaching listener and the fallback timeout now coordinate via the flag, preventing redundant no-op `removeListener` calls
- `background.ts`: Added default catch-all branch to the message listener — unknown actions now respond with `{ error: 'unknown action' }` instead of silently hanging the caller
- `AutocompleteDropdown.tsx`: Replaced array index `key={i}` with a stable key derived from `result.metaData?.zpid`, falling back to `result.display` then index — prevents React from misidentifying DOM nodes when the results list updates
- `App.tsx`: Replaced inline `eslint-disable-line` suppression on the initial-tab `useEffect` with a `eslint-disable-next-line` comment and a full explanation of why `settings.defaultTab` is intentionally excluded from the dependency array
- `ListingTab.tsx`: Added `useEffect` cleanup to cancel the address autocomplete debounce timer on component unmount — prevents a setState call on an unmounted component

---

## [0.9.5] – 2026-04-09

### Fixed
- `content.ts`: Message listener for `trackZpid` action now guards against a missing `zpid` field before calling `doTrackView` — removed non-null assertion (`!`) and added an explicit `!msg.zpid` early return; `zpid` is captured into a local variable before the `setTimeout` to eliminate any stale-closure risk
- `ListingTab.tsx`: Autocomplete Enter key handler and search button click handler now perform bounds-checked index access on `acResults` — if `acActiveIdx` is out of range (e.g. results updated mid-navigation), the code safely falls back to index 0 with a final `if (result)` guard before calling `selectAcResult`
- `background.ts`: Message listener branches for `scrapeTab` and `fetchAddress` now return early after calling `sendResponse`, preventing unintended fall-through to subsequent `if` blocks; comments added clarifying that both are intentionally fire-and-forget (callers do not await the result)
- `background.ts`: Added clarifying comment to the `openSidePanel` handler documenting why the `chrome.storage.session` hydration cannot gate `sidePanel.open()` — the call must remain synchronous to preserve Chrome's user gesture context; async wrapping causes a fatal "may only be called in response to a user gesture" error

---

## [0.9.4] – 2026-04-09

### Added
- "Alan Pit Stop" quick-access button added to the global Quick Access row, positioned to the left of the CaRP Tool button — links to `agent-pitstop-frontend.zg-ap-apps.com/login/callback`; uses a car icon

---

## [0.9.3] – 2026-04-09

### Added
- "Recently Viewed Listings" and "Recently Impersonated Profiles" history sections are now collapsible — click the section header to toggle the list open or closed
- Chevron indicator on each history section header rotates to reflect collapsed/expanded state

---

## [0.9.2] – 2026-04-09

### Added
- "MLS zWiki" quick-access button added to the Listing Tools row in the Listing Troubleshooting tab, positioned to the right of the Address Change button — links to the MLS reference page on zWiki; uses a layers icon

---

## [0.9.1] – 2026-04-09

### Changed
- ZPID search label in Listing Troubleshooting tab changed from "ZPID" to "Search by ZPID"; placeholder changed from "e.g. 29122711" to "Input ZPID"
- Address search label in Listing Troubleshooting tab changed from "Address Search" to "Search by Address"
- Impersonate tab search labels updated to "Search by ZUID", "Search by Email", and "Search by Screen Name" based on active mode
- Impersonate tab placeholders updated: ZUID → "Input ZUID", Email → "Input full email address" (Screen Name unchanged)
- "Find an Agent" and "Impersonate" sections swapped in the Impersonate tab — Find an Agent now appears first, Impersonate search below it
- "Impersonate" section divider updated from `zat-section-divider` to `zat-section-label` style (centered text with hairline rules) to match the "Find an Agent" header
- Global Quick Access → tab bar divider replaced from a plain `1px` line to a `zat-section-label` style hairline divider
- `border-bottom` removed from the `zat-tabs` container in `App.tsx`

## [0.9.0] – 2026-04-08

### Changed
- History deduplication in the Listing Troubleshooting tab now keys on `id + type` instead of `id` alone — the same ZPID opened in Zillow, PHX, and DIT modes now appears as three separate history entries rather than collapsing into one. Revisiting the same ZPID in the same mode still refreshes (moves to top) the existing entry as before.
- History list in the Listing Troubleshooting tab now scrolls independently within the visible frame — the search inputs, mode selector, and quick-access buttons remain fixed at the top while the history list scrolls below them. Achieved by restructuring the tab content area as a bounded flex column (`height: 100%` on `html/body/#root` and App root, `overflow: hidden` on the tab wrapper) with the history section as the sole scrollable region (`overflow-y: auto; flex: 1`). Impersonate and CXN tabs retain their own scroll independently.

---

## [0.8.11] – 2026-04-08

### Added
- "Profile Tools" section label above the Merge Profiles and Upgrade Account quick-access buttons in the Impersonate tab
- "Impersonate" section label above the ZUID/Email/Screen Name/Auto segmented control in the Impersonate tab
- "CXN Call Tools" section label above the three quick-access buttons in the CXN Call Troubleshooting tab

### Changed
- Removed unlabeled `borderBottom` divider lines from quick-links rows in the Impersonate and CXN Call Troubleshooting tabs — section labels now provide the visual separation
- Impersonate tab quick-links spacing aligned to match Listing Troubleshooting tab (`padding: 0 0 4px`, no `marginBottom` on the quick-links row; `margin: 4px 0 8px` on the Impersonate label)
- CXN Call Troubleshooting tab quick-links given `marginBottom: 10px` to match spacing rhythm of other tabs
- Tooltip text on Impersonate tab buttons trimmed: "Merge Profiles Tool" → "Merge Profiles", "Upgrade Account Tool" → "Upgrade Account"
- ZUID search in CXN tab renamed from "ZUID (Splunk Connection Events)" to "Splunk - Events by ZUID"
- ZUID search placeholder changed from "e.g. 12345678" to "Input ZUID"

---

## [0.8.10] – 2026-04-08

### Added
- "Quick Access" section label between the Highspot Search bar and the global quick-access buttons — rendered as a centered uppercase label with hairline rules extending to each edge (`─── QUICK ACCESS ───`)
- Thin `1px` horizontal divider line (matching the in-tab divider pattern) between the global Quick Access buttons and the main tab bar, with 10px of breathing room below
- "Listing Tools" section label above the two listing-specific quick-access buttons in the Listing Troubleshooting tab
- "Listing Search" section label between the listing-specific quick-access buttons and the Zillow/PHX/DIT segmented control in the Listing Troubleshooting tab

### Changed
- "Quick Access" label top padding reduced by 3px (`6px` → `3px`) to tighten spacing between the Highspot Search bar and the label
- Tooltip text on listing quick-access buttons trimmed: "3D Home Tours Tool" → "3D Home Tours", "Address Change Tool" → "Address Change"
- Global quick-access button row (`zat-quick-links`) no longer carries its own `border-bottom` — separation is now handled by the explicit divider element in `App.tsx`

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
