import { LINK_GAP } from "./board-config.js";
import { toLinkSvgPoint } from "./board-link-svg.js";

function getWrappedLines({
  text,
  maxWidth,
  ctx,
  fontSize,
  fontFamily,
  wrapTextLines,
}) {
  let lines = [text];
  if (ctx && fontFamily && wrapTextLines) {
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    lines = wrapTextLines(text, maxWidth);
    ctx.restore();
  }
  return lines;
}

function getLinkAxisData(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return null;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  let nx = -dy / length;
  let ny = dx / length;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  let angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    angle += Math.PI;
  }

  const localUpX = -Math.sin(angle);
  const localUpY = Math.cos(angle);
  const direction = nx * localUpX + ny * localUpY >= 0 ? 1 : -1;

  return {
    length,
    midX,
    midY,
    nx,
    ny,
    angle,
    direction,
  };
}

function getRotatedBounds(anchorX, anchorY, angle, corners) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  corners.forEach((corner) => {
    const rotatedX = corner.x * cos - corner.y * sin;
    const rotatedY = corner.x * sin + corner.y * cos;
    const worldX = anchorX + rotatedX;
    const worldY = anchorY + rotatedY;
    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minY = Math.min(minY, worldY);
    maxY = Math.max(maxY, worldY);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function getLinkTextColor(link, defaultColor) {
  return link?.textColor || link?.color || defaultColor;
}

export function getLinkTextSize(link, defaultTextSize = 14) {
  const size = Number(link?.textSize) || Number(defaultTextSize);
  return Number.isFinite(size) ? size : 14;
}

export function createLinkLabelElement({
  link,
  from,
  to,
  ctx,
  fontFamily,
  wrapTextLines,
  zoom,
  defaultColor,
  defaultTextSize,
  linkGap = LINK_GAP,
}) {
  if (!link?.text || !from || !to) return null;

  const text = String(link.text || "").trim();
  if (!text) return null;

  const axis = getLinkAxisData(from, to);
  if (!axis) return null;

  const fontSize = getLinkTextSize(link, defaultTextSize);
  const lineHeight = Math.round(fontSize * 1.3);
  const padding = 10;
  const maxWidth = Math.max(1, axis.length - padding * 2);
  const lines = getWrappedLines({
    text,
    maxWidth,
    ctx,
    fontSize,
    fontFamily,
    wrapTextLines,
  });
  if (!lines.length) return null;

  const totalHeight = lines.length * lineHeight;
  const offset = Math.max(8, linkGap);
  const anchorX = axis.midX + axis.nx * offset;
  const anchorY = axis.midY + axis.ny * offset;
  const startY = axis.direction > 0 ? 0 : -totalHeight;
  const scaledAnchor = toLinkSvgPoint({ x: anchorX, y: anchorY }, zoom);

  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.classList.add("board-link-label");
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("dominant-baseline", "hanging");
  textEl.setAttribute("font-size", `${fontSize * zoom}`);
  textEl.setAttribute("font-family", fontFamily);
  textEl.setAttribute("fill", getLinkTextColor(link, defaultColor));
  textEl.setAttribute("text-rendering", "geometricPrecision");
  textEl.setAttribute(
    "transform",
    `translate(${scaledAnchor.x} ${scaledAnchor.y}) rotate(${(axis.angle * 180) / Math.PI})`
  );
  textEl.setAttribute("x", "0");
  textEl.setAttribute("y", `${startY * zoom}`);

  lines.forEach((line, index) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.textContent = line;
    tspan.setAttribute("x", "0");
    if (index > 0) {
      tspan.setAttribute("dy", `${lineHeight * zoom}`);
    }
    textEl.appendChild(tspan);
  });

  return textEl;
}

export function getLinkLabelBounds({
  link,
  from,
  to,
  ctx,
  fontFamily,
  wrapTextLines,
  defaultTextSize,
  linkGap = LINK_GAP,
}) {
  if (!link?.text || !from || !to || !ctx) return null;

  const text = String(link.text || "").trim();
  if (!text) return null;

  const axis = getLinkAxisData(from, to);
  if (!axis) return null;

  const fontSize = getLinkTextSize(link, defaultTextSize);
  const lineHeight = Math.round(fontSize * 1.3);
  const padding = 10;
  const maxWidth = Math.max(1, axis.length - padding * 2);
  const lines = getWrappedLines({
    text,
    maxWidth,
    ctx,
    fontSize,
    fontFamily,
    wrapTextLines,
  });
  if (!lines.length) return null;

  const totalHeight = lines.length * lineHeight;
  const offset = Math.max(8, linkGap);
  const anchorX = axis.midX + axis.nx * offset;
  const anchorY = axis.midY + axis.ny * offset;
  const startY = axis.direction > 0 ? 0 : -totalHeight;

  return getRotatedBounds(anchorX, anchorY, axis.angle, [
    { x: -axis.length / 2, y: startY },
    { x: axis.length / 2, y: startY },
    { x: axis.length / 2, y: startY + totalHeight },
    { x: -axis.length / 2, y: startY + totalHeight },
  ]);
}

export function getLinkEditorLayout({
  link,
  from,
  to,
  ctx,
  fontFamily,
  wrapTextLines,
  editorText,
  defaultTextSize,
  linkGap = LINK_GAP,
}) {
  if (!link || !from || !to) return null;

  const axis = getLinkAxisData(from, to);
  if (!axis) return null;

  const fontSize = getLinkTextSize(link, defaultTextSize);
  const lineHeight = Math.round(fontSize * 1.3);
  const padding = 10;
  let lineCount = 1;
  const text = String(editorText ?? link.text ?? "");
  if (ctx && fontFamily && wrapTextLines) {
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    const maxWidth = Math.max(1, axis.length - padding * 2);
    const lines = wrapTextLines(text, maxWidth);
    if (lines.length) {
      lineCount = lines.length;
    }
    ctx.restore();
  }

  const width = Math.max(1, axis.length);
  const height = Math.max(lineHeight, lineCount * lineHeight + padding * 2);
  const offset = Math.max(8, linkGap);

  return {
    anchorX: axis.midX + axis.nx * (offset + height / 2),
    anchorY: axis.midY + axis.ny * (offset + height / 2),
    angle: axis.angle,
    fontSize,
    width,
    height,
  };
}

export function getLinkEditorBounds({
  link,
  from,
  to,
  ctx,
  fontFamily,
  wrapTextLines,
  editorText,
  defaultTextSize,
  linkGap = LINK_GAP,
}) {
  const layout = getLinkEditorLayout({
    link,
    from,
    to,
    ctx,
    fontFamily,
    wrapTextLines,
    editorText,
    defaultTextSize,
    linkGap,
  });
  if (!layout) return null;

  return getRotatedBounds(layout.anchorX, layout.anchorY, layout.angle, [
    { x: -layout.width / 2, y: -layout.height / 2 },
    { x: layout.width / 2, y: -layout.height / 2 },
    { x: layout.width / 2, y: layout.height / 2 },
    { x: -layout.width / 2, y: layout.height / 2 },
  ]);
}
