# Changelog

All notable changes to the "My ToolBox" Chrome extension will be documented in this file.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (starting from this documented version).

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