import { getSyncStorage, setSyncStorage } from "../../core/storage.js";

export const STATUS_COLOR_SETTINGS_KEY = "statusColorSettings";

export async function loadStatusColorSettings(defaultSettings = []) {
  const result = await getSyncStorage(STATUS_COLOR_SETTINGS_KEY);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      settings: [],
    };
  }

  let settings;
  if (
    !Object.prototype.hasOwnProperty.call(result.data, STATUS_COLOR_SETTINGS_KEY)
  ) {
    settings = defaultSettings;
  } else {
    settings = result.data[STATUS_COLOR_SETTINGS_KEY];
    if (!Array.isArray(settings) || settings.length === 0) {
      settings = [];
    }
  }

  return {
    ok: true,
    error: null,
    settings,
  };
}

export function saveStatusColorSettings(settings) {
  return setSyncStorage({ [STATUS_COLOR_SETTINGS_KEY]: settings });
}

export function clearStatusColorSettings() {
  return setSyncStorage({ [STATUS_COLOR_SETTINGS_KEY]: [] });
}

export function resetStatusColorSettings(defaultSettings) {
  return setSyncStorage({ [STATUS_COLOR_SETTINGS_KEY]: defaultSettings });
}
