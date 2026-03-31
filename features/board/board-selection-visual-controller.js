import { parseColorToRgb } from "./board-color-utils.js";
import {
  getSelectionBounds as getSelectionBoundsForEntity,
  getShapeSelectionBounds as getSelectionBoundsForShape,
  getStrokeSelectionBounds as getSelectionBoundsForStroke,
} from "./board-selection.js";
import {
  drawLinkSelection as drawSelectedLinkSelection,
  getLinkSelectionBounds as getComputedLinkSelectionBounds,
} from "./board-link-selection.js";

export function createBoardSelectionVisualController({
  documentRef,
  drawSelectionOutline,
  getBoardLinks,
  getCtx,
  getLinkEditingId,
  getLinkEditorBounds,
  getLinkLabelBounds,
  getLinkRenderPoints,
  getSelectedLinkId,
  getShapeHitPadding,
  getStage,
  selectionDash,
  selectionRadius,
}) {
  let selectionColorCache;
  let linkSelectionColorCache;

  function getSelectionBounds(shape) {
    return getSelectionBoundsForEntity(shape, getShapeHitPadding);
  }

  function getLinkSelectionBounds(link, from, to) {
    return getComputedLinkSelectionBounds({
      link,
      from,
      to,
      linkEditingId: getLinkEditingId(),
      getLinkEditorBounds,
      getLinkLabelBounds,
    });
  }

  function getShapeSelectionBounds(shape) {
    return getSelectionBoundsForShape(shape, getShapeHitPadding);
  }

  function getStrokeSelectionBounds(stroke) {
    return getSelectionBoundsForStroke(stroke, getShapeHitPadding);
  }

  function getSelectionColor() {
    if (selectionColorCache) return selectionColorCache;
    const root = documentRef.documentElement;
    if (root) {
      const value = getComputedStyle(root).getPropertyValue("--dark-text").trim();
      if (value) {
        selectionColorCache = value;
        return selectionColorCache;
      }
    }
    selectionColorCache = "#0d181c";
    return selectionColorCache;
  }

  function getLinkSelectionColor() {
    if (linkSelectionColorCache) return linkSelectionColorCache;
    const root = documentRef.documentElement;
    if (root) {
      const value = getComputedStyle(root).getPropertyValue("--primary-color").trim();
      if (value) {
        linkSelectionColorCache = value;
        return linkSelectionColorCache;
      }
    }
    linkSelectionColorCache = "#e30613";
    return linkSelectionColorCache;
  }

  function getSelectionFillColor(alpha = 0.18) {
    const value = Number(alpha);
    const safe =
      Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.18;
    const base = getSelectionColor();
    const rgb = parseColorToRgb(base) || { r: 13, g: 24, b: 28 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safe})`;
  }

  function drawLinkSelection({ lineWidth = 1.4 } = {}) {
    drawSelectedLinkSelection({
      ctx: getCtx(),
      selectedLinkId: getSelectedLinkId(),
      links: getBoardLinks(),
      stage: getStage(),
      getLinkRenderPoints,
      getLinkSelectionBounds,
      drawSelectionOutline,
      dash: selectionDash,
      radius: selectionRadius,
      lineWidth,
    });
  }

  return {
    drawLinkSelection,
    getLinkSelectionBounds,
    getLinkSelectionColor,
    getSelectionBounds,
    getSelectionColor,
    getSelectionFillColor,
    getShapeSelectionBounds,
    getStrokeSelectionBounds,
  };
}
