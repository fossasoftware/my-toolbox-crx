export function createBoardCanvasBootstrapController({
  assignCanvasElements,
  blurActiveBoardEditors,
  clearLinkHoverTarget,
  clearLinkPreviewLine,
  clearLinkSelection,
  closeZoomPanel,
  documentRef,
  finishLinkDrag,
  getBoardZoom,
  getCurrentTool,
  getLinkEndpointFromEvent,
  getLinksSvg,
  getStage,
  getText,
  getWorldPointFromClient,
  handleCanvasContextMenu,
  handleStageContextMenu,
  hideEraserCursor,
  hideItemToolbar,
  hidePenCursor,
  isBoardPanning,
  isLinkingModeActive,
  linkTool,
  onCanvasDoubleClick,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onStageGestureChange,
  onStageGestureEnd,
  onStageGestureStart,
  onStageWheel,
  resizeCanvas,
  setBoardZoom,
  setCtx,
  setLinkPreviewPoint,
  setStageResizeObserver,
  setupZoomPanel,
  showEraserCursor,
  showPenCursor,
  stageResizeObserverCtor,
  toolDraw,
  toolErase,
  toolHand,
  updateEraserCursor,
  updateLinkHoverTarget,
  updateLinkPreviewFromState,
  updatePenCursor,
  updateViewportTransform,
  windowRef,
  zoomStep,
}) {
  const INK_CURSOR_BLOCKED_SELECTOR = [
    "#boardToolbarDock",
    "#boardShapeControls",
    "#boardItemControls",
    "#boardLinkControls",
    "#boardItemMenu",
    "#boardZoomControls",
  ].join(", ");

  function hideInkCursors() {
    hideEraserCursor();
    hidePenCursor();
  }

  function isInkCursorBlockedTarget(target) {
    return Boolean(
      target &&
      typeof target.closest === "function" &&
      target.closest(INK_CURSOR_BLOCKED_SELECTOR)
    );
  }

  function isPointInsideStage(clientX, clientY) {
    const stage = getStage();
    if (
      !stage ||
      !Number.isFinite(clientX) ||
      !Number.isFinite(clientY)
    ) {
      return false;
    }

    const rect = stage.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  function syncInkCursorVisibility(event) {
    const currentTool = getCurrentTool();
    if (currentTool !== toolDraw && currentTool !== toolErase) {
      hideInkCursors();
      return;
    }

    if (
      !event ||
      !isPointInsideStage(event.clientX, event.clientY)
    ) {
      hideInkCursors();
      return;
    }

    if (isInkCursorBlockedTarget(event.target)) {
      hideInkCursors();
      return;
    }

    if (currentTool === toolErase) {
      hidePenCursor();
      updateEraserCursor(event);
      return;
    }

    hideEraserCursor();
    updatePenCursor(event);
  }

  function setupCanvas() {
    const canvas = documentRef.getElementById("boardCanvas");
    const stage = documentRef.getElementById("boardStage");
    const viewport = documentRef.getElementById("boardViewport");
    const linksSvg = documentRef.getElementById("boardLinks");
    const itemsContainer = documentRef.getElementById("boardItems");
    const itemSelectionLayer = documentRef.getElementById("boardItemSelections");
    const emptyState = documentRef.getElementById("boardEmptyState");
    const penCursor = documentRef.getElementById("boardPenCursor");
    const eraserCursor = documentRef.getElementById("boardEraserCursor");
    const zoomInButton = documentRef.getElementById("boardZoomInBtn");
    const zoomOutButton = documentRef.getElementById("boardZoomOutBtn");
    const zoomLabel = documentRef.getElementById("boardZoomLabel");
    const zoomControls = documentRef.getElementById("boardZoomControls");
    const zoomPanel = documentRef.getElementById("boardZoomPanel");

    assignCanvasElements({
      canvas,
      emptyState,
      eraserCursor,
      itemSelectionLayer,
      itemsContainer,
      linksSvg,
      penCursor,
      stage,
      viewport,
      zoomControls,
      zoomInButton,
      zoomLabel,
      zoomOutButton,
      zoomPanel,
    });

    if (!canvas || !stage || !linksSvg || !itemsContainer || !viewport) {
      console.error("Board: Missing core elements");
      return;
    }

    if (linksSvg.parentElement !== stage) {
      stage.insertBefore(linksSvg, viewport);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Board: Canvas unavailable");
      return;
    }
    setCtx(ctx);

    const stageResizeObserver = new stageResizeObserverCtor(() => {
      resizeCanvas();
    });
    setStageResizeObserver(stageResizeObserver);
    stageResizeObserver.observe(stage);

    canvas.addEventListener("pointerdown", onCanvasPointerDown);
    canvas.addEventListener("pointermove", onCanvasPointerMove);
    canvas.addEventListener("pointerup", onCanvasPointerUp);
    canvas.addEventListener("pointerleave", onCanvasPointerUp);
    canvas.addEventListener("pointercancel", () => {
      onCanvasPointerUp();
      hideInkCursors();
    });
    canvas.addEventListener("dblclick", onCanvasDoubleClick);
    canvas.addEventListener("pointerenter", syncInkCursorVisibility);
    canvas.addEventListener("pointerleave", hideInkCursors);
    canvas.addEventListener("contextmenu", handleCanvasContextMenu);

    if (zoomInButton) {
      zoomInButton.setAttribute("aria-label", getText("boardZoomIn"));
      zoomInButton.addEventListener("click", () => {
        closeZoomPanel();
        setBoardZoom(getBoardZoom() + zoomStep, null, { animate: true });
      });
    }
    if (zoomOutButton) {
      zoomOutButton.setAttribute("aria-label", getText("boardZoomOut"));
      zoomOutButton.addEventListener("click", () => {
        closeZoomPanel();
        setBoardZoom(getBoardZoom() - zoomStep, null, { animate: true });
      });
    }
    setupZoomPanel();
    updateViewportTransform();

    stage.addEventListener("pointerdown", (event) => {
      if (
        !event.target.closest(".board-item") &&
        !event.target.closest(".board-item-controls")
      ) {
        blurActiveBoardEditors();
        hideItemToolbar();
      }
      if (!isLinkingModeActive()) return;
      if (
        event.target === stage ||
        event.target === canvas ||
        event.target === getLinksSvg()
      ) {
        clearLinkSelection();
      }
    });

    stage.addEventListener("pointermove", (event) => {
      if (!isLinkingModeActive() || isBoardPanning()) return;
      setLinkPreviewPoint(getWorldPointFromClient(event.clientX, event.clientY));
      updateLinkHoverTarget(getLinkEndpointFromEvent(event));
      updateLinkPreviewFromState();
    });

    stage.addEventListener("pointerleave", () => {
      if (getCurrentTool() !== linkTool) return;
      setLinkPreviewPoint(null);
      clearLinkPreviewLine();
      clearLinkHoverTarget();
    });

    stage.addEventListener("contextmenu", (event) => {
      handleStageContextMenu(event, getCurrentTool() === toolHand);
    });

    stage.addEventListener("wheel", onStageWheel, { passive: false });
    stage.addEventListener("gesturestart", onStageGestureStart, {
      passive: false,
    });
    stage.addEventListener("gesturechange", onStageGestureChange, {
      passive: false,
    });
    stage.addEventListener("gestureend", onStageGestureEnd);

    windowRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isLinkingModeActive()) {
        clearLinkSelection();
      }
    });

    windowRef.addEventListener("pointermove", syncInkCursorVisibility);

    windowRef.addEventListener("pointerup", (event) => {
      if (isLinkingModeActive()) {
        finishLinkDrag();
      }
      syncInkCursorVisibility(event);
    });

    windowRef.addEventListener("blur", hideInkCursors);
    documentRef.addEventListener("visibilitychange", () => {
      if (documentRef.hidden) {
        hideInkCursors();
      }
    });
  }

  return {
    setupCanvas,
  };
}
