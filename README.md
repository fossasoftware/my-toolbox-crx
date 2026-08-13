<div align="center">

<img src="favicon/my-toolbox-128px.png" alt="My ToolBox" width="96" height="96">

<h1>My ToolBox</h1>

<p><strong>Make Jira Cloud easier to scan — color-code statuses, highlight rows, label security levels — plus a board, a notepad and bookmarks in one workspace.</strong></p>

<p>
  <a href="https://github.com/fossasoftware/my-toolbox-crx/releases"><img src="https://img.shields.io/badge/release-5.5.1-blue" alt="Release 5.5.1"></a>
  <a href="https://github.com/fossasoftware/my-toolbox-crx/actions/workflows/ci.yml"><img src="https://github.com/fossasoftware/my-toolbox-crx/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <img src="https://img.shields.io/badge/manifest-v3-4285F4" alt="Manifest V3">
  <img src="https://img.shields.io/badge/browser-Chrome-4285F4" alt="Chrome extension">
  <img src="https://img.shields.io/badge/permissions-storage%20only-2ea44f" alt="Permissions: storage only">
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20UK-8A2BE2" alt="Localized in English and Ukrainian">
</p>

</div>

My ToolBox has two halves. Three content scripts run on Jira Cloud pages matching `*://*.atlassian.net/*` and change how the UI reads: statuses get colors and optional motion, rows get keyword highlights, and the issue-header security control gets a readable label. The other half is a full-tab options page that carries a canvas board, a markdown notepad and a bookmark grid. The extension declares exactly one permission — `storage` — and has no host permissions.

**Version:** 5.5.1 · **Author:** Vitalii Kopach · **Store listing name:** My Toolbox

## Contents

[Features](#features) · [Quick start](#quick-start) · [Installation](#installation) · [Development](#development) · [Project structure](#project-structure) · [Storage & privacy](#storage--privacy) · [Localization](#localization) · [FAQ](#faq) · [Changelog](#changelog) · [Credits](#credits)

**Features:** [Status Colorizer](#status-colorizer) · [Row Highlighter](#row-highlighter) · [Security Level Customiser](#security-level-customiser) · [Board](#board) · [Notepad](#notepad) · [Bookmarks](#bookmarks)

## Features

### Status Colorizer

- Give each Jira status its own background and text color. Matching is exact, full-string equality after trimming and lowercasing — not substring — so `Done` never bleeds into `Done (rejected)`.
- Six Jira surface families are painted: status lozenges, board-card statuses, the issue-header status button, the status-transition dropdown, Jira Home / recent-activity rows and smart-link lozenges, plus workflow-diagram status nodes.
- Nine animation choices, and this is the complete set: **None**, `ping`, `breathe`, `nudge`, `shimmer`, `glow`, `urgent`, `sweep`, `ribbon`. Any other value is rejected on import.
- The background color always applies. Seven animations paint it through a CSS variable; `ribbon` uses it as the primary stripe of a 45° repeating gradient that scrolls on a 1200 ms loop, with the second stripe derived automatically by lightening the background 24% toward white.
- **Aliases** let one rule claim several status names. If two rules claim the same name, the first one registered wins.
- Matching also tolerates Jira's label wrappers: text after a `Status:` / `Статус:` prefix and before a `- Change status` / `- Update status` suffix is tried too.
- Ships 10 default rules (waiting for customer, pending, waiting for support, open, waiting for feedback, waiting for approval, escalated, in progress, done, closed), seven of them animated. **Restore defaults** in the Preferences tab brings them back.
- All animations are suppressed for `prefers-reduced-motion: reduce`.
- Painting is non-destructive: original inline styles are snapshotted and restored when a rule stops matching, the element leaves the page, or the feature is switched off.
- Table columns: Status / Background / Text / Animation / Delete. The tab itself offers Add row, Save changes and Reset — Reset sits behind a confirm modal but acts immediately, writing an empty rule list to sync storage, so saved rules are deleted and open Jira tabs stop painting right away (Row Highlighter's Reset behaves the same).

### Row Highlighter

- Paint a background color on Jira rows that contain a keyword or phrase.
- Matching is whole-word/phrase, case-insensitive, with whitespace collapsed — a keyword only matches when the characters around it are not letters, digits or underscores, which is what makes short keys like `AI` or `L1` usable.
- Every rule carries a **priority** from 0 to 10 (default 0). When several rules match the same row, the highest priority wins.
- **Aliases** let one rule match several keywords — add them from the Keyword cell; every alias shares the rule's color and priority.
- Rules have an **Active** checkbox, so you can park a rule in the table without it painting.
- Six Jira row shapes are targeted: virtual-table rows, `tr[role="row"]` / `tr.issuerow`, issue-navigator detail cards, board cards, activity items and Jira Home item links. Label chips are scraped too, so rows can be matched by their Jira labels.
- Highlighting is applied as a class plus a CSS variable, leaving Jira's own inline styles alone so they restore cleanly.
- No default rules ship, so the table starts empty and there is no **Restore defaults** button for it in Preferences.
- Table columns: Keyword / Color / Priority / Active / Delete.

### Security Level Customiser

Labelled **Security Level Customizer** in the UI.

- Renders the issue's security level *name* next to the padlock inside Jira's issue-header security button, turning an icon-only control into a labelled pill.
- The value is not scraped from the DOM. It is fetched with your existing session from `GET <origin>/rest/api/3/issue/<ISSUE-KEY>?fields=security` — a same-origin request from the injected content script, which is why no extra permission is needed.
- It activates wherever an issue key can be resolved: from URL query params, from the URL path, or from the page — so it works on the issue view *and* on board, backlog and queue views where an issue opens in a side panel.
- While loading, a shimmering skeleton bar holds the space so the header does not jump. The shimmer is disabled under `prefers-reduced-motion: reduce`.
- The pill is drawn with a rainbow gradient border that thickens and brightens on hover and focus.
- The whole pill is clickable — clicks are forwarded to Jira's real button — and Enter or Space opens the same native dropdown. Picking a new level updates the label immediately, then re-confirms against the server 900 ms later. Choosing Jira's *remove security level* entry clears the label.
- Accessibility: the button gets `aria-label` "Security level: &lt;name&gt;", and the injected visible text is `aria-hidden` so screen readers do not read it twice.
- If the request fails, the customisation is removed silently and retries pause for 15 s; a successful value stays fresh for 30 s.
- Appearance controls in Preferences: text size 12–18, **Rainbow border**, and **Rainbow hover** (which greys out while the border is off, keeping its stored value).

### Board

- A canvas workspace on its own options tab: a page header plus one bordered frame holding a top toolbar band directly above the stage. Toolbar buttons are icon-only, with their labels surfaced as hover/focus tooltips; help and zoom controls float in the canvas corners.
- Toolbar groups: autosave toggle + Save + Undo + Redo | Select + Hand + Link | Pen + Eraser + Shapes + Notes | Clear.
- **Shapes** — ten tools: line, rect, ellipse, diamond, triangle, parallelogram, trapezoid, hexagon, star, heart. Each shape holds editable text (double-click, or Enter with one shape selected) and has a toolbar with 11 fill presets (including *none*), 9 stroke colors, 8 stroke widths from 1 to 16, plus link, edit and delete.
- **Notes** — five card types: note, task, process, decision, text. Cards keep inline rich text, drag by their header, resize from the corner, and expose a floating toolbar with 5 text colors, 8 text sizes and a start-link button. Right-click gives Rename plus the five colors.
- **Pen and eraser** — stroke size 1–16, opacity 0–100%, 9-color palette. The eraser (16–64 px) splits freehand strokes at the erased section instead of deleting the whole stroke; shapes it touches are deleted along with their links.
- **Links** connect any mix of notes and shapes, in 4 styles (solid, dashed, dotted, dash-dot), with a color and an optional inline label. Duplicate links between the same pair are rejected, and Escape cancels linking.
- **Selection** — click, shift-click toggle, marquee rubber-band (shift makes it additive) and Cmd/Ctrl+A. A mixed selection of shapes and notes drags as one.
- **Navigation** — pan with the Hand tool, a right-mouse drag, or wheel/trackpad (Shift+wheel pans horizontally). Zoom with Ctrl/Cmd+wheel toward the pointer, pinch gestures, the ± buttons in 0.1 steps, or the preset wheel (40, 50, 60, 75, 100, 125, 150, 175, 200, 240 %), clamped to 0.4–2.4. The dot grid tracks zoom and pan.
- **Shortcuts** — Escape returns to Select even mid-edit; the rest are ignored while typing: Delete/Backspace removes the selection, Enter edits shape text, Cmd/Ctrl+Z undoes, Shift+Cmd/Ctrl+Z or Cmd/Ctrl+Y redoes, Cmd/Ctrl+A selects all.
- Autosave is on by default and debounced at 650 ms; switch it off to use the manual Save button. Undo/redo keeps up to 80 deduplicated snapshots with a 520 ms debounce, so continuous typing collapses into one entry.
- The last zoom and pan position is restored on load. Clearing the board is confirmed by a modal and is undoable. An empty-state hint and a six-entry FAQ popover are built into the canvas.
- Backup export/import lives in the **Preferences** tab, not on the Board tab.

### Notepad

- Markdown editor with a 10-button format toolbar: bold, italic, link, code, list, quote, checkbox, then H1, H2 and H3.
- Three view modes, not two: **split**, **editor-only** and **preview**. Clicking Split while already in split switches to editor-only; clicking Preview while in preview returns to the last non-preview mode. Format buttons are disabled in preview-only mode.
- Editor shortcuts: Cmd/Ctrl+B bold, Cmd/Ctrl+I italic, Cmd/Ctrl+K link, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redo.
- In-note search opens with Cmd/Ctrl+F; Cmd/Ctrl+G and F3 step forward (Shift for previous), Enter/Shift+Enter step from the search box, and Escape clears the query before closing the panel. A live *active/total* counter, highlighted matches in the preview and a scrolled, selected match in the editor come with it.
- Undo/redo is a custom snapshot history of value plus selection, capped at 120 entries — not the browser's native textarea stack.
- Autosave is on by default, debounced at 750 ms; enabling it disables the manual Save button. The status line shows Saving… / Saved / Unsaved and clears "Saved" after 1.8 s.
- Editor and preview scroll in sync, in both directions.
- The preview is rendered by `marked` (GFM, line breaks on) and sanitized with `DOMPurify` before injection; if either library is missing, the preview shows a "Markdown support unavailable" notice.
- Import/export lives in the **Preferences** tab.

### Bookmarks

- The **+** tile at the end of the grid is the way to add a bookmark. The modal takes a Title and a URL (both required) plus an optional icon, restricted to PNG — anything else is rejected with an error modal.
- URLs without a scheme get `https://` prepended, and only `http:`/`https:` URLs are accepted.
- Without an icon, a card shows a circular badge with the uppercased first character of the title (`?` when the title is empty). The badge stays behind the PNG once it loads and reappears if the image fails.
- Pin favorites to the side ribbon. Pinned labels have two settings: **Hidden** or **On hover**.
- Reorder by dragging a card's handle — a pointer-driven drag with a placeholder that tracks the drop slot across grid rows, and displaced cards animating for 250 ms.
- Deleting is undoable: a 5-second toast (paused while hovered) puts the bookmark back at its original index.
- Two independent size sliders in Preferences: list icon size 36–50 px (default 48) and pinned/ribbon icon size 16–40 px (default 32).
- Import/export lives in Preferences, and the backup carries the bookmarks, the locally stored icons *and* the display settings.
- Open options pages stay in sync — changes to bookmarks, icons or display settings re-render the list and ribbon immediately.

## Quick start

1. Click the toolbar icon. The popup has three switches — Status colorizer, Row highlighter, Security level customizer, all on by default — and an **Open settings** button.
2. In the options page, pick a destination from the side menu: **Helpers → Status colorizer / Row highlighter**, **Notepad**, **Board**, **Bookmarks**, or **Preferences**.
3. Add your rules and press **Save changes**. Import/export and the restore-defaults action live under **Preferences**.
4. Open Jira. Rule and preference changes reach already-open `*.atlassian.net` tabs live — the content scripts listen to `chrome.storage.onChanged` on the `sync` area, so no reload is needed.

## Installation

**Chrome Web Store (testers only)** — the extension's in-app Share button points at the listing at `https://chromewebstore.google.com/detail/my-toolbox/nppomdgnebmeeilmhbkdnidaohhblcbi`, but access is currently limited to registered testers.

**Load unpacked**

1. Clone or download this repository.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Open a Jira Cloud tab to confirm the helpers apply. After reloading the extension itself, refresh open Jira tabs once so the content scripts are re-injected.

## Development

There is no `package.json`, no lockfile, no `npm install` step and no linter config. The toolchain is bash scripts plus a system Node install.

**Prerequisites:** Node.js 18+ (CI uses 20); [ripgrep](https://github.com/BurntSushi/ripgrep) (`rg`) for the whitespace gate in validation; `zip` for packaging.

```bash
./scripts/validate-extension.sh          # full local pass
node --test tests/*.test.mjs             # unit tests only (13 files, 60 cases)
./scripts/package-extension.sh           # validate, then build dist/my-toolbox-crx-<version>.zip
```

`validate-extension.sh` runs six steps: parse `manifest.json`; `node --check` on every `*.js`/`*.mjs` under `background core features options popup`; `node --test` on `tests/*.test.mjs`; an import smoke test of `features/board/board.js` under stubbed `document`/`window`/`getComputedStyle`/`ResizeObserver`/`navigator`/rAF globals; a trailing-whitespace scan; and `git diff --check`.

> **Two sharp edges.** The whitespace scan is written as `if rg …`, so with ripgrep missing it is skipped and the script still prints "Validation passed". And `git diff --check` has its output redirected to `/dev/null`, so a formatting failure aborts the run with no explanation. The scan also covers only `background`, `core`, `features`, `options`, `popup`, `manifest.json`, `README.md` and `CHANGELOG.md`.

**Node resolution.** Both scripts resolve Node through `scripts/node-runtime.sh`: `MY_TOOLBOX_NODE` first (a hard error if it is not executable or does not report a semver), then `node` on `PATH`, then `/opt/homebrew/bin/node`, `/usr/local/bin/node`, a Codex runtime path under `$HOME/.cache`, `$HOME/.volta/bin/node`, and a bundled ChatGPT.app Node.

```bash
MY_TOOLBOX_NODE=/absolute/path/to/node ./scripts/validate-extension.sh
```

**Packaging.** `package-extension.sh` needs `zip`, re-runs validation, reads the version from `manifest.json`, and stages exactly twelve entries — `manifest.json`, `_locales`, `background`, `core`, `data`, `favicon`, `features`, `fonts`, `img`, `libs`, `options`, `popup` — into `dist/my-toolbox-crx-<version>.zip`. `tests/`, `scripts/`, `.github/`, `README.md`, `AGENTS.md` and `CHANGELOG.md` are excluded.

**CI.** `.github/workflows/ci.yml` runs one `validate` job on `ubuntu-latest` with Node 20, on pushes and pull requests to `main`. It performs `node --check` over every `*.js`, `JSON.parse` over every `*.json`, a manifest schema check, locale message-key parity across every `_locales` directory, and a manifest-vs-README version check that requires both the `release-<version>-` badge and the `**Version:** <version>` line. **CI does not run the unit tests** — only `./scripts/validate-extension.sh` does, so run it locally before pushing.

Contributor conventions — the ESM/classic-script split, controller wiring, and the cross-file element-id contracts — are documented in [AGENTS.md](AGENTS.md).

## Project structure

```text
manifest.json                    MV3: storage permission, 3 content-script bundles, popup, options, worker
background/                      ES-module service worker; seeds synced defaults on install and startup
core/                            storage envelopes, custom i18n loader, HTML fragment loader, options shell
data/defaultSettings.json        10 preset Status Colorizer rules (web-accessible; seeded at runtime)
features/
  status-colorizer/              content script + options tab
  row-highlighter/               content script + options tab
  security-level-customiser/     9-file content script (document_start, plus the shared rule runtime) + Preferences card
  board/                         canvas workspace built from injected controller factories
  notepad/                       markdown editor
  bookmarks/                     bookmark grid + pinned ribbon
  settings/                      the "Preferences" tab: import/export and display settings
  shared/                        rule-worker-runtime.js and shared import/export helpers
options/                         options page shell (opens in a full tab)
popup/                           three feature switches + "Open settings"
libs/                            vendored marked and DOMPurify (classic scripts)
_locales/{en,uk}/                262 message keys each; parity enforced by CI
img/, fonts/, favicon/           icons, TTF fonts, extension icons
tests/                           13 *.test.mjs suites (node:test)
scripts/                         validate-extension.sh, package-extension.sh, node-runtime.sh
.github/workflows/ci.yml         syntax + JSON + locale-parity + version gate (no unit tests)
AGENTS.md                        contributor conventions
CHANGELOG.md                     Keep a Changelog release history
```

Feature tab markup is *not* inlined in `options/options.html`. Each `features/<name>/<name>.html` fragment is fetched at runtime and injected into a container div, which is why element ids are effectively global across fragments.

## Storage & privacy

| Data | Area | Key |
| --- | --- | --- |
| Options UI state (language, side menu, last tab) | `chrome.storage.sync` | `userLanguage`, `sideMenuOpen`, `activeOptionsTab` |
| Feature on/off switches | `chrome.storage.sync` | `statusColorizerEnabled`, `rowHighlighterEnabled`, `securityLevelCustomiserEnabled` |
| Status Colorizer rules | `chrome.storage.sync` | `statusColorSettings` |
| Row Highlighter rules | `chrome.storage.sync` | `rowHighlightSettings` |
| Security level appearance | `chrome.storage.sync` | `securityLevelCustomiserRainbowBorderEnabled`, `securityLevelCustomiserAnimationEnabled`, `securityLevelCustomiserTextSize` |
| Notepad content and preferences | `chrome.storage.sync` | `notepadContent`, `notepadAutosaveEnabled`, `notepadViewMode` |
| Bookmark metadata and display settings | `chrome.storage.sync` | `bookmarks`, `bookmarkSettings` |
| Board autosave preference | `chrome.storage.sync` | `boardAutosaveEnabled` |
| Board content and viewport | `chrome.storage.local` | `boardStateV1`, `boardViewportStateV1` |
| Bookmark icons (data URLs) | `chrome.storage.local` | `bookmarkIcons` |
| Fetched security levels (5-minute cache) | page `sessionStorage` | prefix `my-toolbox-security-level:` |

- The manifest declares one permission, `storage`. There are no host permissions, and no `tabs`, `scripting` or `activeTab`.
- Content scripts load only on `*://*.atlassian.net/*`. Notepad, Board and Bookmarks are options-page features and ship no content script.
- The only network request the extension itself initiates is the same-origin Jira REST call for the security level, using the session you are already signed in with. Nothing is sent anywhere else. (One caveat: bookmark icons render via `<img>`, so a hand-edited backup that points an icon at a remote `https:` URL would make the options page load that image.)
- Board content lives in local storage, so it never syncs across devices — use the backup export to move it.
- `chrome.storage.sync` enforces a per-item quota and the manifest does not request `unlimitedStorage`. Notepad content is stored there, so a very long note can fail to save.

## Localization

- Two UI languages ship: **English** and **Ukrainian**, with 262 message keys each. CI fails if the two locale files drift apart.
- Translation is custom, not `chrome.i18n`: `core/i18n.js` fetches `_locales/<lang>/messages.json` and fills every `[data-i18n]` element (`data-i18n-html` opts into HTML injection). Unsupported language values normalize to `en`.
- The **EN / УК** switcher (locale codes `en` / `uk`) lives in the options side menu and persists `userLanguage` to sync storage. The popup has no switcher; it follows the stored value.
- The options tab whose folder and DOM id are called `settings` is labelled **Preferences** in the UI.

## FAQ

**Why don't my changes show up in Jira?**

They should, immediately. Content scripts watch `chrome.storage.onChanged` on the `sync` area, so saving a rule repaints already-open Jira tabs with no reload. Two limits: only tabs matching `*://*.atlassian.net/*` are affected, and each worker only reacts to its own keys. If you reloaded the extension itself in `chrome://extensions/`, refresh the Jira tab once so the content scripts are injected again.

**Does choosing an animation replace the background color?**

No. The background color always applies — seven of the animations paint it directly, and `ribbon` uses it as the primary stripe with the second stripe derived from it. Text color always applies too.

**Why doesn't my highlight keyword match?**

Row Highlighter matches whole words and phrases, not arbitrary substrings, so `AI` will not match inside `RETAIL`. Status Colorizer is stricter still: the status name must match the whole trimmed, lowercased text.

**Can I share my presets with teammates?**

Yes. **Export** in Preferences writes what is currently in storage — not unsaved table edits — to `my-toolbox-status-colorizer-settings-<YYYY-MM-DD>.json` or `my-toolbox-row-highlight-<YYYY-MM-DD>.json`. **Import** loads it on another machine.

**What exactly happens when I import a file?**

Import **replaces** the whole stored rule list for that helper, so rules that exist locally but are absent from the file are lost — export first if you want to keep them. Duplicates *inside the imported file* are merged into one rule: the first entry's field values win and the other names become aliases. Validation is all-or-nothing — a single malformed entry aborts the import with an error toast.

**Why is there no "Restore defaults" button for Row Highlighter?**

It ships no default rules, so there is nothing to restore. Status Colorizer ships 10 defaults and does have the button.

**Can I back up my board, notes and bookmarks?**

Yes, all three export and import JSON from the Preferences tab. The bookmarks backup includes the locally stored icons and the display settings, so it does move icons between machines even though they never sync automatically.

**Do bookmarks sync across devices?**

Titles, URLs, pinned state and display settings sync. Icons stay in local storage and do not.

**Does the extension work outside Jira Cloud?**

The Jira helpers do not — they are limited to `*://*.atlassian.net/*`. The board, notepad and bookmarks live in the options page and work anywhere.

## Changelog

Release history is in [CHANGELOG.md](CHANGELOG.md), which follows Keep a Changelog and Semantic Versioning.

## Credits

- **Markdown** — [marked](https://marked.js.org/) v17.0.1 and [DOMPurify](https://github.com/cure53/DOMPurify) 3.3.1, vendored in `libs/` and loaded as classic scripts.
- **Icons** — the 37 SVGs in `img/icons` come from three sources: 18 from Font Awesome Pro 7.1.0 (Commercial License, © 2025 Fonticons, Inc.), 16 from [Font Awesome Free 7.1.0](https://fontawesome.com/) (© 2026 Fonticons, Inc.), and 3 (`undo.svg`, `redo.svg`, `resize.svg`) from [SVG Repo](https://www.svgrepo.com/).
- **Fonts** — Oswald and Roboto Condensed, shipped as TTF files in `fonts/`.
- **Author** — Vitalii Kopach.
