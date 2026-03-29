export function createBoardSelectionOverlayController({
  drawShapeResizeHandles,
  getBoardStrokes,
  getBoardZoom,
  getCtx,
  getCurrentTool,
  getIsMarqueeSelecting,
  getLinkHoverTarget,
  getLinkSelectionColor,
  getLinkSource,
  getMarqueeRect,
  getSelectedShapeIds,
  getSelectedShapes,
  getSelectionBounds,
  getSelectionColor,
  getSelectionFillColor,
  getShapeSelectionBounds,
  linkTypeShape,
  selectionDash,
  selectionRadius,
  shouldDrawShapeSelection,
  toolSelect,
}) {
  function drawSelectionOutline(
    bounds,
    { color, lineWidth, dash, alpha, fillColor, radius } = {}
  ) {
    const ctx = getCtx();
    if (!ctx || !bounds) return;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const zoom = getBoardZoom();
    const scale = zoom > 0 ? 1 / zoom : 1;
    const targetRadius = (Number(radius) || 0) * scale;
    const cappedRadius =
      targetRadius > 0
        ? Math.min(
            targetRadius,
            Math.max(0, bounds.width / 2),
            Math.max(0, bounds.height / 2)
          )
        : 0;
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;
    ctx.beginPath();
    if (cappedRadius > 0) {
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, cappedRadius);
      } else {
        const r = cappedRadius;
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
    } else {
      ctx.rect(x, y, width, height);
    }
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = color || getSelectionColor();
    const baseLineWidth = Number.isFinite(lineWidth) ? lineWidth : 1.4;
    ctx.lineWidth = baseLineWidth * scale;
    if (Array.isArray(dash)) {
      ctx.setLineDash(dash.map((value) => value * scale));
    } else {
      ctx.setLineDash([]);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (Number.isFinite(alpha)) {
      ctx.globalAlpha = alpha;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawShapeSelection() {
    if (!getCtx() || !getSelectedShapeIds().size) return;
    const selectedShapes = getSelectedShapes();
    if (!selectedShapes.length) return;
    if (selectedShapes.length === 1) {
      const bounds = getSelectionBounds(selectedShapes[0]);
      if (bounds) {
        drawSelectionOutline(bounds, {
          dash: selectionDash,
          lineWidth: 1.4,
          radius: selectionRadius,
        });
      }
      drawShapeResizeHandles(selectedShapes);
      return;
    }
    if (shouldDrawShapeSelection()) {
      selectedShapes.forEach((shape) => {
        const bounds = getSelectionBounds(shape);
        if (!bounds) return;
        drawSelectionOutline(bounds, {
          dash: selectionDash,
          fillColor: getSelectionFillColor(0.12),
          radius: selectionRadius,
        });
      });
    }
  }

  function drawMarqueeSelection() {
    const marqueeRect = getMarqueeRect();
    if (!getCtx() || !getIsMarqueeSelecting() || !marqueeRect) return;
    if (marqueeRect.width < 1 && marqueeRect.height < 1) return;
    drawSelectionOutline(marqueeRect, {
      dash: selectionDash,
      lineWidth: 1.1,
      alpha: 0.7,
      fillColor: getSelectionFillColor(0.2),
      radius: selectionRadius,
    });
  }

  function drawLinkSourceHighlight() {
    const linkSource = getLinkSource();
    if (!getCtx() || !linkSource || linkSource.type !== linkTypeShape) return;
    const shape = getBoardStrokes().find(
      (stroke) => stroke?.id === linkSource.id && stroke.shapeType
    );
    if (!shape) return;
    const bounds = getShapeSelectionBounds(shape);
    if (!bounds) return;
    drawSelectionOutline(bounds, {
      color: getLinkSelectionColor(),
      dash: [4, 4],
      lineWidth: 1.2,
      alpha: 0.85,
      radius: selectionRadius,
    });
  }

  function drawLinkHoverHighlight() {
    const linkHoverTarget = getLinkHoverTarget();
    if (!getCtx() || !linkHoverTarget || linkHoverTarget.type !== linkTypeShape) {
      return;
    }
    const shape = getBoardStrokes().find(
      (stroke) => stroke?.id === linkHoverTarget.id && stroke.shapeType
    );
    if (!shape) return;
    const bounds = getShapeSelectionBounds(shape);
    if (!bounds) return;
    drawSelectionOutline(bounds, {
      color: getLinkSelectionColor(),
      dash: [6, 6],
      lineWidth: 1.1,
      alpha: 0.7,
      radius: selectionRadius,
    });
  }

  return {
    drawLinkHoverHighlight,
    drawLinkSourceHighlight,
    drawMarqueeSelection,
    drawSelectionOutline,
    drawShapeSelection,
  };
}
