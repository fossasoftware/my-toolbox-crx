import { getSyncStorage, setSyncStorage } from "./storage.js";

export const SIDE_MENU_OPEN_KEY = "sideMenuOpen";
export const ACTIVE_OPTIONS_TAB_KEY = "activeOptionsTab";

export async function loadOptionsPreferences(getDefaultLanguage) {
  const result = await getSyncStorage([
    "userLanguage",
    SIDE_MENU_OPEN_KEY,
    ACTIVE_OPTIONS_TAB_KEY,
    "sideMenuPinned",
  ]);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      data: {},
      langPref: getDefaultLanguage(),
      sideMenuOpen: false,
      savedActiveTabId: null,
    };
  }

  const storedPrefs = result.data || {};
  return {
    ok: true,
    error: null,
    data: storedPrefs,
    langPref: storedPrefs.userLanguage || getDefaultLanguage(),
    sideMenuOpen:
      typeof storedPrefs[SIDE_MENU_OPEN_KEY] === "boolean"
        ? storedPrefs[SIDE_MENU_OPEN_KEY]
        : Boolean(storedPrefs.sideMenuPinned),
    savedActiveTabId: storedPrefs[ACTIVE_OPTIONS_TAB_KEY] || null,
  };
}

export async function saveSideMenuOpenPreference(isOpen) {
  return setSyncStorage({ [SIDE_MENU_OPEN_KEY]: isOpen });
}

export async function saveActiveOptionsTabPreference(tabId) {
  return setSyncStorage({ [ACTIVE_OPTIONS_TAB_KEY]: tabId });
}

export async function saveLanguagePreference(lang) {
  return setSyncStorage({ userLanguage: lang });
}
