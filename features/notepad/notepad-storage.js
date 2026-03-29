export const NOTEPAD_CONTENT_KEY = "notepadContent";
export const NOTEPAD_AUTOSAVE_KEY = "notepadAutosaveEnabled";
export const NOTEPAD_VIEW_MODE_KEY = "notepadViewMode";
export const NOTEPAD_EXPORT_KIND = "my-toolbox-notepad-export";
export const NOTEPAD_EXPORT_VERSION = 1;
const NOTEPAD_VIEW_MODES = new Set(["split", "editor", "preview"]);

export function normalizeNotepadViewMode(mode) {
  return NOTEPAD_VIEW_MODES.has(mode) ? mode : "split";
}

export function loadNotepadViewModePreference({ onLoaded, onError }) {
  chrome.storage.sync.get(NOTEPAD_VIEW_MODE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
      return;
    }
    onLoaded?.(data[NOTEPAD_VIEW_MODE_KEY]);
  });
}

export function saveNotepadViewModePreference(mode, { onError } = {}) {
  chrome.storage.sync.set({ [NOTEPAD_VIEW_MODE_KEY]: mode }, () => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
    }
  });
}

export function loadNotepadAutosavePreference({ onLoaded, onError }) {
  chrome.storage.sync.get(NOTEPAD_AUTOSAVE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
      return;
    }
    onLoaded?.(data[NOTEPAD_AUTOSAVE_KEY]);
  });
}

export function saveNotepadAutosavePreference(enabled, { onError } = {}) {
  chrome.storage.sync.set({ [NOTEPAD_AUTOSAVE_KEY]: enabled }, () => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
    }
  });
}

export function buildNotepadExportPayload({
  autosaveEnabled,
  content,
  currentViewMode,
  lastNonPreviewViewMode,
}) {
  return {
    type: NOTEPAD_EXPORT_KIND,
    version: NOTEPAD_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    content: content || "",
    autosaveEnabled,
    viewMode: normalizeNotepadViewMode(currentViewMode),
    lastNonPreviewViewMode: normalizeNotepadViewMode(lastNonPreviewViewMode),
  };
}

export function parseNotepadExportPayload(raw) {
  if (typeof raw === "string") {
    return {
      content: raw,
      autosaveEnabled: null,
      viewMode: null,
      lastNonPreviewViewMode: "split",
    };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const content =
    typeof raw.content === "string"
      ? raw.content
      : typeof raw.notepadContent === "string"
        ? raw.notepadContent
        : typeof raw.text === "string"
          ? raw.text
          : typeof raw.value === "string"
            ? raw.value
            : null;

  if (content === null) {
    return null;
  }

  const viewMode =
    typeof raw.viewMode === "string"
      ? normalizeNotepadViewMode(raw.viewMode)
      : typeof raw.mode === "string"
        ? normalizeNotepadViewMode(raw.mode)
        : null;
  const lastMode =
    typeof raw.lastNonPreviewViewMode === "string"
      ? normalizeNotepadViewMode(raw.lastNonPreviewViewMode)
      : viewMode && viewMode !== "preview"
        ? viewMode
        : "split";

  return {
    content,
    autosaveEnabled:
      typeof raw.autosaveEnabled === "boolean" ? raw.autosaveEnabled : null,
    viewMode,
    lastNonPreviewViewMode: lastMode === "preview" ? "split" : lastMode,
  };
}

export function downloadNotepadBackup(payload) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-toolbox-notepad-export-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readNotepadImportFile(
  file,
  { onLoaded, onParseError, onReadError, onValidationError } = {}
) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    let raw;
    try {
      raw = JSON.parse(loadEvent.target.result);
    } catch (error) {
      onParseError?.(error);
      return;
    }

    const imported = parseNotepadExportPayload(raw);
    if (!imported) {
      onValidationError?.();
      return;
    }

    onLoaded?.(imported);
  };
  reader.onerror = (error) => {
    onReadError?.(error);
  };
  reader.readAsText(file);
}

export function loadStoredNotepadContent({ onLoaded, onError }) {
  chrome.storage.sync.get(NOTEPAD_CONTENT_KEY, (data) => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
      return;
    }
    onLoaded?.(data[NOTEPAD_CONTENT_KEY] || "");
  });
}

export function saveStoredNotepadContent(content, { onSaved, onError } = {}) {
  chrome.storage.sync.set({ [NOTEPAD_CONTENT_KEY]: content }, () => {
    if (chrome.runtime.lastError) {
      onError?.(chrome.runtime.lastError);
      return;
    }
    onSaved?.();
  });
}
