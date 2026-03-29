export function createBoardShapeResizeController({
  getBoardZoom,
  getConstrainedPoint,
  getCurrentTool,
  getCtx,
  getDraggingMixed,
  getDraggingShape,
  getIsMarqueeSelecting,
  getResizingShape,
  getSelectionBounds,
  getSelectionColor,
  getShapeById,
  getShapeHitPadding,
  getShapeResizeHandle,
  getShapeResizeHover,
  getShapeResizeId,
  getShapeResizeSnapshot,
  getSingleSelectedShape,
  handleHitRadius,
  handleRadius,
  redrawCanvas,
  scheduleLinkUpdate,
  setResizingShape,
  setShapeResizeHandle,
  setShapeResizeHover,
  setShapeResizeId,
  setShapeResizeSnapshot,
  toolLine,
  toolSelect,
}) {
  function getShapeResizeHandles(shape) {
    if (!shape?.shapeType || !shape.start || !shape.end) return [];
    if (shape.shapeType === toolLine) {
      return [
        { type: "start", x: shape.start.x, y: shape.start.y },
        { type: "end", x: shape.end.x, y: shape.end.y },
      ];
    }
    const bounds = getSelectionBounds(shape);
    if (!bounds) return [];
    return [
      { type: "nw", x: bounds.x, y: bounds.y },
      { type: "ne", x: bounds.x + bounds.width, y: bounds.y },
      { type: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { type: "sw", x: bounds.x, y: bounds.y + bounds.height },
    ];
  }

  function drawShapeResizeHandles(selectedShapes) {
    const ctx = getCtx();
    if (!ctx || getCurrentTool() !== toolSelect) return;
    if (getIsMarqueeSelecting()) return;
    if (!Array.isArray(selectedShapes) || selectedShapes.length !== 1) return;
    const shape = selectedShapes[0];
    if (!shape?.shapeType) return;
    const handles = getShapeResizeHandles(shape);
    if (!handles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = getSelectionColor();
    const zoom = getBoardZoom();
    const scale = zoom > 0 ? 1 / zoom : 1;
    ctx.lineWidth = 1.2 * scale;
    const hoverState = getShapeResizeHover();
    const hover =
      hoverState && hoverState.id === shape.id ? hoverState.handle : null;
    handles.forEach((handle) => {
      const radius =
        hover && handle.type === hover
          ? (handleRadius + 2) * scale
          : handleRadius * scale;
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  function getShapeResizeHandleAtPoint(shape, point) {
    if (!shape?.shapeType || !point) return null;
    const handles = getShapeResizeHandles(shape);
    const zoom = getBoardZoom();
    const scale = zoom > 0 ? 1 / zoom : 1;
    const hitRadius = handleHitRadius * scale;
    for (let i = 0; i < handles.length; i += 1) {
      const handle = handles[i];
      const dx = point.x - handle.x;
      const dy = point.y - handle.y;
      if (Math.hypot(dx, dy) <= hitRadius) {
        return handle.type;
      }
    }
    return null;
  }

  function startShapeResize(shape, handle) {
    if (!shape?.start || !shape?.end || !handle) return;
    setResizingShape(true);
    setShapeResizeHandle(handle);
    setShapeResizeId(shape.id);
    setShapeResizeHover({ id: shape.id, handle });
    setShapeResizeSnapshot({
      start: { x: shape.start.x, y: shape.start.y },
      end: { x: shape.end.x, y: shape.end.y },
    });
  }

  function updateShapeResize(point, constrain) {
    const resizingShape = getResizingShape();
    const shapeResizeSnapshot = getShapeResizeSnapshot();
    const shapeResizeId = getShapeResizeId();
    if (!resizingShape || !shapeResizeSnapshot || !shapeResizeId || !point) {
      return;
    }
    const shape = getShapeById(shapeResizeId);
    if (!shape?.start || !shape?.end) return;
    const shapeResizeHandle = getShapeResizeHandle();
    if (shape.shapeType === toolLine) {
      if (shapeResizeHandle === "start") {
        shape.start = { x: point.x, y: point.y };
        shape.end = {
          x: shapeResizeSnapshot.end.x,
          y: shapeResizeSnapshot.end.y,
        };
      } else if (shapeResizeHandle === "end") {
        shape.start = {
          x: shapeResizeSnapshot.start.x,
          y: shapeResizeSnapshot.start.y,
        };
        shape.end = { x: point.x, y: point.y };
      }
      redrawCanvas();
      scheduleLinkUpdate();
      return;
    }
    const selectionBounds = getSelectionBounds(shape);
    if (!selectionBounds) return;
    let anchor = { x: selectionBounds.x, y: selectionBounds.y };
    let target = { x: point.x, y: point.y };
    switch (shapeResizeHandle) {
      case "nw":
        anchor = {
          x: selectionBounds.x + selectionBounds.width,
          y: selectionBounds.y + selectionBounds.height,
        };
        break;
      case "ne":
        anchor = {
          x: selectionBounds.x,
          y: selectionBounds.y + selectionBounds.height,
        };
        break;
      case "sw":
        anchor = {
          x: selectionBounds.x + selectionBounds.width,
          y: selectionBounds.y,
        };
        break;
      case "se":
      default:
        anchor = { x: selectionBounds.x, y: selectionBounds.y };
        break;
    }
    if (constrain) {
      target = getConstrainedPoint(anchor, target);
    }
    const padding = getShapeHitPadding(shape);
    const minX = Math.min(anchor.x, target.x);
    const maxX = Math.max(anchor.x, target.x);
    const minY = Math.min(anchor.y, target.y);
    const maxY = Math.max(anchor.y, target.y);
    let startX = minX + padding;
    let endX = maxX - padding;
    let startY = minY + padding;
    let endY = maxY - padding;
    if (endX - startX < 1) {
      const midX = (minX + maxX) / 2;
      startX = midX - 0.5;
      endX = midX + 0.5;
    }
    if (endY - startY < 1) {
      const midY = (minY + maxY) / 2;
      startY = midY - 0.5;
      endY = midY + 0.5;
    }
    shape.start = { x: startX, y: startY };
    shape.end = { x: endX, y: endY };
    redrawCanvas();
    scheduleLinkUpdate();
  }

  function finishShapeResize() {
    if (!getResizingShape()) return false;
    let resized = false;
    const shapeResizeId = getShapeResizeId();
    const shapeResizeSnapshot = getShapeResizeSnapshot();
    const shape = shapeResizeId ? getShapeById(shapeResizeId) : null;
    if (shape && shapeResizeSnapshot && shape.start && shape.end) {
      if (
        shape.start.x !== shapeResizeSnapshot.start.x ||
        shape.start.y !== shapeResizeSnapshot.start.y ||
        shape.end.x !== shapeResizeSnapshot.end.x ||
        shape.end.y !== shapeResizeSnapshot.end.y
      ) {
        resized = true;
      }
    }
    setResizingShape(false);
    setShapeResizeHandle(null);
    setShapeResizeSnapshot(null);
    setShapeResizeId(null);
    setShapeResizeHover(null);
    return resized;
  }

  function updateShapeResizeHover(point) {
    if (getCurrentTool() !== toolSelect || !point) {
      if (getShapeResizeHover()) {
        setShapeResizeHover(null);
        redrawCanvas();
      }
      return;
    }
    if (
      getDraggingShape() ||
      getDraggingMixed() ||
      getResizingShape() ||
      getIsMarqueeSelecting()
    ) {
      return;
    }
    const shape = getSingleSelectedShape();
    if (!shape?.shapeType) {
      if (getShapeResizeHover()) {
        setShapeResizeHover(null);
        redrawCanvas();
      }
      return;
    }
    const handle = getShapeResizeHandleAtPoint(shape, point);
    const next = handle ? { id: shape.id, handle } : null;
    const hoverState = getShapeResizeHover();
    const same =
      hoverState &&
      next &&
      hoverState.id === next.id &&
      hoverState.handle === next.handle;
    if (!same) {
      setShapeResizeHover(next);
      redrawCanvas();
    }
  }

  return {
    drawShapeResizeHandles,
    finishShapeResize,
    getShapeResizeHandleAtPoint,
    startShapeResize,
    updateShapeResize,
    updateShapeResizeHover,
  };
}
