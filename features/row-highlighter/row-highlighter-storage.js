import { getSyncStorage, setSyncStorage } from "../../core/storage.js";

export const ROW_HIGHLIGHT_SETTINGS_KEY = "rowHighlightSettings";

export async function loadRowHighlightSettings() {
  const result = await getSyncStorage(ROW_HIGHLIGHT_SETTINGS_KEY);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      settings: [],
    };
  }

  return {
    ok: true,
    error: null,
    settings: Array.isArray(result.data[ROW_HIGHLIGHT_SETTINGS_KEY])
      ? result.data[ROW_HIGHLIGHT_SETTINGS_KEY]
      : [],
  };
}

export function saveRowHighlightSettings(settings) {
  return setSyncStorage({ [ROW_HIGHLIGHT_SETTINGS_KEY]: settings });
}

export function clearRowHighlightSettings() {
  return setSyncStorage({ [ROW_HIGHLIGHT_SETTINGS_KEY]: [] });
}
