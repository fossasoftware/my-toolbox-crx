import {
  hideLinkControls as hideLinkControlsUi,
  showLinkControls as showLinkControlsUi,
} from "./board-link-controls-ui.js";

const callMethod = (getter, method) => (...args) => getter()[method](...args);
const callOptionalMethod = (getter, method) => (...args) =>
  getter()?.[method](...args);

export function createBoardApis({
  getBoardPersistence,
  getBoardShell,
  getBoardHelpControlsController,
  getBoardViewport,
  getBoardSettingsControls,
  getBoardCanvasBootstrap,
  getBoardInkControls,
  getBoardUiBootstrap,
  getBoardMainToolbar,
  getLinkControls,
  getBoardLinkPopup,
  getBoardLifecycle,
  getBoardToolbarPopup,
  getBoardCursor,
  getBoardItemToolbarShell,
  getBoardItemStyle,
  getBoardItemMenuShell,
  getBoardLinkInteraction,
  getBoardLinkHighlight,
  getBoardLinkRender,
  getBoardCanvasRender,
  getBoardCanvasQuery,
  getBoardHotkeys,
  getBoardShapeRenderer,
  getBoardSelectionQuery,
  getBoardSelectionState,
  getBoardSelectionVisual,
  getBoardSelectionOverlay,
  getBoardShapeResize,
  getBoardShapeEditor,
  getBoardShapeStyle,
  getBoardShapeToolbarController,
  getShapeToolbarSetup,
  getBoardShapeEraser,
  getBoardLinkText,
  getBoardLinkEditor,
  getBoardItemLifecycle,
  getBoardItemRenderer,
  getBoardItemInteraction,
  getLinkControlsSetup,
}) {
  const boardPersistenceApi = {
    exportBoardBackup: callMethod(getBoardPersistence, "exportBoardBackup"),
    handleBoardImport: callMethod(getBoardPersistence, "handleBoardImport"),
    loadAutosavePreference: callMethod(
      getBoardPersistence,
      "loadAutosavePreference"
    ),
    loadBoardState: callMethod(getBoardPersistence, "loadBoardState"),
    loadBoardViewportState: callMethod(
      getBoardPersistence,
      "loadBoardViewportState"
    ),
    saveAutosavePreference: callMethod(
      getBoardPersistence,
      "saveAutosavePreference"
    ),
    saveBoardState: callMethod(getBoardPersistence, "saveBoardState"),
    saveBoardViewportState: callMethod(
      getBoardPersistence,
      "saveBoardViewportState"
    ),
    scheduleSave: callMethod(getBoardPersistence, "scheduleSave"),
    scheduleViewportSave: callMethod(
      getBoardPersistence,
      "scheduleViewportSave"
    ),
    setAutosaveState: callMethod(getBoardPersistence, "setAutosaveState"),
  };
  const boardShellApi = {
    pushHistorySnapshot: callMethod(getBoardShell, "pushHistorySnapshot"),
    redoBoard: callMethod(getBoardShell, "redoBoard"),
    scheduleHistoryCommit: callMethod(getBoardShell, "scheduleHistoryCommit"),
    setTool: callMethod(getBoardShell, "setTool"),
    undoBoard: callMethod(getBoardShell, "undoBoard"),
    updateHistoryButtons: callMethod(getBoardShell, "updateHistoryButtons"),
  };
  const boardUiSetupApi = {
    closeHelpPanel: callMethod(
      getBoardHelpControlsController,
      "closeHelpPanel"
    ),
    closeZoomPanel: callMethod(getBoardViewport, "closeZoomPanel"),
    setupBoardBackupControls: callMethod(
      getBoardSettingsControls,
      "setupBoardBackupControls"
    ),
    setupCanvas: callMethod(getBoardCanvasBootstrap, "setupCanvas"),
    setupEraserMenu: callMethod(getBoardInkControls, "setupEraserMenu"),
    setupHelpControls: callMethod(
      getBoardHelpControlsController,
      "setupHelpControls"
    ),
    setupInputs: callMethod(getBoardSettingsControls, "setupInputs"),
    setupItemMenu: callMethod(getBoardUiBootstrap, "setupItemMenu"),
    setupLinkControls: callMethod(getBoardUiBootstrap, "setupLinkControls"),
    setupPenMenu: callMethod(getBoardInkControls, "setupPenMenu"),
    setupShapeToolbar: callMethod(getBoardUiBootstrap, "setupShapeToolbar"),
    setupToolbar: callMethod(getBoardMainToolbar, "setupToolbar"),
    setupZoomPanel: callMethod(getBoardViewport, "setupZoomPanel"),
  };
  const boardLinkPopupApi = {
    clearLinkPopup: callMethod(getBoardLinkPopup, "clearLinkPopup"),
    hideLinkControls: (...args) => hideLinkControlsUi(getLinkControls(), ...args),
    positionLinkControls: callMethod(getBoardLinkPopup, "positionLinkControls"),
    selectLink: callMethod(getBoardLinkPopup, "selectLink"),
    showLinkControls: (...args) => showLinkControlsUi(getLinkControls(), ...args),
    syncLinkControlsDuringTransition: callMethod(
      getBoardLinkPopup,
      "syncLinkControlsDuringTransition"
    ),
    updateLinkControlsPosition: callMethod(
      getBoardLinkPopup,
      "updateLinkControlsPosition"
    ),
  };
  const boardLifecycleApi = {
    clearBoard: callMethod(getBoardLifecycle, "clearBoard"),
    updateEmptyState: callMethod(getBoardLifecycle, "updateEmptyState"),
  };
  const boardToolbarPopupApi = {
    closeEraserPanel: callMethod(getBoardToolbarPopup, "closeEraserPanel"),
    closeNotesMenu: callMethod(getBoardToolbarPopup, "closeNotesMenu"),
    closePenPanel: callMethod(getBoardToolbarPopup, "closePenPanel"),
    closeShapesMenu: callMethod(getBoardToolbarPopup, "closeShapesMenu"),
    setEraserPanelState: callMethod(getBoardToolbarPopup, "setEraserPanelState"),
    setPenPanelState: callMethod(getBoardToolbarPopup, "setPenPanelState"),
    syncToolbarPopupState: callMethod(
      getBoardToolbarPopup,
      "syncToolbarPopupState"
    ),
    toggleNotesMenu: callMethod(getBoardToolbarPopup, "toggleNotesMenu"),
    toggleShapesMenu: callMethod(getBoardToolbarPopup, "toggleShapesMenu"),
  };
  const boardCursorApi = {
    hideEraserCursor: callMethod(getBoardCursor, "hideEraserCursor"),
    hidePenCursor: callMethod(getBoardCursor, "hidePenCursor"),
    showEraserCursor: callMethod(getBoardCursor, "showEraserCursor"),
    showPenCursor: callMethod(getBoardCursor, "showPenCursor"),
    updateEraserCursor: callMethod(getBoardCursor, "updateEraserCursor"),
    updateEraserCursorSize: callMethod(
      getBoardCursor,
      "updateEraserCursorSize"
    ),
    updatePenCursor: callMethod(getBoardCursor, "updatePenCursor"),
    updatePenCursorStyle: callMethod(getBoardCursor, "updatePenCursorStyle"),
  };
  const boardItemToolbarShellApi = {
    closeItemToolbarMenus: callMethod(
      getBoardItemToolbarShell,
      "closeItemToolbarMenus"
    ),
    hideItemToolbar: callMethod(getBoardItemToolbarShell, "hideItemToolbar"),
    positionItemToolbar: callMethod(
      getBoardItemToolbarShell,
      "positionItemToolbar"
    ),
    scheduleItemToolbarUpdate: callMethod(
      getBoardItemToolbarShell,
      "scheduleItemToolbarUpdate"
    ),
    showItemToolbar: callMethod(getBoardItemToolbarShell, "showItemToolbar"),
    syncItemToolbarDuringTransition: callMethod(
      getBoardItemToolbarShell,
      "syncItemToolbarDuringTransition"
    ),
  };
  const boardItemStyleApi = {
    applyItemColorChoice: callMethod(getBoardItemStyle, "applyItemColorChoice"),
    applyItemTextColorChoice: callMethod(
      getBoardItemStyle,
      "applyItemTextColorChoice"
    ),
    applyItemTextSizeChoice: callMethod(
      getBoardItemStyle,
      "applyItemTextSizeChoice"
    ),
    syncItemMenuSelection: callMethod(
      getBoardItemStyle,
      "syncItemMenuSelection"
    ),
    syncItemMenuTextOptions: callMethod(
      getBoardItemStyle,
      "syncItemMenuTextOptions"
    ),
    syncItemToolbar: callMethod(getBoardItemStyle, "syncItemToolbar"),
  };
  const boardItemMenuShellApi = {
    closeItemMenu: callMethod(getBoardItemMenuShell, "closeItemMenu"),
    getMenuItem: callMethod(getBoardItemMenuShell, "getMenuItem"),
    openItemMenu: callMethod(getBoardItemMenuShell, "openItemMenu"),
  };
  const boardLinkInteractionApi = {
    clearLinkHoverTarget: callMethod(
      getBoardLinkInteraction,
      "clearLinkHoverTarget"
    ),
    clearLinkSelection: callMethod(
      getBoardLinkInteraction,
      "clearLinkSelection"
    ),
    finishLinkDrag: callMethod(getBoardLinkInteraction, "finishLinkDrag"),
    getLinkEndpointFromEvent: callMethod(
      getBoardLinkInteraction,
      "getLinkEndpointFromEvent"
    ),
    handleLinkSelection: callMethod(
      getBoardLinkInteraction,
      "handleLinkSelection"
    ),
    isLinkingModeActive: callMethod(
      getBoardLinkInteraction,
      "isLinkingModeActive"
    ),
    setLinkSource: callMethod(getBoardLinkInteraction, "setLinkSource"),
    startLinkFromToolbar: callMethod(
      getBoardLinkInteraction,
      "startLinkFromToolbar"
    ),
    updateLinkHoverTarget: callMethod(
      getBoardLinkInteraction,
      "updateLinkHoverTarget"
    ),
    updateLinkModeClass: callMethod(
      getBoardLinkInteraction,
      "updateLinkModeClass"
    ),
  };
  const boardLinkHighlightApi = {
    clearLinkItemHighlight: callMethod(
      getBoardLinkHighlight,
      "clearLinkItemHighlight"
    ),
    updateLinkItemHighlight: callMethod(
      getBoardLinkHighlight,
      "updateLinkItemHighlight"
    ),
  };
  const boardLinkRenderApi = {
    applyLinkColorChoice: callMethod(getBoardLinkRender, "applyLinkColorChoice"),
    applyLinkStyleChoice: callMethod(getBoardLinkRender, "applyLinkStyleChoice"),
    clearLinkPreviewLine: callMethod(getBoardLinkRender, "clearLinkPreviewLine"),
    getLinkRenderPoints: callMethod(getBoardLinkRender, "getLinkRenderPoints"),
    removeLink: callMethod(getBoardLinkRender, "removeLink"),
    scheduleLinkUpdate: callMethod(getBoardLinkRender, "scheduleLinkUpdate"),
    updateLinkPreviewFromState: callMethod(
      getBoardLinkRender,
      "updateLinkPreviewFromState"
    ),
    updateLinks: callMethod(getBoardLinkRender, "updateLinks"),
  };
  const boardCanvasRenderApi = {
    redrawCanvas: callMethod(getBoardCanvasRender, "redrawCanvas"),
  };
  const boardCanvasQueryApi = {
    findLineTextAtPoint: callMethod(getBoardCanvasQuery, "findLineTextAtPoint"),
    findLinkTextAtPoint: callMethod(getBoardCanvasQuery, "findLinkTextAtPoint"),
    findLinkableShapeAtPoint: callMethod(
      getBoardCanvasQuery,
      "findLinkableShapeAtPoint"
    ),
    findShapeAtPoint: callMethod(getBoardCanvasQuery, "findShapeAtPoint"),
    getShapeHitPadding: callMethod(getBoardCanvasQuery, "getShapeHitPadding"),
    isSelectableStroke: callMethod(getBoardCanvasQuery, "isSelectableStroke"),
    isShapeVisible: callMethod(getBoardCanvasQuery, "isShapeVisible"),
  };
  const boardHotkeysApi = {
    blurActiveBoardEditors: callMethod(getBoardHotkeys, "blurActiveBoardEditors"),
    handleBoardHotkeys: callMethod(getBoardHotkeys, "handleBoardHotkeys"),
    isTextEditingActive: callMethod(getBoardHotkeys, "isTextEditingActive"),
  };
  const boardShapeRendererApi = {
    drawShape: callMethod(getBoardShapeRenderer, "drawShape"),
    drawStroke: callMethod(getBoardShapeRenderer, "drawStroke"),
    drawStrokeSegment: callMethod(getBoardShapeRenderer, "drawStrokeSegment"),
    getShapeFontFamily: callMethod(getBoardShapeRenderer, "getShapeFontFamily"),
    getShapeTextColor: callMethod(getBoardShapeRenderer, "getShapeTextColor"),
    getShapeTextSize: callMethod(getBoardShapeRenderer, "getShapeTextSize"),
    wrapShapeTextLines: callMethod(getBoardShapeRenderer, "wrapShapeTextLines"),
  };
  const boardInkControlsApi = {
    syncEraserControls: callMethod(getBoardInkControls, "syncEraserControls"),
    syncPenControls: callMethod(getBoardInkControls, "syncPenControls"),
  };
  const boardSelectionQueryApi = {
    getSelectableItemIdsInRect: callMethod(
      getBoardSelectionQuery,
      "getSelectableItemIdsInRect"
    ),
    getSelectableStrokeIdsInRect: callMethod(
      getBoardSelectionQuery,
      "getSelectableStrokeIdsInRect"
    ),
    getSelectedItems: callMethod(getBoardSelectionQuery, "getSelectedItems"),
    getSelectedShapes: callMethod(getBoardSelectionQuery, "getSelectedShapes"),
    getSelectedShapeTargets: callMethod(
      getBoardSelectionQuery,
      "getSelectedShapeTargets"
    ),
    getShapeById: callMethod(getBoardSelectionQuery, "getShapeById"),
    getShapeSelectionBoundsForToolbar: callMethod(
      getBoardSelectionQuery,
      "getShapeSelectionBoundsForToolbar"
    ),
    getSingleSelectedShape: callMethod(
      getBoardSelectionQuery,
      "getSingleSelectedShape"
    ),
    isShapeSelected: callMethod(getBoardSelectionQuery, "isShapeSelected"),
  };
  const boardSelectionStateApi = {
    clearShapeSelection: callMethod(
      getBoardSelectionState,
      "clearShapeSelection"
    ),
    deleteSelectedShape: callMethod(
      getBoardSelectionState,
      "deleteSelectedShape"
    ),
    finishMarqueeSelection: callMethod(
      getBoardSelectionState,
      "finishMarqueeSelection"
    ),
    finishMixedDrag: callMethod(getBoardSelectionState, "finishMixedDrag"),
    finishShapeDrag: callMethod(getBoardSelectionState, "finishShapeDrag"),
    moveMixedDrag: callMethod(getBoardSelectionState, "moveMixedDrag"),
    moveSelectedShape: callMethod(getBoardSelectionState, "moveSelectedShape"),
    selectAllElements: callMethod(getBoardSelectionState, "selectAllElements"),
    selectShape: callMethod(getBoardSelectionState, "selectShape"),
    shouldDrawShapeSelection: callMethod(
      getBoardSelectionState,
      "shouldDrawShapeSelection"
    ),
    startMarqueeSelection: callMethod(
      getBoardSelectionState,
      "startMarqueeSelection"
    ),
    startMixedDrag: callMethod(getBoardSelectionState, "startMixedDrag"),
    startShapeDrag: callMethod(getBoardSelectionState, "startShapeDrag"),
    syncItemSelectionElement: callMethod(
      getBoardSelectionState,
      "syncItemSelectionElement"
    ),
    toggleItemSelection: callMethod(
      getBoardSelectionState,
      "toggleItemSelection"
    ),
    toggleShapeSelection: callMethod(
      getBoardSelectionState,
      "toggleShapeSelection"
    ),
    updateItemSelectionStyles: callMethod(
      getBoardSelectionState,
      "updateItemSelectionStyles"
    ),
    updateMarqueeSelection: callMethod(
      getBoardSelectionState,
      "updateMarqueeSelection"
    ),
  };
  const boardSelectionVisualApi = {
    drawLinkSelection: callMethod(getBoardSelectionVisual, "drawLinkSelection"),
    getLinkSelectionBounds: callMethod(
      getBoardSelectionVisual,
      "getLinkSelectionBounds"
    ),
    getLinkSelectionColor: callMethod(
      getBoardSelectionVisual,
      "getLinkSelectionColor"
    ),
    getSelectionBounds: callMethod(
      getBoardSelectionVisual,
      "getSelectionBounds"
    ),
    getSelectionColor: callMethod(getBoardSelectionVisual, "getSelectionColor"),
    getSelectionFillColor: callMethod(
      getBoardSelectionVisual,
      "getSelectionFillColor"
    ),
    getShapeSelectionBounds: callMethod(
      getBoardSelectionVisual,
      "getShapeSelectionBounds"
    ),
  };
  const boardSelectionOverlayApi = {
    drawLinkHoverHighlight: callMethod(
      getBoardSelectionOverlay,
      "drawLinkHoverHighlight"
    ),
    drawLinkSourceHighlight: callMethod(
      getBoardSelectionOverlay,
      "drawLinkSourceHighlight"
    ),
    drawMarqueeSelection: callMethod(
      getBoardSelectionOverlay,
      "drawMarqueeSelection"
    ),
    drawShapeSelection: callMethod(
      getBoardSelectionOverlay,
      "drawShapeSelection"
    ),
  };
  const boardShapeResizeApi = {
    drawShapeResizeHandles: callMethod(
      getBoardShapeResize,
      "drawShapeResizeHandles"
    ),
    finishShapeResize: callMethod(getBoardShapeResize, "finishShapeResize"),
    getShapeResizeHandleAtPoint: callMethod(
      getBoardShapeResize,
      "getShapeResizeHandleAtPoint"
    ),
    startShapeResize: callMethod(getBoardShapeResize, "startShapeResize"),
    updateShapeResize: callMethod(getBoardShapeResize, "updateShapeResize"),
    updateShapeResizeHover: callMethod(
      getBoardShapeResize,
      "updateShapeResizeHover"
    ),
  };
  const boardShapeEditorApi = {
    cancelShapeTextEditing: callMethod(
      getBoardShapeEditor,
      "cancelShapeTextEditing"
    ),
    closeShapeEditor: callMethod(getBoardShapeEditor, "closeShapeEditor"),
    commitShapeTextEditing: callMethod(
      getBoardShapeEditor,
      "commitShapeTextEditing"
    ),
    startShapeTextEditing: callMethod(
      getBoardShapeEditor,
      "startShapeTextEditing"
    ),
    syncShapeEditorPosition: callMethod(
      getBoardShapeEditor,
      "syncShapeEditorPosition"
    ),
    updateShapeTextFromEditor: callMethod(
      getBoardShapeEditor,
      "updateShapeTextFromEditor"
    ),
  };
  const boardShapeStyleApi = {
    applyShapeFillChoice: callMethod(getBoardShapeStyle, "applyShapeFillChoice"),
    applyShapeStrokeColorChoice: callMethod(
      getBoardShapeStyle,
      "applyShapeStrokeColorChoice"
    ),
    applyShapeStrokeWidthChoice: callMethod(
      getBoardShapeStyle,
      "applyShapeStrokeWidthChoice"
    ),
  };
  const boardShapeToolbarApi = {
    scheduleShapeToolbarUpdate: callMethod(
      getBoardShapeToolbarController,
      "scheduleShapeToolbarUpdate"
    ),
    syncShapeToolbarDuringTransition: callMethod(
      getBoardShapeToolbarController,
      "syncShapeToolbarDuringTransition"
    ),
  };
  const boardShapeToolbarSetupApi = {
    closeShapeColorMenus: callOptionalMethod(
      getShapeToolbarSetup,
      "closeShapeColorMenus"
    ),
    setShapeColorMenuState: callOptionalMethod(
      getShapeToolbarSetup,
      "setShapeColorMenuState"
    ),
    syncShapePaletteVisibility: callOptionalMethod(
      getShapeToolbarSetup,
      "syncShapePaletteVisibility"
    ),
  };
  const boardShapeEraserApi = {
    removeShapesByEraser: callMethod(
      getBoardShapeEraser,
      "removeShapesByEraser"
    ),
  };
  const boardLinkTextApi = {
    createLinkLabelElement: callMethod(
      getBoardLinkText,
      "createLinkLabelElement"
    ),
    getLinkEditorBounds: callMethod(getBoardLinkText, "getLinkEditorBounds"),
    getLinkLabelBounds: callMethod(getBoardLinkText, "getLinkLabelBounds"),
    getLinkTextColor: callMethod(getBoardLinkText, "getLinkTextColor"),
    getLinkTextSize: callMethod(getBoardLinkText, "getLinkTextSize"),
  };
  const boardLinkEditorApi = {
    cancelLinkTextEditing: callMethod(
      getBoardLinkEditor,
      "cancelLinkTextEditing"
    ),
    closeLinkEditor: callMethod(getBoardLinkEditor, "closeLinkEditor"),
    commitLinkTextEditing: callMethod(
      getBoardLinkEditor,
      "commitLinkTextEditing"
    ),
    positionLinkEditorFromPoints: callMethod(
      getBoardLinkEditor,
      "positionLinkEditorFromPoints"
    ),
    startLinkTextEditing: callMethod(
      getBoardLinkEditor,
      "startLinkTextEditing"
    ),
    updateLinkTextFromEditor: callMethod(
      getBoardLinkEditor,
      "updateLinkTextFromEditor"
    ),
  };
  const boardItemLifecycleApi = {
    addItem: callMethod(getBoardItemLifecycle, "addItem"),
    removeItem: callMethod(getBoardItemLifecycle, "removeItem"),
  };
  const boardItemRenderApi = {
    renderItems: callMethod(getBoardItemRenderer, "renderItems"),
  };
  const boardItemInteractionApi = {
    startItemResize: callMethod(getBoardItemInteraction, "startItemResize"),
    updateItemPosition: callMethod(getBoardItemInteraction, "updateItemPosition"),
  };
  const boardLinkControlsSetupApi = {
    closeLinkMenus: callOptionalMethod(getLinkControlsSetup, "closeLinkMenus"),
  };
  const boardViewportApi = {
    applyViewportState: callMethod(getBoardViewport, "applyViewportState"),
    finishBoardPan: callMethod(getBoardViewport, "finishBoardPan"),
    getBoardZoom: callMethod(getBoardViewport, "getBoardZoom"),
    getViewportState: callMethod(getBoardViewport, "getViewportState"),
    getCanvasPoint: (event, rectOverride = null) =>
      getBoardViewport().getWorldPointFromClient(
        event.clientX,
        event.clientY,
        rectOverride
      ),
    getViewPan: callMethod(getBoardViewport, "getViewPan"),
    getWorldPointFromClient: callMethod(
      getBoardViewport,
      "getWorldPointFromClient"
    ),
    isBoardPanning: callMethod(getBoardViewport, "isPanning"),
    onStageGestureChange: callMethod(getBoardViewport, "onStageGestureChange"),
    onStageGestureEnd: callMethod(getBoardViewport, "onStageGestureEnd"),
    onStageGestureStart: callMethod(getBoardViewport, "onStageGestureStart"),
    onStageWheel: callMethod(getBoardViewport, "onStageWheel"),
    resizeCanvas: callMethod(getBoardViewport, "resizeCanvas"),
    setBoardZoom: callMethod(getBoardViewport, "setBoardZoom"),
    startBoardPan: callMethod(getBoardViewport, "startBoardPan"),
    updateBoardPan: callMethod(getBoardViewport, "updateBoardPan"),
    updateViewportTransform: callMethod(
      getBoardViewport,
      "updateViewportTransform"
    ),
  };

  return {
    boardPersistenceApi,
    boardShellApi,
    boardUiSetupApi,
    boardLinkPopupApi,
    boardLifecycleApi,
    boardToolbarPopupApi,
    boardCursorApi,
    boardItemToolbarShellApi,
    boardItemStyleApi,
    boardItemMenuShellApi,
    boardLinkInteractionApi,
    boardLinkHighlightApi,
    boardLinkRenderApi,
    boardCanvasRenderApi,
    boardCanvasQueryApi,
    boardHotkeysApi,
    boardShapeRendererApi,
    boardInkControlsApi,
    boardSelectionQueryApi,
    boardSelectionStateApi,
    boardSelectionVisualApi,
    boardSelectionOverlayApi,
    boardShapeResizeApi,
    boardShapeEditorApi,
    boardShapeStyleApi,
    boardShapeToolbarApi,
    boardShapeToolbarSetupApi,
    boardShapeEraserApi,
    boardLinkTextApi,
    boardLinkEditorApi,
    boardItemLifecycleApi,
    boardItemRenderApi,
    boardItemInteractionApi,
    boardLinkControlsSetupApi,
    boardViewportApi,
  };
}
