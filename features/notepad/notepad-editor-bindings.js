export function bindNotepadAreaEvents({
  applyMarkdownFormat,
  autosaveEnabledRef,
  debouncedSaveNotepad,
  notepadArea,
  onContentDirty,
  pushHistorySnapshot,
  redoNotepad,
  renderMarkdownPreview,
  searchHasQuery,
  refreshSearchState,
  undoNotepad,
}) {
  notepadArea.addEventListener("input", () => {
    if (searchHasQuery()) {
      refreshSearchState({ preserveActive: true });
    } else {
      renderMarkdownPreview();
    }
    pushHistorySnapshot();
    onContentDirty?.();
    if (autosaveEnabledRef()) {
      debouncedSaveNotepad();
    }
  });

  notepadArea.addEventListener("keydown", (event) => {
    const isModifierPressed = event.metaKey || event.ctrlKey;
    if (!isModifierPressed || event.altKey) return;

    const key = event.key.toLowerCase();
    const shouldRedo = key === "y" || (key === "z" && event.shiftKey);
    const shouldUndo = key === "z" && !event.shiftKey;
    const shouldBold = key === "b" && !event.shiftKey;
    const shouldItalic = key === "i" && !event.shiftKey;
    const shouldLink = key === "k" && !event.shiftKey;

    if (shouldBold) {
      event.preventDefault();
      applyMarkdownFormat("bold");
      return;
    }

    if (shouldItalic) {
      event.preventDefault();
      applyMarkdownFormat("italic");
      return;
    }

    if (shouldLink) {
      event.preventDefault();
      applyMarkdownFormat("link");
      return;
    }

    if (shouldUndo) {
      event.preventDefault();
      undoNotepad();
      return;
    }

    if (shouldRedo) {
      event.preventDefault();
      redoNotepad();
    }
  });
}

export function bindGlobalSearchShortcuts({
  handleGlobalKeydown,
  handleGlobalMousedown,
  isAlreadyBound,
  markBound,
}) {
  if (isAlreadyBound()) {
    return;
  }

  markBound();

  document.addEventListener("keydown", (event) => {
    const notepadTab = document.getElementById("notepadTab");
    if (!notepadTab?.classList.contains("active")) {
      return;
    }

    handleGlobalKeydown(event);
  });

  document.addEventListener("mousedown", (event) => {
    const notepadTab = document.getElementById("notepadTab");
    if (!notepadTab?.classList.contains("active")) {
      return;
    }
    handleGlobalMousedown(event);
  });
}
