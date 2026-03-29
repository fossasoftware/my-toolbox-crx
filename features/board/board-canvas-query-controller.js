import {
  getShapeHitPadding as getHitPaddingForShape,
  isLineTextHit as isLineTextTargetHit,
  isLinkTextHit as isLinkTextTargetHit,
  isPolylineHit as isPolylineTargetHit,
  isShapeHit as isShapeTargetHit,
  isStrokeHit as isStrokeTargetHit,
} from "./board-hit-testing.js";

export function createBoardCanvasQueryController({
  getBoardLinks,
  getBoardSettings,
  getBoardStrokes,
  getCtx,
  getLinkRenderPoints,
  getLinkTextSize,
  getShapeFontFamily,
  getShapeTextSize,
  getStage,
  getWrapShapeTextLines,
  linkGap,
  toolDraw,
  toolLine,
}) {
  function getDefaultShapeSize() {
    return getBoardSettings().size || 4;
  }

  function isShapeVisible(shape) {
    if (!shape?.start || !shape?.end) return false;
    const width = Math.abs(shape.end.x - shape.start.x);
    const height = Math.abs(shape.end.y - shape.start.y);
    if (shape.shapeType === toolLine) {
      return Math.hypot(width, height) > 2;
    }
    return width > 2 || height > 2;
  }

  function isSelectableStroke(stroke) {
    return Boolean(stroke?.shapeType || stroke?.mode === toolDraw);
  }

  function isStrokeHit(stroke, point) {
    return isStrokeTargetHit(stroke, point, getDefaultShapeSize());
  }

  function isShapeHit(shape, point) {
    return isShapeTargetHit(shape, point, getDefaultShapeSize());
  }

  function isPolylineHit(stroke, point) {
    return isPolylineTargetHit(stroke, point, getDefaultShapeSize());
  }

  function getShapeHitPadding(shape) {
    return getHitPaddingForShape(shape, getDefaultShapeSize());
  }

  function isLineTextHit(shape, point) {
    return isLineTextTargetHit(shape, point, {
      ctx: getCtx(),
      fontFamily: getShapeFontFamily(),
      wrapTextLines: getWrapShapeTextLines(),
      getShapeTextSize,
      defaultSize: getDefaultShapeSize(),
    });
  }

  function isLinkTextHit(link, from, to, point) {
    return isLinkTextTargetHit(link, from, to, point, {
      ctx: getCtx(),
      fontFamily: getShapeFontFamily(),
      wrapTextLines: getWrapShapeTextLines(),
      getLinkTextSize,
      linkGap,
    });
  }

  function findShapeAtPoint(point) {
    if (!point) return null;
    const strokes = getBoardStrokes();
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      const stroke = strokes[i];
      if (!isSelectableStroke(stroke)) continue;
      if (isStrokeHit(stroke, point)) {
        return stroke;
      }
    }
    return null;
  }

  function findLineTextAtPoint(point) {
    if (!point) return null;
    const strokes = getBoardStrokes();
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      const stroke = strokes[i];
      if (!stroke?.shapeType || stroke.shapeType !== toolLine) continue;
      if (!stroke.text) continue;
      if (isLineTextHit(stroke, point)) {
        return stroke;
      }
    }
    return null;
  }

  function findLinkTextAtPoint(point) {
    const stage = getStage();
    if (!point || !stage) return null;
    const stageRect = stage.getBoundingClientRect();
    const links = getBoardLinks();
    for (let i = links.length - 1; i >= 0; i -= 1) {
      const link = links[i];
      if (!link?.text) continue;
      const points = getLinkRenderPoints(link, stageRect);
      if (!points) continue;
      if (isLinkTextHit(link, points.from, points.to, point)) {
        return link;
      }
    }
    return null;
  }

  function findLinkableShapeAtPoint(point) {
    if (!point) return null;
    const strokes = getBoardStrokes();
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      const stroke = strokes[i];
      if (!stroke?.shapeType) continue;
      if (isShapeHit(stroke, point)) {
        return stroke;
      }
    }
    return null;
  }

  return {
    findLineTextAtPoint,
    findLinkTextAtPoint,
    findLinkableShapeAtPoint,
    findShapeAtPoint,
    getShapeHitPadding,
    isLineTextHit,
    isLinkTextHit,
    isPolylineHit,
    isSelectableStroke,
    isShapeHit,
    isShapeVisible,
    isStrokeHit,
  };
}
