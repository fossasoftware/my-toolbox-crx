export function createBoardShapeStyleController({
  getBoardSettings,
  getSelectedShapeTargets,
  lineTool,
  redrawCanvas,
  scheduleHistoryCommit,
  scheduleLinkUpdate,
  scheduleSave,
  syncPenControls,
  updateEraserCursorSize,
}) {
  function applyShapeFillChoice(value) {
    const shapes = getSelectedShapeTargets();
    if (!shapes.length) return;
    const fillValue = value || "";
    shapes.forEach((shape) => {
      if (shape.shapeType === lineTool) {
        shape.fillColor = "";
        return;
      }
      shape.fillColor = fillValue;
    });
    getBoardSettings().shapeFill = fillValue;
    scheduleSave();
    scheduleHistoryCommit();
    redrawCanvas();
  }

  function applyShapeStrokeColorChoice(color) {
    if (!color) return;
    const shapes = getSelectedShapeTargets();
    if (!shapes.length) return;
    shapes.forEach((shape) => {
      shape.color = color;
    });
    getBoardSettings().color = color;
    syncPenControls();
    scheduleSave();
    scheduleHistoryCommit();
    redrawCanvas();
  }

  function applyShapeStrokeWidthChoice(size) {
    if (!Number.isFinite(size)) return;
    const shapes = getSelectedShapeTargets();
    if (!shapes.length) return;
    shapes.forEach((shape) => {
      shape.size = size;
    });
    getBoardSettings().size = size;
    updateEraserCursorSize();
    syncPenControls();
    scheduleSave();
    scheduleHistoryCommit();
    scheduleLinkUpdate();
    redrawCanvas();
  }

  return {
    applyShapeFillChoice,
    applyShapeStrokeColorChoice,
    applyShapeStrokeWidthChoice,
  };
}
