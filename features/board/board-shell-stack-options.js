export function createBoardItemStackOptions({
  documentRef,
  windowRef,
  getText,
  createId,
  itemElements,
  itemToolbars,
  runtime,
  refs,
  apis,
  boardUiPreview,
  constants,
  helpers,
}) {
  const { boardRuntime, selectionRuntime, dragRuntime, itemRuntime, linkRuntime } =
    runtime;
  const { canvasRefs, itemRefs } = refs;
  const {
    boardShellApi,
    boardPersistenceApi,
    boardViewportApi,
    boardSelectionStateApi,
    boardLinkInteractionApi,
    boardLinkHighlightApi,
    boardLinkRenderApi,
    boardCanvasRenderApi,
    boardLifecycleApi,
  } = apis;
  const {
    itemDefaults,
    itemMenuOffset,
    itemOffsetLimit,
    itemOffsetStep,
    itemTypeColors,
    textColorPresets,
    textSizePresets,
    linkTypeItem,
    toolSelect,
  } = constants;
  const { linkHasEndpoint, makeLinkEndpoint } = helpers;

  return {
    documentRef,
    windowRef,
    getText,
    createId,
    itemElements,
    itemToolbars,
    getBoardItems: () => boardRuntime.boardState.items,
    getBoardLinks: () => boardRuntime.boardState.links,
    getBoardSettings: () => boardRuntime.boardState.settings,
    getStage: () => canvasRefs.stage,
    getItemsContainer: () => canvasRefs.itemsContainer,
    getItemMenu: () => itemRefs.itemMenu,
    getItemControls: () => itemRefs.itemControls,
    getCurrentTool: () => boardRuntime.currentTool,
    getActiveItemToolbarId: () => dragRuntime.activeItemToolbarId,
    setActiveItemToolbarId: (value) => {
      dragRuntime.activeItemToolbarId = value;
    },
    getItemMenuTargetId: () => itemRuntime.itemMenuTargetId,
    setItemMenuTargetId: (value) => {
      itemRuntime.itemMenuTargetId = value;
    },
    getResizeObserver: () => dragRuntime.resizeObserver,
    setResizeObserver: (value) => {
      dragRuntime.resizeObserver = value;
    },
    getItemOffset: () => dragRuntime.itemOffset,
    setItemOffset: (value) => {
      dragRuntime.itemOffset = value;
    },
    getSelectedItemIds: () => selectionRuntime.selectedItemIds,
    getSelectedShapeIds: () => selectionRuntime.selectedShapeIds,
    getLinkSource: () => linkRuntime.linkSource,
    getLinkHoverTarget: () => linkRuntime.linkHoverTarget,
    getDraggingMixed: () => dragRuntime.draggingMixed,
    getResizingItem: () => dragRuntime.resizingItem,
    setResizingItem: (value) => {
      dragRuntime.resizingItem = value;
    },
    getMixedDragUsesWindow: () => dragRuntime.mixedDragUsesWindow,
    setMixedDragUsesWindow: (value) => {
      dragRuntime.mixedDragUsesWindow = value;
    },
    getItemMenuColorButtons: () => itemRefs.itemMenuColorButtons,
    getItemMenuTextColorButtons: () => itemRefs.itemMenuTextColorButtons,
    getItemMenuTextSizeButtons: () => itemRefs.itemMenuTextSizeButtons,
    setBoardItems: (items) => {
      boardRuntime.boardState.items = items;
    },
    setBoardLinks: (links) => {
      boardRuntime.boardState.links = links;
    },
    boardShellApi,
    boardPersistenceApi,
    boardViewportApi,
    boardSelectionStateApi,
    boardLinkInteractionApi,
    boardLinkHighlightApi,
    boardLinkRenderApi,
    boardCanvasRenderApi,
    boardLifecycleApi,
    boardUiPreview,
    itemDefaults,
    itemMenuOffset,
    itemOffsetLimit,
    itemOffsetStep,
    itemTypeColors,
    textColorPresets,
    textSizePresets,
    linkTypeItem,
    toolSelect,
    linkHasEndpoint,
    makeLinkEndpoint,
  };
}

export function createBoardCanvasCoreStackOptions({
  windowRef,
  getText,
  runtime,
  refs,
  apis,
  constants,
}) {
  const { boardRuntime, drawingRuntime, dragRuntime, linkRuntime } = runtime;
  const { canvasRefs } = refs;
  const {
    boardPersistenceApi,
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
  } = apis;
  const { linkGap, toolDraw, toolErase, toolLine, toolSelect } = constants;

  return {
    windowRef,
    boardPersistenceApi,
    getText,
    getCurrentTool: () => boardRuntime.currentTool,
    getBoardSettings: () => boardRuntime.boardState.settings,
    getBoardStrokes: () => boardRuntime.boardState.strokes,
    getBoardLinks: () => boardRuntime.boardState.links,
    getSelectedLinkId: () => linkRuntime.selectedLinkId,
    getCanvas: () => canvasRefs.canvas,
    getCtx: () => canvasRefs.ctx,
    getStage: () => canvasRefs.stage,
    getViewport: () => canvasRefs.viewport,
    getLinksSvg: () => canvasRefs.linksSvg,
    getItemSelectionLayer: () => canvasRefs.itemSelectionLayer,
    getZoomControls: () => canvasRefs.zoomControls,
    getZoomInButton: () => canvasRefs.zoomInButton,
    getZoomLabel: () => canvasRefs.zoomLabel,
    getZoomOutButton: () => canvasRefs.zoomOutButton,
    getZoomPanel: () => canvasRefs.zoomPanel,
    isViewportInteractionBlocked: () =>
      drawingRuntime.drawing ||
      dragRuntime.draggingMixed ||
      dragRuntime.resizingShape ||
      dragRuntime.resizingItem,
    getPenCursor: () => canvasRefs.penCursor,
    getEraserCursor: () => canvasRefs.eraserCursor,
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
    cancelScheduledLinkUpdate: () => {
      if (linkRuntime.linkUpdateRaf) {
        cancelAnimationFrame(linkRuntime.linkUpdateRaf);
        linkRuntime.linkUpdateRaf = null;
      }
    },
    linkGap,
    toolDraw,
    toolErase,
    toolLine,
    toolSelect,
  };
}

export function createBoardCanvasInteractionStackOptions({
  documentRef,
  windowRef,
  getText,
  createId,
  runtime,
  refs,
  boardViewport,
  apis,
  constants,
  helpers,
  stageResizeObserverCtor,
}) {
  const {
    boardRuntime,
    drawingRuntime,
    selectionRuntime,
    dragRuntime,
    linkRuntime,
    shapeRuntime,
  } = runtime;
  const { canvasRefs, penRefs, eraserRefs } = refs;
  const {
    boardPersistenceApi,
    boardShellApi,
    boardUiSetupApi,
    boardSelectionQueryApi,
    boardSelectionStateApi,
    boardLinkPopupApi,
    boardToolbarPopupApi,
    boardCanvasQueryApi,
    boardCanvasRenderApi,
    boardShapeResizeApi,
    boardShapeEditorApi,
    boardLinkEditorApi,
    boardLifecycleApi,
    boardViewportApi,
    boardCursorApi,
    boardLinkInteractionApi,
    boardShapeEraserApi,
    boardShapeRendererApi,
    boardLinkRenderApi,
    boardItemToolbarShellApi,
  } = apis;
  const { inkTools, shapeTools, linkTypeShape, toolDraw, toolErase, toolHand, toolLine, toolLink, toolSelect, zoomStep } =
    constants;
  const { getConstrainedPoint, makeLinkEndpoint } = helpers;

  return {
    documentRef,
    windowRef,
    getText,
    createId,
    getCurrentTool: () => boardRuntime.currentTool,
    getBoardSettings: () => boardRuntime.boardState.settings,
    getBoardStrokes: () => boardRuntime.boardState.strokes,
    getCanvas: () => canvasRefs.canvas,
    getCtx: () => canvasRefs.ctx,
    getStage: () => canvasRefs.stage,
    getLinksSvg: () => canvasRefs.linksSvg,
    getViewportController: () => boardViewport,
    getSelectedItemIds: () => selectionRuntime.selectedItemIds,
    getSelectedShapeIds: () => selectionRuntime.selectedShapeIds,
    getShapeEditingId: () => shapeRuntime.shapeEditingId,
    getActiveShape: () => drawingRuntime.activeShape,
    setActiveShape: (value) => {
      drawingRuntime.activeShape = value;
    },
    getActiveStroke: () => drawingRuntime.activeStroke,
    setActiveStroke: (value) => {
      drawingRuntime.activeStroke = value;
    },
    getDrawing: () => drawingRuntime.drawing,
    setDrawing: (value) => {
      drawingRuntime.drawing = value;
    },
    getDraggingMixed: () => dragRuntime.draggingMixed,
    getDraggingShape: () => dragRuntime.draggingShape,
    getIsMarqueeSelecting: () => selectionRuntime.isMarqueeSelecting,
    getMixedDragUsesWindow: () => dragRuntime.mixedDragUsesWindow,
    getResizingShape: () => dragRuntime.resizingShape,
    getPenPanel: () => penRefs.penPanel,
    getEraserPanel: () => eraserRefs.eraserPanel,
    assignCanvasElements: ({
      canvas: nextCanvas,
      emptyState: nextEmptyState,
      eraserCursor: nextEraserCursor,
      itemSelectionLayer: nextItemSelectionLayer,
      itemsContainer: nextItemsContainer,
      linksSvg: nextLinksSvg,
      penCursor: nextPenCursor,
      stage: nextStage,
      viewport: nextViewport,
      zoomControls: nextZoomControls,
      zoomInButton: nextZoomInButton,
      zoomLabel: nextZoomLabel,
      zoomOutButton: nextZoomOutButton,
      zoomPanel: nextZoomPanel,
    }) => {
      canvasRefs.canvas = nextCanvas;
      canvasRefs.emptyState = nextEmptyState;
      canvasRefs.eraserCursor = nextEraserCursor;
      canvasRefs.itemSelectionLayer = nextItemSelectionLayer;
      canvasRefs.itemsContainer = nextItemsContainer;
      canvasRefs.linksSvg = nextLinksSvg;
      canvasRefs.penCursor = nextPenCursor;
      canvasRefs.stage = nextStage;
      canvasRefs.viewport = nextViewport;
      canvasRefs.zoomControls = nextZoomControls;
      canvasRefs.zoomInButton = nextZoomInButton;
      canvasRefs.zoomLabel = nextZoomLabel;
      canvasRefs.zoomOutButton = nextZoomOutButton;
      canvasRefs.zoomPanel = nextZoomPanel;
    },
    setCtx: (value) => {
      canvasRefs.ctx = value;
    },
    setLinkPreviewPoint: (value) => {
      linkRuntime.linkPreviewPoint = value;
    },
    setStageResizeObserver: (value) => {
      dragRuntime.stageResizeObserver = value;
    },
    boardPersistenceApi,
    boardShellApi,
    boardUiSetupApi,
    boardSelectionQueryApi,
    boardSelectionStateApi,
    boardLinkPopupApi,
    boardToolbarPopupApi,
    boardCanvasQueryApi,
    boardCanvasRenderApi,
    boardShapeResizeApi,
    boardShapeEditorApi,
    boardLinkEditorApi,
    boardLifecycleApi,
    boardViewportApi,
    boardCursorApi,
    boardLinkInteractionApi,
    boardShapeEraserApi,
    boardShapeRendererApi,
    boardLinkRenderApi,
    boardItemToolbarShellApi,
    inkTools,
    shapeTools,
    getConstrainedPoint,
    makeLinkEndpoint,
    linkTypeShape,
    toolDraw,
    toolErase,
    toolHand,
    toolLine,
    toolLink,
    toolSelect,
    stageResizeObserverCtor,
    zoomStep,
  };
}

export function createBoardUiControlsStackOptions({
  documentRef,
  windowRef,
  getText,
  runtime,
  refs,
  apis,
  boardItemContent,
  boardUiPreview,
  constants,
}) {
  const { boardRuntime } = runtime;
  const { toolbarRefs, settingsRefs, penRefs, eraserRefs } = refs;
  const {
    boardItemLifecycleApi,
    boardToolbarPopupApi,
    boardUiSetupApi,
    boardShellApi,
    boardPersistenceApi,
    boardLifecycleApi,
    boardCursorApi,
  } = apis;
  const {
    itemTypeColors,
    shapeToolLabels,
    shapeTools,
    shapeStrokeColorPresets,
  } = constants;

  return {
    documentRef,
    windowRef,
    getText,
    getCurrentTool: () => boardRuntime.currentTool,
    getBoardSettings: () => boardRuntime.boardState.settings,
    getBoardToolbarDock: () => toolbarRefs.boardToolbarDock,
    setBoardToolbarDock: (value) => {
      toolbarRefs.boardToolbarDock = value;
    },
    getBoardToolbarPanel: () => toolbarRefs.boardToolbarPanel,
    setBoardToolbarPanel: (value) => {
      toolbarRefs.boardToolbarPanel = value;
    },
    getNotesMenu: () => toolbarRefs.notesMenu,
    setNotesMenu: (value) => {
      toolbarRefs.notesMenu = value;
    },
    getNotesToggle: () => toolbarRefs.notesToggle,
    setNotesToggle: (value) => {
      toolbarRefs.notesToggle = value;
    },
    getShapesMenu: () => toolbarRefs.shapesMenu,
    setShapesMenu: (value) => {
      toolbarRefs.shapesMenu = value;
    },
    getShapesToggle: () => toolbarRefs.shapesToggle,
    setShapesToggle: (value) => {
      toolbarRefs.shapesToggle = value;
    },
    getHelpControls: () => toolbarRefs.helpControls,
    setHelpControls: (value) => {
      toolbarRefs.helpControls = value;
    },
    getHelpButton: () => toolbarRefs.helpButton,
    setHelpButton: (value) => {
      toolbarRefs.helpButton = value;
    },
    getHelpPanel: () => toolbarRefs.helpPanel,
    setHelpPanel: (value) => {
      toolbarRefs.helpPanel = value;
    },
    getAutosaveToggle: () => settingsRefs.autosaveToggle,
    getClearModal: () => settingsRefs.clearModal,
    setInputRefs: ({
      autosaveToggle: nextAutosaveToggle,
      clearButton: nextClearButton,
      clearModal: nextClearModal,
      clearModalCancelButton: nextClearModalCancelButton,
      clearModalConfirmButton: nextClearModalConfirmButton,
      redoButton: nextRedoButton,
      saveButton: nextSaveButton,
      undoButton: nextUndoButton,
    }) => {
      settingsRefs.autosaveToggle = nextAutosaveToggle;
      settingsRefs.clearButton = nextClearButton;
      settingsRefs.clearModal = nextClearModal;
      settingsRefs.clearModalCancelButton = nextClearModalCancelButton;
      settingsRefs.clearModalConfirmButton = nextClearModalConfirmButton;
      settingsRefs.redoButton = nextRedoButton;
      settingsRefs.saveButton = nextSaveButton;
      settingsRefs.undoButton = nextUndoButton;
    },
    setBackupRefs: ({
      boardBackupButton: nextBoardBackupButton,
      boardImportButton: nextBoardImportButton,
      boardImportFileInput: nextBoardImportFileInput,
    }) => {
      settingsRefs.boardBackupButton = nextBoardBackupButton;
      settingsRefs.boardImportButton = nextBoardImportButton;
      settingsRefs.boardImportFileInput = nextBoardImportFileInput;
    },
    getEraserRefs: () => ({
      eraserCard: eraserRefs.eraserCard,
      eraserPanel: eraserRefs.eraserPanel,
      eraserSizeIcon: eraserRefs.eraserSizeIcon,
      eraserSizeInput: eraserRefs.eraserSizeInput,
      eraserSizeValue: eraserRefs.eraserSizeValue,
      eraserToggle: eraserRefs.eraserToggle,
    }),
    setEraserRefs: ({
      eraserCard: nextEraserCard,
      eraserPanel: nextEraserPanel,
      eraserSizeIcon: nextEraserSizeIcon,
      eraserSizeInput: nextEraserSizeInput,
      eraserSizeValue: nextEraserSizeValue,
      eraserToggle: nextEraserToggle,
    }) => {
      eraserRefs.eraserCard = nextEraserCard;
      eraserRefs.eraserPanel = nextEraserPanel;
      eraserRefs.eraserSizeIcon = nextEraserSizeIcon;
      eraserRefs.eraserSizeInput = nextEraserSizeInput;
      eraserRefs.eraserSizeValue = nextEraserSizeValue;
      eraserRefs.eraserToggle = nextEraserToggle;
    },
    getPenRefs: () => ({
      penCard: penRefs.penCard,
      penColors: penRefs.penColors,
      penOpacityIcon: penRefs.penOpacityIcon,
      penOpacityInput: penRefs.penOpacityInput,
      penOpacityValue: penRefs.penOpacityValue,
      penPanel: penRefs.penPanel,
      penSizeIcon: penRefs.penSizeIcon,
      penSizeInput: penRefs.penSizeInput,
      penSizeValue: penRefs.penSizeValue,
      penToggle: penRefs.penToggle,
    }),
    setPenRefs: ({
      penCard: nextPenCard,
      penColors: nextPenColors,
      penOpacityIcon: nextPenOpacityIcon,
      penOpacityInput: nextPenOpacityInput,
      penOpacityValue: nextPenOpacityValue,
      penPanel: nextPenPanel,
      penSizeIcon: nextPenSizeIcon,
      penSizeInput: nextPenSizeInput,
      penSizeValue: nextPenSizeValue,
      penToggle: nextPenToggle,
    }) => {
      penRefs.penCard = nextPenCard;
      penRefs.penColors = nextPenColors;
      penRefs.penOpacityIcon = nextPenOpacityIcon;
      penRefs.penOpacityInput = nextPenOpacityInput;
      penRefs.penOpacityValue = nextPenOpacityValue;
      penRefs.penPanel = nextPenPanel;
      penRefs.penSizeIcon = nextPenSizeIcon;
      penRefs.penSizeInput = nextPenSizeInput;
      penRefs.penSizeValue = nextPenSizeValue;
      penRefs.penToggle = nextPenToggle;
    },
    getItemTitle: boardItemContent.getItemTitle,
    boardItemLifecycleApi,
    boardToolbarPopupApi,
    boardUiSetupApi,
    boardShellApi,
    boardPersistenceApi,
    boardLifecycleApi,
    boardUiPreview,
    boardCursorApi,
    itemTypeColors,
    shapeToolLabels,
    shapeTools,
    shapeStrokeColorPresets,
  };
}
