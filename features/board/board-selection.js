import {
  expandRect,
  getShapeBounds,
  getStrokeBounds,
  rectsIntersect,
} from "./board-geometry.js";

export function getItemBounds(item) {
  if (!item) return null;

  const width = Number(item.width) || 0;
  const height = Number(item.height) || 0;
  return {
    x: Number(item.x) || 0,
    y: Number(item.y) || 0,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

export function getSelectableStrokeBounds(stroke) {
  if (!stroke) return null;
  if (stroke.shapeType) {
    return getShapeBounds(stroke.start, stroke.end);
  }
  if (Array.isArray(stroke.points) && stroke.points.length) {
    return getStrokeBounds(stroke.points);
  }
  return null;
}

export function getSelectableStrokeIdsInRect(
  strokes,
  rect,
  { isSelectableStroke, getShapeHitPadding }
) {
  if (!Array.isArray(strokes) || !rect) return [];

  const ids = [];
  strokes.forEach((stroke) => {
    if (!isSelectableStroke(stroke)) return;
    const bounds = getSelectableStrokeBounds(stroke);
    if (!bounds) return;
    const padded = expandRect(bounds, getShapeHitPadding(stroke));
    if (rectsIntersect(rect, padded)) {
      ids.push(stroke.id);
    }
  });
  return ids;
}

export function getSelectableItemIdsInRect(items, rect) {
  if (!Array.isArray(items) || !rect) return [];

  const ids = [];
  items.forEach((item) => {
    const bounds = getItemBounds(item);
    if (!bounds) return;
    if (rectsIntersect(rect, bounds)) {
      ids.push(item.id);
    }
  });
  return ids;
}

export function collectSelectedStrokes(strokes, selectedIds) {
  const selected = [];
  const existingIds = new Set();

  if (!Array.isArray(strokes) || !(selectedIds instanceof Set)) {
    return { selected, existingIds };
  }

  strokes.forEach((stroke) => {
    if (!selectedIds.has(stroke.id)) return;
    selected.push(stroke);
    existingIds.add(stroke.id);
  });

  return { selected, existingIds };
}

export function collectSelectedItems(items, selectedIds) {
  const selected = [];
  const existingIds = new Set();

  if (!Array.isArray(items) || !(selectedIds instanceof Set)) {
    return { selected, existingIds };
  }

  items.forEach((item) => {
    if (!selectedIds.has(item.id)) return;
    selected.push(item);
    existingIds.add(item.id);
  });

  return { selected, existingIds };
}

export function getShapeSelectionBounds(shape, getShapeHitPadding) {
  if (!shape?.start || !shape?.end) return null;

  const bounds = getShapeBounds(shape.start, shape.end);
  if (!bounds) return null;

  const padding = getShapeHitPadding(shape);
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2),
  };
}

export function getStrokeSelectionBounds(stroke, getShapeHitPadding) {
  const bounds = getStrokeBounds(stroke?.points);
  if (!bounds) return null;

  const padding = getShapeHitPadding(stroke);
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2),
  };
}

export function getSelectionBounds(entity, getShapeHitPadding) {
  if (entity?.shapeType) {
    return getShapeSelectionBounds(entity, getShapeHitPadding);
  }
  if (Array.isArray(entity?.points) && entity.points.length) {
    return getStrokeSelectionBounds(entity, getShapeHitPadding);
  }
  return null;
}

export function getShapeSelectionBoundsForToolbar(shapes, getShapeHitPadding) {
  if (!Array.isArray(shapes) || !shapes.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const bounds = getShapeSelectionBounds(shape, getShapeHitPadding);
    if (!bounds) return;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}
