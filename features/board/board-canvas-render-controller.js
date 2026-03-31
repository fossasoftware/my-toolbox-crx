export function createBoardCanvasRenderController({
  drawLinkHoverHighlight,
  drawLinkSelection,
  drawLinkSourceHighlight,
  drawMarqueeSelection,
  drawShape,
  drawShapeSelection,
  drawStroke,
  getBoardStrokes,
  getCanvas,
  getCtx,
  getCurrentTool,
  getDevicePixelRatio,
  getSelectedLinkId,
  getViewPan,
  getZoom,
  isLinkingModeActive,
  scheduleShapeToolbarUpdate,
  toolSelect,
}) {
  function drawOperation(stroke) {
    if (!stroke) return;
    if (stroke.mode === "shape" || stroke.shapeType) {
      drawShape(stroke);
      return;
    }
    drawStroke(stroke);
  }

  function redrawCanvas(preview = null) {
    const ctx = getCtx();
    const canvas = getCanvas();
    if (!ctx || !canvas) return;
    const ratio = getDevicePixelRatio();
    const pan = getViewPan();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    const zoom = getZoom();
    ctx.setTransform(
      ratio * zoom,
      0,
      0,
      ratio * zoom,
      ratio * pan.x,
      ratio * pan.y
    );
    getBoardStrokes().forEach((stroke) => drawOperation(stroke));
    if (preview) {
      drawOperation(preview);
    }
    if (getCurrentTool() === toolSelect) {
      drawShapeSelection();
      drawMarqueeSelection();
    }
    if (getSelectedLinkId()) {
      drawLinkSelection();
    }
    if (isLinkingModeActive()) {
      drawLinkSourceHighlight();
      drawLinkHoverHighlight();
    }
    scheduleShapeToolbarUpdate();
  }

  return {
    drawOperation,
    redrawCanvas,
  };
}
