import {
  SYNC_PREFERENCE_DEFAULTS,
  loadDefaultStatusSettings,
} from "../core/extension-defaults.js";
import { getSyncStorage, setSyncStorage } from "../core/storage.js";

async function ensureExtensionDefaults() {
  const keys = [...Object.keys(SYNC_PREFERENCE_DEFAULTS), "statusColorSettings"];
  const result = await getSyncStorage(keys);

  if (!result.ok) {
    console.error("Background: Failed to read sync defaults.", result.error);
    return;
  }

  const stored = result.data || {};
  const nextValues = {};

  Object.entries(SYNC_PREFERENCE_DEFAULTS).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(stored, key)) {
      nextValues[key] = value;
    }
  });

  if (!Object.prototype.hasOwnProperty.call(stored, "statusColorSettings")) {
    const defaultStatusSettings = await loadDefaultStatusSettings();
    if (defaultStatusSettings.length > 0) {
      nextValues.statusColorSettings = defaultStatusSettings;
    }
  }

  if (Object.keys(nextValues).length === 0) {
    return;
  }

  const saveResult = await setSyncStorage(nextValues);
  if (!saveResult.ok) {
    console.error("Background: Failed to persist sync defaults.", saveResult.error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureExtensionDefaults();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureExtensionDefaults();
});

void ensureExtensionDefaults();
