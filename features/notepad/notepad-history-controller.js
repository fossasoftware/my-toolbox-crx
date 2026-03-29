export function createNotepadHistoryController({
  debouncedSaveNotepad,
  getAutosaveEnabled,
  getCurrentViewMode,
  getNotepadArea,
  getRedoButton,
  getUndoButton,
  hasSearchQuery,
  historyManager,
  refreshSearchState,
  renderMarkdownPreview,
}) {
  function restoreHistorySnapshot(snapshot) {
    const notepadArea = getNotepadArea();
    if (!notepadArea || !snapshot) return;

    historyManager.setMuted(true);
    notepadArea.value = snapshot.value;

    if (hasSearchQuery()) {
      refreshSearchState({ preserveActive: true });
    } else {
      renderMarkdownPreview();
    }

    notepadArea.focus({ preventScroll: true });
    const maxPosition = snapshot.value.length;
    const selectionStart = Math.min(snapshot.selectionStart, maxPosition);
    const selectionEnd = Math.min(snapshot.selectionEnd, maxPosition);
    notepadArea.setSelectionRange(selectionStart, selectionEnd);
    historyManager.setMuted(false);

    if (getAutosaveEnabled()) {
      debouncedSaveNotepad();
    }
  }

  function updateHistoryButtons() {
    const isPreviewOnly = getCurrentViewMode() === "preview";
    const undoButton = getUndoButton();
    const redoButton = getRedoButton();

    if (undoButton) {
      undoButton.disabled = isPreviewOnly || !historyManager.canUndo();
      undoButton.setAttribute("aria-disabled", undoButton.disabled ? "true" : "false");
    }

    if (redoButton) {
      redoButton.disabled = isPreviewOnly || !historyManager.canRedo();
      redoButton.setAttribute("aria-disabled", redoButton.disabled ? "true" : "false");
    }
  }

  function resetHistory(area = getNotepadArea()) {
    if (!historyManager.reset(area)) return;
    updateHistoryButtons();
  }

  function pushHistorySnapshot(area = getNotepadArea()) {
    if (!area) return;
    if (historyManager.push(area)) {
      updateHistoryButtons();
    }
  }

  function undoNotepad() {
    const snapshot = historyManager.undo(getNotepadArea());
    if (!snapshot) return;
    restoreHistorySnapshot(snapshot);
    updateHistoryButtons();
  }

  function redoNotepad() {
    const snapshot = historyManager.redo(getNotepadArea());
    if (!snapshot) return;
    restoreHistorySnapshot(snapshot);
    updateHistoryButtons();
  }

  function commitNotepadValue(nextValue, selectionStart, selectionEnd) {
    const notepadArea = getNotepadArea();
    if (!notepadArea) return;

    notepadArea.value = nextValue;
    notepadArea.focus({ preventScroll: true });
    notepadArea.setSelectionRange(selectionStart, selectionEnd);

    if (hasSearchQuery()) {
      refreshSearchState({ preserveActive: true });
    } else {
      renderMarkdownPreview();
    }

    pushHistorySnapshot(notepadArea);

    if (getAutosaveEnabled()) {
      debouncedSaveNotepad();
    }
  }

  return {
    commitNotepadValue,
    redoNotepad,
    resetHistory,
    undoNotepad,
    updateHistoryButtons,
    pushHistorySnapshot,
  };
}
