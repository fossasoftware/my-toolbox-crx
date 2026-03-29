export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getShapeBounds(start, end) {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  if (width < 1 && height < 1) {
    return null;
  }

  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width,
    height,
  };
}

export function getShapeBoundsWithStroke(shape, defaultStrokeSize = 4) {
  if (!shape?.start || !shape?.end) {
    return null;
  }

  const bounds = getShapeBounds(shape.start, shape.end);
  if (!bounds) {
    return null;
  }

  const strokeSize = Number(shape.size) || defaultStrokeSize;
  const pad = Math.max(0, strokeSize / 2);
  if (!pad) {
    return bounds;
  }

  return {
    x: bounds.x - pad,
    y: bounds.y - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2,
  };
}

export function getRoundedRectRadius(bounds) {
  if (!bounds) {
    return 0;
  }

  const base = Math.min(bounds.width, bounds.height) * 0.2;
  return clamp(base, 6, 18);
}

export function getParallelogramVertices(bounds) {
  if (!bounds) {
    return [];
  }

  const maxOffset = Math.max(4, bounds.width * 0.2);
  const limit = Math.max(0, bounds.width / 2 - 1);
  const offset = Math.min(maxOffset, limit);
  return [
    { x: bounds.x + offset, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width - offset, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

export function getTrapezoidVertices(bounds) {
  if (!bounds) {
    return [];
  }

  const maxInset = Math.max(4, bounds.width * 0.2);
  const limit = Math.max(0, bounds.width / 2 - 1);
  const inset = Math.min(maxInset, limit);
  return [
    { x: bounds.x + inset, y: bounds.y },
    { x: bounds.x + bounds.width - inset, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

export function getHexagonVertices(bounds) {
  if (!bounds) {
    return [];
  }

  const maxInset = Math.max(4, bounds.width * 0.22);
  const limit = Math.max(0, bounds.width / 2 - 1);
  const inset = Math.min(maxInset, limit);
  const midY = bounds.y + bounds.height / 2;
  return [
    { x: bounds.x + inset, y: bounds.y },
    { x: bounds.x + bounds.width - inset, y: bounds.y },
    { x: bounds.x + bounds.width, y: midY },
    { x: bounds.x + bounds.width - inset, y: bounds.y + bounds.height },
    { x: bounds.x + inset, y: bounds.y + bounds.height },
    { x: bounds.x, y: midY },
  ];
}

export function getStarVertices(bounds, points = 5, innerRatio = 0.48) {
  if (!bounds) {
    return [];
  }

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const rx = bounds.width / 2;
  const ry = bounds.height / 2;
  const vertices = [];
  const step = Math.PI / points;
  const startAngle = -Math.PI / 2;
  for (let i = 0; i < points * 2; i += 1) {
    const isOuter = i % 2 === 0;
    const r = isOuter ? 1 : innerRatio;
    const angle = startAngle + i * step;
    vertices.push({
      x: cx + Math.cos(angle) * rx * r,
      y: cy + Math.sin(angle) * ry * r,
    });
  }
  return vertices;
}

export const HEART_SVG_PATH_COMMANDS = [
  { cmd: "M", x: 1.24264, y: 8.24264 },
  { cmd: "L", x: 8, y: 15 },
  { cmd: "L", x: 14.7574, y: 8.24264 },
  {
    cmd: "C",
    x1: 15.553,
    y1: 7.44699,
    x2: 16,
    y2: 6.36786,
    x: 16,
    y: 5.24264,
  },
  { cmd: "V", y: 5.05234 },
  { cmd: "C", x1: 16, y1: 2.8143, x2: 14.1857, y2: 1, x: 11.9477, y: 1 },
  {
    cmd: "C",
    x1: 10.7166,
    y1: 1,
    x2: 9.55233,
    y2: 1.55959,
    x: 8.78331,
    y: 2.52086,
  },
  { cmd: "L", x: 8, y: 3.5 },
  { cmd: "L", x: 7.21669, y: 2.52086 },
  {
    cmd: "C",
    x1: 6.44767,
    y1: 1.55959,
    x2: 5.28338,
    y2: 1,
    x: 4.05234,
    y: 1,
  },
  { cmd: "C", x1: 1.8143, y1: 1, x2: 0, y2: 2.8143, x: 0, y: 5.05234 },
  { cmd: "V", y: 5.24264 },
  {
    cmd: "C",
    x1: 0,
    y1: 6.36786,
    x2: 0.44699,
    y2: 7.44699,
    x: 1.24264,
    y: 8.24264,
  },
  { cmd: "Z" },
];

export function cubicBezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

export function getHeartVertices(bounds, samples = 10) {
  if (!bounds) {
    return [];
  }

  const scaleX = bounds.width / 16;
  const scaleY = bounds.height / 16;
  const originX = bounds.x;
  const originY = bounds.y;
  const mapPoint = (point) => ({
    x: originX + point.x * scaleX,
    y: originY + point.y * scaleY,
  });
  const vertices = [];
  let current = { x: 0, y: 0 };
  HEART_SVG_PATH_COMMANDS.forEach((command) => {
    switch (command.cmd) {
      case "M":
        current = { x: command.x, y: command.y };
        vertices.push(mapPoint(current));
        break;
      case "L":
        current = { x: command.x, y: command.y };
        vertices.push(mapPoint(current));
        break;
      case "V":
        current = { x: current.x, y: command.y };
        vertices.push(mapPoint(current));
        break;
      case "C": {
        const p0 = current;
        const p1 = { x: command.x1, y: command.y1 };
        const p2 = { x: command.x2, y: command.y2 };
        const p3 = { x: command.x, y: command.y };
        const count = Math.max(4, samples);
        for (let i = 1; i <= count; i += 1) {
          const t = i / count;
          vertices.push(mapPoint(cubicBezierPoint(p0, p1, p2, p3, t)));
        }
        current = p3;
        break;
      }
      default:
        break;
    }
  });
  return vertices;
}

export function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) /
    (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const closestX = start.x + clamped * dx;
  const closestY = start.y + clamped * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function getStrokeBounds(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) {
      continue;
    }
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function getSelectionRect(start, end) {
  if (!start || !end) {
    return null;
  }

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function expandRect(rect, padding) {
  if (!rect) {
    return null;
  }

  const pad = Number(padding) || 0;
  return {
    x: rect.x - pad,
    y: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

export function rectsIntersect(a, b) {
  if (!a || !b) {
    return false;
  }

  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

export function getConstrainedPoint(anchor, point) {
  if (!anchor || !point) {
    return point;
  }

  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));
  if (!Number.isFinite(size) || size === 0) {
    return { x: anchor.x, y: anchor.y };
  }

  const signX = dx === 0 ? (dy >= 0 ? 1 : -1) : Math.sign(dx);
  const signY = dy === 0 ? (dx >= 0 ? 1 : -1) : Math.sign(dy);
  return {
    x: anchor.x + signX * size,
    y: anchor.y + signY * size,
  };
}
