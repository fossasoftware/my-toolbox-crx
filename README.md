# My ToolBox

[![Release](https://img.shields.io/badge/release-4.8.2-blue)](https://github.com/fossasoftware/my-toolbox-crx/releases)

**Chrome Extension**

**My ToolBox** is a Chrome extension for Jira Cloud that adds status coloring, row highlighting, bookmarks, and a built-in notepad to speed up daily work.

**Version:** 4.8.2
**Author:** Vitalii Kopach

## What you can do

- **Status Colorizer**
  - Set background + text colors for Jira statuses.
  - Optional animated ribbon with primary/secondary colors.
  - Add **aliases** so multiple status names share one rule.
  - Import/export presets as JSON.
- **Row Highlighter**
  - Highlight rows that contain a word or phrase.
  - Enable/disable rules without deleting them.
  - Add **aliases** for alternative keywords.
  - Import/export rules as JSON.
- **Notepad**
  - Markdown editor with live preview.
  - Auto-save with sync across devices.
- **Bookmarks**
  - Save bookmarks with title and URL.
  - Optional PNG icon upload; missing icons render as a circular initial badge.
  - Pin favorites to the side ribbon for quick access.
  - Drag a handle to reorder bookmarks with smooth animations.
  - Edit or delete bookmarks with undo support.
  - Adjust icon size in Settings.
  - Configure pinned label visibility (hidden or on hover) in Settings.
- **Localization**
  - English and Ukrainian UI.

## Quick start

1. Open the extension popup and click **Open Settings**.
2. Choose a tab (Helpers → Status Colorizer/Row Highlighter, Notepad, or Bookmarks).
3. Save changes or add bookmarks.
4. Refresh Jira to apply updates for content scripts.

## Installation

1. **Chrome Web Store (testers only)**
   - Access is currently limited to registered testers via a test link.
2. **Manual (Load unpacked)**
   - Clone/download this repo.
   - Open `chrome://extensions/` and enable **Developer mode**.
   - Click **Load unpacked** and select the folder with `manifest.json`.

## Usage notes

- Status Colorizer works on Jira Cloud pages under `*://*.atlassian.net/*`.
- When **Animation** is enabled, the background input is disabled; text color still applies.
- Preset import/export and defaults are managed from the **Settings** tab.
- Use the side menu footer to open or share the Chrome Web Store listing.
- Settings and bookmarks (title, URL, pinned) are stored in `chrome.storage.sync`.
- Bookmark icons are stored locally in `chrome.storage.local` and do not sync.
- Markdown preview uses `marked` + `DOMPurify`.

## FAQ

**Q: Why don't my changes show up immediately in Jira?**
A: Refresh the Jira page. The content script applies styles on load and after DOM updates.

**Q: Can I share my presets with teammates?**
A: Yes. Use **Export** to save a JSON file and **Import** to load it on another machine.

**Q: What happens if I import duplicates?**
A: Duplicates are merged into a single rule, and additional names become aliases.

**Q: Does the extension work outside Jira Cloud?**
A: No. It targets `*://*.atlassian.net/*`.

**Q: Do bookmarks sync across devices?**
A: Titles, URLs, and pinned state sync. Bookmark icons stay local.
