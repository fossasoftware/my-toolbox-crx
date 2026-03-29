export function createBoardAppStackOptions({
  documentRef,
  windowRef,
  getText,
  showToast,
  boardHistory,
  cloneBoardState,
  runtime,
  refs,
  controllers,
  apis,
  storage,
  constants,
  normalizeState,
  makeLinkEndpoint,
}) {
  const {
    boardRuntime,
    selectionRuntime,
    dragRuntime,
    linkRuntime,
    shapeRuntime,
  } = runtime;
  const {
    canvasRefs,
    settingsRefs,
    itemRefs,
    shapeRefs,
    linkRefs,
    setupRefs,
  } = refs;
  const {
    boardItemMenuShell,
    boardItemRename,
    boardItemStyle,
    boardItemToolbarShell,
    boardLinkRender,
    boardMainToolbar,
  } = controllers;
  const {
    boardUiSetupApi,
    boardToolbarPopupApi,
    boardCursorApi,
    boardItemToolbarShellApi,
    boardItemMenuShellApi,
    boardLinkPopupApi,
    boardLinkEditorApi,
    boardShapeEditorApi,
    boardLinkInteractionApi,
    boardCanvasRenderApi,
    boardItemRenderApi,
    boardHotkeysApi,
    boardInkControlsApi,
    boardSelectionStateApi,
    boardViewportApi,
    boardShapeToolbarApi,
    boardShapeStyleApi,
    boardSelectionQueryApi,
    boardLinkRenderApi,
  } = apis;
  const {
    createBoardBackupPayload,
    downloadBoardBackupFile,
    loadStoredBoardAutosavePreference,
    loadStoredBoardState,
    loadStoredBoardViewportState,
    parseStoredBoardBackup,
    readBoardImportFile,
    saveStoredBoardAutosavePreference,
    saveStoredBoardState,
    saveStoredBoardViewportState,
  } = storage;
  const {
    historyCommitDelay,
    itemTypeColors,
    shapeFillPresets,
    shapeStrokeColorPresets,
    shapeStrokePresets,
    linkStylePresets,
    linkStyleDashed,
    linkStyleDotted,
    linkStyleDashDot,
    boardModelOptions,
    saveDelay,
    toolSelect,
    toolDraw,
    toolErase,
    toolHand,
    toolLink,
    inkTools,
    linkTypeShape,
  } = constants;

  return {
    documentRef,
    windowRef,
    getText,
    boardHistory,
    cloneBoardState,
    historyCommitDelay,
    getAutosaveEnabled: () => boardRuntime.autosaveEnabled,
    setAutosaveEnabled: (value) => {
      boardRuntime.autosaveEnabled = value;
    },
    getAutosaveToggle: () => settingsRefs.autosaveToggle,
    getBoardState: () => boardRuntime.boardState,
    setBoardState: (value) => {
      boardRuntime.boardState = value;
    },
    getCurrentTool: () => boardRuntime.currentTool,
    setCurrentTool: (value) => {
      boardRuntime.currentTool = value;
    },
    getSaveButton: () => settingsRefs.saveButton,
    getStage: () => canvasRefs.stage,
    getUndoButton: () => settingsRefs.undoButton,
    getRedoButton: () => settingsRefs.redoButton,
    getEmptyState: () => canvasRefs.emptyState,
    getHotkeysBound: () => boardRuntime.hotkeysBound,
    setHotkeysBound: (value) => {
      boardRuntime.hotkeysBound = value;
    },
    getMixedDragItemElements: () => dragRuntime.mixedDragItemElements,
    setDraggingMixed: (value) => {
      dragRuntime.draggingMixed = value;
    },
    setDraggingShape: (value) => {
      dragRuntime.draggingShape = value;
    },
    setIsMarqueeSelecting: (value) => {
      selectionRuntime.isMarqueeSelecting = value;
    },
    setMarqueeAdditive: (value) => {
      selectionRuntime.marqueeAdditive = value;
    },
    setMarqueeBaseItemSelection: (value) => {
      selectionRuntime.marqueeBaseItemSelection = value;
    },
    setMarqueeBaseSelection: (value) => {
      selectionRuntime.marqueeBaseSelection = value;
    },
    setMarqueeRect: (value) => {
      selectionRuntime.marqueeRect = value;
    },
    setMarqueeStart: (value) => {
      selectionRuntime.marqueeStart = value;
    },
    setMixedDragItemElements: (value) => {
      dragRuntime.mixedDragItemElements = value;
    },
    setMixedDragItemSnapshot: (value) => {
      dragRuntime.mixedDragItemSnapshot = value;
    },
    setMixedDragShapeSnapshot: (value) => {
      dragRuntime.mixedDragShapeSnapshot = value;
    },
    setMixedDragStart: (value) => {
      dragRuntime.mixedDragStart = value;
    },
    setMixedDragUsesWindow: (value) => {
      dragRuntime.mixedDragUsesWindow = value;
    },
    setResizingShape: (value) => {
      dragRuntime.resizingShape = value;
    },
    setSelectedItemIds: (value) => {
      selectionRuntime.selectedItemIds = value;
    },
    setSelectedLinkId: (value) => {
      linkRuntime.selectedLinkId = value;
    },
    setSelectedShapeIds: (value) => {
      selectionRuntime.selectedShapeIds = value;
    },
    setShapeDragSnapshot: (value) => {
      dragRuntime.shapeDragSnapshot = value;
    },
    setShapeDragStart: (value) => {
      dragRuntime.shapeDragStart = value;
    },
    setShapeResizeHandle: (value) => {
      dragRuntime.shapeResizeHandle = value;
    },
    setShapeResizeHover: (value) => {
      dragRuntime.shapeResizeHover = value;
    },
    setShapeResizeId: (value) => {
      dragRuntime.shapeResizeId = value;
    },
    setShapeResizeSnapshot: (value) => {
      dragRuntime.shapeResizeSnapshot = value;
    },
    setShapeSelectionFromShift: (value) => {
      selectionRuntime.shapeSelectionFromShift = value;
    },
    setShapeToolbarPinned: (value) => {
      shapeRuntime.shapeToolbarPinned = value;
    },
    itemTypeColors,
    shapeFillPresets,
    shapeStrokeColorPresets,
    shapeStrokePresets,
    linkStylePresets,
    linkStyleDashed,
    linkStyleDotted,
    linkStyleDashDot,
    setItemMenuRefs: ({ itemMenu: nextItemMenu, itemControls: nextItemControls }) => {
      itemRefs.itemMenu = nextItemMenu;
      itemRefs.itemControls = nextItemControls;
    },
    setItemMenuButtonRefs: ({
      itemMenuColorButtons: nextItemMenuColorButtons,
      itemMenuTextColorButtons: nextItemMenuTextColorButtons,
      itemMenuTextSizeButtons: nextItemMenuTextSizeButtons,
    }) => {
      itemRefs.itemMenuColorButtons = nextItemMenuColorButtons;
      itemRefs.itemMenuTextColorButtons = nextItemMenuTextColorButtons;
      itemRefs.itemMenuTextSizeButtons = nextItemMenuTextSizeButtons;
    },
    setupItemMenuDeps: {
      getMenuItem: boardItemMenuShell.getMenuItem,
      applyItemColorChoice: boardItemStyle.applyItemColorChoice,
      applyItemTextColorChoice: boardItemStyle.applyItemTextColorChoice,
      applyItemTextSizeChoice: boardItemStyle.applyItemTextSizeChoice,
      closeItemMenu: boardItemMenuShell.closeItemMenu,
      startItemRename: (item) => boardItemRename.startItemRename(item),
      closeItemToolbarMenus: boardItemToolbarShell.closeItemToolbarMenus,
    },
    setShapeRefs: ({
      shapeControls: nextShapeControls,
      shapeCard: nextShapeCard,
      shapePalette: nextShapePalette,
      shapeToolbar: nextShapeToolbar,
      shapeFillButton: nextShapeFillButton,
      shapeFillMenu: nextShapeFillMenu,
      shapeStrokeButton: nextShapeStrokeButton,
      shapeStrokeMenu: nextShapeStrokeMenu,
      shapeStrokeWidthButton: nextShapeStrokeWidthButton,
      shapeStrokeWidthMenu: nextShapeStrokeWidthMenu,
      shapeLinkButton: nextShapeLinkButton,
      shapeTextButton: nextShapeTextButton,
      shapeDeleteButton: nextShapeDeleteButton,
      shapeEditor: nextShapeEditor,
    }) => {
      shapeRefs.shapeControls = nextShapeControls;
      shapeRefs.shapeCard = nextShapeCard;
      shapeRefs.shapePalette = nextShapePalette;
      shapeRefs.shapeToolbar = nextShapeToolbar;
      shapeRefs.shapeFillButton = nextShapeFillButton;
      shapeRefs.shapeFillMenu = nextShapeFillMenu;
      shapeRefs.shapeStrokeButton = nextShapeStrokeButton;
      shapeRefs.shapeStrokeMenu = nextShapeStrokeMenu;
      shapeRefs.shapeStrokeWidthButton = nextShapeStrokeWidthButton;
      shapeRefs.shapeStrokeWidthMenu = nextShapeStrokeWidthMenu;
      shapeRefs.shapeLinkButton = nextShapeLinkButton;
      shapeRefs.shapeTextButton = nextShapeTextButton;
      shapeRefs.shapeDeleteButton = nextShapeDeleteButton;
      shapeRefs.shapeEditor = nextShapeEditor;
    },
    setShapeToolbarSetup: (value) => {
      setupRefs.shapeToolbarSetup = value;
    },
    setupShapeToolbarDeps: {
      applyShapeFillChoice: boardShapeStyleApi.applyShapeFillChoice,
      applyShapeStrokeColorChoice: boardShapeStyleApi.applyShapeStrokeColorChoice,
      applyShapeStrokeWidthChoice: boardShapeStyleApi.applyShapeStrokeWidthChoice,
      getSingleSelectedShape: boardSelectionQueryApi.getSingleSelectedShape,
      startShapeTextEditing: boardShapeEditorApi.startShapeTextEditing,
      startLinkFromToolbar: boardLinkInteractionApi.startLinkFromToolbar,
      makeLinkEndpoint,
      linkTypeShape,
      deleteSelectedShape: boardSelectionStateApi.deleteSelectedShape,
      commitShapeTextEditing: boardShapeEditorApi.commitShapeTextEditing,
      updateShapeTextFromEditor: boardShapeEditorApi.updateShapeTextFromEditor,
      cancelShapeTextEditing: boardShapeEditorApi.cancelShapeTextEditing,
      scheduleShapeToolbarUpdate: boardShapeToolbarApi.scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition:
        boardShapeToolbarApi.syncShapeToolbarDuringTransition,
    },
    setLinkRefs: ({
      linkControls: nextLinkControls,
      linkColorButton: nextLinkColorButton,
      linkColorMenu: nextLinkColorMenu,
      linkStyleButton: nextLinkStyleButton,
      linkStyleMenu: nextLinkStyleMenu,
      linkDeleteButton: nextLinkDeleteButton,
      linkEditor: nextLinkEditor,
    }) => {
      linkRefs.linkControls = nextLinkControls;
      linkRefs.linkColorButton = nextLinkColorButton;
      linkRefs.linkColorMenu = nextLinkColorMenu;
      linkRefs.linkStyleButton = nextLinkStyleButton;
      linkRefs.linkStyleMenu = nextLinkStyleMenu;
      linkRefs.linkDeleteButton = nextLinkDeleteButton;
      linkRefs.linkEditor = nextLinkEditor;
    },
    setLinkControlsSetup: (value) => {
      setupRefs.linkControlsSetup = value;
    },
    setLinkOptionRefs: ({
      linkColorOptions: nextLinkColorOptions,
      linkStyleOptions: nextLinkStyleOptions,
    }) => {
      linkRefs.linkColorOptions = nextLinkColorOptions;
      linkRefs.linkStyleOptions = nextLinkStyleOptions;
    },
    setupLinkControlsDeps: {
      getSelectedLinkId: () => linkRuntime.selectedLinkId,
      getSelectedLink: (...args) => boardLinkRender.getSelectedLink(...args),
      applyLinkColorChoice: boardLinkRenderApi.applyLinkColorChoice,
      applyLinkStyleChoice: boardLinkRenderApi.applyLinkStyleChoice,
      clearLinkPopup: boardLinkPopupApi.clearLinkPopup,
      startLinkTextEditing: boardLinkEditorApi.startLinkTextEditing,
      removeLink: boardLinkRenderApi.removeLink,
      commitLinkTextEditing: boardLinkEditorApi.commitLinkTextEditing,
      updateLinkTextFromEditor: boardLinkEditorApi.updateLinkTextFromEditor,
      cancelLinkTextEditing: boardLinkEditorApi.cancelLinkTextEditing,
      updateLinkControlsPosition: boardLinkPopupApi.updateLinkControlsPosition,
      syncLinkControlsDuringTransition:
        boardLinkPopupApi.syncLinkControlsDuringTransition,
    },
    boardModelOptions,
    createBoardBackupPayload,
    downloadBoardBackupFile,
    loadStoredBoardAutosavePreference,
    loadStoredBoardState,
    loadStoredBoardViewportState,
    parseStoredBoardBackup,
    readBoardImportFile,
    saveDelay,
    saveStoredBoardAutosavePreference,
    saveStoredBoardState,
    saveStoredBoardViewportState,
    showToast,
    boardUiSetupApi,
    boardToolbarPopupApi,
    boardCursorApi,
    boardItemToolbarShellApi,
    boardItemMenuShellApi,
    boardLinkPopupApi,
    boardLinkEditorApi,
    boardShapeEditorApi,
    boardLinkInteractionApi,
    boardCanvasRenderApi,
    boardItemRenderApi,
    boardHotkeysApi,
    boardInkControlsApi,
    boardSelectionStateApi,
    boardViewportApi,
    boardShapeToolbarApi,
    updateShapeMenuActive: boardMainToolbar.updateShapeMenuActive,
    normalizeState,
    toolSelect,
    toolDraw,
    toolErase,
    toolHand,
    toolLink,
    inkTools,
  };
}

export function createBoardShapeStackOptions({
  refs,
  runtime,
  apis,
  boardUiPreview,
  constants,
  helpers,
}) {
  const { canvasRefs, toolbarRefs, shapeRefs } = refs;
  const {
    boardRuntime,
    selectionRuntime,
    dragRuntime,
    linkRuntime,
    shapeRuntime,
  } = runtime;
  const {
    boardViewportApi,
    boardSelectionQueryApi,
    boardSelectionVisualApi,
    boardCanvasQueryApi,
    boardCanvasRenderApi,
    boardShellApi,
    boardPersistenceApi,
    boardLinkRenderApi,
    boardInkControlsApi,
    boardCursorApi,
    boardLinkInteractionApi,
    boardShapeToolbarSetupApi,
  } = apis;
  const {
    getShapeBounds,
    getConstrainedPoint,
    pointToSegmentDistance,
    getLinkType,
  } = helpers;
  const {
    defaultStrokeColor,
    shapeResizeHandleHitRadius,
    shapeResizeHandleRadius,
    linkTypeShape,
    toolLine,
    toolSelect,
  } = constants;

  return {
    getCtx: () => canvasRefs.ctx,
    getBoardSettings: () => boardRuntime.boardState.settings,
    getCurrentTool: () => boardRuntime.currentTool,
    getBoardZoom: boardViewportApi.getBoardZoom,
    getViewPan: boardViewportApi.getViewPan,
    getBoardLinks: () => boardRuntime.boardState.links,
    setBoardLinks: (value) => {
      boardRuntime.boardState.links = value;
    },
    getBoardStrokes: () => boardRuntime.boardState.strokes,
    setBoardStrokes: (value) => {
      boardRuntime.boardState.strokes = value;
    },
    getDraggingMixed: () => dragRuntime.draggingMixed,
    getDraggingShape: () => dragRuntime.draggingShape,
    setDraggingShape: (value) => {
      dragRuntime.draggingShape = value;
    },
    getIsMarqueeSelecting: () => selectionRuntime.isMarqueeSelecting,
    getResizingShape: () => dragRuntime.resizingShape,
    setResizingShape: (value) => {
      dragRuntime.resizingShape = value;
    },
    getSelectedItemIds: () => selectionRuntime.selectedItemIds,
    getSelectedShapeIds: () => selectionRuntime.selectedShapeIds,
    getLinkSource: () => linkRuntime.linkSource,
    getShapeEditingId: () => shapeRuntime.shapeEditingId,
    setShapeEditingId: (value) => {
      shapeRuntime.shapeEditingId = value;
    },
    getShapeResizeHandle: () => dragRuntime.shapeResizeHandle,
    setShapeResizeHandle: (value) => {
      dragRuntime.shapeResizeHandle = value;
    },
    getShapeResizeHover: () => dragRuntime.shapeResizeHover,
    setShapeResizeHover: (value) => {
      dragRuntime.shapeResizeHover = value;
    },
    getShapeResizeId: () => dragRuntime.shapeResizeId,
    setShapeResizeId: (value) => {
      dragRuntime.shapeResizeId = value;
    },
    getShapeResizeSnapshot: () => dragRuntime.shapeResizeSnapshot,
    setShapeResizeSnapshot: (value) => {
      dragRuntime.shapeResizeSnapshot = value;
    },
    setShapeDragStart: (value) => {
      dragRuntime.shapeDragStart = value;
    },
    setShapeDragSnapshot: (value) => {
      dragRuntime.shapeDragSnapshot = value;
    },
    getShapeToolbarPinned: () => shapeRuntime.shapeToolbarPinned,
    getTransitionUntil: () => shapeRuntime.shapeToolbarTransitionUntil,
    setTransitionUntil: (value) => {
      shapeRuntime.shapeToolbarTransitionUntil = value;
    },
    getScheduleRafId: () => shapeRuntime.shapeToolbarRaf,
    setScheduleRafId: (value) => {
      shapeRuntime.shapeToolbarRaf = value;
    },
    getTransitionRafId: () => shapeRuntime.shapeToolbarTransitionRaf,
    setTransitionRafId: (value) => {
      shapeRuntime.shapeToolbarTransitionRaf = value;
    },
    getShapeRefs: () => ({
      boardToolbarDock: toolbarRefs.boardToolbarDock,
      shapeCard: shapeRefs.shapeCard,
      shapeControls: shapeRefs.shapeControls,
      shapeDeleteButton: shapeRefs.shapeDeleteButton,
      shapeEditor: shapeRefs.shapeEditor,
      shapeFillButton: shapeRefs.shapeFillButton,
      shapeFillMenu: shapeRefs.shapeFillMenu,
      shapeLinkButton: shapeRefs.shapeLinkButton,
      shapeStrokeButton: shapeRefs.shapeStrokeButton,
      shapeStrokeMenu: shapeRefs.shapeStrokeMenu,
      shapeStrokeWidthButton: shapeRefs.shapeStrokeWidthButton,
      shapeStrokeWidthMenu: shapeRefs.shapeStrokeWidthMenu,
      shapeTextButton: shapeRefs.shapeTextButton,
      shapeToolbar: shapeRefs.shapeToolbar,
      stage: canvasRefs.stage,
      zoomControls: canvasRefs.zoomControls,
    }),
    getSelectedShapeTargets: boardSelectionQueryApi.getSelectedShapeTargets,
    getShapeSelectionBoundsForToolbar:
      boardSelectionQueryApi.getShapeSelectionBoundsForToolbar,
    getSingleSelectedShape: boardSelectionQueryApi.getSingleSelectedShape,
    getShapeById: boardSelectionQueryApi.getShapeById,
    getSelectionBounds: boardSelectionVisualApi.getSelectionBounds,
    getSelectionColor: boardSelectionVisualApi.getSelectionColor,
    getShapeHitPadding: boardCanvasQueryApi.getShapeHitPadding,
    getDefaultShapeSize: () => boardRuntime.boardState.settings.size,
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
  };
}

export function createBoardLinkStackOptions({
  documentRef,
  createId,
  runtime,
  refs,
  collections,
  apis,
  boardUiPreview,
  helpers,
  constants,
  getBoardSelectionOverlay,
}) {
  const { boardRuntime, selectionRuntime, linkRuntime } = runtime;
  const { canvasRefs, linkRefs } = refs;
  const { itemElements } = collections;
  const {
    boardViewportApi,
    boardCanvasQueryApi,
    boardCanvasRenderApi,
    boardPersistenceApi,
    boardShellApi,
    boardLinkPopupApi,
    boardLinkControlsSetupApi,
    boardShapeRendererApi,
    boardSelectionStateApi,
  } = apis;
  const {
    getEndpointDataFromEndpoint,
    getLinkEndpointData,
    resolveLinkAnchorPoint,
    resolveLinkGapForEndpoint,
    offsetLinkPoint,
    getLinkEditorLayout,
    isSameLinkEndpoint,
    isLinkBetweenEndpoints,
    makeLinkEndpoint,
  } = helpers;
  const {
    linkDoubleClickDelay,
    linkGap,
    linkStyleDashDot,
    linkStyleDashed,
    linkStyleDotted,
    linkStyleSolid,
    linkTypeItem,
    linkTypeShape,
    selectionDash,
    selectionRadius,
    toolLink,
    toolSelect,
  } = constants;

  return {
    documentRef,
    getCtx: () => canvasRefs.ctx,
    getBoardItems: () => boardRuntime.boardState.items,
    getBoardLinks: () => boardRuntime.boardState.links,
    setBoardLinks: (value) => {
      boardRuntime.boardState.links = value;
    },
    getBoardSettings: () => boardRuntime.boardState.settings,
    getBoardStrokes: () => boardRuntime.boardState.strokes,
    getCurrentTool: () => boardRuntime.currentTool,
    getItemElements: () => itemElements,
    getItemSelectionLayer: () => canvasRefs.itemSelectionLayer,
    getStage: () => canvasRefs.stage,
    getViewPan: boardViewportApi.getViewPan,
    getZoom: boardViewportApi.getBoardZoom,
    getLinksSvg: () => canvasRefs.linksSvg,
    getSelectedLinkId: () => linkRuntime.selectedLinkId,
    setSelectedLinkId: (value) => {
      linkRuntime.selectedLinkId = value;
    },
    getSelectedItemIds: () => selectionRuntime.selectedItemIds,
    clearSelectedItemIds: () => {
      selectionRuntime.selectedItemIds.clear();
    },
    getSelectedShapeIds: () => selectionRuntime.selectedShapeIds,
    resetSelectedShapeIds: () => {
      selectionRuntime.selectedShapeIds = new Set();
    },
    setShapeSelectionFromShift: (value) => {
      selectionRuntime.shapeSelectionFromShift = value;
    },
    getLinkEditingId: () => linkRuntime.linkEditingId,
    setLinkEditingId: (value) => {
      linkRuntime.linkEditingId = value;
    },
    getLinkEditor: () => linkRefs.linkEditor,
    getLinkControls: () => linkRefs.linkControls,
    getLinkColorOptions: () => linkRefs.linkColorOptions,
    getLinkStyleOptions: () => linkRefs.linkStyleOptions,
    getLinkPreviewLine: () => linkRuntime.linkPreviewLine,
    setLinkPreviewLine: (value) => {
      linkRuntime.linkPreviewLine = value;
    },
    getLinkPreviewPoint: () => linkRuntime.linkPreviewPoint,
    setLinkPreviewPoint: (value) => {
      linkRuntime.linkPreviewPoint = value;
    },
    getLinkSource: () => linkRuntime.linkSource,
    setLinkSource: (value) => {
      linkRuntime.linkSource = value;
    },
    getLinkHoverTarget: () => linkRuntime.linkHoverTarget,
    setLinkHoverTarget: (value) => {
      linkRuntime.linkHoverTarget = value;
    },
    getLinkDragActive: () => linkRuntime.linkDragActive,
    setLinkDragActive: (value) => {
      linkRuntime.linkDragActive = value;
    },
    getLinkUpdateRaf: () => linkRuntime.linkUpdateRaf,
    setLinkUpdateRaf: (value) => {
      linkRuntime.linkUpdateRaf = value;
    },
    getLastLinkClickId: () => linkRuntime.lastLinkClickId,
    setLastLinkClickId: (value) => {
      linkRuntime.lastLinkClickId = value;
    },
    getLastLinkClickTime: () => linkRuntime.lastLinkClickTime,
    setLastLinkClickTime: (value) => {
      linkRuntime.lastLinkClickTime = value;
    },
    getLinkControlsRefs: () => ({
      linkColorButton: linkRefs.linkColorButton,
      linkColorMenu: linkRefs.linkColorMenu,
      linkStyleButton: linkRefs.linkStyleButton,
    }),
    createLinkId: () => createId("link"),
    getWorldPointFromClient: boardViewportApi.getWorldPointFromClient,
    findLinkableShapeAtPoint: boardCanvasQueryApi.findLinkableShapeAtPoint,
    boardCanvasRenderApi,
    boardPersistenceApi,
    boardShellApi,
    boardLinkPopupApi,
    boardLinkControlsSetupApi,
    boardUiPreview,
    boardShapeRendererApi,
    boardCanvasQueryApi,
    drawSelectionOutline: (bounds, options) =>
      getBoardSelectionOverlay().drawSelectionOutline(bounds, options),
    updateItemSelectionStyles: boardSelectionStateApi.updateItemSelectionStyles,
    getEndpointDataFromEndpoint,
    getLinkEndpointData,
    getLinkAnchorPoint: (endpoint, targetPoint) =>
      resolveLinkAnchorPoint(endpoint, targetPoint, {
        defaultStrokeSize: boardRuntime.boardState.settings.size || 4,
      }),
    getLinkGapForEndpoint: (endpoint) =>
      resolveLinkGapForEndpoint(endpoint, {
        defaultGap: linkGap,
        defaultStrokeSize: boardRuntime.boardState.settings.size || 4,
      }),
    getOffsetLinkPoint: () => offsetLinkPoint,
    getLinkEditorLayout,
    isSameLinkEndpoint,
    isLinkBetweenEndpoints,
    makeLinkEndpoint,
    linkDoubleClickDelay,
    linkGap,
    linkStyleDashDot,
    linkStyleDashed,
    linkStyleDotted,
    linkStyleSolid,
    linkTypeItem,
    linkTypeShape,
    selectionDash,
    selectionRadius,
    toolLink,
    toolSelect,
  };
}

export function createBoardSelectionStackOptions({
  documentRef,
  runtime,
  refs,
  collections,
  apis,
  helpers,
  constants,
}) {
  const {
    boardRuntime,
    selectionRuntime,
    dragRuntime,
    itemRuntime,
    linkRuntime,
    shapeRuntime,
  } = runtime;
  const { canvasRefs } = refs;
  const { itemElements, itemSelectionElements } = collections;
  const {
    boardViewportApi,
    boardSelectionQueryApi,
    boardCanvasQueryApi,
    boardShellApi,
    boardPersistenceApi,
    boardCanvasRenderApi,
    boardItemRenderApi,
    boardLinkRenderApi,
    boardLifecycleApi,
    boardItemInteractionApi,
    boardItemMenuShellApi,
    boardShapeEditorApi,
    boardLinkInteractionApi,
    boardShapeResizeApi,
    boardSelectionVisualApi,
  } = apis;
  const { getSelectionRect, getLinkType } = helpers;
  const {
    itemSelectionOutset,
    linkTypeItem,
    linkTypeShape,
    selectionDash,
    selectionRadius,
    toolSelect,
  } = constants;

  return {
    documentRef,
    getBoardItems: () => boardRuntime.boardState.items,
    setBoardItems: (value) => {
      boardRuntime.boardState.items = value;
    },
    getBoardLinks: () => boardRuntime.boardState.links,
    setBoardLinks: (value) => {
      boardRuntime.boardState.links = value;
    },
    getBoardStrokes: () => boardRuntime.boardState.strokes,
    setBoardStrokes: (value) => {
      boardRuntime.boardState.strokes = value;
    },
    getSelectedItemIds: () => selectionRuntime.selectedItemIds,
    setSelectedItemIds: (value) => {
      selectionRuntime.selectedItemIds = value;
    },
    getSelectedShapeIds: () => selectionRuntime.selectedShapeIds,
    setSelectedShapeIds: (value) => {
      selectionRuntime.selectedShapeIds = value;
    },
    getItemElements: () => itemElements,
    getItemSelectionElements: () => itemSelectionElements,
    getItemSelectionLayer: () => canvasRefs.itemSelectionLayer,
    getItemMenuTargetId: () => itemRuntime.itemMenuTargetId,
    getLinkSource: () => linkRuntime.linkSource,
    getDraggingMixed: () => dragRuntime.draggingMixed,
    setDraggingMixed: (value) => {
      dragRuntime.draggingMixed = value;
    },
    getDraggingShape: () => dragRuntime.draggingShape,
    setDraggingShape: (value) => {
      dragRuntime.draggingShape = value;
    },
    getIsMarqueeSelecting: () => selectionRuntime.isMarqueeSelecting,
    setIsMarqueeSelecting: (value) => {
      selectionRuntime.isMarqueeSelecting = value;
    },
    getMarqueeAdditive: () => selectionRuntime.marqueeAdditive,
    setMarqueeAdditive: (value) => {
      selectionRuntime.marqueeAdditive = value;
    },
    getMarqueeBaseItemSelection: () => selectionRuntime.marqueeBaseItemSelection,
    setMarqueeBaseItemSelection: (value) => {
      selectionRuntime.marqueeBaseItemSelection = value;
    },
    getMarqueeBaseSelection: () => selectionRuntime.marqueeBaseSelection,
    setMarqueeBaseSelection: (value) => {
      selectionRuntime.marqueeBaseSelection = value;
    },
    getMarqueeRect: () => selectionRuntime.marqueeRect,
    setMarqueeRect: (value) => {
      selectionRuntime.marqueeRect = value;
    },
    getMarqueeStart: () => selectionRuntime.marqueeStart,
    setMarqueeStart: (value) => {
      selectionRuntime.marqueeStart = value;
    },
    getMixedDragItemElements: () => dragRuntime.mixedDragItemElements,
    setMixedDragItemElements: (value) => {
      dragRuntime.mixedDragItemElements = value;
    },
    getMixedDragItemSnapshot: () => dragRuntime.mixedDragItemSnapshot,
    setMixedDragItemSnapshot: (value) => {
      dragRuntime.mixedDragItemSnapshot = value;
    },
    getMixedDragShapeSnapshot: () => dragRuntime.mixedDragShapeSnapshot,
    setMixedDragShapeSnapshot: (value) => {
      dragRuntime.mixedDragShapeSnapshot = value;
    },
    getMixedDragStart: () => dragRuntime.mixedDragStart,
    setMixedDragStart: (value) => {
      dragRuntime.mixedDragStart = value;
    },
    setMixedDragUsesWindow: (value) => {
      dragRuntime.mixedDragUsesWindow = value;
    },
    getResizingShape: () => dragRuntime.resizingShape,
    setResizingShape: (value) => {
      dragRuntime.resizingShape = value;
    },
    getShapeEditingId: () => shapeRuntime.shapeEditingId,
    getShapeSelectionFromShift: () => selectionRuntime.shapeSelectionFromShift,
    setShapeSelectionFromShift: (value) => {
      selectionRuntime.shapeSelectionFromShift = value;
    },
    getShapeToolbarPinned: () => shapeRuntime.shapeToolbarPinned,
    setShapeToolbarPinned: (value) => {
      shapeRuntime.shapeToolbarPinned = value;
    },
    getShapeDragSnapshot: () => dragRuntime.shapeDragSnapshot,
    setShapeDragSnapshot: (value) => {
      dragRuntime.shapeDragSnapshot = value;
    },
    getShapeDragStart: () => dragRuntime.shapeDragStart,
    setShapeDragStart: (value) => {
      dragRuntime.shapeDragStart = value;
    },
    setShapeResizeHandle: (value) => {
      dragRuntime.shapeResizeHandle = value;
    },
    setShapeResizeHover: (value) => {
      dragRuntime.shapeResizeHover = value;
    },
    setShapeResizeId: (value) => {
      dragRuntime.shapeResizeId = value;
    },
    setShapeResizeSnapshot: (value) => {
      dragRuntime.shapeResizeSnapshot = value;
    },
    getCurrentTool: () => boardRuntime.currentTool,
    getCtx: () => canvasRefs.ctx,
    getBoardZoom: boardViewportApi.getBoardZoom,
    getLinkHoverTarget: () => linkRuntime.linkHoverTarget,
    getShapeById: boardSelectionQueryApi.getShapeById,
    getSelectionRect,
    getLinkType,
    getShapeHitPadding: boardCanvasQueryApi.getShapeHitPadding,
    isSelectableStroke: boardCanvasQueryApi.isSelectableStroke,
    boardShellApi,
    boardPersistenceApi,
    boardCanvasRenderApi,
    boardItemRenderApi,
    boardLinkRenderApi,
    boardLifecycleApi,
    boardItemInteractionApi,
    boardItemMenuShellApi,
    boardShapeEditorApi,
    boardLinkInteractionApi,
    boardShapeResizeApi,
    boardSelectionVisualApi,
    itemSelectionOutset,
    linkTypeItem,
    linkTypeShape,
    selectionDash,
    selectionRadius,
    toolSelect,
  };
}
