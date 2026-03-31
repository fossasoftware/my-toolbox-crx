import {
  buildBoardBackupPayload,
  makeDefaultBoardState,
  makeDefaultBoardViewportState,
  normalizeBoardState,
  normalizeBoardViewportState,
  parseBoardBackupPayload,
} from "./board-model.js";
import {
  getLocalStorage,
  getSyncStorage,
  setLocalStorage,
  setSyncStorage,
} from "../../core/storage.js";

const BOARD_STORAGE_KEY = "boardStateV1";
const BOARD_VIEWPORT_STORAGE_KEY = "boardViewportStateV1";
const BOARD_AUTOSAVE_KEY = "boardAutosaveEnabled";

export async function loadStoredBoardState(options = {}) {
  const result = await getLocalStorage(BOARD_STORAGE_KEY);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      state: makeDefaultBoardState(),
    };
  }

  return {
    ok: true,
    error: null,
    state: normalizeBoardState(result.data[BOARD_STORAGE_KEY], options),
  };
}

export function saveStoredBoardState(state) {
  return setLocalStorage({ [BOARD_STORAGE_KEY]: state });
}

export async function loadStoredBoardViewportState() {
  const result = await getLocalStorage(BOARD_VIEWPORT_STORAGE_KEY);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      viewport: makeDefaultBoardViewportState(),
    };
  }

  return {
    ok: true,
    error: null,
    viewport: normalizeBoardViewportState(result.data[BOARD_VIEWPORT_STORAGE_KEY]),
  };
}

export function saveStoredBoardViewportState(viewport) {
  return setLocalStorage({
    [BOARD_VIEWPORT_STORAGE_KEY]: normalizeBoardViewportState(viewport),
  });
}

export async function loadStoredBoardAutosavePreference() {
  const result = await getSyncStorage(BOARD_AUTOSAVE_KEY);
  return {
    ok: result.ok,
    error: result.error,
    enabled: result.ok ? result.data[BOARD_AUTOSAVE_KEY] !== false : true,
  };
}

export function saveStoredBoardAutosavePreference(enabled) {
  return setSyncStorage({ [BOARD_AUTOSAVE_KEY]: enabled });
}

export function createBoardBackupPayload(state, autosaveEnabled) {
  return buildBoardBackupPayload(state, autosaveEnabled);
}

export function parseStoredBoardBackup(raw, options = {}) {
  return parseBoardBackupPayload(raw, options);
}

export function downloadBoardBackupFile(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readBoardImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        resolve(JSON.parse(event.target?.result));
      } catch (error) {
        const parseError = new Error("Board import JSON parse error");
        parseError.code = "json-parse";
        parseError.cause = error;
        reject(parseError);
      }
    };

    reader.onerror = (event) => {
      const readError = new Error("Board import file read error");
      readError.code = "file-read";
      readError.cause = event;
      reject(readError);
    };

    reader.readAsText(file);
  });
}
