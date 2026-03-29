import {
  LINK_GAP,
  LINK_TYPE_ITEM,
  LINK_TYPE_SHAPE,
  TOOL_DIAMOND,
  TOOL_ELLIPSE,
  TOOL_HEART,
  TOOL_HEXAGON,
  TOOL_LINE,
  TOOL_PARALLELOGRAM,
  TOOL_STAR,
  TOOL_TRAPEZOID,
  TOOL_TRIANGLE,
} from "./board-config.js";
import {
  getHeartVertices,
  getHexagonVertices,
  getParallelogramVertices,
  getShapeBounds,
  getShapeBoundsWithStroke,
  getStarVertices,
  getTrapezoidVertices,
} from "./board-geometry.js";

export function getShapeCenter(shape) {
  if (!shape?.start || !shape?.end) return null;

  if (shape.shapeType === TOOL_LINE) {
    return {
      x: (shape.start.x + shape.end.x) / 2,
      y: (shape.start.y + shape.end.y) / 2,
    };
  }

  const bounds = getShapeBounds(shape.start, shape.end);
  if (!bounds) return null;
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

export function getLinkAnchorPoint(
  endpoint,
  targetPoint,
  { defaultStrokeSize = 4 } = {}
) {
  if (!endpoint?.center || !targetPoint) return null;

  if (endpoint.type === LINK_TYPE_ITEM) {
    return getRectAnchorPoint(endpoint.rect, endpoint.center, targetPoint);
  }
  if (endpoint.type === LINK_TYPE_SHAPE) {
    return getShapeAnchorPoint(endpoint.shape, endpoint.center, targetPoint, {
      defaultStrokeSize,
    });
  }
  return endpoint.center;
}

export function offsetLinkPoint(anchor, target, gap) {
  if (!anchor || !target || !Number.isFinite(gap) || gap <= 0) return anchor;

  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return anchor;

  const maxOffset = Math.max(0, dist / 2 - 1);
  const offset = Math.min(gap, maxOffset);
  if (offset <= 0) return anchor;

  return {
    x: anchor.x + (dx / dist) * offset,
    y: anchor.y + (dy / dist) * offset,
  };
}

export function getLinkGapForEndpoint(
  endpoint,
  { defaultGap = LINK_GAP, defaultStrokeSize = 4 } = {}
) {
  if (endpoint?.type !== LINK_TYPE_SHAPE || !endpoint.shape) {
    return defaultGap;
  }
  if (endpoint.shape.shapeType === TOOL_STAR) {
    return defaultGap;
  }

  const strokeSize = Number(endpoint.shape.size) || defaultStrokeSize;
  const minGap =
    endpoint.shape.shapeType === TOOL_LINE
      ? strokeSize / 2 + 4
      : strokeSize / 2 + 2;
  return Math.max(defaultGap, minGap);
}

export function getRectAnchorPoint(rect, center, target) {
  if (!rect || !center || !target) return null;

  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (dx === 0 && dy === 0) return { ...center };

  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  if (halfWidth === 0 || halfHeight === 0) return { ...center };

  const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

export function getShapeAnchorPoint(
  shape,
  center,
  target,
  { defaultStrokeSize = 4 } = {}
) {
  if (!shape || !center || !target) return null;

  if (shape.shapeType === TOOL_LINE) {
    return getLineAnchorPoint(shape, target);
  }
  if (shape.shapeType === TOOL_STAR) {
    return getStarAnchorPoint(shape, center, target, { defaultStrokeSize });
  }

  const bounds = getShapeBoundsWithStroke(shape, defaultStrokeSize);
  if (!bounds) return { ...center };

  if (shape.shapeType === TOOL_ELLIPSE) {
    return getEllipseAnchorPoint(bounds, center, target);
  }
  if (shape.shapeType === TOOL_DIAMOND) {
    return getDiamondAnchorPoint(bounds, center, target);
  }
  if (shape.shapeType === TOOL_TRIANGLE) {
    return getTriangleAnchorPoint(bounds, center, target);
  }
  if (shape.shapeType === TOOL_PARALLELOGRAM) {
    return getPolygonAnchorPoint(
      center,
      target,
      getParallelogramVertices(bounds)
    );
  }
  if (shape.shapeType === TOOL_TRAPEZOID) {
    return getPolygonAnchorPoint(center, target, getTrapezoidVertices(bounds));
  }
  if (shape.shapeType === TOOL_HEXAGON) {
    return getPolygonAnchorPoint(center, target, getHexagonVertices(bounds));
  }
  if (shape.shapeType === TOOL_HEART) {
    return getPolygonAnchorPoint(center, target, getHeartVertices(bounds));
  }
  return getRectAnchorPoint(bounds, center, target);
}

export function getLineAnchorPoint(shape, target) {
  if (!shape?.start || !shape?.end) return null;

  const startDist = Math.hypot(target.x - shape.start.x, target.y - shape.start.y);
  const endDist = Math.hypot(target.x - shape.end.x, target.y - shape.end.y);
  return startDist <= endDist ? { ...shape.start } : { ...shape.end };
}

export function getEllipseAnchorPoint(bounds, center, target) {
  const rx = bounds.width / 2;
  const ry = bounds.height / 2;
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (dx === 0 && dy === 0) return { ...center };
  if (rx === 0 || ry === 0) return { ...center };

  const scale = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

export function getDiamondAnchorPoint(bounds, center, target) {
  const rx = bounds.width / 2;
  const ry = bounds.height / 2;
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (dx === 0 && dy === 0) return { ...center };
  if (rx === 0 || ry === 0) return { ...center };

  const scale = 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry);
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

export function getTriangleAnchorPoint(bounds, center, target) {
  const dir = { x: target.x - center.x, y: target.y - center.y };
  if (dir.x === 0 && dir.y === 0) return { ...center };

  const hit = getRayPolygonIntersection(center, dir, getTriangleVertices(bounds));
  return hit || { ...center };
}

export function getStarAnchorPoint(
  shape,
  center,
  target,
  { defaultStrokeSize = 4 } = {}
) {
  if (!shape?.start || !shape?.end || !center || !target) return null;

  const bounds = getShapeBounds(shape.start, shape.end);
  if (!bounds) return { ...center };

  const basePoint = getPolygonAnchorPoint(center, target, getStarVertices(bounds));
  if (!basePoint) return { ...center };

  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return basePoint;

  const strokeSize = Number(shape.size) || defaultStrokeSize;
  const strokeOffset = Math.max(0, strokeSize / 2 + 4);
  return {
    x: basePoint.x + (dx / dist) * strokeOffset,
    y: basePoint.y + (dy / dist) * strokeOffset,
  };
}

export function getPolygonAnchorPoint(center, target, vertices) {
  if (!center || !target) return null;
  if (!Array.isArray(vertices) || !vertices.length) {
    return { ...center };
  }

  const dir = { x: target.x - center.x, y: target.y - center.y };
  if (dir.x === 0 && dir.y === 0) return { ...center };

  const hit = getRayPolygonIntersection(center, dir, vertices);
  return hit || { ...center };
}

export function getTriangleVertices(bounds) {
  const cx = bounds.x + bounds.width / 2;
  return [
    { x: cx, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

export function getRayPolygonIntersection(origin, dir, vertices) {
  let closest = null;

  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const hit = getRaySegmentIntersection(origin, dir, a, b);
    if (!hit) continue;
    if (!closest || hit.t < closest.t) {
      closest = hit;
    }
  }

  return closest ? closest.point : null;
}

export function getRaySegmentIntersection(origin, dir, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const denom = cross2d(dir.x, dir.y, vx, vy);
  if (Math.abs(denom) < 0.00001) return null;

  const ax = a.x - origin.x;
  const ay = a.y - origin.y;
  const t = cross2d(ax, ay, vx, vy) / denom;
  const u = cross2d(ax, ay, dir.x, dir.y) / denom;

  if (t >= 0 && u >= 0 && u <= 1) {
    return {
      t,
      point: {
        x: origin.x + t * dir.x,
        y: origin.y + t * dir.y,
      },
    };
  }
  return null;
}

export function cross2d(x1, y1, x2, y2) {
  return x1 * y2 - y1 * x2;
}
