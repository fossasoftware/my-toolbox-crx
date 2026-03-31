import {
  DEFAULT_BOARD_TEXT_COLOR,
  ERASER_SIZE_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./board-config.js";
import { colorsMatch } from "./board-color-utils.js";
import { clamp } from "./board-geometry.js";
import { flattenLegacyEraserStrokes } from "./board-stroke-erasing.js";
import { buildStrokeWithPaths, normalizeStrokePaths } from "./board-stroke-paths.js";

export const BOARD_BACKUP_KIND = "my-toolbox-board-backup";
export const BOARD_BACKUP_VERSION = 1;

export function makeDefaultBoardViewportState() {
  return {
    zoom: 1,
    pan: {
      x: 0,
      y: 0,
    },
  };
}

export function normalizeBoardViewportState(raw) {
  const next = makeDefaultBoardViewportState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return next;
  }

  const zoom = Number(raw.zoom);
  if (Number.isFinite(zoom)) {
    next.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  }

  const panSource =
    raw.pan && typeof raw.pan === "object" && !Array.isArray(raw.pan)
      ? raw.pan
      : raw;
  const x = Number(panSource.x);
  const y = Number(panSource.y);
  if (Number.isFinite(x)) {
    next.pan.x = x;
  }
  if (Number.isFinite(y)) {
    next.pan.y = y;
  }

  return next;
}

export function makeDefaultBoardState() {
  return {
    version: 1,
    strokes: [],
    items: [],
    links: [],
    settings: {
      color: DEFAULT_BOARD_TEXT_COLOR,
      size: 4,
      opacity: 1,
      eraserSize: ERASER_SIZE_MIN,
      textColor: DEFAULT_BOARD_TEXT_COLOR,
      textSize: 16,
      shapeFill: "",
    },
  };
}

export function createBoardId(prefix) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneBoardState(state) {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state));
}

export function looksLikeBoardState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return false;
  }
  if (!Array.isArray(raw.strokes) || !Array.isArray(raw.items)) {
    return false;
  }
  if ("links" in raw && !Array.isArray(raw.links)) {
    return false;
  }
  if ("settings" in raw && (!raw.settings || typeof raw.settings !== "object")) {
    return false;
  }

  return true;
}

export function normalizeBoardState(
  raw,
  { textColorPresetValues = [DEFAULT_BOARD_TEXT_COLOR] } = {}
) {
  const next = makeDefaultBoardState();
  if (!raw || typeof raw !== "object") {
    return next;
  }

  if (Array.isArray(raw.strokes)) {
    next.strokes = raw.strokes.map((stroke) => {
      const nextStroke = {
        ...stroke,
        id: stroke?.id || createBoardId("stroke"),
        opacity: Number.isFinite(Number(stroke?.opacity))
          ? clamp(Number(stroke.opacity), 0, 1)
          : 1,
      };

      if (normalizeStrokePaths(nextStroke.paths).length) {
        return buildStrokeWithPaths(nextStroke, nextStroke.paths);
      }

      return nextStroke;
    });
    next.strokes = flattenLegacyEraserStrokes(next.strokes, {
      createStrokeId: () => createBoardId("stroke"),
    });
  }

  next.items = Array.isArray(raw.items)
    ? raw.items.map((item) =>
        item && typeof item === "object" ? { ...item } : item
      )
    : [];
  next.links = Array.isArray(raw.links)
    ? raw.links.map((link) =>
        link && typeof link === "object" ? { ...link } : link
      )
    : [];

  const rawSettings = raw.settings || {};
  next.settings = {
    ...next.settings,
    ...rawSettings,
  };

  if (!Number.isFinite(Number(next.settings.size))) {
    next.settings.size = 4;
  }

  const eraserValue = Number(next.settings.eraserSize);
  if (!Number.isFinite(eraserValue)) {
    next.settings.eraserSize = ERASER_SIZE_MIN;
  } else {
    next.settings.eraserSize = Math.max(ERASER_SIZE_MIN, eraserValue);
  }

  const opacityValue = Number(next.settings.opacity);
  if (!Number.isFinite(opacityValue)) {
    next.settings.opacity = 1;
  } else if (opacityValue > 1) {
    next.settings.opacity = clamp(opacityValue / 100, 0, 1);
  } else {
    next.settings.opacity = clamp(opacityValue, 0, 1);
  }

  if (!Number.isFinite(Number(next.settings.textSize))) {
    next.settings.textSize = 16;
  }

  const allowedTextColors = Array.isArray(textColorPresetValues)
    ? textColorPresetValues.filter((value) => typeof value === "string" && value)
    : [DEFAULT_BOARD_TEXT_COLOR];
  const defaultTextColor = allowedTextColors[0] || DEFAULT_BOARD_TEXT_COLOR;
  const textColorValue =
    typeof next.settings.textColor === "string" ? next.settings.textColor : "";
  const textColorValid = allowedTextColors.some((presetValue) =>
    colorsMatch(presetValue, textColorValue)
  );
  if (!textColorValid) {
    next.settings.textColor = defaultTextColor;
  }

  if (typeof next.settings.shapeFill !== "string") {
    next.settings.shapeFill = "";
  }

  next.items = next.items.map((item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    const nextItem = { ...item };
    const uiScale = Number(nextItem.uiScale);
    if (!Number.isFinite(uiScale) || uiScale <= 0 || uiScale === 1) {
      nextItem.uiScale = 1;
      return nextItem;
    }

    const width = Number(nextItem.width);
    const height = Number(nextItem.height);
    if (Number.isFinite(width) && Number.isFinite(height)) {
      const nextWidth = width / uiScale;
      const nextHeight = height / uiScale;
      const dx = (width - nextWidth) / 2;
      const dy = (height - nextHeight) / 2;
      if (Number.isFinite(Number(nextItem.x))) {
        nextItem.x = Number(nextItem.x) + dx;
      }
      if (Number.isFinite(Number(nextItem.y))) {
        nextItem.y = Number(nextItem.y) + dy;
      }
      nextItem.width = nextWidth;
      nextItem.height = nextHeight;
    }

    nextItem.uiScale = 1;
    return nextItem;
  });

  return next;
}

export function buildBoardBackupPayload(state, autosaveEnabled) {
  return {
    type: BOARD_BACKUP_KIND,
    version: BOARD_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    autosaveEnabled,
    boardState: cloneBoardState(state),
  };
}

export function parseBoardBackupPayload(raw, options = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const candidates = [raw, raw.boardState, raw.board, raw.state];
  const stateCandidate = candidates.find((candidate) =>
    looksLikeBoardState(candidate)
  );
  if (!stateCandidate) {
    return null;
  }

  return {
    state: normalizeBoardState(stateCandidate, options),
    autosaveEnabled:
      typeof raw.autosaveEnabled === "boolean" ? raw.autosaveEnabled : null,
  };
}
