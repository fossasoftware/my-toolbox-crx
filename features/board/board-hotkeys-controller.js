export function createBoardHotkeysController({
  documentRef,
  getCurrentTool,
  getSingleSelectedShape,
  getTargetToolSelect,
  isBoardTabActive,
  deleteSelectedShape,
  redoBoard,
  selectAllElements,
  setTool,
  startShapeTextEditing,
  undoBoard,
}) {
  function blurActiveBoardEditors() {
    const active = documentRef.activeElement;
    if (!active) return;
    if (
      active.closest?.(".board-item") ||
      active.closest?.(".board-item-controls") ||
      active.closest?.("#boardShapeEditor") ||
      active.closest?.("#boardLinkEditor")
    ) {
      active.blur();
    }
  }

  function isBoardActive() {
    return Boolean(isBoardTabActive());
  }

  function isEditableTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
  }

  function handleBoardHotkeys(event) {
    if (!isBoardActive()) return;
    if (event.key === "Escape") {
      if (getCurrentTool() !== getTargetToolSelect()) {
        event.preventDefault();
        setTool(getTargetToolSelect());
      }
      return;
    }
    if (isEditableTarget(event.target)) return;

    const key = event.key.toLowerCase();
    if (
      (key === "delete" || key === "backspace") &&
      getCurrentTool() === getTargetToolSelect()
    ) {
      if (deleteSelectedShape()) {
        event.preventDefault();
      }
      return;
    }
    if (key === "enter" && getCurrentTool() === getTargetToolSelect()) {
      const shape = getSingleSelectedShape();
      if (shape) {
        event.preventDefault();
        startShapeTextEditing(shape);
      }
      return;
    }

    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modKey = isMac ? event.metaKey : event.ctrlKey;
    if (!modKey) return;

    if (key === "a") {
      event.preventDefault();
      selectAllElements();
      return;
    }
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redoBoard();
      } else {
        undoBoard();
      }
    } else if (key === "y") {
      event.preventDefault();
      redoBoard();
    }
  }

  function isTextEditingActive() {
    const active = documentRef.activeElement;
    if (!active) return false;
    if (active.isContentEditable) return true;
    if (
      active.closest?.(".board-item-title") ||
      active.closest?.(".board-item-body") ||
      active.closest?.(".board-shape-editor")
    ) {
      return true;
    }
    return false;
  }

  return {
    blurActiveBoardEditors,
    handleBoardHotkeys,
    isBoardActive,
    isEditableTarget,
    isTextEditingActive,
  };
}
