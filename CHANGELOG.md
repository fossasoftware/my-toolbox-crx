# Changelog

All notable changes to the "My ToolBox" Chrome extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (starting from this documented version).

## [4.8.3] - 2026-01-14

### Changed

- Updated bundled dependencies in `libs/`.

## [4.8.2] - 2026-01-14

### Added

- Added bookmark settings for icon size and pinned label visibility.
- Marked required fields in the bookmark editor.
- Added a “Helpers” group in the side menu for Status Colorizer and Row Highlighter.
- Added Chrome Web Store and Share actions to the side menu footer.

### Changed

- Reworked bookmark drag-and-drop with smoother tile reflow.
- Updated Settings layout to a tiled grid.
- Adjusted bookmark icon size ranges (36–50px, pinned 16–40px).
- Pinned labels now show only on hover or stay hidden.
- Side menu tabs now span the full width with a consistent hover indicator.
- Settings import/export/reset buttons blend with the Settings cards.
- Removed hover tooltips from bookmark links.

### Fixed

- Pinned labels no longer clip inside the side ribbon scroll area.

## [4.8.1] - 2026-01-14

### Changed

- Refined the Bookmarks layout with rectangular tiles, larger icons, and the add tile anchored at the end of the grid.
- Added pin/edit icon actions and a dedicated drag handle for bookmark ordering.
- Added undo support for bookmark deletion via a toast action button.
- Smoothed UI transitions across tabs, pinned bookmarks, and modal overlays.

### Fixed

- Prevented the bookmark icon file field highlight from flickering after file picker use.
- Prevented empty pinned bookmark icons from clipping on hover.
- Prevented bookmark icons from shifting when pinning or unpinning.
- Disabled hover styling while dragging bookmarks.

## [4.8.0] - 2026-01-14

### Added

- New Bookmarks tab with create, edit, delete, and pin actions.
- Pinned bookmarks render under the burger button in the collapsed side ribbon.
- Optional PNG icon uploads for bookmarks; icons are stored locally while titles, URLs, and pin state sync.

### Changed

- Added Bookmarks to the side menu navigation.

## [4.7.1] - 2026-01-14

### Changed

- Moved save/reset button layout to match the notepad layout and reduced table action spacing.
- Removed hover-expand behavior for save/reset actions in the Colorizer and Highlighter tabs.

### Fixed

- Keep save/reset/export buttons visible and disable them when there are no rows.
- Stabilized the Add Row pill placement when tables are empty or fonts load late.
- Prevent table header text collisions on narrow widths by clamping with word wrapping.
- Aligned alias controls by placing add/remove buttons inside the inputs.
- Added import validation console errors for Row Highlighter to match Status Colorizer.

## [4.7.0] - 2026-01-14

### Added

- New Settings tab for defaults and preset import/export actions.

### Changed

- Options tab markup now lives in feature-specific HTML files under `features/*`.
- Import/export actions moved out of individual feature tabs into Settings.

## [4.5.3] - 2026-01-13

### Changed

- Reworked the Add Row control into an inline pill that expands on hover and adapts to empty table states.
- Updated the Add Row label to show a dedicated "ADD ROW" text label in both languages.
- Adjusted toast sizing/positioning for less overlap with table content.

### Fixed

- Corrected the Add Row button border alignment and hover visibility.

## [4.5.2] - 2026-01-13

### Added

- Notepad autosave toggle with a manual save option.
- Animated toast transitions and smooth language switcher movement.

### Changed

- Notepad editor/preview now stretch to the window height and controls sit below the panels.
- Autosave no longer shows toasts, manual saves show confirmation and the save button is disabled when autosave is enabled.

### Fixed

- Centered the autosave toggle knob and removed manual textarea resizing.
- Resolved minor gaps in the language switcher highlight alignment.

## [4.5.1] - 2026-01-12

### Fixed

- Prevented double status ribbon animations in nested Jira markup.
- Ribbon animations no longer get overridden by the base background color; text color still applies.

### Changed

- Import now merges duplicate status/keyword entries into a single rule with aliases.
- Status Colorizer disables the background color input when animation is enabled.

## [4.5.0] - 2026-01-12

### Added

- Status Colorizer now supports alternative status names (aliases) per status.
- Row Highlighter now supports alternative keywords (aliases) per rule.

## [4.4.7] - 2025-09-02

### Fixed

- Fixed broken Status Colorizer. The issue was caused by a class name change introduced by Atlassian.

## [4.4.6] - 2025-08-04

### Fixed

- Fixed broken Status Colorizer. The issue was caused by a class name change introduced by Atlassian.

## [4.4.5] - 2025-06-26

### Added

- Row Highlighter now lets you enable or disable keywords without deleting them

### Changed

- Renamed the Colorizer feature to **Status Colorizer** across the extension
- Updated bundled libraries: DOMPurify 3.2.6 and Marked 15.0.12

## [4.4.4] - 2025-06-25

### Changed

- Highlight rows containing keywords in search results, on custom dashboards, in the Activity Stream, on board cards, and in "For you" lists.

## [4.4.3] - 2025-06-24

### Changed

- Integrated **Roboto Condensed** and **Oswald** fonts. Fonts now display correctly even if not installed locally.

## [4.4.2] - 2025-06-24

### Added

- Sliding button labels appear on hover for Add, Save, Reset, Import and Export
  actions.

## [4.4.1] - 2025-06-24

### Changed

- Settings tables renamed to `.status-colorizer-table` and `.highlighter-table` to avoid CSS conflicts
- Status Colorizer now uses 30×30 px custom toggles
- Notepad and buttons adapt to window size and show icon-only controls
- Popup toggles with animation let you enable or disable each feature

### Fixed

- Validation messages display on the correct tab

## [4.4.0] - 2025-06-23

### Added

- New **Row Highlighter** module with settings UI, worker script, and styles

### Changed

- Renamed the status-colorizer worker script
- Toast notifications now remain visible across all tabs

### Fixed

- Worker function name clashes resolved for status-colorizer and highlighter

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

- This `CHANGELOG.md` file to track project changes.
- Initial `README.md` file with instructions and feature descriptions in English and Ukrainian.

### Changed

- **Internal:** Performed code cleanup across all relevant JS and CSS files in preparation for release. This primarily involved removing developer comments and non-essential console logging (`console.log`, `console.warn`, etc.).

### Removed

- Developer comments from the codebase (`.js`, `.css`, `.html`).
- Debug console log statements, preserving only `console.error` for critical error reporting.

*Note: This version reflects the state after preparing the existing codebase for release. Features include Jira Status Colorizer with animation/import/export, Markdown Notepad with auto-save/preview, and EN/UK localization.*

---

*Older version history is not documented here.*
