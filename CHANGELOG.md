# Changelog

All notable changes to Zillow Admin Tools are documented here.

Versions are tagged on `main` as `vX.Y.Z`.

Versioning follows:
- `0.x.y` — pre-release development builds
- `1.0.0` — first stable, production-ready release

---

## [0.8.3] – 2026-04-01

### Added
- `README.md` added to the repository — documents all features, surfaces, tech stack, project structure, storage schema, and build/install steps

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
