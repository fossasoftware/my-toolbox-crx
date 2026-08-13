# Repository Guidelines

## Project Structure & Module Organization

Manifest V3 Chrome extension for Jira Cloud. There is no `package.json`, no npm install step, and no linter/formatter config — tooling is bash scripts plus a system Node install.

- `manifest.json` — permissions (`storage` only), the three `content_scripts` blocks, `web_accessible_resources`, options page, popup, background worker.
- `background/service-worker.js` — ES module; seeds `SYNC_PREFERENCE_DEFAULTS` on install/startup/import, writing only absent keys.
- `core/` — shared helpers: `storage.js` (ESM chrome.storage wrapper — getters resolve `{ok, data, error}`, setters `{ok, error}` — used by background, board and the options shell; notepad, bookmarks and the content-script workers deliberately call `chrome.storage` directly), `i18n.js` (custom loader, not `chrome.i18n`), `html-loader.js`, `extension-defaults.js`, options shell modules.
- `features/` — `board`, `bookmarks`, `notepad`, `row-highlighter`, `security-level-customiser`, `settings`, `shared`, `status-colorizer`. `features/shared/rule-worker-runtime.js` is the classic-script runtime every Jira content script loads first; `features/settings/` renders the **Preferences** tab (DOM id `settingsTab`).
- `options/`, `popup/` — the two extension pages. `options/options.html` holds the shell — side ribbon with the pinned-bookmarks list, tab nav, language switcher, footer, toast and the validation-error modal — plus six empty `*TabContainer` divs; each tab's own markup is a runtime-fetched fragment (`features/<name>/<name>.html`).
- `tests/` — 13 `node:test` suites (60 tests), board-heavy. `data/defaultSettings.json` holds the 10 preset Status Colorizer rules and is fetched at runtime by the content script, so it must stay in `web_accessible_resources`.
- `_locales/{en,uk}/`, `fonts/`, `img/`, `favicon/`, `libs/` — assets and vendored libs (`marked`, `DOMPurify`, loaded as classic `<script>` globals). `dist/` is generated; never edit by hand.

## Adding a Feature (wiring checklist)

- **New options tab:** fragment in `features/<name>/`, container div + stylesheet link + `.tab-link[data-tab="<name>Tab"]` in `options/options.html`, a `<name>-tab.js` calling `loadHtmlIntoContainer`, then register in both `options/options-main.js` lists (tab loaders `Promise.all`, then the ordered `initialize*()` calls). Initializers run unconditionally and bail with `console.error` if markup is missing.
- **Element ids are cross-file contracts.** Import/Export buttons for all five features — plus Status Colorizer's restore-defaults trio (`resetStatusSettings`, `confirmReset`, `cancelReset`) — live in `features/settings/settings.html` but are queried by the owning feature. Renaming an id in one file silently no-ops the other.
- **New Jira content script:** add a `content_scripts` entry listing every file individually, `rule-worker-runtime.js` first, in dependency order (each IIFE reads its deps off `globalThis` at evaluation time). Reordering breaks the feature at runtime, not at load.
- **New synced preference:** add it to `SYNC_PREFERENCE_DEFAULTS` (`core/extension-defaults.js`) *and* to the worker's `handleStorageChanges` key guard, or open Jira tabs ignore it until reload. Live updates flow only through `chrome.storage.onChanged` (sync area) — there is no messaging and no `tabs` permission.
- **New top-level runtime directory:** add a `copy_entry` line in `scripts/package-extension.sh` (whitelist: `manifest.json _locales background core data favicon features fonts img libs options popup`) or it is silently missing from the shipped zip.
- **Version bump:** `manifest.json`, the `release-<version>-` README badge, the `**Version:** <version>` README line (CI greps for both), and a `CHANGELOG.md` entry.

## Build, Test, and Development Commands

- `./scripts/validate-extension.sh` — parses `manifest.json`; `node --check` over `background core features options popup` only (**not** `tests/` or `scripts/`); `node --test tests/*.test.mjs`; a `board.js` import smoke test under stubbed `document`/`window`/`getComputedStyle`/`ResizeObserver`/`navigator`/rAF globals; `rg`-based trailing-whitespace scan of `background core features options popup manifest.json README.md CHANGELOG.md`; `git diff --check`.
- `node --test tests/*.test.mjs` — unit tests only.
- `./scripts/package-extension.sh` — re-runs validation, stages the whitelist, writes `dist/my-toolbox-crx-<version>.zip`. Requires the `zip` binary.
- Prerequisites: **ripgrep** (`rg`) and, for packaging, `zip`. Node resolves via `scripts/node-runtime.sh`; `MY_TOOLBOX_NODE=/abs/path/to/node` overrides it and hard-errors on a bad path.
- Known trap: the whitespace check is written as `if rg …`, so a missing `rg` (exit 127) is read as "no matches" and the script still prints `Validation passed`. `git diff --check` output is discarded, so that failure aborts with no message.
- Manual testing: load the repo folder via `chrome://extensions/` with Developer mode on. A green validation says nothing about behavior on a real Jira page.

## Coding Style & Naming Conventions

Two module systems coexist and are not interchangeable:

- **ESM** — `background/`, `core/`, `options/`, `popup/`, and all options-side feature code. Named exports only (no `export default` anywhere), `const`/`let`, double quotes, semicolons, 2-space indent.
- **Classic scripts** — every file listed in a `content_scripts` block (`features/shared/rule-worker-runtime.js`, both rule logic/worker pairs, nine of the ten `security-level-customiser` files — `security-level-customiser-settings.js` is the options-side ESM exception). Module-style files use the guard pattern `(function attachX(global) { if (global.MyToolboxX) return; … global.MyToolboxX = {…}; })(globalThis)`; the two rule workers are self-starting `(function runXWorker(global) { … })(globalThis)` runners with no guard or export, and the security-level worker guards with a `…WorkerStarted` flag. **Never** use `import`/`export` in content-script files.

Kebab-case filenames (`board-link-endpoints.js`), `UPPER_SNAKE_CASE` constants, `camelCase` functions and variables. No trailing whitespace. Board controllers are DI factories (`createBoard<Thing>Controller({…})`) that never import each other's factories — cross-controller *method* calls go through the lazily-bound facades in `board-apis.js`, a plain mutable registry: calling through the facade before `board.js` has registered the controller throws a TypeError because the getter returns `undefined`. (Stateless helper functions exported by `board-item-menu-controller.js` and `board-item-toolbar-controller.js` are the exception — their `-shell-` counterparts import them directly.) In the Status Colorizer worker, paint only via `setTrackedStyle`/`setTrackedClassState` so `data-my-toolbox-status-props` can restore Jira's own inline styles.

Some values are deliberately duplicated and must be changed together: status animation names (4 places), Row Highlighter priority bounds 0–10 (4 files), security-level preference keys (content-script, options-side, `core/extension-defaults.js`), and every shared-runtime helper (the shared module plus three inline fallback sites: both rule workers carry all six helpers; the security-level-customiser worker/observers pair copies the storage and viewport helpers).

## Localization

Every user-facing string needs a `data-i18n` attribute (or `getText(key)`) and a key in **both** `_locales/en/messages.json` and `_locales/uk/messages.json` — the only two supported languages. CI enforces exact key parity across locales; a missing key falls back to the key name itself, which ships to the UI as visible text — the tell for a forgotten locale entry.

## Testing Guidelines

`node:test` + `node:assert/strict`, files named `tests/<subject>.test.mjs`. Three established patterns: import a pure ESM module directly; load a classic content script through `node:vm` and read back the global it attaches (`tests/status-colorizer-logic.test.mjs`); or construct a DI controller with stub callbacks and no DOM at all (`tests/board-lifecycle.test.mjs`, `tests/board-selection-state.test.mjs`) — prefer that over adding DOM stubs.

Coverage is uneven and worth knowing before promising anything: nine board suites plus status-colorizer-logic, row-highlighter-logic, rule-import-utils and notepad-markdown-transforms. `features/bookmarks/`, `features/security-level-customiser/`, i18n, storage and the options shell have **zero** tests. Note that `tests/status-colorizer-logic.test.mjs` asserts against the literal source text of `status-colorizer-worker.js`, so renaming, reordering, or reflowing functions there fails the suite even when behavior is unchanged.

## Continuous Integration

`.github/workflows/ci.yml` runs on push/PR to `main` (Node 20) and checks repo-wide `*.js` syntax (`.mjs` is excluded, so `tests/` is never syntax-checked in CI), JSON validity, a manifest schema check, locale key parity, and manifest-vs-README version consistency. **CI does not run the unit tests or `validate-extension.sh`** — run the local script before pushing, and don't read a green CI as passing tests. Conversely, locale parity and the README version check only ever run in CI.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits with an optional scope: `feat: …`, `feat!: …`, `fix(status-colorizer): …`, `fix(board,notepad): …`, `chore: …`, `chore(release): …`, `ci: …`. Follow that style; keep subjects imperative and scoped to the feature folder touched.

Pull requests should describe the user-visible change, list the validation performed, link related issues, and include screenshots or a short recording for popup, options, board, notepad, bookmarks, or Jira DOM changes.

## Security & Configuration Tips

Keep `manifest.json` permissions minimal — `storage` is currently the only one, with no `host_permissions`. All three content-script blocks match `*://*.atlassian.net/*`; do not broaden host access. The Security Level Customiser reads Jira's REST API same-origin from the injected content script with the user's session, which is why no host permission is needed — keep it that way. Anything a content script `fetch`es at runtime must be listed in `web_accessible_resources`. `chrome.storage.sync` carries an ~8 KB per-item quota (Notepad content lives there); board content and bookmark icons deliberately use `chrome.storage.local`. Do not commit local Chrome profiles, exported user data, or generated zips unless intentionally releasing.
