import { createBoardCanvasQueryController } from "./board-canvas-query-controller.js";
import { createBoardCanvasRenderController } from "./board-canvas-render-controller.js";
import { createBoardCursorController } from "./board-cursor-controller.js";
import { createBoardViewportController } from "./board-viewport-controller.js";

export function createBoardCanvasCoreStack({
  windowRef,
  boardPersistenceApi,
  getText,
  getCurrentTool,
  getBoardSettings,
  getBoardStrokes,
  getBoardLinks,
  getSelectedLinkId,
  getCanvas,
  getCtx,
  getStage,
  getViewport,
  getLinksSvg,
  getItemSelectionLayer,
  getZoomControls,
  getZoomInButton,
  getZoomLabel,
  getZoomOutButton,
  getZoomPanel,
  isViewportInteractionBlocked,
  getPenCursor,
  getEraserCursor,
  boardSelectionOverlayApi,
  boardSelectionVisualApi,
  boardShapeRendererApi,
  boardLinkInteractionApi,
  boardShapeToolbarApi,
  boardLinkRenderApi,
  boardItemToolbarShellApi,
  boardLinkPopupApi,
  boardHotkeysApi,
  boardLinkTextApi,
  cancelScheduledLinkUpdate,
  linkGap,
  toolDraw,
  toolErase,
  toolLine,
  toolSelect,
}) {
  let boardViewport;

  const boardCursor = createBoardCursorController({
    getCanvasPoint: (...args) => boardViewport.getCanvasPoint(...args),
    getCurrentTool,
    getDefaultColor: () => "#0d181c",
    getDrawColor: () => getBoardSettings().color,
    getDrawOpacity: () => getBoardSettings().opacity,
    getDrawSize: () => getBoardSettings().size,
    getEraserCursor,
    getEraserSize: () => getBoardSettings().eraserSize,
    getPenCursor,
    getStage,
    // The cursor elements live inside #boardViewport, which carries the
    // translate(pan) scale(zoom) transform — so they must be positioned in
    // WORLD coordinates, otherwise the viewport transform offsets them from
    // the real pointer whenever the board is zoomed or panned.
    getViewPan: (...args) => boardViewport.getViewPan(...args),
    getBoardZoom: (...args) => boardViewport.getBoardZoom(...args),
    getWorldPoint: (clientX, clientY) =>
      boardViewport.getWorldPointFromClient(clientX, clientY),
    toolDraw,
    toolErase,
  });

  const boardCanvasRender = createBoardCanvasRenderController({
    drawLinkHoverHighlight: boardSelectionOverlayApi.drawLinkHoverHighlight,
    drawLinkSelection: boardSelectionVisualApi.drawLinkSelection,
    drawLinkSourceHighlight: boardSelectionOverlayApi.drawLinkSourceHighlight,
    drawMarqueeSelection: boardSelectionOverlayApi.drawMarqueeSelection,
    drawShape: boardShapeRendererApi.drawShape,
    drawShapeSelection: boardSelectionOverlayApi.drawShapeSelection,
    drawStroke: boardShapeRendererApi.drawStroke,
    getBoardStrokes,
    getCanvas,
    getCtx,
    getCurrentTool,
    getDevicePixelRatio: () => windowRef.devicePixelRatio || 1,
    getSelectedLinkId,
    getViewPan: (...args) => boardViewport.getViewPan(...args),
    getZoom: (...args) => boardViewport.getBoardZoom(...args),
    isLinkingModeActive: boardLinkInteractionApi.isLinkingModeActive,
    scheduleShapeToolbarUpdate: boardShapeToolbarApi.scheduleShapeToolbarUpdate,
    toolSelect,
  });

  boardViewport = createBoardViewportController({
    scheduleViewportSave: boardPersistenceApi.scheduleViewportSave,
    getText,
    getCanvas,
    getCtx,
    getItemSelectionLayer,
    getLinksSvg,
    getStage,
    getViewport,
    getZoomControls,
    getZoomInButton,
    getZoomLabel,
    getZoomOutButton,
    getZoomPanel,
    isTextEditingActive: boardHotkeysApi.isTextEditingActive,
    isViewportInteractionBlocked,
    redrawCanvas: boardCanvasRender.redrawCanvas,
    updateLinks: boardLinkRenderApi.updateLinks,
    scheduleShapeToolbarUpdate: boardShapeToolbarApi.scheduleShapeToolbarUpdate,
    scheduleItemToolbarUpdate: boardItemToolbarShellApi.scheduleItemToolbarUpdate,
    updateLinkPreviewFromState: boardLinkRenderApi.updateLinkPreviewFromState,
    updateLinkControlsPosition: boardLinkPopupApi.updateLinkControlsPosition,
    cancelScheduledLinkUpdate,
  });

  const boardCanvasQuery = createBoardCanvasQueryController({
    getBoardLinks,
    getBoardSettings,
    getBoardStrokes,
    getCtx,
    getLinkRenderPoints: boardLinkRenderApi.getLinkRenderPoints,
    getLinkTextSize: boardLinkTextApi.getLinkTextSize,
    getShapeFontFamily: boardShapeRendererApi.getShapeFontFamily,
    getShapeTextSize: boardShapeRendererApi.getShapeTextSize,
    getStage,
    getWrapShapeTextLines: () => boardShapeRendererApi.wrapShapeTextLines,
    linkGap,
    toolDraw,
    toolLine,
  });

  return {
    boardCanvasQuery,
    boardCanvasRender,
    boardCursor,
    boardViewport,
  };
}
