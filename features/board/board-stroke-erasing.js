import { TOOL_DRAW, TOOL_ERASE } from "./board-config.js";
import {
  expandRect,
  getStrokeBounds,
  pointToSegmentDistance,
  rectsIntersect,
} from "./board-geometry.js";
import {
  buildStrokeWithPaths,
  flattenStrokePaths,
  getStrokePaths,
  normalizeStrokePath,
} from "./board-stroke-paths.js";

function getSampleStep(strokeSize, eraserSize) {
  const minSize = Math.min(Math.max(1, strokeSize), Math.max(1, eraserSize));
  return Math.max(0.35, Math.min(0.75, minSize / 6));
}

function interpolatePoint(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

function densifySegment(from, to, step) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (!Number.isFinite(distance) || distance === 0) {
    return [];
  }

  const segments = Math.max(1, Math.ceil(distance / step));
  const densePoints = [];
  for (let segmentIndex = 1; segmentIndex <= segments; segmentIndex += 1) {
    densePoints.push(interpolatePoint(from, to, segmentIndex / segments));
  }
  return densePoints;
}

function getEraserSegments(points) {
  const segments = [];
  for (let index = 1; index < points.length; index += 1) {
    segments.push([points[index - 1], points[index]]);
  }
  return segments;
}

function getCellKey(cellX, cellY) {
  return `${cellX}:${cellY}`;
}

function addIndexToBuckets(buckets, rect, cellSize, index) {
  if (!rect) {
    return;
  }

  const startX = Math.floor(rect.x / cellSize);
  const endX = Math.floor((rect.x + rect.width) / cellSize);
  const startY = Math.floor(rect.y / cellSize);
  const endY = Math.floor((rect.y + rect.height) / cellSize);
  for (let cellY = startY; cellY <= endY; cellY += 1) {
    for (let cellX = startX; cellX <= endX; cellX += 1) {
      const key = getCellKey(cellX, cellY);
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(index);
    }
  }
}

function createEraserMask(points, padding) {
  const segments = getEraserSegments(points);
  const cellSize = Math.max(4, padding * 2);
  const segmentBuckets = new Map();
  const pointBuckets = new Map();

  segments.forEach(([from, to], index) => {
    addIndexToBuckets(
      segmentBuckets,
      expandRect(getStrokeBounds([from, to]), padding),
      cellSize,
      index
    );
  });

  if (!segments.length) {
    points.forEach((point, index) => {
      addIndexToBuckets(
        pointBuckets,
        {
          x: point.x - padding,
          y: point.y - padding,
          width: padding * 2,
          height: padding * 2,
        },
        cellSize,
        index
      );
    });
  }

  return {
    cellSize,
    padding,
    points,
    pointBuckets,
    segmentBuckets,
    segments,
  };
}

function isPointNearEraser(point, eraserMask) {
  if (!point || !eraserMask) {
    return false;
  }

  const cellX = Math.floor(point.x / eraserMask.cellSize);
  const cellY = Math.floor(point.y / eraserMask.cellSize);
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const key = getCellKey(cellX + offsetX, cellY + offsetY);
      const segmentIndexes = eraserMask.segmentBuckets.get(key) || [];
      for (let index = 0; index < segmentIndexes.length; index += 1) {
        const segmentIndex = segmentIndexes[index];
        const [from, to] = eraserMask.segments[segmentIndex];
        if (pointToSegmentDistance(point, from, to) <= eraserMask.padding) {
          return true;
        }
      }

      const pointIndexes = eraserMask.pointBuckets.get(key) || [];
      for (let index = 0; index < pointIndexes.length; index += 1) {
        const eraserPoint = eraserMask.points[pointIndexes[index]];
        if (
          eraserPoint &&
          Math.hypot(point.x - eraserPoint.x, point.y - eraserPoint.y) <= eraserMask.padding
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function clonePoints(points) {
  return points.map((point) => ({ x: point.x, y: point.y }));
}

function eraseStrokePath(points, eraserMask, sampleStep, eraserBounds) {
  if (!points.length) {
    return {
      changed: false,
      paths: [],
    };
  }

  if (points.length === 1) {
    const removed = isPointNearEraser(points[0], eraserMask);
    return {
      changed: removed,
      paths: removed ? [] : [clonePoints(points)],
    };
  }

  let changed = false;
  const nextPointChunks = [];
  let currentChunk = [];
  const pushPoint = (point) => {
    const pointErased = isPointNearEraser(point, eraserMask);

    if (pointErased) {
      changed = true;
      if (currentChunk.length > 0) {
        nextPointChunks.push(currentChunk);
      }
      currentChunk = [];
      return;
    }

    const previousPoint = currentChunk[currentChunk.length - 1];
    if (previousPoint && previousPoint.x === point.x && previousPoint.y === point.y) {
      return;
    }
    currentChunk.push({ x: point.x, y: point.y });
  };

  pushPoint(points[0]);
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (!from || !to) {
      continue;
    }

    const segmentBounds = expandRect(getStrokeBounds([from, to]), eraserMask.padding);
    const segmentPoints = rectsIntersect(segmentBounds, eraserBounds)
      ? densifySegment(from, to, sampleStep)
      : [{ x: to.x, y: to.y }];

    for (let pointIndex = 0; pointIndex < segmentPoints.length; pointIndex += 1) {
      pushPoint(segmentPoints[pointIndex]);
    }
  }

  if (currentChunk.length > 0) {
    nextPointChunks.push(currentChunk);
  }

  return {
    changed,
    paths: nextPointChunks,
  };
}

export function eraseDrawStroke(
  stroke,
  eraser,
  { createStrokeId = () => `stroke-${Date.now()}` } = {}
) {
  if (
    !stroke ||
    stroke.mode !== TOOL_DRAW ||
    !eraser ||
    !Array.isArray(eraser.points) ||
    eraser.points.length === 0
  ) {
    return {
      changed: false,
      replacementIds: stroke?.id ? [stroke.id] : [],
      strokes: stroke ? [stroke] : [],
    };
  }

  const rawEraserPoints = normalizeStrokePath(eraser.points);
  if (!rawEraserPoints.length) {
    return {
      changed: false,
      replacementIds: [stroke.id],
      strokes: [stroke],
    };
  }

  const strokeSize = Math.max(1, Number(stroke.size) || 1);
  const eraserSize = Math.max(1, Number(eraser.size) || strokeSize);
  const strokePaths = getStrokePaths(stroke)
    .map((path) => normalizeStrokePath(path))
    .filter((path) => path.length);
  if (!strokePaths.length) {
    return {
      changed: false,
      replacementIds: [stroke.id],
      strokes: [stroke],
    };
  }

  const strokePoints =
    Array.isArray(stroke.points) && stroke.points.length
      ? stroke.points
      : flattenStrokePaths(strokePaths);
  const strokeBounds = expandRect(getStrokeBounds(strokePoints), strokeSize / 2);
  const eraserBounds = expandRect(getStrokeBounds(rawEraserPoints), eraserSize / 2 + 1);
  if (!rectsIntersect(strokeBounds, eraserBounds)) {
    return {
      changed: false,
      replacementIds: [stroke.id],
      strokes: [stroke],
    };
  }

  const sampleStep = getSampleStep(strokeSize, eraserSize);
  const padding = Math.max(0.75, eraserSize / 2);
  const eraserMask = createEraserMask(rawEraserPoints, padding);

  let changed = false;
  const nextPaths = [];
  strokePaths.forEach((path) => {
    const pathResult = eraseStrokePath(path, eraserMask, sampleStep, eraserBounds);
    if (pathResult.changed) {
      changed = true;
    }
    nextPaths.push(...pathResult.paths);
  });

  if (!changed) {
    return {
      changed: false,
      replacementIds: [stroke.id],
      strokes: [stroke],
    };
  }

  if (!nextPaths.length) {
    return {
      changed: true,
      replacementIds: [],
      strokes: [],
    };
  }

  const nextStroke = buildStrokeWithPaths(stroke, nextPaths);

  return {
    changed: true,
    replacementIds: [stroke.id],
    strokes: [nextStroke],
  };
}

export function flattenLegacyEraserStrokes(
  strokes,
  { createStrokeId = () => `stroke-${Date.now()}` } = {}
) {
  if (!Array.isArray(strokes) || !strokes.length) {
    return Array.isArray(strokes) ? strokes : [];
  }

  let nextStrokes = [];

  strokes.forEach((stroke) => {
    if (!stroke) return;

    if (stroke.mode !== TOOL_ERASE) {
      nextStrokes.push(stroke);
      return;
    }

    nextStrokes = nextStrokes.flatMap((existingStroke) => {
      if (!existingStroke || existingStroke.shapeType || existingStroke.mode !== TOOL_DRAW) {
        return [existingStroke];
      }

      return eraseDrawStroke(existingStroke, stroke, {
        createStrokeId,
      }).strokes;
    });
  });

  return nextStrokes;
}
