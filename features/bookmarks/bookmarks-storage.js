import {
  BOOKMARK_ICONS_KEY,
  BOOKMARK_ICON_SIZE_LIMITS,
  BOOKMARK_PINNED_ICON_SIZE_LIMITS,
  BOOKMARK_SETTINGS_DEFAULTS,
  BOOKMARK_SETTINGS_KEY,
  BOOKMARKS_KEY,
} from "./bookmarks-constants.js";

export * from "./bookmarks-backup.js";
export * from "./bookmarks-data.js";
export * from "./bookmarks-settings.js";

export function saveBookmarksSync(bookmarks) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [BOOKMARKS_KEY]: bookmarks }, () => {
      if (chrome.runtime.lastError) {
        console.error("Bookmarks: Error saving data", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

export function saveBookmarkIcons(iconMap) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [BOOKMARK_ICONS_KEY]: iconMap }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error saving icon data",
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

export function loadBookmarksSync() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(BOOKMARKS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error("Bookmarks: Error loading data", chrome.runtime.lastError);
        resolve([]);
        return;
      }
      resolve(stored[BOOKMARKS_KEY]);
    });
  });
}

export function loadBookmarkIcons() {
  return new Promise((resolve) => {
    chrome.storage.local.get(BOOKMARK_ICONS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error loading icon data",
          chrome.runtime.lastError
        );
        resolve({});
        return;
      }
      resolve(stored[BOOKMARK_ICONS_KEY]);
    });
  });
}

export {
  BOOKMARK_ICONS_KEY,
  BOOKMARK_ICON_SIZE_LIMITS,
  BOOKMARK_SETTINGS_KEY,
  BOOKMARK_PINNED_ICON_SIZE_LIMITS,
  BOOKMARK_SETTINGS_DEFAULTS,
  BOOKMARKS_KEY,
};
