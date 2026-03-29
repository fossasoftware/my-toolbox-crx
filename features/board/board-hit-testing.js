import {
  getShapeBounds,
  getStrokeBounds,
  pointToSegmentDistance,
} from "./board-geometry.js";
import { TOOL_LINE } from "./board-config.js";
import { getStrokePaths } from "./board-stroke-paths.js";

export function getShapeHitPadding(shape, defaultSize = 4) {
  const size = Number(shape?.size) || defaultSize;
  return Math.max(6, size + 4);
}

export function isShapeHit(shape, point, defaultSize = 4) {
  if (!shape?.start || !shape?.end || !point) return false;

  const padding = getShapeHitPadding(shape, defaultSize);
  if (shape.shapeType === TOOL_LINE) {
    return pointToSegmentDistance(point, shape.start, shape.end) <= padding;
  }

  const bounds = getShapeBounds(shape.start, shape.end);
  if (!bounds) return false;

  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  );
}

export function isPolylineHit(stroke, point, defaultSize = 4) {
  const paths = getStrokePaths(stroke);
  const points = stroke?.points;
  if (!paths.length || !Array.isArray(points) || !points.length || !point) return false;

  const padding = getShapeHitPadding(stroke, defaultSize);
  const bounds = getStrokeBounds(points);
  if (!bounds) return false;

  if (
    point.x < bounds.x - padding ||
    point.x > bounds.x + bounds.width + padding ||
    point.y < bounds.y - padding ||
    point.y > bounds.y + bounds.height + padding
  ) {
    return false;
  }

  for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
    const path = paths[pathIndex];
    if (path.length === 1) {
      if (Math.hypot(point.x - path[0].x, point.y - path[0].y) <= padding) {
        return true;
      }
      continue;
    }

    for (let i = 1; i < path.length; i += 1) {
      if (pointToSegmentDistance(point, path[i - 1], path[i]) <= padding) {
        return true;
      }
    }
  }

  return false;
}

export function isStrokeHit(stroke, point, defaultSize = 4) {
  if (stroke?.shapeType) {
    return isShapeHit(stroke, point, defaultSize);
  }
  if (Array.isArray(stroke?.points) && stroke.points.length) {
    return isPolylineHit(stroke, point, defaultSize);
  }
  return false;
}

function isAngledTextHit({
  text,
  from,
  to,
  point,
  fontSize,
  offset,
  ctx,
  fontFamily,
  wrapTextLines,
}) {
  if (!text || !from || !to || !point) return false;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return false;

  const lineHeight = Math.round(fontSize * 1.3);
  const padding = 10;
  const maxWidth = Math.max(1, length - padding * 2);
  let lines = [text];

  if (ctx && fontFamily && wrapTextLines) {
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    lines = wrapTextLines(text, maxWidth);
    ctx.restore();
  }

  if (!lines.length) return false;

  const totalHeight = lines.length * lineHeight;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  let nx = -dy / length;
  let ny = dx / length;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  const anchorX = midX + nx * offset;
  const anchorY = midY + ny * offset;
  let angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    angle += Math.PI;
  }

  const localUpX = -Math.sin(angle);
  const localUpY = Math.cos(angle);
  const direction = nx * localUpX + ny * localUpY >= 0 ? 1 : -1;
  const yMin = direction > 0 ? 0 : -totalHeight;
  const yMax = direction > 0 ? totalHeight : 0;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const localX = (point.x - anchorX) * cos - (point.y - anchorY) * sin;
  const localY = (point.x - anchorX) * sin + (point.y - anchorY) * cos;
  const hitPadding = 6;

  return (
    localX >= -maxWidth / 2 - hitPadding &&
    localX <= maxWidth / 2 + hitPadding &&
    localY >= yMin - hitPadding &&
    localY <= yMax + hitPadding
  );
}

export function isLineTextHit(
  shape,
  point,
  { ctx, fontFamily, wrapTextLines, getShapeTextSize, defaultSize = 4 }
) {
  if (!shape?.start || !shape?.end || !shape.text || !point) return false;

  return isAngledTextHit({
    text: shape.text || "",
    from: shape.start,
    to: shape.end,
    point,
    fontSize: getShapeTextSize(shape),
    offset: Math.max(8, (Number(shape.size) || defaultSize) / 2 + 4),
    ctx,
    fontFamily,
    wrapTextLines,
  });
}

export function isLinkTextHit(
  link,
  from,
  to,
  point,
  { ctx, fontFamily, wrapTextLines, getLinkTextSize, linkGap }
) {
  if (!link?.text || !from || !to || !point) return false;

  return isAngledTextHit({
    text: link.text || "",
    from,
    to,
    point,
    fontSize: getLinkTextSize(link),
    offset: Math.max(8, linkGap),
    ctx,
    fontFamily,
    wrapTextLines,
  });
}
