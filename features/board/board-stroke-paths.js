export function cloneStrokePath(path) {
  if (!Array.isArray(path)) {
    return [];
  }

  return path
    .filter(
      (point) =>
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y)
    )
    .map((point) => ({ x: point.x, y: point.y }));
}

export function normalizeStrokePath(path) {
  const nextPath = [];
  cloneStrokePath(path).forEach((point) => {
    const previousPoint = nextPath[nextPath.length - 1];
    if (previousPoint && previousPoint.x === point.x && previousPoint.y === point.y) {
      return;
    }
    nextPath.push(point);
  });
  return nextPath;
}

export function normalizeStrokePaths(paths) {
  if (!Array.isArray(paths)) {
    return [];
  }

  return paths
    .map((path) => normalizeStrokePath(path))
    .filter((path) => path.length);
}

export function getStrokePaths(stroke) {
  if (Array.isArray(stroke?.paths) && stroke.paths.length) {
    return stroke.paths.filter((path) => Array.isArray(path) && path.length);
  }

  if (Array.isArray(stroke?.points) && stroke.points.length) {
    return [stroke.points];
  }

  return [];
}

export function flattenStrokePaths(paths) {
  return normalizeStrokePaths(paths).flatMap((path) => cloneStrokePath(path));
}

export function buildStrokeWithPaths(stroke, paths) {
  const normalizedPaths = normalizeStrokePaths(paths);
  return {
    ...stroke,
    paths: normalizedPaths,
    points: flattenStrokePaths(normalizedPaths),
  };
}

export function translateStrokePaths(paths, dx, dy) {
  return normalizeStrokePaths(paths).map((path) =>
    path.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }))
  );
}
