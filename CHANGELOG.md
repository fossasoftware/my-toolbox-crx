# Changelog

All notable changes to the "My ToolBox" Chrome extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (starting from this documented version).

## [5.2.0] - 2026-05-12

This minor release adds a Jira issue security level customizer for the issue header actions.

### Added

- Added a Security Level Customizer content script that shows the selected Jira security level directly on the issue header security button.
- Added cached Jira issue security-level loading so the button label appears quickly across reloads and issue navigation.
- Added a popup toggle for turning Security Level Customizer on or off.
- Added Preferences controls for Security Level Customizer text size, rainbow border, and hover rainbow glow.

### Changed

- Styled the security-level button as a single compact control with a rainbow border, balanced spacing, centered icon/text alignment, and static rainbow glow on hover.
- Disabled the hover rainbow glow preference when the rainbow border preference is turned off.
- Refreshed English and Ukrainian UI copy for the popup and Security Level Customizer settings card.
- Restored standard Atlassian-style hover behavior when rainbow hover glow is disabled.

### Fixed

- Preserved the native Jira security-level menu behavior when clicking either the lock icon or the displayed security-level text.

## [5.1.1] - 2026-04-30

This patch release improves Status Colorizer rendering across newer Jira status surfaces.

### Fixed

- Fixed animated ribbon status text being hidden on classic dashboard status lozenges.
- Added Status Colorizer coverage for Jira Home `For you` issue list status pills.
- Added Status Colorizer coverage for JQL builder status picker lozenges.

## [5.1.0] - 2026-04-30

This minor release adds selectable Status Colorizer animations and simplifies animated ribbon configuration.

### Added

- Added a Status Colorizer animation selector with ping, breathe, nudge, shimmer, glow, urgent, sweep, and ribbon options.
- Added automatic Status Colorizer settings migration so older saved rules continue to work after the animation schema changes.
- Added `AGENTS.md` with repository contributor guidelines.

### Changed

- Refreshed the default Status Colorizer palette and default animation assignments for common Jira statuses.
- Removed manual primary/secondary ribbon color settings; ribbon now derives a lighter secondary stripe from the status background color.
- Removed the dots and stripes animation options and simplified sweep to a sweep-only effect.

### Fixed

- Fixed Jira issue-view status button painting so colors and animations render on the visible button surface.
- Improved ribbon animation rendering to reduce visible seams and lag.
- Adjusted ping so the external wave remains visible without changing the button layout.

## [5.0.2] - 2026-04-29

This patch release restores Status Colorizer behavior after recent Atlassian Jira status button and lozenge markup changes.

### Changed

- Reworked Status Colorizer button painting to use a dedicated button surface layer so Jira ticket status buttons and compact status controls share the same stable background/ribbon rendering model.
- Expanded Jira helper mutation observation to include text, class, and stable status-related attribute changes so Jira hover/remount states repaint without waiting for slower viewport refreshes.

### Fixed

- Fixed Jira statuses not coloring automatically on page load after Atlassian delayed or changed status lozenge markup.
- Fixed Jira status colors disappearing or repainting late when hovering status buttons that Jira remounts into a different presentation structure.
- Fixed animated ribbon styling on Jira issue-view status buttons and compact status controls so animations render on the visible control surface instead of only on nested text spans.
- Fixed ribbon animation looping so the stripe pattern repeats seamlessly and keeps its phase when Jira remounts hovered status buttons.

## [5.0.1] - 2026-03-31

This patch release focuses on post-5.0.0 stabilization, Jira helper performance, and release hardening.

### Added

- Added packaging and validation support for the `5.0.1` release line, including updated release metadata and documentation.

### Changed

- Refined Jira helper internals so Status Colorizer and Row Highlighter use compiled rule lookup helpers, narrower repaint paths, and stronger separation between runtime logic and pure matching helpers.
- Reduced repeated repaint work in Jira helpers by throttling viewport-triggered refreshes and by limiting Row Highlighter viewport scans to rows that are visible or close to the viewport.
- Extended unit coverage with dedicated tests for Status Colorizer and Row Highlighter helper logic.

### Fixed

- Fixed multiple Board regressions around viewport restore, mixed selection, note-to-shape links, delete/undo/redo history, eraser behavior, and custom pen/eraser cursor rendering.
- Fixed Jira helper startup, live-update, virtualization, and scroll repaint issues so status colors and row highlights apply more reliably on first open and during long queue navigation.
- Fixed the large issue-view status button so ribbon styling no longer breaks the control, while still allowing the regular status lozenges to use animated ribbons.

## [5.0.0] - 2026-03-29

This major release summarizes all shipped work since the last GitHub release, `4.8.3`.

### Added

- Added the Board workspace with freehand drawing, notes, shapes, links, marquee multi-selection, undo/redo, autosave, zoom presets, wheel/trackpad pan and zoom, pen/eraser controls, link label editing, and JSON backup import/export.
- Added richer Notepad editing with markdown toolbar actions, split/preview modes, a keyboard-first search popup, heading and checkbox helpers, and note import/export.
- Added Bookmarks backup/import/export plus extra bookmark settings for icon size and pinned-label behavior.
- Added local validation and test tooling via `scripts/validate-extension.sh` and `node:test` coverage for Board, Notepad, and shared rule helpers.
- Added a release packaging script that builds a Chrome Web Store upload zip from the runtime extension files after a successful validation pass.

### Changed

- Reworked the Board UI around bottom-docked toolbars, contextual popups, FAQ/help, sharper zoom rendering, restored viewport state, mixed drag support, and more stable note/link workflows.
- Refactored Board, Notepad, Bookmarks, Status Colorizer, Row Highlighter, and the Options shell into smaller modules with shared core helpers, shared storage/runtime utilities, and a background service worker platform layer.
- Unified the Jira helper runtime so Status Colorizer and Row Highlighter now use the same shared content-script bootstrap and can apply rule updates live on already open Jira tabs.
- Refreshed Notepad, Board, Popup, and Options interactions to the newer rounded control style and improved restored UI state behavior after reload.

### Fixed

- Fixed multiple Board regressions around mixed selection, link persistence, delete/undo/redo history, backup import while the tab is hidden, zoom rendering, toolbar visibility, viewport restore, eraser behavior, and custom ink cursor behavior.
- Fixed Notepad search dismissal, focus, and toolbar layout issues.
- Fixed popup and Options startup flicker along with saved helper toggle restoration.
- Fixed Jira helper repaint/update issues so status colors and row highlights refresh reliably after settings changes.
- Fixed Jira helper startup timing so Status Colorizer and Row Highlighter apply more reliably on first page open without needing a manual off/on toggle from the popup.
- Fixed Jira helper repaint for long or virtualized issue lists so newly rendered rows and statuses are refreshed on scroll/viewport activity instead of only on DOM mutations.
- Optimized Jira helper repaint for Service Desk queue tables by narrowing the status/row selectors to the real virtual-table content and by updating only stale or changed elements instead of clearing all painted styles on every pass.
- Expanded Status Colorizer so the same status rules now apply across Jira queue tables, native issue tables, classic dashboard gadgets, issue-view status buttons and transition menus, issue history/status activity blocks, inline-card status lozenges, and workflow preview diagrams.
- Improved Row Highlighter runtime by compiling keyword matchers once per settings reload, caching searchable row text between DOM mutations, and only clearing the editor table after reset storage writes succeed.
- Changed Row Highlighter repaint to use a dedicated highlight class and CSS variable instead of snapshotting and rewriting the full row `style` attribute, which reduces the risk of clobbering unrelated inline styles from Jira.
- Refined Row Highlighter matching by using surface-specific searchable text extractors for issue tables, detail cards, board cards, activity items, and home feed links instead of relying on one broad text scrape for every row type.
- Throttled Row Highlighter viewport-triggered repaint so scroll/hover/resize activity is coalesced into fewer refresh frames while keeping DOM/storage-driven updates immediate.
- Extracted Row Highlighter keyword normalization and matcher compilation into a dedicated runtime helper file and added unit coverage for keyword normalization, alias handling, and first-match resolution.
- Limited Row Highlighter viewport refresh work to rows that are visible or near the viewport instead of re-evaluating every candidate row on each scroll-triggered repaint.
- Improved Status Colorizer runtime by compiling status and alias lookups once per settings reload and by restoring only the specific CSS properties it touches instead of snapshotting and rewriting the full inline `style` attribute on Jira status elements.
- Reworked Status Colorizer repaint into separate Jira surface collectors for standard badges, issue-view status buttons, and workflow nodes so future fixes can target one surface without risking regressions in the others.
- Throttled Status Colorizer viewport-triggered repaint so scroll/hover/resize activity is coalesced into fewer refresh frames while still keeping DOM/storage-driven updates immediate.
- Extracted Status Colorizer lookup and ribbon helper logic into a dedicated runtime helper file and added unit coverage for normalization, alias lookup, and ribbon gradient generation.

## [4.9.15] - 2026-03-26

### Changed

- Refactored the Board internals into smaller modules for viewport, history, storage, shape rendering, link interaction, selection, geometry, and toolbar/editor controllers.
- Reduced the main Board shell to a thinner orchestration layer so future Board changes can land in isolated modules instead of one large script.
- Extracted Board item content/style helpers, item renderer/lifecycle/interaction flows, main toolbar setup, settings/backup wiring, persistence/history/tool-state orchestration, hotkeys/help/canvas bootstrap flows, toolbar popup state, ink controls, and pen/eraser cursor UI into dedicated controllers so item title/color/text handling, item DOM creation, item drag/resize/create/remove logic, main toolbar wiring, backup/autosave modal flows, board persistence/import/export, undo/redo/tool-mode orchestration, board hotkeys, help popup wiring, canvas bootstrap listeners, docked popup switching, ink settings, and cursor rendering no longer live in the main Board shell.
- Extracted Board selection-state orchestration into a dedicated controller so shape/item selection, marquee flow, mixed drag, shape drag, deletion, and selection-outline decisions no longer live in the main Board shell.
- Extracted Board shape-resize lifecycle into a dedicated controller so resize handles, hover detection, constrained resize math, and resize commit checks no longer live in the main Board shell.
- Extracted Board selection overlay rendering into a dedicated controller so marquee, selection outlines, and link-source/link-target highlight drawing no longer live in the main Board shell.
- Extracted Board shape style mutations and eraser-based shape removal into dedicated controllers so fill/stroke changes and erase-hit cleanup no longer live in the main Board shell.
- Extracted Board canvas pointer orchestration into a dedicated controller so double-click edit entry, draw/erase start and finish, marquee start/finish, drag transitions, and shape-preview pointer flow no longer live in the main Board shell.
- Extracted Board shape-toolbar orchestration into a dedicated controller so visibility sync, overlay positioning, and transition-frame updates no longer live in the main Board shell.
- Extracted Board link render/update orchestration into a dedicated controller so preview lines, render-point resolution, link control sync, click/double-click handling, and SVG refresh flow no longer live in the main Board shell.
- Extracted Board item style/menu synchronization into a dedicated controller so note color changes, text style mutations, and item toolbar/menu state sync no longer live in the main Board shell.
- Extracted Board link item-highlight state into a dedicated controller so source/hover note highlight elements no longer live as raw shell state.
- Extracted Board lifecycle orchestration into a dedicated controller so bootstrapping, board reset, and empty-state sync no longer live in the main Board shell.
- Extracted Board link text/label helpers into a dedicated controller so label creation, text sizing, and editor-bound calculations no longer live in the main Board shell.
- Extracted Board selection visual helpers into a dedicated controller so selection colors, fill overlays, selection bounds, and selected-link outline rendering no longer live in the main Board shell.
- Extracted Board item-menu shell orchestration into a dedicated controller so menu target lookup, open/close flow, and viewport-aware menu positioning no longer live in the main Board shell.
- Extracted Board UI bootstrap/setup wiring into a dedicated controller so item menu, shape toolbar, and link controls no longer query and initialize their DOM directly inside the main Board shell.
- Extracted Board canvas query and render-loop helpers into dedicated controllers so shape/link hit lookup, text hit-testing, stroke visibility checks, and the canvas redraw loop no longer live in the main Board shell.
- Extracted Board item-toolbar shell orchestration into a dedicated controller so active note toolbar lookup, show/hide flow, overlay positioning, and transition-frame syncing no longer live in the main Board shell.
- Extracted Board selection query helpers into a dedicated controller so selected shape/item collection, rect-based selectable lookup, and toolbar-bounds lookup no longer live in the main Board shell.
- Extracted Board UI preview helpers into a dedicated controller so shape color/size menu sync, shape stroke-width preview, and pen/eraser preview DOM updates no longer live in the main Board shell.
- Collapsed more Board shell bridge logic by routing item rename through a dedicated controller instance and letting persistence and selection-visual flows call their owning controllers directly instead of hopping through extra shell wrappers.
- Replaced another block of Board shell persistence/history wrappers with direct controller bindings so autosave, save/export/import, undo/redo, tool switching, and history commits no longer need duplicated bridge functions in the main Board shell.
- Replaced another block of Board shell UI/link wrappers with direct controller bindings so setup flows, popup actions, lifecycle calls, and several link/item passthrough helpers no longer need duplicated bridge functions in the main Board shell.
- Replaced another block of Board shell viewport, toolbar-popup, cursor, item-content/style/menu, and selection bindings with direct controller calls, then removed the dead passthrough helpers those bindings made unnecessary so the main Board shell stays closer to a composition root than a forwarding layer.
- Replaced another block of Board shell popup, cursor, item-toolbar, item-menu, and link-preview forwarding helpers with lazy controller API bindings so those flows no longer rely on duplicated shell wrappers and still initialize safely without top-level controller-order regressions.
- Replaced another block of Board shell viewport, hotkey, and shape-renderer forwarding helpers with lazy controller API bindings so zoom/pan access, canvas event wiring, and text-render helper flows no longer need duplicated shell wrappers while still passing safe module-init checks.
- Replaced another block of Board shell selection/query/shape-edit/shape-resize forwarding helpers with lazy controller API bindings so the hotkey, canvas-pointer, selection-overlay, shape-toolbar, and lifecycle flows can call their owning controllers directly without relying on duplicated passthrough functions in the main Board shell.
- Replaced another block of Board shell canvas-query, shape-style, link-editor, link-render, item-lifecycle, and item-interaction forwarding helpers with lazy controller API bindings, then removed the now-dead bottom-of-file passthrough layer so the Board shell keeps shrinking toward a composition root instead of a wrapper hub.
- Extracted the Board lazy controller-API layer into a dedicated `board-apis` factory so the main Board shell no longer needs to host the full glue block for persistence, selection, viewport, item, link, and shape controller wrappers inline.
- Extracted the full Board item controller composition into a dedicated `board-item-stack` factory so note content/style, rename flow, menu shell, toolbar shell, drag/resize interaction, item lifecycle, and item renderer wiring no longer need to be assembled inline in the main Board shell.
- Extracted the Board toolbar/help/settings/ink composition into a dedicated `board-ui-controls-stack` factory so toolbar popup switching, note/shape menu wiring, help popup setup, backup/settings controls, and pen/eraser UI orchestration no longer need to be assembled inline in the main Board shell.
- Extracted the Board shape composition into a dedicated `board-shape-stack` factory so shape editor, shape renderer, resize flow, style mutations, shape-toolbar orchestration, and eraser cleanup no longer need to be assembled inline in the main Board shell.
- Extracted the Board link composition into a dedicated `board-link-stack` factory so link highlight state, link interaction, popup positioning, link text/layout helpers, link editor lifecycle, link rendering, and selected-link visual helpers no longer need to be assembled inline in the main Board shell.
- Extracted the Board selection composition into a dedicated `board-selection-stack` factory so selection query/state, marquee flow, mixed drag selection state, item-selection overlays, and selection overlay rendering no longer need to be assembled inline in the main Board shell.
- Extracted the Board canvas core composition into a dedicated `board-canvas-core-stack` factory so cursor state, canvas redraw orchestration, viewport/zoom wiring, and canvas query helpers no longer need to be assembled inline in the main Board shell.
- Extracted the Board canvas interaction composition into a dedicated `board-canvas-interaction-stack` factory so hotkeys, pointer-event orchestration, and canvas/stage bootstrap wiring no longer need to be assembled inline in the main Board shell.
- Extracted the Board application-shell composition into a dedicated `board-app-stack` factory so UI bootstrap wiring, autosave/import-export persistence, lifecycle bootstrapping, and shell/history orchestration no longer need to be assembled inline in the main Board shell.
- Extracted the Board mutable runtime state into a dedicated `board-runtime-state` module so board/tool state, selection state, drag/resize state, link state, and editor/toolbar transition state no longer need to be declared inline as one large block in the main Board shell.
- Extracted the Board outer-shell DOM refs into a dedicated `board-shell-refs` module so canvas/viewport refs, toolbar/help refs, and settings/backup refs no longer need to be declared inline as another large mutable block in the main Board shell.
- Extracted the remaining Board feature DOM refs into a dedicated `board-feature-refs` module so note-menu, ink-panel, shape-toolbar, and link-controls refs no longer need to be declared inline in the main Board shell.
- Extracted the Board application, link, selection, and shape stack wiring into dedicated stack-option builders so the main Board shell no longer hosts the longest composition object literals for autosave/history wiring, link setup, selection orchestration, or shape stack assembly.
- Extracted the Board item, canvas-core, canvas-interaction, and UI-controls stack wiring into a dedicated `board-shell-stack-options` module so the main Board shell no longer assembles those root-level dependency objects inline.
- Replaced the Board lazy controller getter block for `createBoardApis` with a shared `controllerRefs` registry plus `board-api-options`, so the main Board shell no longer needs to host a large TDZ-sensitive closure map for persistence, selection, viewport, item, link, and shape controller access.
- Split the Notepad feature into dedicated modules for history, storage, formatting, preview, search, view mode, and DOM bindings to reduce the main shell size.
- Extracted Notepad history and persistence orchestration into dedicated controllers so undo/redo, autosave, import/export, and preview refresh no longer live in one main script.
- Split Notepad search into dedicated state and UI helpers so match navigation logic and DOM reveal behavior no longer live in a single controller file.
- Split Notepad markdown formatting into pure transform helpers plus a thin controller layer that only bridges textarea state to commits.
- Split Notepad bindings into dedicated toolbar and editor binding modules while keeping the same public binding surface for the shell.
- Split the Bookmarks feature into dedicated controllers for actions, modal handling, drag-and-drop, settings, and storage sync, leaving the main module as a thin composition layer.
- Split Bookmarks persistence into dedicated constants, settings, data, backup, and storage modules while keeping the public storage API stable for existing callers.
- Split Bookmarks rendering into dedicated item/icon factory helpers so the main render module now focuses on list orchestration.
- Split the Bookmarks modal flow into dedicated state and submit helpers so the controller now only wires events and composes behavior.
- Split Bookmarks drag-and-drop into dedicated layout/reflow helpers so the controller now focuses on pointer lifecycle and reorder commits.
- Started consolidating shared rule-editor infrastructure between Status Colorizer and Row Highlighter by extracting common alias-row, import/export, import-merge, and storage-backed settings helpers into shared feature modules.
- Split Status Colorizer and Row Highlighter into thinner editor shells with dedicated table, import, and storage modules, and extracted Options page navigation, translation, and table-state helpers into reusable core modules.
- Split Status Colorizer table logic into dedicated DOM/render and validation/collection modules while preserving the existing table API for callers.
- Split Row Highlighter table logic into dedicated DOM/render and validation/collection modules while preserving the existing table API for callers.
- Split `core/options-ui` into dedicated toast, dialog, and default-settings-state modules while preserving the existing import surface for feature modules.
- Added a shared runtime helper for Jira content scripts and applied it to the Status Colorizer worker bootstrap.
- Applied the shared Jira worker runtime to Row Highlighter through its own content-script entry and aligned its worker bootstrap with the same runtime-aware loading/observer pattern while keeping a local fallback path.
- Isolated both Jira content-script workers behind local IIFEs so Status Colorizer and Row Highlighter no longer leak helper names into the shared page-level script scope while still using the shared runtime helper.
- Added shared sync-storage change observation to the Jira worker runtime and wired both Status Colorizer and Row Highlighter to live-refresh from `chrome.storage.onChanged`, clearing previously injected inline styles before repaint so rule updates apply on open Jira pages without a manual reload.
- Added a local `scripts/validate-extension.sh` quality gate that validates `manifest.json`, runs `node --check` across extension scripts, smoke-imports the Board entry with a stubbed DOM, and fails on trailing whitespace or malformed patch output.
- Expanded the local validation pass with minimal `node:test` coverage for Board history, color, link-endpoint, and stroke-path/eraser/model helpers, Notepad markdown transforms, and shared rule-import merging so core pure-module regressions are caught before manual smoke testing.

### Fixed

- Fixed Board shape-toolbar visibility so mixed stroke selections such as a shape plus a drawn line no longer show the single-shape styling toolbar.
- Fixed Board viewport persistence so the last pan/zoom position is restored after a page reload instead of snapping back to the default view.
- Fixed Board startup ordering so restoring a persisted viewport no longer drops note-to-shape links before note DOM elements are rendered.
- Fixed Board delete/undo history capture so removing a mixed selection now snapshots the full pre-delete link graph before clearing selected shapes and notes.
- Fixed Board link cleanup so `updateLinks()` no longer drops a note-to-shape link during `undo` just because one endpoint is temporarily unresolved in the DOM while both endpoints still exist in board state.
- Fixed Notepad search navigation buttons so clicking previous/next/close no longer steals focus and flashes the search popup border.
- Fixed Board freehand erasing so pen-stroke erasure now rewrites stored draw strokes instead of leaving a standalone canvas erase mask behind, which keeps erased gaps attached to the drawing during later drag/move operations and also normalizes legacy saved erase strokes on load.
- Optimized Board freehand erasing so large erase gestures no longer brute-force every sampled stroke point against the full eraser path and the live erase preview now redraws at animation-frame cadence instead of on every raw pointer event.
- Changed Board freehand erasing to keep an erased pen drawing as one stroke with internal visible subpaths instead of splitting it into multiple standalone stroke objects, which also restores small-eraser edits on fine details.
- Raised the minimum Board eraser size to `16` and now clamp saved/runtime eraser settings to that lower bound so the toolbar slider, defaults, and restored board state stay aligned.
- Fixed Board ink cursor visibility so the custom pen/eraser cursor now resets on `pointercancel`, window blur, document hide, and fast pointer exits, and draw/erase mode now hides the native cursor across the whole board stage instead of only the canvas element.

## [4.9.14] - 2026-03-25

### Changed

- Restyled the Board main toolbar, zoom controls, and FAQ popup to use the newer soft rounded shell design.
- Moved the Notepad `Split` and `Preview` switch to the bottom-right corner.
- Replaced oversized `999px` rounded corners in UI controls with a consistent `22px` radius across the updated interface.
- Removed shadow styling from Notepad buttons for a cleaner flat look.

### Fixed

- Fixed Board toolbar and zoom panel corner animation glitches during expand and collapse.

## [4.9.13] - 2026-03-25

### Added

- Added Notepad quick actions for `H1`, `H2`, `H3`, and markdown checkbox lists.

### Changed

- Reworked the Notepad search UI into a keyboard-first popup in the top-right corner with icon-based previous/next/close controls.
- Updated Notepad formatting quick actions and search navigation to use SVG icons instead of text labels.
- Reordered the Notepad toolbar to group save/history actions, formatting tools, and heading actions more clearly.
- Moved `Split` and `Preview` controls out of the bottom toolbar into the Notepad header.
- Restyled the Notepad view switch and bottom toolbar to the newer soft segmented visual style.

### Fixed

- Fixed Notepad search dismissal so an empty search closes when clicking outside the popup.
- Fixed Notepad toolbar icon sizing so save/history, formatting, heading, and view buttons use a consistent visual scale.
- Fixed Notepad view-switch styling issues, including distorted button sizing and inconsistent active/pressed states.
- Removed hover tooltips from Notepad buttons while preserving accessibility labels.

## [4.9.12] - 2026-03-21

### Added

- Added a richer Notepad toolbar with undo/redo, markdown formatting actions, split/preview view controls, and note export/import support in Preferences.
- Added in-note search for Notepad with match navigation, keyboard shortcuts, and preview highlighting.

### Changed

- Reworked Notepad search into a floating popup in the top-right corner that opens via `Cmd/Ctrl+F`.
- Updated Notepad formatting controls to use icon buttons and added markdown shortcuts for bold, italic, and link actions.
- Expanded the README Notepad section to document the new editing, view-mode, import/export, and search capabilities.

### Fixed

- Fixed Notepad header spacing after moving search into a floating popup so the editor no longer overlaps the title.
- Fixed Notepad search dismissal behavior: it now supports a dedicated close button and closes on outside click when the search field is empty.

## [4.9.11] - 2026-03-20

### Changed

- Renamed the Board Settings action from `Backup` to `Export`, removed extra helper copy, and aligned export filenames/messages with the new wording.
- Moved Bookmarks import/export controls below the pinned-label settings in Preferences for a cleaner layout.
- The Options page now restores the last open/closed side menu state and the last active tab after reload.

### Fixed

- Fixed visual startup flicker in the Options shell so the side menu, active tab, and language indicator no longer jump from default state to the restored one.
- Fixed popup toggle flicker for Status colorizer and Row highlighter when restoring their saved enabled state.

## [4.9.10] - 2026-03-20

### Added

- Added Board backup/import actions in Settings, including local board state export to JSON and restore from backup.
- Added Bookmarks import/export in Settings with full backup support for bookmark data, pinned state, local icons, and bookmark section settings.

### Changed

- Reworked the Board FAQ popup content into a question/answer format and updated copy in both English and Ukrainian.
- Updated the Board FAQ popup title to `FAQ` and set a fixed expanded height for more consistent popup behavior.
- Removed trailing periods from short toast notifications for a cleaner UI tone.

### Fixed

- Fixed Board link loss when importing backups from Settings while the Board tab is hidden.
- Hidden `boardShapeControls` for multi-shape and mixed shape+note selections to avoid unnecessary controls.

## [4.9.9] - 2026-03-06

### Changed

- Reworked the main board toolbar into a bottom dock with a unified expandable panel behavior, matching the zoom control interaction pattern.
- Updated main toolbar order: `Select → Hand → Link | Pen → Eraser → Shapes → Note | Clear`.
- Added consistent visual separators around grouped tool actions in the main toolbar.
- Unified board mini-toolbar cards (shape/item/link) to the same container style and panel animation behavior.
- Moved the board local-storage hint into the Help/FAQ popup.
- Reworked expanded popups in the main board toolbar: pen controls + color palette now use a responsive row layout with wrap.
- Updated Shapes and Notes expanded menus to render options in horizontal rows with wrapping.

### Fixed

- Fixed item/shape/link expandable mini-menus so they open upward reliably during animated transitions.
- Fixed multi-selection toolbar visibility when the main toolbar is visible (z-index and positioning overlap).
- Fixed pinned multi-selection toolbar placement so it stays above bottom dock controls.
- Fixed toolbar popup switching behavior to avoid stacked close/open animation artifacts.
- Fixed unwanted trailing spacing after the Clear (broom) action in the main toolbar.

## [4.9.8] - 2026-03-06

### Changed

- Improved board link rendering on zoom by decoupling link SVG from viewport scaling and updating link geometry in screen-space.
- Tuned link anchor offsets for thick-stroke shapes, including a dedicated star anchor offset behavior.

### Fixed

- Fixed blurry link lines and labels after zoom changes.
- Fixed blurry note text after zoom (no extra click needed to refresh rendering).
- Fixed note size drift when repeatedly adding/removing notes (ResizeObserver now uses border-box dimensions).
- Fixed centered placeholder in the "Decision" note variant so it matches other note types.

## [4.9.7] - 2026-02-11

### Added

- Board zoom scale popup with direct preset selection (not only `+` / `-`).

### Changed

- Board zoom controls now support faster wheel/trackpad step changes while hovering the zoom control.
- Performed release-readiness cleanup for Board code and localization consistency.

### Removed

- Removed dead Board state/handlers that were no longer used by the note text toolbar flow.
- Removed unused Ukrainian localization keys for deprecated Board menu actions/options.

## [4.9.6] - 2026-02-03

### Added

- Link buttons in shape and note mini toolbars for faster linking.

### Changed

- Note delete action now uses an icon button.
- Removed the board subtitle and hint text from the UI.

### Fixed

- Mixed selection dragging now moves shapes and notes together.
- Improved drag performance for notes and mixed selections.

## [4.9.5] - 2026-02-01

### Added

- Link popup with color, style, label editing, and delete controls.
- Link label editing on double-click.

### Changed

- Link style picker uses circular ring icons; main style button uses the circle-dashed icon.
- Link popups now position relative to a link selection outline for clearer context.

### Fixed

- Link selection now appears immediately and clears correctly after deletion or switching selection.
- Link anchor points respect shape stroke bounds when connecting.
- Double-clicking a link line now reliably opens the label editor.

## [4.9.4] - 2026-01-25

### Changed

- Updated icon pack to Font Awesome 7.1.0 and refreshed icon filenames.

## [4.9.3] - 2026-01-25

### Added

- Shapes and notes popups in the board toolbar with icon grids.
- New shape options: star, heart, hexagon, trapezoid, and parallelogram.
- Live size/opacity preview dots for pen and eraser sliders.

### Changed

- Ellipse tool icon now shows a circle (tool still draws ellipses).

## [4.9.2] - 2026-01-24

### Added

- Pen popup with stroke size, opacity, and color controls.
- Eraser popup with adjustable size (up to 64px).
- Pen dot cursor that reflects color, size, and opacity.

### Changed

- Eraser now removes shapes entirely on contact for stable behavior.
- Board sliders use integer steps only.

## [4.9.1] - 2026-01-24

### Added

- Trackpad/scroll wheel gestures for board zoom and pan (pinch to zoom, two-finger scroll).

### Changed

- Adjusted board pinch-zoom speed for smoother control.

## [4.9.0] - 2026-01-23

### Added

- New Board tab with freehand drawing, shapes, links, and notes.
- Rich note editor with per-word text styling, size/color controls, and context menu presets.
- Shape mini-toolbar with fill/stroke palettes, stroke thickness, text editing, and delete.
- Multi-select, marquee selection, and select-all support for board elements.
- Undo/redo actions with keyboard shortcuts.
- Autosave toggle with manual save action in the board toolbar.

### Changed

- Updated board toolbar to icon-based controls and lighter button styling.
- Selection visuals now use uniform dashed outlines and brand color styling.

### Fixed

- Selection interactions for notes and shapes now behave consistently with shift/marquee selection.
- Link lines now connect at shape edges and use a refined line style.

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
