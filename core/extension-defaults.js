import { getDefaultLanguage } from "./i18n.js";

export const SYNC_PREFERENCE_DEFAULTS = {
  userLanguage: getDefaultLanguage(),
  statusColorizerEnabled: true,
  rowHighlighterEnabled: true,
  notepadAutosaveEnabled: true,
  boardAutosaveEnabled: true,
};

export async function loadDefaultStatusSettings() {
  try {
    const response = await fetch(
      chrome.runtime.getURL("data/defaultSettings.json")
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const defaults = await response.json();
    return Array.isArray(defaults) ? defaults : [];
  } catch (error) {
    console.error("Failed to load default status settings.", error);
    return [];
  }
}
