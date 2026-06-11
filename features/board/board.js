import { getText } from "../../core/i18n.js";
import { showToast } from "../../core/options-ui.js";
import { initBoardTooltip } from "./board-tooltip.js";
import {
  cloneBoardState,
  createBoardId as createId,
  makeDefaultBoardState as makeDefaultState,
  normalizeBoardState,
} from "./board-model.js";
import {
  BOARD_MODEL_OPTIONS,
  HISTORY_COMMIT_DELAY,
  HISTORY_LIMIT,
  INK_TOOLS,
  ITEM_DEFAULTS,
  ITEM_MENU_OFFSET,
  ITEM_OFFSET_LIMIT,
  ITEM_OFFSET_STEP,
  ITEM_SELECTION_OUTSET,
  ITEM_TYPE_COLORS,
  LINK_DOUBLE_CLICK_DELAY,
  LINK_GAP,
  LINK_STYLE_DASH_DOT,
  LINK_STYLE_DASHED,
  LINK_STYLE_DOTTED,
  LINK_STYLE_PRESETS,
  LINK_STYLE_SOLID,
  LINK_TYPE_ITEM,
  LINK_TYPE_SHAPE,
  SAVE_DELAY,
  SELECTION_DASH,
  SELECTION_RADIUS,
  SHAPE_FILL_PRESETS,
  SHAPE_RESIZE_HANDLE_HIT_RADIUS,
  SHAPE_RESIZE_HANDLE_RADIUS,
  SHAPE_STROKE_COLOR_PRESETS,
  SHAPE_STROKE_PRESETS,
  SHAPE_TOOL_LABELS,
  SHAPE_TOOLS,
  TEXT_COLOR_PRESETS,
  TEXT_SIZE_PRESETS,
  TOOL_DIAMOND,
  TOOL_DRAW,
  TOOL_ELLIPSE,
  TOOL_ERASE,
  TOOL_HAND,
  TOOL_HEART,
  TOOL_HEXAGON,
  TOOL_LINE,
  TOOL_LINK,
  TOOL_PARALLELOGRAM,
  TOOL_RECT,
  TOOL_ROUND_RECT,
  TOOL_SELECT,
  TOOL_STAR,
  TOOL_TRAPEZOID,
  TOOL_TRIANGLE,
  ZOOM_STEP,
} from "./board-config.js";
import {
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
} from "./board-storage.js";
import { createBoardHistoryManager } from "./board-history.js";
import {
  clamp,
  getConstrainedPoint,
  getHexagonVertices,
  getParallelogramVertices,
  getRoundedRectRadius,
  getSelectionRect,
  getShapeBounds,
  getStarVertices,
  getTrapezoidVertices,
  pointToSegmentDistance,
} from "./board-geometry.js";
import {
  getLinkAnchorPoint as resolveLinkAnchorPoint,
  getLinkGapForEndpoint as resolveLinkGapForEndpoint,
  offsetLinkPoint,
} from "./board-link-geometry.js";
import {
  getEndpointDataFromEndpoint,
  getLinkEndpointData,
  getLinkType,
  isLinkBetweenEndpoints,
  isSameLinkEndpoint,
  linkHasEndpoint,
  makeLinkEndpoint,
} from "./board-link-endpoints.js";
import { getPointOverlayPosition } from "./board-ui-positioning.js";
import { createBoardApiOptions } from "./board-api-options.js";
import { createBoardApis } from "./board-apis.js";
import { createBoardAppStack } from "./board-app-stack.js";
import { createBoardLinkStack } from "./board-link-stack.js";
import { getLinkEditorLayout } from "./board-link-text.js";
import { setStrokeWidthPreview as setShapeStrokeWidthPreview } from "./board-shape-toolbar-setup.js";
import { createBoardShapeStack } from "./board-shape-stack.js";
import { createBoardUiPreviewController } from "./board-ui-preview-controller.js";
import { createBoardCanvasCoreStack } from "./board-canvas-core-stack.js";
import { createBoardCanvasInteractionStack } from "./board-canvas-interaction-stack.js";
import { createBoardFeatureRefs } from "./board-feature-refs.js";
import { createBoardItemStack } from "./board-item-stack.js";
import { createBoardRuntimeState } from "./board-runtime-state.js";
import { createBoardShellRefs } from "./board-shell-refs.js";
import {
  createBoardCanvasCoreStackOptions,
  createBoardCanvasInteractionStackOptions,
  createBoardItemStackOptions,
  createBoardUiControlsStackOptions,
} from "./board-shell-stack-options.js";
import {
  createBoardAppStackOptions,
  createBoardLinkStackOptions,
  createBoardSelectionStackOptions,
  createBoardShapeStackOptions,
} from "./board-stack-options.js";
import { createBoardSelectionStack } from "./board-selection-stack.js";
import { createBoardUiControlsStack } from "./board-ui-controls-stack.js";

const {
  canvasRefs,
  toolbarRefs,
  settingsRefs,
} = createBoardShellRefs();
const {
  itemRefs,
  penRefs,
  eraserRefs,
  shapeRefs,
  linkRefs,
  setupRefs,
} = createBoardFeatureRefs();
const {
  boardRuntime,
  drawingRuntime,
  selectionRuntime,
  dragRuntime,
  itemRuntime,
  linkRuntime,
  shapeRuntime,
} = createBoardRuntimeState({
  makeDefaultState,
  toolSelect: TOOL_SELECT,
});

const itemElements = new Map();
const itemSelectionElements = new Map();
const itemToolbars = new Map();
const boardControllers = {};
const boardHistory = createBoardHistoryManager({ historyLimit: HISTORY_LIMIT });
const {
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
} = createBoardApis(
  createBoardApiOptions({
    controllerRefs: boardControllers,
    linkRefs,
    setupRefs,
  }),
);
const boardUiPreview = createBoardUiPreviewController({
  getEraserRefs: () => ({
    eraserSizeIcon: eraserRefs.eraserSizeIcon,
    eraserSizeInput: eraserRefs.eraserSizeInput,
  }),
  getPenRefs: () => ({
    penOpacityIcon: penRefs.penOpacityIcon,
    penOpacityInput: penRefs.penOpacityInput,
    penOpacityValue: penRefs.penOpacityValue,
    penSizeIcon: penRefs.penSizeIcon,
    penSizeInput: penRefs.penSizeInput,
    penSizeValue: penRefs.penSizeValue,
  }),
  getShapeStrokeWidthButton: () => shapeRefs.shapeStrokeWidthButton,
  setShapeStrokeWidthPreview,
});
const {
  boardItemContent,
  boardItemInteraction,
  boardItemLifecycle,
  boardItemMenuShell,
  boardItemRename,
  boardItemRenderer,
  boardItemStyle,
  boardItemToolbarShell,
} = createBoardItemStack(
  createBoardItemStackOptions({
    documentRef: document,
    windowRef: window,
    getText,
    createId,
    itemElements,
    itemToolbars,
    runtime: {
      boardRuntime,
      selectionRuntime,
      dragRuntime,
      itemRuntime,
      linkRuntime,
    },
    refs: {
      canvasRefs,
      itemRefs,
    },
    apis: {
      boardShellApi,
      boardPersistenceApi,
      boardViewportApi,
      boardSelectionStateApi,
      boardLinkInteractionApi,
      boardLinkHighlightApi,
      boardLinkRenderApi,
      boardCanvasRenderApi,
      boardLifecycleApi,
    },
    boardUiPreview,
    constants: {
      itemDefaults: ITEM_DEFAULTS,
      itemMenuOffset: ITEM_MENU_OFFSET,
      itemOffsetLimit: ITEM_OFFSET_LIMIT,
      itemOffsetStep: ITEM_OFFSET_STEP,
      itemTypeColors: ITEM_TYPE_COLORS,
      textColorPresets: TEXT_COLOR_PRESETS,
      textSizePresets: TEXT_SIZE_PRESETS,
      linkTypeItem: LINK_TYPE_ITEM,
      toolSelect: TOOL_SELECT,
    },
    helpers: {
      linkHasEndpoint,
      makeLinkEndpoint,
    },
  }),
);
Object.assign(boardControllers, {
  boardItemInteraction,
  boardItemLifecycle,
  boardItemMenuShell,
  boardItemRenderer,
  boardItemStyle,
  boardItemToolbarShell,
});
const {
  boardCanvasQuery,
  boardCanvasRender,
  boardCursor,
  boardViewport,
} = createBoardCanvasCoreStack(
  createBoardCanvasCoreStackOptions({
    windowRef: window,
    getText,
    runtime: {
      boardRuntime,
      drawingRuntime,
      dragRuntime,
      linkRuntime,
    },
    refs: {
      canvasRefs,
    },
    apis: {
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
    },
    constants: {
      linkGap: LINK_GAP,
      toolDraw: TOOL_DRAW,
      toolErase: TOOL_ERASE,
      toolLine: TOOL_LINE,
      toolSelect: TOOL_SELECT,
    },
  }),
);
Object.assign(boardControllers, {
  boardCanvasQuery,
  boardCanvasRender,
  boardCursor,
  boardViewport,
});
const {
  boardCanvasBootstrap,
  boardCanvasPointer,
  boardHotkeys,
} = createBoardCanvasInteractionStack(
  createBoardCanvasInteractionStackOptions({
    documentRef: document,
    windowRef: window,
    getText,
    createId,
    runtime: {
      boardRuntime,
      drawingRuntime,
      selectionRuntime,
      dragRuntime,
      linkRuntime,
      shapeRuntime,
    },
    refs: {
      canvasRefs,
      penRefs,
      eraserRefs,
    },
    boardViewport,
    apis: {
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
    },
    constants: {
      inkTools: INK_TOOLS,
      shapeTools: SHAPE_TOOLS,
      linkTypeShape: LINK_TYPE_SHAPE,
      toolDraw: TOOL_DRAW,
      toolErase: TOOL_ERASE,
      toolHand: TOOL_HAND,
      toolLine: TOOL_LINE,
      toolLink: TOOL_LINK,
      toolSelect: TOOL_SELECT,
      zoomStep: ZOOM_STEP,
    },
    helpers: {
      getConstrainedPoint,
      makeLinkEndpoint,
    },
    stageResizeObserverCtor: ResizeObserver,
  }),
);
Object.assign(boardControllers, {
  boardCanvasBootstrap,
  boardHotkeys,
});
const {
  boardHelpControlsController,
  boardInkControls,
  boardMainToolbar,
  boardSettingsControls,
  boardToolbarPopup,
} = createBoardUiControlsStack(
  createBoardUiControlsStackOptions({
    documentRef: document,
    windowRef: window,
    getText,
    runtime: {
      boardRuntime,
    },
    refs: {
      toolbarRefs,
      settingsRefs,
      penRefs,
      eraserRefs,
    },
    apis: {
      boardItemLifecycleApi,
      boardToolbarPopupApi,
      boardUiSetupApi,
      boardShellApi,
      boardPersistenceApi,
      boardLifecycleApi,
      boardCursorApi,
    },
    boardItemContent,
    boardUiPreview,
    constants: {
      itemTypeColors: ITEM_TYPE_COLORS,
      shapeToolLabels: SHAPE_TOOL_LABELS,
      shapeTools: SHAPE_TOOLS,
      shapeStrokeColorPresets: SHAPE_STROKE_COLOR_PRESETS,
    },
  }),
);
Object.assign(boardControllers, {
  boardHelpControlsController,
  boardInkControls,
  boardMainToolbar,
  boardSettingsControls,
  boardToolbarPopup,
});
const {
  boardLinkEditor,
  boardLinkHighlight,
  boardLinkInteraction,
  boardLinkPopup,
  boardLinkRender,
  boardLinkText,
  boardSelectionVisual,
} = createBoardLinkStack(
  createBoardLinkStackOptions({
    documentRef: document,
    createId,
    runtime: {
      boardRuntime,
      selectionRuntime,
      linkRuntime,
    },
    refs: {
      canvasRefs,
      linkRefs,
    },
    collections: {
      itemElements,
    },
    apis: {
      boardViewportApi,
      boardCanvasQueryApi,
      boardCanvasRenderApi,
      boardPersistenceApi,
      boardShellApi,
      boardLinkPopupApi,
      boardLinkControlsSetupApi,
      boardShapeRendererApi,
      boardSelectionStateApi,
    },
    boardUiPreview,
    helpers: {
      getEndpointDataFromEndpoint,
      getLinkEndpointData,
      resolveLinkAnchorPoint,
      resolveLinkGapForEndpoint,
      offsetLinkPoint,
      getLinkEditorLayout,
      isSameLinkEndpoint,
      isLinkBetweenEndpoints,
      makeLinkEndpoint,
    },
    constants: {
      linkDoubleClickDelay: LINK_DOUBLE_CLICK_DELAY,
      linkGap: LINK_GAP,
      linkStyleDashDot: LINK_STYLE_DASH_DOT,
      linkStyleDashed: LINK_STYLE_DASHED,
      linkStyleDotted: LINK_STYLE_DOTTED,
      linkStyleSolid: LINK_STYLE_SOLID,
      linkTypeItem: LINK_TYPE_ITEM,
      linkTypeShape: LINK_TYPE_SHAPE,
      selectionDash: SELECTION_DASH,
      selectionRadius: SELECTION_RADIUS,
      toolLink: TOOL_LINK,
      toolSelect: TOOL_SELECT,
    },
    getBoardSelectionOverlay: () => boardSelectionOverlay,
  }),
);
Object.assign(boardControllers, {
  boardLinkEditor,
  boardLinkHighlight,
  boardLinkInteraction,
  boardLinkPopup,
  boardLinkRender,
  boardLinkText,
  boardSelectionVisual,
});
const {
  boardSelectionOverlay,
  boardSelectionQuery,
  boardSelectionState,
} = createBoardSelectionStack(
  createBoardSelectionStackOptions({
    documentRef: document,
    runtime: {
      boardRuntime,
      selectionRuntime,
      dragRuntime,
      itemRuntime,
      linkRuntime,
      shapeRuntime,
    },
    refs: {
      canvasRefs,
    },
    collections: {
      itemElements,
      itemSelectionElements,
    },
    apis: {
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
    },
    helpers: {
      getSelectionRect,
      getLinkType,
    },
    constants: {
      itemSelectionOutset: ITEM_SELECTION_OUTSET,
      linkTypeItem: LINK_TYPE_ITEM,
      linkTypeShape: LINK_TYPE_SHAPE,
      selectionDash: SELECTION_DASH,
      selectionRadius: SELECTION_RADIUS,
      toolSelect: TOOL_SELECT,
    },
  }),
);
Object.assign(boardControllers, {
  boardSelectionOverlay,
  boardSelectionQuery,
  boardSelectionState,
});
const {
  boardLifecycle,
  boardPersistence,
  boardShell,
  boardUiBootstrap,
} = createBoardAppStack(
  createBoardAppStackOptions({
    documentRef: document,
    windowRef: window,
    getText,
    showToast,
    boardHistory,
    cloneBoardState,
    runtime: {
      boardRuntime,
      selectionRuntime,
      dragRuntime,
      linkRuntime,
      shapeRuntime,
    },
    refs: {
      canvasRefs,
      settingsRefs,
      itemRefs,
      shapeRefs,
      linkRefs,
      setupRefs,
    },
    controllers: {
      boardItemMenuShell,
      boardItemRename,
      boardItemStyle,
      boardItemToolbarShell,
      boardLinkRender,
      boardMainToolbar,
    },
    apis: {
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
    },
    storage: {
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
    },
    constants: {
      historyCommitDelay: HISTORY_COMMIT_DELAY,
      itemTypeColors: ITEM_TYPE_COLORS,
      shapeFillPresets: SHAPE_FILL_PRESETS,
      shapeStrokeColorPresets: SHAPE_STROKE_COLOR_PRESETS,
      shapeStrokePresets: SHAPE_STROKE_PRESETS,
      linkStylePresets: LINK_STYLE_PRESETS,
      linkStyleDashed: LINK_STYLE_DASHED,
      linkStyleDotted: LINK_STYLE_DOTTED,
      linkStyleDashDot: LINK_STYLE_DASH_DOT,
      boardModelOptions: BOARD_MODEL_OPTIONS,
      saveDelay: SAVE_DELAY,
      toolSelect: TOOL_SELECT,
      toolDraw: TOOL_DRAW,
      toolErase: TOOL_ERASE,
      toolHand: TOOL_HAND,
      toolLink: TOOL_LINK,
      inkTools: INK_TOOLS,
      linkTypeShape: LINK_TYPE_SHAPE,
    },
    normalizeState: (raw) => normalizeBoardState(raw, BOARD_MODEL_OPTIONS),
    makeLinkEndpoint,
  }),
);
Object.assign(boardControllers, {
  boardLifecycle,
  boardPersistence,
  boardShell,
  boardUiBootstrap,
});
const {
  boardShapeEditor,
  boardShapeEraser,
  boardShapeRenderer,
  boardShapeResize,
  boardShapeStyle,
  boardShapeToolbarController,
} = createBoardShapeStack(
  createBoardShapeStackOptions({
    refs: {
      canvasRefs,
      toolbarRefs,
      shapeRefs,
    },
    runtime: {
      boardRuntime,
      selectionRuntime,
      dragRuntime,
      linkRuntime,
      shapeRuntime,
    },
    apis: {
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
    },
    boardUiPreview,
    constants: {
      defaultStrokeColor: SHAPE_STROKE_COLOR_PRESETS[0].value,
      shapeResizeHandleHitRadius: SHAPE_RESIZE_HANDLE_HIT_RADIUS,
      shapeResizeHandleRadius: SHAPE_RESIZE_HANDLE_RADIUS,
      linkTypeShape: LINK_TYPE_SHAPE,
      toolLine: TOOL_LINE,
      toolSelect: TOOL_SELECT,
    },
    helpers: {
      getShapeBounds,
      getConstrainedPoint,
      pointToSegmentDistance,
      getLinkType,
    },
  }),
);
Object.assign(boardControllers, {
  boardShapeEditor,
  boardShapeEraser,
  boardShapeRenderer,
  boardShapeResize,
  boardShapeStyle,
  boardShapeToolbarController,
});

export async function initializeBoard() {
  await boardLifecycle.initializeBoard();
  initBoardTooltip({ root: document.getElementById("boardTab") });
}
