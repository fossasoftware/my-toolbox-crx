export const SAVE_DELAY = 650;
export const HISTORY_LIMIT = 80;
export const HISTORY_COMMIT_DELAY = 520;
export const ITEM_OFFSET_STEP = 24;
export const ITEM_OFFSET_LIMIT = 140;
export const LINK_GAP = 8;
export const LINK_DOUBLE_CLICK_DELAY = 320;
export const LINK_BASE_STROKE_WIDTH = 2.6;
export const LINK_BASE_HIT_WIDTH = 18;
export const SELECTION_DASH = [6, 4];
export const ITEM_SELECTION_OUTSET = 8;
export const SELECTION_RADIUS = 6;
export const SHAPE_RESIZE_HANDLE_RADIUS = 5;
export const SHAPE_RESIZE_HANDLE_HIT_RADIUS = 12;
export const ITEM_MENU_OFFSET = 12;
export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 2.4;
export const ZOOM_STEP = 0.1;
export const ZOOM_PRESETS = [0.4, 0.5, 0.6, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.4];
export const ZOOM_WHEEL_ITEM_HEIGHT = 34;
export const ZOOM_ANIMATION_DURATION = 180;
export const WHEEL_ZOOM_INTENSITY = 0.0018;
export const WHEEL_LINE_HEIGHT = 16;
export const WHEEL_PAGE_MULTIPLIER = 0.9;
export const ERASER_SIZE_MIN = 16;
export const ERASER_SIZE_MAX = 64;

export const ITEM_DEFAULTS = {
  note: { width: 240, height: 170 },
  task: { width: 240, height: 180 },
  process: { width: 220, height: 130 },
  decision: { width: 200, height: 170 },
  text: { width: 220, height: 120 },
};

export const ITEM_TYPE_COLORS = {
  note: "#fff6bf",
  task: "#f6f7fb",
  process: "#e5f1ff",
  decision: "#ffe6d5",
  text: "#ffffff",
};

export const DEFAULT_BOARD_TEXT_COLOR = "#0d181c";

export const TEXT_COLOR_PRESETS = [
  { value: DEFAULT_BOARD_TEXT_COLOR, label: "boardItemMenuTextColorDark" },
  { value: "#e30613", label: "boardItemMenuTextColorRed" },
  { value: "#2563eb", label: "boardItemMenuTextColorBlue" },
  { value: "#16a34a", label: "boardItemMenuTextColorGreen" },
  { value: "#64748b", label: "boardItemMenuTextColorGray" },
];

export const BOARD_TEXT_COLOR_PRESET_VALUES = TEXT_COLOR_PRESETS.map(
  (preset) => preset.value
);

export const BOARD_MODEL_OPTIONS = {
  textColorPresetValues: BOARD_TEXT_COLOR_PRESET_VALUES,
};

export const TEXT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32];

export const SHAPE_FILL_PRESETS = [
  { value: "", label: "boardShapeFillNone" },
  { value: "#fff6bf", label: "boardShapeFillYellow" },
  { value: "#ffe2b5", label: "boardShapeFillOrange" },
  { value: "#ffe6d5", label: "boardShapeFillPeach" },
  { value: "#f6d3e8", label: "boardShapeFillPink" },
  { value: "#e9ddff", label: "boardShapeFillPurple" },
  { value: "#e1f3c1", label: "boardShapeFillGreen" },
  { value: "#d7f2e3", label: "boardShapeFillMint" },
  { value: "#e5f1ff", label: "boardShapeFillBlue" },
  { value: "#f6f7fb", label: "boardShapeFillGray" },
  { value: "#ffffff", label: "boardShapeFillWhite" },
];

export const SHAPE_STROKE_COLOR_PRESETS = [
  { value: DEFAULT_BOARD_TEXT_COLOR, label: "boardShapeStrokeDark" },
  { value: "#e30613", label: "boardShapeStrokeRed" },
  { value: "#f97316", label: "boardShapeStrokeOrange" },
  { value: "#f6b100", label: "boardShapeStrokeYellow" },
  { value: "#16a34a", label: "boardShapeStrokeGreen" },
  { value: "#0ea5a0", label: "boardShapeStrokeTeal" },
  { value: "#2563eb", label: "boardShapeStrokeBlue" },
  { value: "#7c3aed", label: "boardShapeStrokePurple" },
  { value: "#64748b", label: "boardShapeStrokeGray" },
];

export const SHAPE_STROKE_PRESETS = [1, 2, 3, 4, 6, 8, 12, 16];

export const TOOL_SELECT = "select";
export const TOOL_HAND = "hand";
export const TOOL_DRAW = "draw";
export const TOOL_ERASE = "erase";
export const TOOL_LINE = "line";
export const TOOL_RECT = "rect";
export const TOOL_ROUND_RECT = "round-rect";
export const TOOL_ELLIPSE = "ellipse";
export const TOOL_DIAMOND = "diamond";
export const TOOL_TRIANGLE = "triangle";
export const TOOL_PARALLELOGRAM = "parallelogram";
export const TOOL_TRAPEZOID = "trapezoid";
export const TOOL_HEXAGON = "hexagon";
export const TOOL_STAR = "star";
export const TOOL_HEART = "heart";
export const TOOL_LINK = "link";

export const LINK_TYPE_ITEM = "item";
export const LINK_TYPE_SHAPE = "shape";
export const LINK_STYLE_SOLID = "solid";
export const LINK_STYLE_DASHED = "dashed";
export const LINK_STYLE_DOTTED = "dotted";
export const LINK_STYLE_DASH_DOT = "dash-dot";

export const LINK_STYLE_PRESETS = [
  { value: LINK_STYLE_SOLID, label: "boardLinkStyleSolid" },
  { value: LINK_STYLE_DASHED, label: "boardLinkStyleDashed" },
  { value: LINK_STYLE_DOTTED, label: "boardLinkStyleDotted" },
  { value: LINK_STYLE_DASH_DOT, label: "boardLinkStyleDashDot" },
];

export const SHAPE_TOOLS = new Set([
  TOOL_LINE,
  TOOL_RECT,
  TOOL_ELLIPSE,
  TOOL_DIAMOND,
  TOOL_TRIANGLE,
  TOOL_PARALLELOGRAM,
  TOOL_TRAPEZOID,
  TOOL_HEXAGON,
  TOOL_STAR,
  TOOL_HEART,
]);

export const INK_TOOLS = new Set([TOOL_DRAW, TOOL_ERASE, ...SHAPE_TOOLS]);

export const SHAPE_TOOL_LABELS = {
  line: "boardToolLine",
  rect: "boardToolRect",
  ellipse: "boardToolEllipse",
  diamond: "boardToolDiamond",
  triangle: "boardToolTriangle",
  parallelogram: "boardToolParallelogram",
  trapezoid: "boardToolTrapezoid",
  hexagon: "boardToolHexagon",
  star: "boardToolStar",
  heart: "boardToolHeart",
};
