export function createBookmarksSyncController({
  attachIcons,
  getBookmarks,
  getIconMap,
  loadBookmarkIcons,
  loadBookmarksSync,
  normalizeBookmarkSettings,
  normalizeBookmarks,
  normalizeIconMap,
  pruneIconMap,
  renderAll,
  saveBookmarkIcons,
  saveBookmarksSync,
  serializeBookmarksForSync,
  setBookmarks,
  setIconMap,
  storageApi,
  syncBookmarkSettings,
  settingsStorageKey,
  bookmarksStorageKey,
  iconsStorageKey,
}) {
  const applyBookmarksState = ({ bookmarks, iconMap }) => {
    const bookmarksWithIcons = attachIcons(bookmarks, iconMap);
    setIconMap(iconMap);
    setBookmarks(bookmarksWithIcons);
    renderAll(bookmarksWithIcons);
    return bookmarksWithIcons;
  };

  const persistNormalizedBookmarks = (bookmarks) => {
    saveBookmarksSync(serializeBookmarksForSync(bookmarks)).catch((error) => {
      console.error("Bookmarks: Failed to normalize data", error);
    });
  };

  const persistNormalizedSyncUpdate = (bookmarks) => {
    saveBookmarksSync(serializeBookmarksForSync(bookmarks)).catch((error) => {
      console.error("Bookmarks: Failed to normalize sync update", error);
    });
  };

  const persistIconMapUpdate = (iconMap, message) => {
    saveBookmarkIcons(iconMap).catch((error) => {
      console.error(message, error);
    });
  };

  const loadFromStorage = async () => {
    const [syncData, localIcons] = await Promise.all([
      loadBookmarksSync(),
      loadBookmarkIcons(),
    ]);
    const { bookmarks, needsSave, legacyIcons } = normalizeBookmarks(syncData);

    let iconMap = normalizeIconMap(localIcons);
    let iconChanged = false;
    Object.entries(legacyIcons).forEach(([key, value]) => {
      if (!iconMap[key]) {
        iconMap[key] = value;
        iconChanged = true;
      }
    });

    const pruned = pruneIconMap(iconMap, bookmarks);
    iconMap = pruned.icons;
    if (pruned.changed) {
      iconChanged = true;
    }

    const normalizedBookmarks = applyBookmarksState({ bookmarks, iconMap });

    if (needsSave) {
      persistNormalizedBookmarks(normalizedBookmarks);
    }

    if (iconChanged) {
      persistIconMapUpdate(iconMap, "Bookmarks: Failed to migrate icons");
    }
  };

  const bindStorageChanges = () => {
    storageApi.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes[settingsStorageKey]) {
        syncBookmarkSettings(
          normalizeBookmarkSettings(changes[settingsStorageKey].newValue || {})
        );
      }

      if (areaName === "sync" && changes[bookmarksStorageKey]) {
        const { bookmarks, needsSave, legacyIcons } = normalizeBookmarks(
          changes[bookmarksStorageKey].newValue
        );

        let iconMap = { ...getIconMap() };
        let iconChanged = false;
        Object.entries(legacyIcons).forEach(([key, value]) => {
          if (!iconMap[key]) {
            iconMap[key] = value;
            iconChanged = true;
          }
        });

        const pruned = pruneIconMap(iconMap, bookmarks);
        iconMap = pruned.icons;
        if (pruned.changed) {
          iconChanged = true;
        }

        const normalizedBookmarks = applyBookmarksState({ bookmarks, iconMap });

        if (needsSave) {
          persistNormalizedSyncUpdate(normalizedBookmarks);
        }

        if (iconChanged) {
          persistIconMapUpdate(iconMap, "Bookmarks: Failed to update icons");
        }
      }

      if (areaName === "local" && changes[iconsStorageKey]) {
        const iconMap = normalizeIconMap(changes[iconsStorageKey].newValue);
        const pruned = pruneIconMap(iconMap, getBookmarks());
        const bookmarksWithIcons = applyBookmarksState({
          bookmarks: getBookmarks(),
          iconMap: pruned.icons,
        });

        if (pruned.changed) {
          persistIconMapUpdate(
            pruned.icons,
            "Bookmarks: Failed to prune icons"
          );
        }

        return bookmarksWithIcons;
      }
    });
  };

  return {
    bindStorageChanges,
    loadFromStorage,
  };
}
