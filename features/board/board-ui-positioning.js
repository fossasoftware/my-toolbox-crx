import { clamp } from "./board-geometry.js";

function getOverlayClampMax(containerSize, overlaySize, offset) {
  return Math.max(offset, containerSize - overlaySize - offset);
}

function clampOverlayPosition(position, containerRect, overlayRect, offset) {
  return {
    left: clamp(
      position.left,
      offset,
      getOverlayClampMax(containerRect.width, overlayRect.width, offset)
    ),
    top: clamp(
      position.top,
      offset,
      getOverlayClampMax(containerRect.height, overlayRect.height, offset)
    ),
  };
}

export function getBottomCenteredOverlayPosition({
  containerRect,
  overlayRect,
  offset = 12,
  blockerRects = [],
}) {
  let top = containerRect.height - offset - overlayRect.height;

  blockerRects.forEach((rect) => {
    if (!rect) return;
    const blockerTop = rect.top - containerRect.top - overlayRect.height - offset;
    top = Math.min(top, blockerTop);
  });

  const left = containerRect.width / 2 - overlayRect.width / 2;
  return clampOverlayPosition({ left, top }, containerRect, overlayRect, offset);
}

export function getBoundsOverlayPosition({
  containerRect,
  overlayRect,
  bounds,
  zoom,
  pan,
  offset = 8,
}) {
  if (!containerRect || !overlayRect || !bounds) return null;

  const screenX = bounds.x * zoom + pan.x;
  const screenY = bounds.y * zoom + pan.y;
  const screenW = bounds.width * zoom;
  const screenH = bounds.height * zoom;
  const left = screenX + screenW / 2 - overlayRect.width / 2;
  let top = screenY - overlayRect.height - offset;

  if (top < offset) {
    top = screenY + screenH + offset;
  }

  return clampOverlayPosition({ left, top }, containerRect, overlayRect, offset);
}

export function getPointOverlayPosition({
  containerRect,
  overlayRect,
  point,
  offset = 8,
}) {
  if (!containerRect || !overlayRect || !point) return null;

  const left = point.x - overlayRect.width / 2;
  const top = point.y - overlayRect.height - offset;
  return clampOverlayPosition({ left, top }, containerRect, overlayRect, offset);
}

export function getItemMenuPosition({
  containerRect,
  menuRect,
  clientX,
  clientY,
  offset,
}) {
  if (!containerRect || !menuRect) return null;

  const left = clientX - containerRect.left + offset;
  const top = clientY - containerRect.top + offset;
  return clampOverlayPosition({ left, top }, containerRect, menuRect, offset);
}
