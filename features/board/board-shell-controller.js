export function createBoardShellController({
  boardHistory,
  cloneBoardState,
  closeEraserPanel,
  closeItemMenu,
  closeLinkEditor,
  closeLinkPopup,
  closeNotesMenu,
  closePenPanel,
  closeShapeEditor,
  closeShapesMenu,
  clearLinkSelection,
  clearShapeSelection,
  documentRef,
  finishBoardPan,
  getBoardState,
  getCurrentTool,
  getMixedDragItemElements,
  getRedoButton,
  getStage,
  getUndoButton,
  hideEraserCursor,
  hideItemToolbar,
  hideLinkControls,
  hidePenCursor,
  historyCommitDelay,
  inkTools,
  linkTool,
  normalizeState,
  redrawCanvas,
  renderItems,
  saveBoardState,
  scheduleShapeToolbarUpdate,
  selectTool,
  setBoardState,
  setCurrentTool,
  setDraggingMixed,
  setDraggingShape,
  setIsMarqueeSelecting,
  setMarqueeAdditive,
  setMarqueeBaseItemSelection,
  setMarqueeBaseSelection,
  setMarqueeRect,
  setMarqueeStart,
  setMixedDragItemElements,
  setMixedDragItemSnapshot,
  setMixedDragShapeSnapshot,
  setMixedDragStart,
  setMixedDragUsesWindow,
  setResizingShape,
  setSelectedItemIds,
  setSelectedLinkId,
  setSelectedShapeIds,
  setShapeDragSnapshot,
  setShapeDragStart,
  setShapeResizeHandle,
  setShapeResizeHover,
  setShapeResizeId,
  setShapeResizeSnapshot,
  setShapeSelectionFromShift,
  setShapeToolbarPinned,
  syncEraserControls,
  syncPenControls,
  toolDraw,
  toolErase,
  toolHand,
  updateEmptyState,
  updateEraserCursorSize,
  updateLinkModeClass,
  updateShapeMenuActive,
}) {
  function updateHistoryButtons() {
    const undoButton = getUndoButton();
    if (undoButton) {
      undoButton.disabled = !boardHistory.canUndo();
      undoButton.setAttribute(
        "aria-disabled",
        undoButton.disabled ? "true" : "false"
      );
    }

    const redoButton = getRedoButton();
    if (redoButton) {
      redoButton.disabled = !boardHistory.canRedo();
      redoButton.setAttribute(
        "aria-disabled",
        redoButton.disabled ? "true" : "false"
      );
    }
  }

  function pushHistorySnapshot() {
    if (boardHistory.captureSnapshot(getBoardState(), cloneBoardState)) {
      updateHistoryButtons();
    }
  }

  function scheduleHistoryCommit() {
    boardHistory.scheduleCommit(pushHistorySnapshot, historyCommitDelay);
  }

  function resetTransientState() {
    setSelectedShapeIds(new Set());
    setSelectedItemIds(new Set());
    setSelectedLinkId(null);
    setShapeToolbarPinned(false);
    setShapeSelectionFromShift(false);
    setDraggingShape(false);
    setDraggingMixed(false);
    setShapeDragStart(null);
    setShapeDragSnapshot(null);
    setMixedDragStart(null);
    setMixedDragShapeSnapshot(null);
    setMixedDragItemSnapshot(null);

    const mixedDragItemElements = getMixedDragItemElements();
    if (mixedDragItemElements) {
      mixedDragItemElements.forEach((element) =>
        element.classList.remove("is-dragging")
      );
    }
    setMixedDragItemElements(null);
    setMixedDragUsesWindow(false);
    setResizingShape(false);
    setShapeResizeHandle(null);
    setShapeResizeSnapshot(null);
    setShapeResizeId(null);
    setShapeResizeHover(null);
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeRect(null);
    setMarqueeAdditive(false);
    setMarqueeBaseSelection(null);
    setMarqueeBaseItemSelection(null);
  }

  function applyBoardState(
    state,
    {
      forceSave = false,
      resetHistory = false,
      showSuccessToast = false,
      successToastKey = "toastSaved",
      errorToastKey = "toastErrorSaving",
    } = {}
  ) {
    boardHistory.pause();
    const nextState = normalizeState(state);
    setBoardState(nextState);
    boardHistory.syncCurrentSignature(nextState);
    syncPenControls();
    syncEraserControls();
    clearLinkSelection();
    hideLinkControls();
    resetTransientState();
    closeShapeEditor();
    closeLinkEditor();
    renderItems();
    redrawCanvas();
    updateEmptyState();
    updateEraserCursorSize();
    saveBoardState({
      force: forceSave,
      showSuccessToast,
      successToastKey,
      errorToastKey,
    });

    requestAnimationFrame(() => {
      boardHistory.resume();
      if (resetHistory) {
        boardHistory.reset();
        pushHistorySnapshot();
      }
      updateHistoryButtons();
    });
    updateHistoryButtons();
  }

  function canUndo() {
    return boardHistory.canUndo();
  }

  function undoBoard() {
    if (!canUndo()) return;
    const previousSnapshot = boardHistory.undo();
    if (!previousSnapshot) return;
    applyBoardState(previousSnapshot);
  }

  function redoBoard() {
    const nextSnapshot = boardHistory.redo();
    if (!nextSnapshot) return;
    applyBoardState(nextSnapshot);
  }

  function setTool(tool) {
    setCurrentTool(tool);
    closeItemMenu();

    const active = documentRef.activeElement;
    if (
      active &&
      (active.closest?.(".board-item") ||
        active.closest?.(".board-item-controls") ||
        active.closest?.("#boardShapeEditor") ||
        active.closest?.("#boardLinkEditor"))
    ) {
      active.blur();
    }

    const buttons = documentRef.querySelectorAll(".board-tool-button");
    buttons.forEach((button) => {
      const isActive = button.dataset.tool === tool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    updateShapeMenuActive();

    const stage = getStage();
    if (stage) {
      stage.classList.toggle("board-mode-ink", inkTools.has(tool));
      stage.classList.toggle("board-mode-erase", tool === toolErase);
      stage.classList.toggle("board-mode-hand", tool === toolHand);
      stage.classList.toggle("board-mode-link", tool === linkTool);
      stage.classList.toggle("board-mode-draw", tool === toolDraw);
      stage.classList.toggle("board-mode-select", tool === selectTool);
    }

    if (tool !== selectTool) {
      hideItemToolbar();
      closeShapeEditor();
      clearShapeSelection();
      setShapeResizeHover(null);
    }
    if (tool !== toolHand) {
      finishBoardPan();
    }
    if (tool !== linkTool) {
      clearLinkSelection();
    }
    if (tool !== selectTool && tool !== linkTool) {
      closeLinkPopup();
    }
    if (tool !== toolErase) {
      hideEraserCursor();
      closeEraserPanel();
    }
    if (tool !== toolDraw) {
      hidePenCursor();
      closePenPanel();
    }
    closeShapesMenu();
    closeNotesMenu();
    updateLinkModeClass();
    scheduleShapeToolbarUpdate();
  }

  return {
    applyBoardState,
    canUndo,
    pushHistorySnapshot,
    redoBoard,
    scheduleHistoryCommit,
    setTool,
    undoBoard,
    updateHistoryButtons,
  };
}
