import { showToast } from "../../core/options-ui.js";
import { createNotepadFormattingController } from "./notepad-formatting.js";
import {
  bindAutosaveControls,
  bindFormatButtons,
  bindGlobalSearchShortcuts,
  bindImportExportControls,
  bindNotepadAreaEvents,
  bindSaveControls,
  bindSearchControls,
  bindViewButtons,
} from "./notepad-bindings.js";
import { createNotepadHistoryManager } from "./notepad-history.js";
import {
  bindSyncedNotepadScroll,
  renderNotepadPreview,
  waitForMarkdownLibraries,
} from "./notepad-preview.js";
import { createNotepadHistoryController } from "./notepad-history-controller.js";
import { createNotepadPersistenceController } from "./notepad-persistence-controller.js";
import { createNotepadSearchController } from "./notepad-search.js";
import {
  buildNotepadExportPayload,
  downloadNotepadBackup,
  loadNotepadAutosavePreference,
  loadNotepadViewModePreference,
  loadStoredNotepadContent,
  normalizeNotepadViewMode,
  readNotepadImportFile,
  saveNotepadAutosavePreference,
  saveNotepadViewModePreference,
  saveStoredNotepadContent,
} from "./notepad-storage.js";
import { createNotepadViewModeController } from "./notepad-view-mode.js";

let autosaveToggle;
let saveButton;
let undoButton;
let redoButton;
let formatButtons = [];
let viewButtons = [];
let searchShell;
let searchPanel;
let searchInput;
let searchPrevButton;
let searchNextButton;
let searchCloseButton;
let searchCount;
let notepadWrapper;
let searchShortcutsBound = false;
const NOTEPAD_HISTORY_LIMIT = 120;
let notepadSearch;
const notepadHistory = createNotepadHistoryManager({
  historyLimit: NOTEPAD_HISTORY_LIMIT,
});
let notepadHistoryController;
let notepadViewMode;
const notepadPersistence = createNotepadPersistenceController({
  autosaveDelay: 750,
  bindSyncedNotepadScroll,
  buildNotepadExportPayload,
  downloadNotepadBackup,
  getActiveSearchMatchIndex: () => notepadSearch?.getActiveSearchMatchIndex() ?? -1,
  getAutosaveToggle: () => autosaveToggle,
  getCurrentViewMode: () => notepadViewMode?.getCurrentViewMode() ?? "split",
  getLastNonPreviewViewMode: () =>
    notepadViewMode?.getLastNonPreviewViewMode() ?? "split",
  getNotepadArea: () => document.getElementById("notepadArea"),
  getNotepadPreview: () => document.getElementById("notepadPreview"),
  getSaveButton: () => saveButton,
  getSearchQuery: () => notepadSearch?.getSearchQuery() ?? "",
  loadNotepadAutosavePreference,
  loadNotepadViewModePreference,
  loadStoredNotepadContent,
  readNotepadImportFile,
  refreshSearchState: (options) => notepadSearch?.refreshSearchState(options),
  renderNotepadPreview,
  resetHistory: (area) => notepadHistoryController?.resetHistory(area),
  saveNotepadAutosavePreference,
  saveNotepadViewModePreference,
  saveStoredNotepadContent,
  searchHasQuery: () => notepadSearch?.hasSearchQuery() ?? false,
  setLastNonPreviewViewMode: (mode) =>
    notepadViewMode?.setLastNonPreviewViewMode(mode),
  setNotepadViewMode: (mode, options) =>
    notepadViewMode?.setNotepadViewMode(mode, options),
  showToast,
  waitForMarkdownLibraries,
});
const notepadFormatting = createNotepadFormattingController({
  commitNotepadValue: (...args) => notepadHistoryController?.commitNotepadValue(...args),
  getNotepadArea: () => document.getElementById("notepadArea"),
});
notepadViewMode = createNotepadViewModeController({
  getNotepadArea: () => document.getElementById("notepadArea"),
  getNotepadPreview: () => document.getElementById("notepadPreview"),
  getNotepadWrapper: () => notepadWrapper,
  getViewButtons: () => viewButtons,
  normalizeViewMode,
  saveViewModePreference: notepadPersistence.saveViewModePreference,
  updateFormatButtons,
  updateHistoryButtons: () => notepadHistoryController?.updateHistoryButtons(),
});
notepadSearch = createNotepadSearchController({
  getCurrentViewMode: () => getCurrentViewMode(),
  getNotepadArea: () => document.getElementById("notepadArea"),
  getNotepadPreview: () => document.getElementById("notepadPreview"),
  getSearchCloseButton: () => searchCloseButton,
  getSearchCount: () => searchCount,
  getSearchInput: () => searchInput,
  getSearchNextButton: () => searchNextButton,
  getSearchPanel: () => searchPanel,
  getSearchPrevButton: () => searchPrevButton,
  getSearchShell: () => searchShell,
  renderMarkdownPreview: () => notepadPersistence.renderMarkdownPreview(),
});
notepadHistoryController = createNotepadHistoryController({
  debouncedSaveNotepad: () => notepadPersistence.debouncedSaveNotepad(),
  getAutosaveEnabled: () => notepadPersistence.getAutosaveEnabled(),
  getCurrentViewMode: () => notepadViewMode?.getCurrentViewMode() ?? "split",
  getNotepadArea: () => document.getElementById("notepadArea"),
  getRedoButton: () => redoButton,
  getUndoButton: () => undoButton,
  hasSearchQuery: () => notepadSearch?.hasSearchQuery() ?? false,
  historyManager: notepadHistory,
  refreshSearchState: (options) => notepadSearch?.refreshSearchState(options),
  renderMarkdownPreview: () => notepadPersistence.renderMarkdownPreview(),
});

function applyMarkdownFormat(format) {
  notepadFormatting.applyMarkdownFormat(format);
}

function normalizeViewMode(mode) {
  return normalizeNotepadViewMode(mode);
}

function updateFormatButtons() {
  const isPreviewOnly = getCurrentViewMode() === "preview";
  formatButtons.forEach((button) => {
    button.disabled = isPreviewOnly;
    button.setAttribute("aria-disabled", button.disabled ? "true" : "false");
  });
}

function updateSearchControls() {
  notepadSearch.updateSearchControls();
}

function setSearchOpen(
  open,
  { focusInput = false, selectInput = false, clearQueryOnClose = false } = {}
) {
  notepadSearch.setSearchOpen(open, {
    focusInput,
    selectInput,
    clearQueryOnClose,
  });
}

function refreshSearchState({ preserveActive = false, reveal = false, keepInputFocus = false } = {}) {
  notepadSearch.refreshSearchState({ preserveActive, reveal, keepInputFocus });
}

function resolveNextViewMode(controlMode) {
  return notepadViewMode.resolveNextViewMode(controlMode);
}

function setNotepadViewMode(mode, options = {}) {
  notepadViewMode.setNotepadViewMode(mode, options);
}

function getCurrentViewMode() {
  return notepadViewMode.getCurrentViewMode();
}

export function initializeNotepad() {
  const notepadArea = document.getElementById('notepadArea');
  const notepadImportFileInput = document.getElementById("notepadImportFile");
  const notepadImportButton = document.getElementById("notepadImportBtn");
  const notepadExportButton = document.getElementById("notepadExportBtn");
  searchShell = document.getElementById("notepadSearchShell");
  searchPanel = document.getElementById("notepadSearchPanel");
  searchInput = document.getElementById("notepadSearchInput");
  searchPrevButton = document.getElementById("notepadSearchPrevButton");
  searchNextButton = document.getElementById("notepadSearchNextButton");
  searchCloseButton = document.getElementById("notepadSearchCloseButton");
  searchCount = document.getElementById("notepadSearchCount");
  if (!notepadArea) {
    console.error("Notepad: Missing Notepad textarea");
    return;
  }

  autosaveToggle = document.getElementById('notepadAutosaveToggle');
  saveButton = document.getElementById('notepadSaveButton');
  undoButton = document.getElementById("notepadUndoButton");
  redoButton = document.getElementById("notepadRedoButton");
  notepadWrapper = document.querySelector(".notepad-wrapper");
  formatButtons = Array.from(
    document.querySelectorAll(".notepad-format-button")
  );
  viewButtons = Array.from(
    document.querySelectorAll(".notepad-view-button")
  );

  bindAutosaveControls({
    autosaveToggle,
    debouncedSaveNotepad: () => notepadPersistence.debouncedSaveNotepad(),
    saveAutosavePreference: (enabled) => notepadPersistence.saveAutosavePreference(enabled),
    setAutosaveState: (enabled) => notepadPersistence.setAutosaveState(enabled),
  });
  bindSaveControls({
    redoButton,
    redoNotepad: () => notepadHistoryController?.redoNotepad(),
    saveButton,
    saveNotepadContent: (options) => notepadPersistence.saveNotepadContent(options),
    undoButton,
    undoNotepad: () => notepadHistoryController?.undoNotepad(),
  });
  bindFormatButtons({
    applyMarkdownFormat,
    formatButtons,
  });
  bindViewButtons({
    resolveNextViewMode,
    setNotepadViewMode,
    viewButtons,
  });
  bindImportExportControls({
    importButton: notepadImportButton,
    importFileInput: notepadImportFileInput,
    importNotepadBackup: (event) => notepadPersistence.importNotepadBackup(event),
    exportButton: notepadExportButton,
    exportNotepadBackup: () => notepadPersistence.exportNotepadBackup(),
  });
  bindSearchControls({
    handleCloseClick: () => notepadSearch.handleCloseClick(),
    handleInputChange: (value) => notepadSearch.handleInputChange(value),
    handleInputKeydown: (event) => notepadSearch.handleInputKeydown(event),
    handleNextClick: () => notepadSearch.handleNextClick(),
    handlePrevClick: () => notepadSearch.handlePrevClick(),
    searchCloseButton,
    searchInput,
    searchNextButton,
    searchPrevButton,
  });
  bindNotepadAreaEvents({
    applyMarkdownFormat,
    autosaveEnabledRef: () => notepadPersistence.getAutosaveEnabled(),
    debouncedSaveNotepad: () => notepadPersistence.debouncedSaveNotepad(),
    notepadArea,
    pushHistorySnapshot: () => notepadHistoryController?.pushHistorySnapshot(),
    redoNotepad: () => notepadHistoryController?.redoNotepad(),
    renderMarkdownPreview: () => notepadPersistence.renderMarkdownPreview(),
    searchHasQuery: () => notepadSearch.hasSearchQuery(),
    refreshSearchState,
    undoNotepad: () => notepadHistoryController?.undoNotepad(),
  });
  bindGlobalSearchShortcuts({
    handleGlobalKeydown: (event) => notepadSearch.handleGlobalKeydown(event),
    handleGlobalMousedown: (event) => notepadSearch.handleGlobalMousedown(event),
    isAlreadyBound: () => searchShortcutsBound,
    markBound: () => {
      searchShortcutsBound = true;
    },
  });

  notepadHistoryController?.resetHistory(notepadArea);
  setNotepadViewMode("split", { animate: false });
  setSearchOpen(false);
  updateSearchControls();
  notepadPersistence.loadAutosavePreference();
  notepadPersistence.loadViewModePreference();
  notepadPersistence.waitForMarkdownAndThenInit();
  notepadPersistence.bindSyncedScroll();
}
