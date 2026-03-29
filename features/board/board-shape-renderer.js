import {
  TOOL_DIAMOND,
  TOOL_ELLIPSE,
  TOOL_ERASE,
  TOOL_HEART,
  TOOL_HEXAGON,
  TOOL_LINE,
  TOOL_PARALLELOGRAM,
  TOOL_RECT,
  TOOL_ROUND_RECT,
  TOOL_STAR,
  TOOL_TRAPEZOID,
  TOOL_TRIANGLE,
} from "./board-config.js";
import {
  clamp,
  HEART_SVG_PATH_COMMANDS,
  getHexagonVertices,
  getParallelogramVertices,
  getRoundedRectRadius,
  getShapeBounds,
  getStarVertices,
  getTrapezoidVertices,
} from "./board-geometry.js";
import { getStrokePaths } from "./board-stroke-paths.js";

export function createBoardShapeRenderer({
  getCtx,
  getDefaultColor,
  getDefaultOpacity,
  getDefaultSize,
  getDefaultTextSize,
  isShapeEditing,
}) {
  let shapeFontFamily = null;

  function getShapeFontFamily() {
    if (shapeFontFamily) return shapeFontFamily;
    const root = document.documentElement;
    if (root) {
      const value = getComputedStyle(root).getPropertyValue("--font-body").trim();
      if (value) {
        shapeFontFamily = value;
        return shapeFontFamily;
      }
    }
    const fallback = getComputedStyle(document.body).fontFamily;
    shapeFontFamily = fallback || "sans-serif";
    return shapeFontFamily;
  }

  function getShapeTextColor(shape) {
    return shape?.textColor || shape?.color || getDefaultColor();
  }

  function getShapeTextSize(shape) {
    const size = Number(shape?.textSize) || Number(getDefaultTextSize());
    return Number.isFinite(size) ? size : 14;
  }

  function wrapShapeTextLines(text, maxWidth) {
    const ctx = getCtx();
    if (!ctx) return [];
    const lines = [];
    const paragraphs = String(text || "").split(/\n/);
    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.replace(/\s+/g, " ").trim();
      if (!trimmed) {
        lines.push("");
        return;
      }
      const words = trimmed.split(" ");
      let line = "";
      words.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  function drawRoundedRectPath(bounds, radius) {
    const ctx = getCtx();
    if (!ctx || !bounds) return;
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawPolygonPath(vertices) {
    const ctx = getCtx();
    if (!ctx || !Array.isArray(vertices) || vertices.length === 0) return;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i += 1) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
  }

  function drawHeartPath(bounds) {
    const ctx = getCtx();
    if (!ctx || !bounds) return;
    const scaleX = bounds.width / 16;
    const scaleY = bounds.height / 16;
    const originX = bounds.x;
    const originY = bounds.y;
    let current = { x: 0, y: 0 };
    HEART_SVG_PATH_COMMANDS.forEach((command) => {
      switch (command.cmd) {
        case "M":
          current = { x: command.x, y: command.y };
          ctx.moveTo(originX + current.x * scaleX, originY + current.y * scaleY);
          break;
        case "L":
          current = { x: command.x, y: command.y };
          ctx.lineTo(originX + current.x * scaleX, originY + current.y * scaleY);
          break;
        case "V":
          current = { x: current.x, y: command.y };
          ctx.lineTo(originX + current.x * scaleX, originY + current.y * scaleY);
          break;
        case "C": {
          const p1 = { x: command.x1, y: command.y1 };
          const p2 = { x: command.x2, y: command.y2 };
          const p3 = { x: command.x, y: command.y };
          ctx.bezierCurveTo(
            originX + p1.x * scaleX,
            originY + p1.y * scaleY,
            originX + p2.x * scaleX,
            originY + p2.y * scaleY,
            originX + p3.x * scaleX,
            originY + p3.y * scaleY
          );
          current = p3;
          break;
        }
        case "Z":
          ctx.closePath();
          break;
        default:
          break;
      }
    });
  }

  function drawShapeText(shape, bounds) {
    const ctx = getCtx();
    if (!ctx || !shape?.text || !bounds) return;
    if (isShapeEditing(shape)) return;

    if (shape.shapeType === TOOL_LINE && shape.start && shape.end) {
      const dx = shape.end.x - shape.start.x;
      const dy = shape.end.y - shape.start.y;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length < 1) return;
      const padding = 10;
      const maxWidth = Math.max(1, length - padding * 2);
      const fontSize = getShapeTextSize(shape);
      const lineHeight = Math.round(fontSize * 1.3);
      ctx.save();
      ctx.font = `${fontSize}px ${getShapeFontFamily()}`;
      ctx.fillStyle = getShapeTextColor(shape);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const lines = wrapShapeTextLines(shape.text, maxWidth);
      if (!lines.length) {
        ctx.restore();
        return;
      }
      const totalHeight = lines.length * lineHeight;
      const midX = (shape.start.x + shape.end.x) / 2;
      const midY = (shape.start.y + shape.end.y) / 2;
      let nx = -dy / length;
      let ny = dx / length;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const offset = Math.max(
        8,
        (Number(shape.size) || getDefaultSize() || 4) / 2 + 4
      );
      const anchorX = midX + nx * offset;
      const anchorY = midY + ny * offset;
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
      }
      const localUpX = -Math.sin(angle);
      const localUpY = Math.cos(angle);
      const direction = nx * localUpX + ny * localUpY >= 0 ? 1 : -1;
      ctx.translate(anchorX, anchorY);
      ctx.rotate(angle);
      const startY = direction > 0 ? 0 : -totalHeight;
      lines.forEach((line, index) => {
        ctx.fillText(line, 0, startY + index * lineHeight);
      });
      ctx.restore();
      return;
    }

    const padding = 10;
    const maxWidth = Math.max(1, bounds.width - padding * 2);
    const maxHeight = Math.max(1, bounds.height - padding * 2);
    if (maxWidth < 6 || maxHeight < 6) return;
    const fontSize = getShapeTextSize(shape);
    const lineHeight = Math.round(fontSize * 1.3);
    ctx.save();
    ctx.font = `${fontSize}px ${getShapeFontFamily()}`;
    ctx.fillStyle = getShapeTextColor(shape);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const lines = wrapShapeTextLines(shape.text, maxWidth);
    if (!lines.length) {
      ctx.restore();
      return;
    }
    const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
    const visibleLines = lines.slice(0, maxLines);
    const totalHeight = visibleLines.length * lineHeight;
    let startY = bounds.y + (bounds.height - totalHeight) / 2;
    if (startY < bounds.y + padding) {
      startY = bounds.y + padding;
    }
    const centerX = bounds.x + bounds.width / 2;
    visibleLines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });
    ctx.restore();
  }

  function applyStrokeStyle(stroke) {
    const ctx = getCtx();
    if (!ctx) return;
    if (stroke.mode === TOOL_ERASE) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color || getDefaultColor();
      const alpha = Number(
        Number.isFinite(stroke.opacity) ? stroke.opacity : getDefaultOpacity()
      );
      ctx.globalAlpha = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
    }
    const baseSize = Number(stroke.size) || 4;
    ctx.lineWidth = Math.max(0.5, baseSize);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function drawStroke(stroke) {
    const ctx = getCtx();
    const paths = getStrokePaths(stroke);
    if (!ctx || !paths.length) return;
    ctx.save();
    applyStrokeStyle(stroke);
    paths.forEach((path) => {
      if (path.length === 1) {
        const point = path[0];
        const radius = Math.max(0.25, ctx.lineWidth / 2);
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        return;
      }

      ctx.beginPath();
      path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawStrokeSegment(stroke, from, to) {
    const ctx = getCtx();
    if (!ctx || !from || !to) return;
    ctx.save();
    applyStrokeStyle(stroke);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawShape(shape) {
    const ctx = getCtx();
    if (!ctx || !shape?.start || !shape?.end) return;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const strokeColor = shape.color || getDefaultColor();
    const strokeWidth = shape.size || getDefaultSize();
    const fillColor = shape.fillColor || "";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (shape.shapeType === TOOL_LINE) {
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.stroke();
      ctx.restore();
      const lineBounds = getShapeBounds(shape.start, shape.end);
      if (lineBounds) {
        drawShapeText(shape, lineBounds);
      }
      return;
    }

    const bounds = getShapeBounds(shape.start, shape.end);
    if (!bounds) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    if (shape.shapeType === TOOL_RECT) {
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    } else if (shape.shapeType === TOOL_ROUND_RECT) {
      drawRoundedRectPath(bounds, getRoundedRectRadius(bounds));
    } else if (shape.shapeType === TOOL_ELLIPSE) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      ctx.ellipse(
        centerX,
        centerY,
        bounds.width / 2,
        bounds.height / 2,
        0,
        0,
        Math.PI * 2
      );
    } else if (shape.shapeType === TOOL_DIAMOND) {
      ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height / 2);
      ctx.lineTo(bounds.x + bounds.width / 2, bounds.y + bounds.height);
      ctx.lineTo(bounds.x, bounds.y + bounds.height / 2);
      ctx.closePath();
    } else if (shape.shapeType === TOOL_TRIANGLE) {
      ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
      ctx.lineTo(bounds.x, bounds.y + bounds.height);
      ctx.closePath();
    } else if (shape.shapeType === TOOL_PARALLELOGRAM) {
      drawPolygonPath(getParallelogramVertices(bounds));
    } else if (shape.shapeType === TOOL_TRAPEZOID) {
      drawPolygonPath(getTrapezoidVertices(bounds));
    } else if (shape.shapeType === TOOL_HEXAGON) {
      drawPolygonPath(getHexagonVertices(bounds));
    } else if (shape.shapeType === TOOL_STAR) {
      drawPolygonPath(getStarVertices(bounds));
    } else if (shape.shapeType === TOOL_HEART) {
      drawHeartPath(bounds);
    }
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    drawShapeText(shape, bounds);
  }

  return {
    applyStrokeStyle,
    drawShape,
    drawShapeText,
    drawStroke,
    drawStrokeSegment,
    getShapeFontFamily,
    getShapeTextColor,
    getShapeTextSize,
    wrapShapeTextLines,
  };
}
