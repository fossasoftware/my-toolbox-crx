import { createBoardShapeEditorController } from "./board-shape-editor-controller.js";
import { createBoardShapeEraserController } from "./board-shape-eraser-controller.js";
import { createBoardShapeRenderer } from "./board-shape-renderer.js";
import { createBoardShapeResizeController } from "./board-shape-resize-controller.js";
import { createBoardShapeStyleController } from "./board-shape-style-controller.js";
import { createBoardShapeToolbarController } from "./board-shape-toolbar-controller.js";

export function createBoardShapeStack({
  getCtx,
  getBoardSettings,
  getCurrentTool,
  getBoardZoom,
  getViewPan,
  getBoardLinks,
  setBoardLinks,
  getBoardStrokes,
  setBoardStrokes,
  getDraggingMixed,
  getDraggingShape,
  setDraggingShape,
  getIsMarqueeSelecting,
  getResizingShape,
  setResizingShape,
  getSelectedItemIds,
  getSelectedShapeIds,
  getLinkSource,
  getShapeEditingId,
  setShapeEditingId,
  getShapeResizeHandle,
  setShapeResizeHandle,
  getShapeResizeHover,
  setShapeResizeHover,
  getShapeResizeId,
  setShapeResizeId,
  getShapeResizeSnapshot,
  setShapeResizeSnapshot,
  setShapeDragStart,
  setShapeDragSnapshot,
  getShapeToolbarPinned,
  getTransitionUntil,
  setTransitionUntil,
  getScheduleRafId,
  setScheduleRafId,
  getTransitionRafId,
  setTransitionRafId,
  getShapeRefs,
  getSelectedShapeTargets,
  getShapeSelectionBoundsForToolbar,
  getSingleSelectedShape,
  getShapeById,
  getSelectionBounds,
  getSelectionColor,
  getShapeHitPadding,
  getDefaultShapeSize,
  boardCanvasRenderApi,
  boardShellApi,
  boardPersistenceApi,
  boardLinkRenderApi,
  boardInkControlsApi,
  boardCursorApi,
  boardLinkInteractionApi,
  boardShapeToolbarSetupApi,
  boardUiPreview,
  getShapeBounds,
  getConstrainedPoint,
  pointToSegmentDistance,
  getLinkType,
  defaultStrokeColor,
  shapeResizeHandleHitRadius,
  shapeResizeHandleRadius,
  linkTypeShape,
  toolLine,
  toolSelect,
}) {
  let boardShapeRenderer;

  const boardShapeEditor = createBoardShapeEditorController({
    getCtx,
    getShapeById,
    getShapeBounds,
    getShapeEditor: () => getShapeRefs().shapeEditor,
    getShapeEditingId,
    getShapeFontFamily: () => boardShapeRenderer.getShapeFontFamily(),
    getShapeTextColor: (...args) => boardShapeRenderer.getShapeTextColor(...args),
    getShapeTextSize: (...args) => boardShapeRenderer.getShapeTextSize(...args),
    getWrapShapeTextLines: (...args) =>
      boardShapeRenderer.wrapShapeTextLines(...args),
    getDefaultShapeSize,
    setShapeEditingId,
    toolLine,
    redrawCanvas: boardCanvasRenderApi.redrawCanvas,
    scheduleHistoryCommit: boardShellApi.scheduleHistoryCommit,
    scheduleSave: boardPersistenceApi.scheduleSave,
  });

  boardShapeRenderer = createBoardShapeRenderer({
    getCtx,
    getDefaultColor: () => getBoardSettings().color,
    getDefaultOpacity: () => getBoardSettings().opacity,
    getDefaultSize: () => getBoardSettings().size,
    getDefaultTextSize: () => getBoardSettings().textSize,
    isShapeEditing: (shape) =>
      Boolean(getShapeEditingId() && shape?.id === getShapeEditingId()),
  });

  const boardShapeResize = createBoardShapeResizeController({
    getBoardZoom,
    getConstrainedPoint,
    getCurrentTool,
    getCtx,
    getDraggingMixed,
    getDraggingShape,
    getIsMarqueeSelecting,
    getResizingShape,
    getSelectionBounds,
    getSelectionColor,
    getShapeById,
    getShapeHitPadding,
    getShapeResizeHandle,
    getShapeResizeHover,
    getShapeResizeId,
    getShapeResizeSnapshot,
    getSingleSelectedShape,
    handleHitRadius: shapeResizeHandleHitRadius,
    handleRadius: shapeResizeHandleRadius,
    redrawCanvas: boardCanvasRenderApi.redrawCanvas,
    scheduleLinkUpdate: boardLinkRenderApi.scheduleLinkUpdate,
    setResizingShape,
    setShapeResizeHandle,
    setShapeResizeHover,
    setShapeResizeId,
    setShapeResizeSnapshot,
    toolLine,
    toolSelect,
  });

  const boardShapeStyle = createBoardShapeStyleController({
    getBoardSettings,
    getSelectedShapeTargets,
    lineTool: toolLine,
    redrawCanvas: boardCanvasRenderApi.redrawCanvas,
    scheduleHistoryCommit: boardShellApi.scheduleHistoryCommit,
    scheduleLinkUpdate: boardLinkRenderApi.scheduleLinkUpdate,
    scheduleSave: boardPersistenceApi.scheduleSave,
    syncPenControls: boardInkControlsApi.syncPenControls,
    updateEraserCursorSize: boardCursorApi.updateEraserCursorSize,
  });

  const boardShapeToolbarController = createBoardShapeToolbarController({
    defaultStrokeColor,
    getBoardSettings,
    getBoardZoom,
    getCurrentTool,
    getRefs: getShapeRefs,
    getSelectedItemIds,
    getSelectedStrokeCount: () => getSelectedShapeIds().size,
    getSelectedShapeTargets,
    getShapeSelectionBoundsForToolbar,
    getShapeToolbarPinned,
    getTransitionUntil,
    getViewPan,
    getScheduleRafId,
    getTransitionRafId,
    lineTool: toolLine,
    selectTool: toolSelect,
    setScheduleRafId,
    setShapeColorButtonSwatch: boardUiPreview.setShapeColorButtonSwatch,
    setShapeColorMenuState: boardShapeToolbarSetupApi.setShapeColorMenuState,
    setStrokeWidthPreview: boardUiPreview.setStrokeWidthPreview,
    setTransitionRafId,
    setTransitionUntil,
    syncShapeColorMenu: boardUiPreview.syncShapeColorMenu,
    syncShapeEditorPosition: boardShapeEditor.syncShapeEditorPosition,
    syncShapePaletteVisibility: boardShapeToolbarSetupApi.syncShapePaletteVisibility,
    syncShapeSizeMenu: boardUiPreview.syncShapeSizeMenu,
    closeShapeColorMenus: boardShapeToolbarSetupApi.closeShapeColorMenus,
  });

  const boardShapeEraser = createBoardShapeEraserController({
    clearLinkSelection: boardLinkInteractionApi.clearLinkSelection,
    clearShapeDragState: () => {
      setDraggingShape(false);
      setShapeDragStart(null);
      setShapeDragSnapshot(null);
    },
    clearShapeResizeState: () => {
      setResizingShape(false);
      setShapeResizeHandle(null);
      setShapeResizeSnapshot(null);
      setShapeResizeId(null);
    },
    closeShapeEditor: boardShapeEditor.closeShapeEditor,
    getBoardLinks,
    getBoardSettings,
    getBoardStrokes,
    getDraggingShape,
    getLinkSource,
    getLinkType,
    getSelectedShapeIds,
    getShapeBounds,
    getShapeEditingId,
    getShapeResizeId,
    linkTypeShape,
    pointToSegmentDistance,
    scheduleLinkUpdate: boardLinkRenderApi.scheduleLinkUpdate,
    setBoardLinks,
    setBoardStrokes,
    toolLine,
  });

  return {
    boardShapeEditor,
    boardShapeEraser,
    boardShapeRenderer,
    boardShapeResize,
    boardShapeStyle,
    boardShapeToolbarController,
  };
}
