# Repository Guidelines

## Project Structure & Module Organization

This repository is a Manifest V3 Chrome extension for Jira Cloud. Runtime code is organized by surface:

- `manifest.json` defines permissions, content scripts, options UI, popup, and background worker.
- `background/` contains the extension service worker.
- `core/` contains shared options, storage, i18n, navigation, and UI helpers.
- `features/` contains feature modules such as `board`, `bookmarks`, `notepad`, `row-highlighter`, `status-colorizer`, and `settings`.
- `options/` and `popup/` contain the extension pages.
- `tests/` contains lightweight Node `node:test` suites for pure modules.
- `_locales/`, `data/`, `fonts/`, `img/`, `favicon/`, and `libs/` hold extension assets and bundled browser libraries.

Generated Chrome Web Store archives are written to `dist/`; do not edit packaged output by hand.

## Build, Test, and Development Commands

- `./scripts/validate-extension.sh` validates `manifest.json`, runs `node --check` on extension scripts, executes `tests/*.test.mjs`, smoke-tests `features/board/board.js`, and checks whitespace and patch formatting.
- `node --test tests/*.test.mjs` runs only the unit tests.
- `./scripts/package-extension.sh` runs validation, stages runtime files, and creates `dist/my-toolbox-crx-<version>.zip`.

For manual testing, load the repository folder in `chrome://extensions/` with Developer mode enabled.

## Coding Style & Naming Conventions

Use modern ES modules, `const`/`let`, named exports, double quotes, semicolons, and 2-space indentation. Keep feature code inside its matching `features/<name>/` folder and use descriptive kebab-case filenames, for example `board-link-endpoints.js` or `notepad-search-state.js`. Constants use `UPPER_SNAKE_CASE`; functions and variables use `camelCase`.

Avoid trailing whitespace. Keep shared helpers in `core/` or `features/shared/` only when more than one feature uses them.

## Testing Guidelines

Tests use Node’s built-in `node:test` with `node:assert/strict`. Name files `*.test.mjs` and colocate them under `tests/`, mirroring the module or behavior under test, such as `board-history.test.mjs`. Prefer testing pure logic modules without browser APIs; add stubs only when a browser-facing import requires them.

Run `./scripts/validate-extension.sh` before packaging or submitting changes.

## Commit & Pull Request Guidelines

Recent history uses concise release commits plus Conventional Commit-style messages such as `feat: ...`, `feat!: ...`, and `chore(release): ...`. Follow that style and include a scope when helpful.

Pull requests should describe the user-visible change, list validation performed, link related issues, and include screenshots or short recordings for popup, options, board, notepad, bookmarks, or Jira DOM changes.

## Security & Configuration Tips

Keep permissions in `manifest.json` minimal. The extension targets `*://*.atlassian.net/*`; avoid broadening host access unless the feature requires it. Do not commit local Chrome profiles, exported user data, or generated zip archives unless intentionally releasing.
