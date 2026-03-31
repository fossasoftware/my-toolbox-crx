import {
  showToast,
  showValidationErrorModal,
} from "../../core/options-ui.js";
import { getText } from "../../core/i18n.js";
import {
  BOOKMARK_ICONS_KEY,
  BOOKMARK_SETTINGS_KEY,
  BOOKMARKS_KEY,
  applyBookmarkSettings,
  attachIcons,
  buildBookmarksBackupPayload,
  buildIconMap,
  downloadBookmarksBackup,
  getIconKey,
  loadBookmarkIcons,
  loadBookmarksSync,
  loadBookmarkSettings,
  normalizeBookmarkSettings,
  normalizeBookmarks,
  normalizeIconMap,
  normalizeIconValue,
  normalizeBookmarkUrl,
  pruneIconMap,
  readBookmarksImportFile,
  readFileAsDataUrl,
  saveBookmarkIcons,
  saveBookmarksSync,
  saveBookmarkSettings,
  serializeBookmarksForSync,
} from "./bookmarks-storage.js";
import {
  createBookmarkDragPlaceholder,
  renderBookmarks,
  renderPinnedBookmarks,
} from "./bookmarks-render.js";
import { createBookmarksActionsController } from "./bookmarks-actions-controller.js";
import { createBookmarksDragDropController } from "./bookmarks-drag-drop-controller.js";
import { createBookmarksModalController } from "./bookmarks-modal-controller.js";
import { createBookmarksSettingsController } from "./bookmarks-settings-controller.js";
import { createBookmarksSyncController } from "./bookmarks-sync-controller.js";

let bookmarksCache = [];
let bookmarkIconsCache = {};

export async function initializeBookmarks() {
  const listEl = document.getElementById("bookmarksList");
  const pinnedListEl = document.getElementById("bookmarksPinnedList");
  const pinnedEmptyEl = document.getElementById("bookmarksPinnedEmpty");
  const modal = document.getElementById("bookmarkModal");
  const form = document.getElementById("bookmarkForm");
  const nameInput = document.getElementById("bookmarkName");
  const urlInput = document.getElementById("bookmarkUrl");
  const iconFileInput = document.getElementById("bookmarkIconFile");
  const iconFileName = document.getElementById("bookmarkIconFileName");
  const cancelBtn = document.getElementById("bookmarkCancel");
  const modalTitle = document.getElementById("bookmarkModalTitle");
  const saveButton = document.getElementById("bookmarkSave");
  const iconSizeInput = document.getElementById("bookmarkIconSize");
  const iconSizeValue = document.getElementById("bookmarkIconSizeValue");
  const pinnedIconSizeInput = document.getElementById("bookmarkPinnedIconSize");
  const pinnedIconSizeValue = document.getElementById(
    "bookmarkPinnedIconSizeValue"
  );
  const bookmarksImportFileInput = document.getElementById(
    "bookmarksImportFile"
  );
  const bookmarksImportButton = document.getElementById("bookmarksImportBtn");
  const bookmarksExportButton = document.getElementById("bookmarksExportBtn");
  const pinnedTitleDisplayInput = document.getElementById(
    "bookmarkPinnedTitleDisplay"
  );

  if (
    !listEl ||
    !modal ||
    !form ||
    !nameInput ||
    !urlInput ||
    !iconFileInput ||
    !iconFileName
  ) {
    console.error("Bookmarks: Missing required elements.");
    return false;
  }
  const bookmarksSettings = await createBookmarksSettingsController({
    documentRef: document,
    windowRef: window,
    pinnedListEl,
    iconSizeInput,
    iconSizeValue,
    pinnedIconSizeInput,
    pinnedIconSizeValue,
    pinnedTitleDisplayInput,
    loadBookmarkSettings,
    normalizeBookmarkSettings,
    applyBookmarkSettings,
    saveBookmarkSettings,
  });

  const renderAll = (bookmarks) => {
    renderBookmarks(listEl, bookmarks, getText);
    if (pinnedListEl && pinnedEmptyEl) {
      renderPinnedBookmarks(
        pinnedListEl,
        pinnedEmptyEl,
        bookmarks,
        bookmarksSettings.renderPinnedLabels
      );
    }
  };

  const exportBookmarksBackup = () => {
    downloadBookmarksBackup(
      buildBookmarksBackupPayload({
        bookmarks: bookmarksCache,
        iconMap: bookmarkIconsCache,
        settings: bookmarksSettings.getCurrentSettings(),
      })
    );
    showToast("toastBookmarksExportSuccess");
  };

  const importBookmarksBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readBookmarksImportFile(file, {
      onLoaded: async (imported) => {
        const nextBookmarks = attachIcons(imported.bookmarks, imported.iconMap);
        const nextSettings =
          imported.settings || bookmarksSettings.getCurrentSettings();

        bookmarkIconsCache = imported.iconMap;
        bookmarksCache = nextBookmarks;
        renderAll(bookmarksCache);
        bookmarksSettings.syncBookmarkSettings(nextSettings);
        bookmarksActions.clearPendingUndo();

        try {
          await Promise.all([
            saveBookmarksSync(serializeBookmarksForSync(imported.bookmarks)),
            saveBookmarkIcons(imported.iconMap),
            saveBookmarkSettings(nextSettings),
          ]);
          showToast("toastBookmarksImportSuccess");
        } catch (error) {
          console.error("Bookmarks: Error saving imported backup", error);
          showToast("toastBookmarksImportErrorSave");
          await bookmarksSync.loadFromStorage();
          bookmarksSettings.syncBookmarkSettings(await loadBookmarkSettings());
        } finally {
          event.target.value = "";
        }
      },
      onParseError: (error) => {
        console.error("Bookmarks: Error parsing import file", error);
        showToast("toastImportErrorJsonParse");
        event.target.value = "";
      },
      onReadError: (error) => {
        console.error("Bookmarks: Error reading import file", error);
        showToast("toastImportErrorFileRead");
        event.target.value = "";
      },
      onValidationError: () => {
        showToast("toastBookmarksImportErrorValidation");
        event.target.value = "";
      },
    });
  };

  const commitBookmarks = async (
    nextBookmarks,
    toastKey = "toastSaved",
    toastOptions = null
  ) => {
    const iconMap = buildIconMap(nextBookmarks);
    const syncPayload = serializeBookmarksForSync(nextBookmarks);

    bookmarkIconsCache = iconMap;
    bookmarksCache = attachIcons(nextBookmarks, bookmarkIconsCache);
    renderAll(bookmarksCache);

    try {
      await Promise.all([
        saveBookmarksSync(syncPayload),
        saveBookmarkIcons(bookmarkIconsCache),
      ]);
      if (toastKey) {
        showToast(toastKey, null, toastOptions);
      }
      return true;
    } catch (error) {
      showToast("toastErrorSaving");
      await bookmarksSync.loadFromStorage();
      return false;
    }
  };

  const bookmarksModal = createBookmarksModalController({
    cancelBtn,
    commitBookmarks,
    form,
    getBookmarks: () => bookmarksCache,
    getIconKey,
    getText,
    iconFileInput,
    iconFileName,
    modal,
    modalTitle,
    nameInput,
    normalizeBookmarkUrl,
    normalizeIconValue,
    readFileAsDataUrl,
    saveButton,
    showToast,
    showValidationErrorModal,
    urlInput,
    windowRef: window,
  });
  bookmarksModal.bind();

  const bookmarksSync = createBookmarksSyncController({
    attachIcons,
    getBookmarks: () => bookmarksCache,
    getIconMap: () => bookmarkIconsCache,
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
    setBookmarks: (bookmarks) => {
      bookmarksCache = bookmarks;
    },
    setIconMap: (iconMap) => {
      bookmarkIconsCache = iconMap;
    },
    storageApi: chrome.storage,
    syncBookmarkSettings: bookmarksSettings.syncBookmarkSettings,
    settingsStorageKey: BOOKMARK_SETTINGS_KEY,
    bookmarksStorageKey: BOOKMARKS_KEY,
    iconsStorageKey: BOOKMARK_ICONS_KEY,
  });
  bookmarksSync.bindStorageChanges();

  const bookmarksActions = createBookmarksActionsController({
    addButton: document.getElementById("bookmarkAddButton"),
    bookmarksExportButton,
    bookmarksImportButton,
    bookmarksImportFileInput,
    commitBookmarks,
    exportBookmarksBackup,
    getBookmarks: () => bookmarksCache,
    importBookmarksBackup,
    listEl,
    openCreate: bookmarksModal.openForCreate,
    openEdit: bookmarksModal.openForEdit,
    showToast,
  });
  bookmarksActions.bind();

  createBookmarksDragDropController({
    createPlaceholder: createBookmarkDragPlaceholder,
    documentRef: document,
    getBookmarks: () => bookmarksCache,
    commitBookmarks,
    listEl,
    windowRef: window,
  }).bind();

  await bookmarksSync.loadFromStorage();

  return true;
}
