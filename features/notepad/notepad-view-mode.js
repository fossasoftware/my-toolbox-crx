export function createNotepadViewModeController({
  getNotepadArea,
  getNotepadPreview,
  getNotepadWrapper,
  getViewButtons,
  normalizeViewMode,
  saveViewModePreference,
  updateFormatButtons,
  updateHistoryButtons,
}) {
  let currentViewMode = "split";
  let lastNonPreviewViewMode = "split";

  function getCurrentViewMode() {
    return currentViewMode;
  }

  function getLastNonPreviewViewMode() {
    return lastNonPreviewViewMode;
  }

  function setLastNonPreviewViewMode(mode) {
    const nextMode = normalizeViewMode(mode);
    if (nextMode !== "preview") {
      lastNonPreviewViewMode = nextMode;
    }
  }

  function resolveNextViewMode(controlMode) {
    if (controlMode === "preview") {
      return currentViewMode === "preview" ? lastNonPreviewViewMode : "preview";
    }

    if (controlMode === "split") {
      return currentViewMode === "split" ? "editor" : "split";
    }

    return normalizeViewMode(controlMode);
  }

  function setNotepadViewMode(mode, options = {}) {
    const { persist = false, focusEditor = false, animate = true } = options;
    const previousViewMode = currentViewMode;
    const nextMode = normalizeViewMode(mode);
    currentViewMode = nextMode;

    if (nextMode !== "preview") {
      lastNonPreviewViewMode = nextMode;
    }

    const notepadArea = getNotepadArea();
    const notepadPreview = getNotepadPreview();
    const notepadWrapper = getNotepadWrapper();
    const viewButtons = getViewButtons();

    if (notepadWrapper) {
      const animationMode = !animate
        ? "none"
        : previousViewMode === "preview" || nextMode === "preview"
          ? "preview"
          : "split";
      notepadWrapper.dataset.viewAnimation = animationMode;
      notepadWrapper.dataset.viewMode = nextMode;
    }

    if (notepadArea) {
      const hideEditor = nextMode === "preview";
      notepadArea.setAttribute("aria-hidden", hideEditor ? "true" : "false");
      notepadArea.tabIndex = hideEditor ? -1 : 0;
    }

    if (notepadPreview) {
      const hidePreview = nextMode === "editor";
      notepadPreview.setAttribute("aria-hidden", hidePreview ? "true" : "false");
    }

    viewButtons.forEach((button) => {
      const isActive =
        (button.dataset.viewMode === "split" && nextMode === "split") ||
        (button.dataset.viewMode === "preview" && nextMode === "preview");
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updateFormatButtons();
    updateHistoryButtons();

    if (focusEditor && nextMode !== "preview" && notepadArea) {
      notepadArea.focus({ preventScroll: true });
    }

    if (persist) {
      saveViewModePreference(nextMode);
    }
  }

  return {
    getCurrentViewMode,
    getLastNonPreviewViewMode,
    resolveNextViewMode,
    setLastNonPreviewViewMode,
    setNotepadViewMode,
  };
}
