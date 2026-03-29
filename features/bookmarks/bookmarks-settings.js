import {
  BOOKMARK_ICON_SIZE_LIMITS,
  BOOKMARK_PINNED_ICON_SIZE_LIMITS,
  BOOKMARK_PINNED_TITLE_DISPLAY_OPTIONS,
  BOOKMARK_SETTINGS_DEFAULTS,
  BOOKMARK_SETTINGS_KEY,
} from "./bookmarks-constants.js";

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

export function normalizeBookmarkSettings(rawSettings = {}) {
  const iconSize = clampNumber(
    Number.parseInt(rawSettings.iconSize, 10) ||
      BOOKMARK_SETTINGS_DEFAULTS.iconSize,
    BOOKMARK_ICON_SIZE_LIMITS.min,
    BOOKMARK_ICON_SIZE_LIMITS.max
  );
  const pinnedIconSize = clampNumber(
    Number.parseInt(rawSettings.pinnedIconSize, 10) ||
      BOOKMARK_SETTINGS_DEFAULTS.pinnedIconSize,
    BOOKMARK_PINNED_ICON_SIZE_LIMITS.min,
    BOOKMARK_PINNED_ICON_SIZE_LIMITS.max
  );
  let pinnedTitleDisplay = rawSettings.pinnedTitleDisplay;
  if (pinnedTitleDisplay === "always") {
    pinnedTitleDisplay = "hover";
  }
  pinnedTitleDisplay = BOOKMARK_PINNED_TITLE_DISPLAY_OPTIONS.has(
    pinnedTitleDisplay
  )
    ? pinnedTitleDisplay
    : BOOKMARK_SETTINGS_DEFAULTS.pinnedTitleDisplay;
  return { iconSize, pinnedIconSize, pinnedTitleDisplay };
}

export function applyBookmarkSettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--bookmark-icon-size", `${settings.iconSize}px`);
  root.style.setProperty(
    "--bookmark-pinned-icon-size",
    `${settings.pinnedIconSize}px`
  );
}

export function loadBookmarkSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(BOOKMARK_SETTINGS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error loading settings",
          chrome.runtime.lastError
        );
        resolve({ ...BOOKMARK_SETTINGS_DEFAULTS });
        return;
      }
      resolve(normalizeBookmarkSettings(stored[BOOKMARK_SETTINGS_KEY] || {}));
    });
  });
}

export function saveBookmarkSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [BOOKMARK_SETTINGS_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error saving settings",
          chrome.runtime.lastError
        );
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}
