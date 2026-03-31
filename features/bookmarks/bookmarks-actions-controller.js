const UNDO_TOAST_DURATION = 5000;

export function createBookmarksActionsController({
  addButton,
  bookmarksExportButton,
  bookmarksImportButton,
  bookmarksImportFileInput,
  commitBookmarks,
  exportBookmarksBackup,
  getBookmarks,
  listEl,
  openCreate,
  openEdit,
  importBookmarksBackup,
  showToast,
}) {
  let pendingUndo = null;

  const clearPendingUndo = () => {
    pendingUndo = null;
  };

  const scheduleUndo = (bookmark, index) => {
    clearPendingUndo();
    pendingUndo = { bookmark, index };
    showToast("toastBookmarkDeleted", null, {
      duration: UNDO_TOAST_DURATION,
      pauseOnHover: true,
      actionLabelKey: "toastUndoAction",
      onHide: clearPendingUndo,
      onAction: async () => {
        if (!pendingUndo) return;
        const { bookmark: undoBookmark, index: undoIndex } = pendingUndo;
        clearPendingUndo();
        const nextBookmarks = [...getBookmarks()];
        const insertIndex = Math.min(
          Math.max(undoIndex, 0),
          nextBookmarks.length
        );
        nextBookmarks.splice(insertIndex, 0, undoBookmark);
        await commitBookmarks(nextBookmarks, "toastBookmarkRestored");
      },
    });
  };

  const bindToolbarActions = () => {
    if (addButton) {
      addButton.addEventListener("click", openCreate);
    }

    if (bookmarksExportButton) {
      bookmarksExportButton.addEventListener("click", exportBookmarksBackup);
    }

    if (bookmarksImportButton && bookmarksImportFileInput) {
      bookmarksImportButton.addEventListener("click", () => {
        bookmarksImportFileInput.click();
      });
      bookmarksImportFileInput.addEventListener("change", importBookmarksBackup);
    }
  };

  const bindListActions = () => {
    listEl.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;
      event.preventDefault();
      const action = actionButton.dataset.action;
      if (action === "add") {
        openCreate();
        return;
      }
      const item = actionButton.closest(".bookmark-item");
      if (!item) return;
      const index = Number.parseInt(item.dataset.bookmarkIndex || "", 10);
      const bookmarks = getBookmarks();
      if (!Number.isFinite(index) || !bookmarks[index]) return;

      if (action === "toggle-pin") {
        const nextBookmarks = [...bookmarks];
        nextBookmarks[index] = {
          ...nextBookmarks[index],
          pinned: !nextBookmarks[index].pinned,
        };
        await commitBookmarks(nextBookmarks);
        return;
      }

      if (action === "edit") {
        openEdit(bookmarks[index]);
        return;
      }

      if (action === "delete") {
        const removed = bookmarks[index];
        const nextBookmarks = [...bookmarks];
        nextBookmarks.splice(index, 1);
        const saved = await commitBookmarks(nextBookmarks, null);
        if (saved) {
          scheduleUndo(removed, index);
        }
      }
    });
  };

  return {
    bind() {
      bindToolbarActions();
      bindListActions();
    },
    clearPendingUndo,
  };
}
