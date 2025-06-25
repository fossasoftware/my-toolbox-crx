# Changelog

All notable changes to the "My ToolBox" Chrome extension will be documented in this file.




The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (starting from this documented version).

## [4.4.4] - 2025-06-25

### Changed
- Highlight rows containing keywords in search results, on custom dashboards, and in the Activity Stream.

## [4.4.3] - 2025-06-24

### Changed
- Integrated **Roboto Condensed** and **Oswald** fonts. Fonts now display correctly even if not installed locally.

## [4.4.2] - 2025-06-24

### Added
- Sliding button labels appear on hover for Add, Save, Reset, Import and Export
  actions.

## [4.4.1] - 2025-06-24

### Changed
- Settings tables renamed to `.colorizer-table` and `.highlighter-table` to avoid CSS conflicts
- Status Colorizer now uses 30×30 px custom toggles
- Notepad and buttons adapt to window size and show icon-only controls
- Popup toggles with animation let you enable or disable each feature

### Fixed
- Validation messages display on the correct tab

## [4.4.0] - 2025-06-23

### Added
- New **Row Highlighter** module with settings UI, worker script, and styles

### Changed
- Renamed the status colorizer worker script
- Toast notifications now remain visible across all tabs

### Fixed
- Worker function name clashes resolved for colorizer and highlighter

## [4.3.3] - 2025-06-23

### Fixed
- Prevent duplicate style injection for animated ribbons
- Sanitize status names for valid CSS class creation
- Allow markdown preview to initialize when `marked` is a function

## [4.3.2] - 2025-06-23

### Fixed
- Reset Table now clears custom status colors without restoring defaults after refresh

## [4.3.1] - 2025-06-23

### Fixed
- Version label updates when switching languages

### Changed
- Updated extension description text and localization


## [4.3.0] - 2025-06-22

### Added

- Collapsible side menu with vertical app title and toggle button
- Navigation tabs moved into the side menu
- Animated slide-in/out behavior for opening and closing the menu
- Footer and language selector relocated inside the menu

## [4.2.4] - 2025-06-21

### Fixed

- Default color settings now apply automatically on extension update.

## [4.2.3] - 2025-06-20

### Added

- Extension version now shown on the options page.

### Fixed

- Updated status colorization logic to support new Jira styles.

## [4.2.2] - 2025-04-25

### Added

* This `CHANGELOG.md` file to track project changes.
* Initial `README.md` file with instructions and feature descriptions in English and Ukrainian.

### Changed

* **Internal:** Performed code cleanup across all relevant JS and CSS files in preparation for release. This primarily involved removing developer comments and non-essential console logging (`console.log`, `console.warn`, etc.).

### Removed

* Developer comments from the codebase (`.js`, `.css`, `.html`).
* Debug console log statements, preserving only `console.error` for critical error reporting.

*Note: This version reflects the state after preparing the existing codebase for release. Features include Jira Status Colorizer with animation/import/export, Markdown Notepad with auto-save/preview, and EN/UK localization.*

---

*Older version history is not documented here.*
