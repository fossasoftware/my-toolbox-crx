export function getLinkSelectionBounds({
  link,
  from,
  to,
  linkEditingId = null,
  getLinkEditorBounds,
  getLinkLabelBounds,
  padding = 8,
}) {
  if (!from || !to) return null;

  let minX = Math.min(from.x, to.x) - padding;
  let maxX = Math.max(from.x, to.x) + padding;
  let minY = Math.min(from.y, to.y) - padding;
  let maxY = Math.max(from.y, to.y) + padding;

  if (link && linkEditingId === link.id) {
    const editorBounds = getLinkEditorBounds?.(link, from, to);
    if (editorBounds) {
      minX = Math.min(minX, editorBounds.x - padding);
      minY = Math.min(minY, editorBounds.y - padding);
      maxX = Math.max(maxX, editorBounds.x + editorBounds.width + padding);
      maxY = Math.max(maxY, editorBounds.y + editorBounds.height + padding);
    }
  } else if (link?.text) {
    const labelBounds = getLinkLabelBounds?.(link, from, to);
    if (labelBounds) {
      minX = Math.min(minX, labelBounds.x - padding);
      minY = Math.min(minY, labelBounds.y - padding);
      maxX = Math.max(maxX, labelBounds.x + labelBounds.width + padding);
      maxY = Math.max(maxY, labelBounds.y + labelBounds.height + padding);
    }
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function drawLinkSelection({
  ctx,
  selectedLinkId,
  links = [],
  stage,
  getLinkRenderPoints,
  getLinkSelectionBounds,
  drawSelectionOutline,
  dash,
  radius,
  lineWidth = 1.4,
}) {
  if (!ctx || !selectedLinkId || !stage) return;

  const link = links.find((entry) => entry.id === selectedLinkId);
  if (!link) return;

  const stageRect = stage.getBoundingClientRect();
  const points = getLinkRenderPoints(link, stageRect);
  if (!points) return;

  const bounds = getLinkSelectionBounds(link, points.from, points.to);
  if (!bounds) return;

  drawSelectionOutline(bounds, {
    dash,
    lineWidth,
    radius,
  });
}
