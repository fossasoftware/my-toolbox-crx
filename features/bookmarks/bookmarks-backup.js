import {
  BOOKMARKS_BACKUP_KIND,
  BOOKMARKS_BACKUP_VERSION,
} from "./bookmarks-constants.js";
import {
  normalizeBookmarks,
  normalizeIconMap,
  pruneIconMap,
  serializeBookmarksForSync,
} from "./bookmarks-data.js";
import { normalizeBookmarkSettings } from "./bookmarks-settings.js";

export function buildBookmarksBackupPayload({ bookmarks, iconMap, settings }) {
  return {
    type: BOOKMARKS_BACKUP_KIND,
    version: BOOKMARKS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    bookmarks: serializeBookmarksForSync(bookmarks),
    icons: { ...iconMap },
    settings: { ...settings },
  };
}

export function parseBookmarksBackupPayload(raw) {
  const isRawArray = Array.isArray(raw);
  const bookmarksSource = isRawArray
    ? raw
    : Array.isArray(raw?.bookmarks)
      ? raw.bookmarks
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : null;

  if (!bookmarksSource) {
    return null;
  }

  const { bookmarks, legacyIcons } = normalizeBookmarks(bookmarksSource);
  let iconMap = normalizeIconMap(
    isRawArray ? {} : raw.icons || raw.bookmarkIcons || raw.iconMap || {}
  );
  Object.entries(legacyIcons).forEach(([key, value]) => {
    if (!iconMap[key]) {
      iconMap[key] = value;
    }
  });
  iconMap = pruneIconMap(iconMap, bookmarks).icons;

  const settingsSource =
    !isRawArray && raw.settings && typeof raw.settings === "object"
      ? raw.settings
      : !isRawArray &&
          raw.bookmarkSettings &&
          typeof raw.bookmarkSettings === "object"
        ? raw.bookmarkSettings
        : null;

  return {
    bookmarks,
    iconMap,
    settings: settingsSource ? normalizeBookmarkSettings(settingsSource) : null,
  };
}

export function downloadBookmarksBackup(payload) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-toolbox-bookmarks-export-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readBookmarksImportFile(
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

    const imported = parseBookmarksBackupPayload(raw);
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
