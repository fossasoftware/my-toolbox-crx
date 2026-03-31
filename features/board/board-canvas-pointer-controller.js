export function createBoardCanvasPointerController({
  blurActiveBoardEditors,
  clearLinkPopup,
  clearLinkSelection,
  closeEraserPanel,
  closePenPanel,
  commitShapeTextEditing,
  createId,
  drawStroke,
  drawStrokeSegment,
  findLineTextAtPoint,
  findLinkTextAtPoint,
  findLinkableShapeAtPoint,
  findShapeAtPoint,
  finishBoardPan,
  finishMarqueeSelection,
  finishMixedDrag,
  finishShapeDrag,
  finishShapeResize,
  getActiveShape,
  getActiveStroke,
  getBoardSettings,
  getBoardStrokes,
  getCanvas,
  getCanvasPoint,
  getConstrainedPoint,
  getCtx,
  getCurrentTool,
  getDraggingMixed,
  getDraggingShape,
  getDrawing,
  getIsMarqueeSelecting,
  getMixedDragUsesWindow,
  getResizingShape,
  getSelectedItemIds,
  getSelectedShapeIds,
  getSelectedShapeTargets,
  getShapeEditingId,
  getShapeResizeHandleAtPoint,
  getSingleSelectedShape,
  getStage,
  handleLinkSelection,
  inkTools,
  isBoardPanning,
  isEraserPanelOpen,
  isLinkingModeActive,
  isPenPanelOpen,
  isShapeSelected,
  isShapeVisible,
  linkTypeShape,
  makeLinkEndpoint,
  moveMixedDrag,
  moveSelectedShape,
  pushHistorySnapshot,
  redrawCanvas,
  removeShapesByEraser,
  scheduleSave,
  selectLink,
  selectShape,
  setActiveShape,
  setActiveStroke,
  setDrawing,
  setTool,
  shapeTools,
  startBoardPan,
  startLinkTextEditing,
  startMarqueeSelection,
  startMixedDrag,
  startShapeDrag,
  startShapeResize,
  startShapeTextEditing,
  toggleShapeSelection,
  toolDraw,
  toolErase,
  toolHand,
  toolLine,
  toolSelect,
  updateBoardPan,
  updateEraserCursor,
  updateEraserCursorSize,
  updateEmptyState,
  updateMarqueeSelection,
  updatePenCursor,
  updateShapeResize,
  updateShapeResizeHover,
}) {
  let erasePreviewRaf = 0;
  let erasePreviewStroke = null;

  function scheduleErasePreviewRedraw(previewStroke) {
    erasePreviewStroke = previewStroke;
    if (erasePreviewRaf) {
      return;
    }

    erasePreviewRaf = requestAnimationFrame(() => {
      erasePreviewRaf = 0;
      const nextPreview = erasePreviewStroke;
      erasePreviewStroke = null;
      redrawCanvas(nextPreview);
    });
  }

  function cancelErasePreviewRedraw() {
    if (erasePreviewRaf) {
      cancelAnimationFrame(erasePreviewRaf);
      erasePreviewRaf = 0;
    }
    erasePreviewStroke = null;
  }

  function onCanvasDoubleClick(event) {
    if (!getCtx() || getCurrentTool() !== toolSelect) return;
    const point = getCanvasPoint(event);
    const hit = findShapeAtPoint(point);
    if (hit && hit.shapeType) {
      event.preventDefault();
      event.stopPropagation();
      selectShape(hit);
      startShapeTextEditing(hit);
      return;
    }
    const textHit = findLineTextAtPoint(point);
    if (textHit) {
      event.preventDefault();
      event.stopPropagation();
      selectShape(textHit);
      startShapeTextEditing(textHit);
      return;
    }
    const linkTextHit = findLinkTextAtPoint(point);
    if (!linkTextHit) return;
    event.preventDefault();
    event.stopPropagation();
    selectLink(linkTextHit.id);
    startLinkTextEditing(linkTextHit);
  }

  function onCanvasPointerDown(event) {
    if (!getCtx()) return;
    blurActiveBoardEditors();
    clearLinkPopup();
    const currentTool = getCurrentTool();
    const isRightButton = event.button === 2;
    if (currentTool === toolHand || isRightButton) {
      event.preventDefault();
      getCanvas()?.setPointerCapture(event.pointerId);
      startBoardPan(event);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    if (currentTool === toolDraw && isPenPanelOpen()) {
      closePenPanel();
    }
    if (currentTool === toolErase && isEraserPanelOpen()) {
      closeEraserPanel();
    }
    if (getShapeEditingId()) {
      commitShapeTextEditing();
    }
    const point = getCanvasPoint(event);
    getCanvas()?.setPointerCapture(event.pointerId);
    if (isLinkingModeActive()) {
      const hit = findLinkableShapeAtPoint(point);
      if (hit) {
        event.stopPropagation();
        handleLinkSelection(makeLinkEndpoint(linkTypeShape, hit.id), event);
      } else {
        clearLinkSelection();
      }
      return;
    }
    if (currentTool === toolSelect) {
      const selectedShape = getSingleSelectedShape();
      if (selectedShape?.shapeType) {
        const resizeHandle = getShapeResizeHandleAtPoint(selectedShape, point);
        if (resizeHandle) {
          startShapeResize(selectedShape, resizeHandle);
          return;
        }
      }
      const hit = findShapeAtPoint(point);
      if (hit) {
        if (
          hit.shapeType &&
          isShapeSelected(hit.id) &&
          getSelectedShapeTargets().length === 1
        ) {
          const resizeHandle = getShapeResizeHandleAtPoint(hit, point);
          if (resizeHandle) {
            startShapeResize(hit, resizeHandle);
            return;
          }
        }
        if (event.shiftKey) {
          toggleShapeSelection(hit);
          return;
        }
        if (!isShapeSelected(hit.id)) {
          selectShape(hit);
        }
        if (getSelectedShapeIds().size && getSelectedItemIds().size) {
          startMixedDrag(point);
        } else {
          startShapeDrag(point);
        }
      } else {
        startMarqueeSelection(point, event.shiftKey);
      }
      return;
    }
    if (!inkTools.has(currentTool)) return;
    const settings = getBoardSettings();
    if (currentTool === toolDraw || currentTool === toolErase) {
      const size =
        currentTool === toolErase
          ? Number(settings.eraserSize) || settings.size
          : settings.size;
      const activeStroke = {
        id: createId("stroke"),
        mode: currentTool,
        color: settings.color,
        size,
        opacity: settings.opacity,
        points: [point],
      };
      setActiveStroke(activeStroke);
      setDrawing(true);
      if (currentTool === toolErase) {
        scheduleErasePreviewRedraw(activeStroke);
      } else {
        getBoardStrokes().push(activeStroke);
        drawStroke(activeStroke);
      }
      return;
    }
    if (shapeTools.has(currentTool)) {
      const activeShape = {
        id: createId("shape"),
        mode: "shape",
        shapeType: currentTool,
        color: settings.color,
        size: settings.size,
        fillColor: settings.shapeFill || "",
        start: point,
        end: point,
      };
      setActiveShape(activeShape);
      setDrawing(true);
      redrawCanvas(activeShape);
    }
  }

  function onCanvasPointerMove(event) {
    const stage = getStage();
    const rect = stage ? stage.getBoundingClientRect() : null;
    const point = rect ? getCanvasPoint(event, rect) : getCanvasPoint(event);
    updateEraserCursor(event);
    updatePenCursor(event);
    if (isBoardPanning()) {
      updateBoardPan(event);
      return;
    }
    if (getCurrentTool() === toolSelect) {
      updateShapeResizeHover(point);
    }
    if (getResizingShape() && getCurrentTool() === toolSelect) {
      updateShapeResize(point, event.shiftKey);
      return;
    }
    if (getDraggingMixed() && !getMixedDragUsesWindow() && getCurrentTool() === toolSelect) {
      moveMixedDrag(point);
      return;
    }
    if (getDraggingShape() && getCurrentTool() === toolSelect) {
      moveSelectedShape(point);
      return;
    }
    if (getIsMarqueeSelecting() && getCurrentTool() === toolSelect) {
      updateMarqueeSelection(point);
      return;
    }
    if (!getDrawing()) return;
    const activeStroke = getActiveStroke();
    if (activeStroke) {
      const points = activeStroke.points;
      points.push(point);
      const opacityValue = Number(
        Number.isFinite(activeStroke.opacity)
          ? activeStroke.opacity
          : getBoardSettings().opacity
      );
      if (activeStroke.mode === toolErase) {
        scheduleErasePreviewRedraw(activeStroke);
      } else if (activeStroke.mode === toolDraw && opacityValue < 0.99) {
        redrawCanvas();
      } else {
        drawStrokeSegment(activeStroke, points[points.length - 2], point);
      }
      return;
    }
    const activeShape = getActiveShape();
    if (activeShape) {
      const shouldConstrain = activeShape.shapeType !== toolLine && event.shiftKey;
      const nextPoint = shouldConstrain
        ? getConstrainedPoint(activeShape.start, point)
        : point;
      activeShape.end = nextPoint;
      redrawCanvas(activeShape);
    }
  }

  function onCanvasPointerUp() {
    if (isBoardPanning()) {
      finishBoardPan();
      return;
    }
    if (getResizingShape()) {
      const resized = finishShapeResize();
      if (resized) {
        scheduleSave();
        pushHistorySnapshot();
      }
      redrawCanvas();
      updateEmptyState();
      return;
    }
    if (getDraggingMixed() && !getMixedDragUsesWindow()) {
      const moved = finishMixedDrag();
      if (moved) {
        scheduleSave();
        pushHistorySnapshot();
      }
      updateEmptyState();
      return;
    }
    if (getDraggingShape()) {
      const moved = finishShapeDrag();
      if (moved) {
        scheduleSave();
        pushHistorySnapshot();
      }
      updateEmptyState();
      return;
    }
    if (getIsMarqueeSelecting()) {
      finishMarqueeSelection();
      return;
    }
    if (!getDrawing()) return;
    setDrawing(false);
    const finishedStroke = getActiveStroke();
    let strokeChanged = Boolean(finishedStroke && finishedStroke.mode !== toolErase);
    let addedShape = false;
    let createdShape = null;
    const activeShape = getActiveShape();
    if (activeShape) {
      if (isShapeVisible(activeShape)) {
        getBoardStrokes().push(activeShape);
        addedShape = true;
        createdShape = activeShape;
      }
      setActiveShape(null);
      redrawCanvas();
    }
    setActiveStroke(null);
    if (finishedStroke?.mode === toolErase) {
      cancelErasePreviewRedraw();
      strokeChanged = removeShapesByEraser(finishedStroke);
      redrawCanvas();
      updateEmptyState();
    }
    if (getCurrentTool() === toolErase) {
      updateEraserCursorSize();
    }
    if (strokeChanged || addedShape) {
      scheduleSave();
    }
    updateEmptyState();
    if (strokeChanged || addedShape) {
      pushHistorySnapshot();
    }
    if (addedShape && createdShape) {
      setTool(toolSelect);
      selectShape(createdShape);
    }
  }

  return {
    onCanvasDoubleClick,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  };
}
