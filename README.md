# My ToolBox

[![Release](https://img.shields.io/badge/release-5.2.0-blue)](https://github.com/fossasoftware/my-toolbox-crx/releases)

**Chrome Extension**

**My ToolBox** is a Chrome extension for Jira Cloud that combines helper rules, a whiteboard-style board, bookmarks, and a built-in markdown notepad into one workspace.

**Version:** 5.2.0
**Author:** Vitalii Kopach

## Highlights

- Live Jira helper updates on already open tabs.
- Board workspace with notes, shapes, links, drawing, autosave, undo/redo, and backup import/export.
- Markdown Notepad with formatting tools, split/preview modes, search, and import/export.
- Bookmarks with pinned ribbon access, icon upload, drag-and-drop ordering, and backup support.
- English and Ukrainian UI.

## Features

- **Status Colorizer**
  - Set background + text colors for Jira statuses.
  - Choose optional status animations such as ping, breathe, nudge, shimmer, glow, urgent, sweep, and ribbon.
  - Ribbon animation derives its secondary stripe color automatically from the status background.
  - Add **aliases** so multiple status names share one rule.
  - Import/export presets as JSON.
  - Changes apply live on already open Jira tabs.
- **Row Highlighter**
  - Highlight rows that contain a word or phrase.
  - Enable/disable rules without deleting them.
  - Add **aliases** for alternative keywords.
  - Import/export rules as JSON.
  - Changes apply live on already open Jira tabs.
- **Board**
  - Draw freehand, erase, add shapes, create notes, and link elements together.
  - Edit shape fill/stroke/text, note text color/size, and link color/style/label.
  - Use marquee multi-select, mixed dragging, resize, zoom presets, wheel/trackpad pan and zoom, undo/redo, and autosave.
  - Export/import board backups as JSON.
  - Restore the last viewport position after reload.
- **Notepad**
  - Markdown editor with formatting toolbar, heading helpers, and checkbox helpers.
  - `Split` and `Preview` modes with live preview.
  - In-note search via `Cmd/Ctrl+F`.
  - Undo/redo, autosave, and note import/export.
- **Bookmarks**
  - Save bookmarks with title and URL.
  - Optional PNG icon upload; missing icons render as a circular initial badge.
  - Pin favorites to the side ribbon for quick access.
  - Drag a handle to reorder bookmarks with smooth animations.
  - Edit or delete bookmarks, adjust icon size, and configure pinned-label behavior.
  - Import/export bookmark backups.

## Quick start

1. Open the extension popup and click **Open Settings**.
2. Choose a tab (Helpers → Status Colorizer/Row Highlighter, Board, Notepad, or Bookmarks).
3. Configure helper rules, board content, notes, or bookmarks.
4. Open Jira and verify that your helper rules apply; updates on already open Jira tabs now sync live after settings changes.

## Installation

1. **Chrome Web Store (testers only)**
   - Access is currently limited to registered testers via a test link.
2. **Manual (Load unpacked)**
   - Clone/download this repo.
   - Open `chrome://extensions/` and enable **Developer mode**.
   - Click **Load unpacked** and select the folder with `manifest.json`.

## Local validation

Run the local validation pass before packaging or manual smoke tests:

```bash
./scripts/validate-extension.sh
```

It validates `manifest.json`, runs `node --check` for extension scripts, executes the lightweight `node:test` suite for pure modules, performs a lightweight `board.js` import smoke test with a stubbed DOM environment, and fails on trailing whitespace or malformed patch output.

## Packaging for Chrome Web Store

Create a ready-to-upload archive with:

```bash
./scripts/package-extension.sh
```

The script runs the full local validation pass first, stages only the runtime extension files, and creates `dist/my-toolbox-crx-<version>.zip`.

## Usage notes

- Status Colorizer works on Jira Cloud pages under `*://*.atlassian.net/*`.
- When **Animation** is enabled, the background input is disabled; text color still applies.
- Helper rule changes now refresh on already open Jira tabs without a manual reload.
- Preset import/export and defaults are managed from the **Settings** tab.
- Settings and bookmark metadata are stored in `chrome.storage.sync`.
- Bookmark icons are stored in `chrome.storage.local` and do not sync.
- Board state is stored locally in the browser and supports manual backup export/import.
- Markdown preview uses `marked` + `DOMPurify`.

## FAQ

**Q: Why don't my changes show up immediately in Jira?**
A: Helper rule updates now sync to already open Jira tabs without a manual reload. If you just reloaded the extension itself in `chrome://extensions/`, refresh the Jira tab once so the new content scripts are injected again.

**Q: Can I share my presets with teammates?**
A: Yes. Use **Export** to save a JSON file and **Import** to load it on another machine.

**Q: What happens if I import duplicates?**
A: Duplicates are merged into a single rule, and additional names become aliases.

**Q: Can I back up my Board or Bookmarks data?**
A: Yes. Both features support JSON export/import from their settings areas.

**Q: Does the extension work outside Jira Cloud?**
A: No. It targets `*://*.atlassian.net/*`.

**Q: Do bookmarks sync across devices?**
A: Titles, URLs, and pinned state sync. Bookmark icons stay local.

## Icon pack

Icons are sourced from Font Awesome 7.1.0.

```
https://fontawesome.com/
```
