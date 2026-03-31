export function createBoardLifecycleController({
  applyViewportState,
  closeItemMenu,
  closeLinkEditor,
  closeShapeEditor,
  consoleRef,
  documentRef,
  getBoardState,
  getEmptyState,
  getHotkeysBound,
  hideLinkControls,
  loadAutosavePreference,
  loadBoardState,
  loadBoardViewportState,
  pushHistorySnapshot,
  redrawCanvas,
  renderItems,
  resetHistory,
  scheduleSave,
  setBoardState,
  setHotkeysBound,
  setSelectedLinkId,
  setTool,
  setupBoardBackupControls,
  setupCanvas,
  setupEraserMenu,
  setupHelpControls,
  setupInputs,
  setupItemMenu,
  setupLinkControls,
  setupPenMenu,
  setupShapeToolbar,
  setupToolbar,
  toolSelect,
  updateHistoryButtons,
  windowRef,
  handleBoardHotkeys,
}) {
  function updateEmptyState() {
    const emptyState = getEmptyState();
    if (!emptyState) return;
    const boardState = getBoardState();
    const hasContent =
      boardState.items.length > 0 || boardState.strokes.length > 0;
    emptyState.classList.toggle("is-hidden", hasContent);
  }

  function clearBoard() {
    const boardState = getBoardState();
    boardState.strokes = [];
    boardState.items = [];
    boardState.links = [];
    setSelectedLinkId(null);
    hideLinkControls();
    closeLinkEditor();
    closeShapeEditor();
    closeItemMenu();
    redrawCanvas();
    renderItems();
    updateEmptyState();
    scheduleSave();
    pushHistorySnapshot();
  }

  async function initializeBoard() {
    if (!documentRef.getElementById("boardTab")) {
      consoleRef.error("Board: Tab markup not found");
      return;
    }
    setBoardState(await loadBoardState());
    setupToolbar();
    setupCanvas();
    setupHelpControls();
    setupItemMenu();
    setupInputs();
    setupPenMenu();
    setupEraserMenu();
    setupShapeToolbar();
    setupLinkControls();
    setupBoardBackupControls();
    loadAutosavePreference();
    setTool(toolSelect);
    renderItems();
    applyViewportState(await loadBoardViewportState(), {
      persist: false,
      redraw: false,
    });
    redrawCanvas();
    updateEmptyState();
    resetHistory();
    pushHistorySnapshot();
    updateHistoryButtons();
    if (!getHotkeysBound()) {
      windowRef.addEventListener("keydown", handleBoardHotkeys);
      setHotkeysBound(true);
    }
  }

  return {
    clearBoard,
    initializeBoard,
    updateEmptyState,
  };
}
