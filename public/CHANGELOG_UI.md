## [0.9.0] – 2026-04-08
### Changed
- The same ZPID opened in different modes (Zillow, PHX, DIT) now appears as separate entries in the history list — previously they collapsed into one
- Revisiting the same ZPID in the same mode still moves it to the top of the list as before
- History list in the Listing Troubleshooting tab now scrolls independently — the search inputs, mode selector, and quick-access buttons stay fixed while you scroll through history

---

## [0.8.11] – 2026-04-08
### Added
- Section labels added to the Impersonate and CXN tabs: "Profile Tools", "Impersonate", and "CXN Call Tools" — clarifies the groupings at a glance

### Changed
- ZUID search in the CXN tab renamed from "ZUID (Splunk Connection Events)" to "Splunk - Events by ZUID"
- Spacing and divider lines in the Impersonate and CXN tabs cleaned up

---

## [0.8.10] – 2026-04-08
### Added
- "Quick Access" section label between the Highspot Search bar and the global quick-access buttons
- "Listing Tools" and "Listing Search" section labels inside the Listing Troubleshooting tab
- Thin divider line between the global Quick Access row and the main tab bar

---

## [0.8.9] – 2026-04-08
### Added
- Color-coded left border on history items — each type has its own color (ZPID=amber, PHX=orange, DIT=pink, Zillow=cyan, Email=purple, ZUID=blue, Screen Name=green)
- Empty history state now shows a muted inbox icon above the placeholder text
- Highspot Search bar gets a subtle blue-tint background in light mode

### Changed
- Header redesigned with a dark gradient and blue accent stripe along the top edge
- Header icon changed from a house to a shield — better reflects the admin nature of the tool
- Header subtitle text removed to free up vertical space
- Active tab indicator changed from an underline to a pill highlight
- Quick link buttons now have a subtle hover lift effect with a blue glow
- History item sub-text color darkened for better readability in light mode

---

## [0.8.8] – 2026-04-08
### Added
- Tab-contextual quick access buttons: each tab now has its own row of relevant shortcuts at the top
  - Listing Troubleshooting: 3D Home Tours and Address Change
  - Impersonate / Profile Troubleshooting: Merge Profiles and Upgrade Account
  - CXN Call Troubleshooting: FAQT2 Test Calls, Pearl Dashboard, and VoIP Dashboard
- Global Quick Links row expanded with Supportal and Zuora Billing shortcuts

### Changed
- Tabs renamed for clarity: "Listing Search" → "Listing Troubleshooting", "Impersonate / Find Agent" → "Impersonate / Profile Troubleshooting", "CXN Call Testing" → "CXN Call Troubleshooting"
- 3D Home Tours and Address Change moved out of the global Quick Links row and into the Listing Troubleshooting tab
- Merge Profiles and Upgrade Account moved out of the global Quick Links row and into the Impersonate tab

---

## [0.8.7] – 2026-04-02
### Added
- PHX and DIT listing history items now show cross-link buttons — a PHX entry lets you open it in DIT or Zillow, and a DIT entry lets you open it in PHX or Zillow

### Fixed
- PHX and DIT history items now show a "Copy URL" button that copies the full URL (previously showed "Copy ZPID" and only copied the ID)
- The open button on PHX and DIT history items now correctly shows "Open in PHX" or "Open in DIT" (previously showed a generic "Open listing" tooltip)

---

## [0.8.6.2] – 2026-04-02
### Added
- Listing searches (ZPID, PHX, DIT) now appear in the "Recently Viewed Listings" history alongside properties you browsed to directly — all sorted by time, with a single Clear button for both

### Changed
- Passively-browsed listing items now show a "Zillow" badge instead of "Viewed"

---

## [0.8.6.1] – 2026-04-02
### Fixed
- Side panel toggle now works correctly after Chrome restarts the service worker in the background — no more getting stuck in "open only" mode
- Resolved a regression introduced in this same release where clicking the FAB threw a "user gesture" error and the side panel wouldn't open at all
- Changelog text is now safely escaped before rendering

---

## [0.8.6] – 2026-04-02
### Changed
- Listing Search tab is now always present — the hidden "Show Listing Search Tab" setting has been removed from the underlying code
- Internal code cleanup: removed dead components, consolidated shared utilities, and improved extension context cleanup on page unload

---

## [0.8.5] – 2026-04-02
### Fixed
- "Smart Redirect After Impersonate" setting description updated to read clearly: "Redirects you to the profile page when impersonating agent profiles."

---

## [0.8.4] – 2026-04-01
### Changed
- Tooltips everywhere updated to a bold pill style with a subtle drop shadow
- History sections renamed to "Recently Viewed Listings" and "Recently Impersonated Profiles"
- Search section labels in all tabs are now uppercase and bold for consistency
- Settings reorganized — cleaner order, "History Limit" now lives under "Record History" and only appears when it's enabled
- "Default Tab" setting now explains what it does
- Removed "Show Listing Search Tab" from Settings

### Fixed
- Tooltips on edge buttons (first/last quick link, "Open in Zillow") no longer clip outside the popup border

---

## [0.8.3] – 2026-04-01
### Added
- README added to the repository with full feature documentation, build instructions, and project structure

### Fixed
- Impersonation URL corrected — requests now route through `/user/Impersonate.htm`
- ZUID impersonations now skip the extra confirmation step automatically

---

## [0.8.2] – 2026-04-01
### Changed
- Migrated from plain HTML/JS to WXT + React + TypeScript
- Rebuilt all UI as React components with Tailwind CSS and strict TypeScript
- Popup and Side Panel now share a single `<App>` component via a `surface` prop
- All chrome.storage access moved to dedicated `useSettings` and `useHistory` hooks

---

## [0.8.1] – 2026-04-01
### Added
- Highspot Search bar in the header — enter a query to search zillow.highspot.com

### Fixed
- Version badge no longer wraps in narrow popup widths

---

## [0.8.0] – 2026-03-27
### Added
- CXN Call Testing tab with Splunk log search and Pearl call search sections

---
## [0.7.5] – 2026-03-26
### Changed
- Post-impersonation redirect is now account-type-aware: Consumer accounts land on Account.htm directly; Premier Agent accounts are detected via ZPA-specific header items and redirected to Profile.htm
- Eliminated a redundant page reload that occurred when Zillow's handler had already navigated to Account.htm

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
- "Recently Viewed" is now the only history section shown
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

