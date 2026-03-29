import { createBoardId } from "./board-model.js";
import { eraseDrawStroke } from "./board-stroke-erasing.js";

export function createBoardShapeEraserController({
  clearLinkSelection,
  clearShapeDragState,
  clearShapeResizeState,
  closeShapeEditor,
  getBoardLinks,
  getBoardSettings,
  getBoardStrokes,
  getDraggingShape,
  getLinkSource,
  getLinkType,
  getSelectedShapeIds,
  getShapeBounds,
  getShapeEditingId,
  getShapeResizeId,
  linkTypeShape,
  pointToSegmentDistance,
  scheduleLinkUpdate,
  setBoardLinks,
  setBoardStrokes,
  toolLine,
}) {
  function removeShapesByEraser(eraser) {
    if (!eraser || !Array.isArray(eraser.points) || !eraser.points.length) {
      return false;
    }
    const settings = getBoardSettings();
    const baseSize = Math.max(
      1,
      Number(eraser.size) || Number(settings.eraserSize) || Number(settings.size) || 1
    );
    const radius = baseSize / 2;
    const padding = Math.max(1, radius + 2);
    const points = eraser.points;
    const hitIds = new Set();
    const selectedShapeIds = getSelectedShapeIds();
    const nextSelectedShapeIds = new Set(selectedShapeIds);
    const nextStrokes = [];
    let changed = false;

    getBoardStrokes().forEach((stroke) => {
      if (!stroke) return;

      if (!stroke.shapeType) {
        const erasedStroke = eraseDrawStroke(stroke, eraser, {
          createStrokeId: () => createBoardId("stroke"),
        });
        if (erasedStroke.changed) {
          changed = true;
          if (selectedShapeIds.has(stroke.id)) {
            nextSelectedShapeIds.delete(stroke.id);
            erasedStroke.replacementIds.forEach((id) => nextSelectedShapeIds.add(id));
          }
        }
        nextStrokes.push(...erasedStroke.strokes);
        return;
      }

      if (!stroke?.shapeType || !stroke.start || !stroke.end) {
        nextStrokes.push(stroke);
        return;
      }
      if (stroke.shapeType === toolLine) {
        const hit = points.some(
          (point) => pointToSegmentDistance(point, stroke.start, stroke.end) <= padding
        );
        if (hit) {
          hitIds.add(stroke.id);
          changed = true;
        } else {
          nextStrokes.push(stroke);
        }
        return;
      }
      const bounds = getShapeBounds(stroke.start, stroke.end);
      if (!bounds) return;
      const minX = bounds.x - padding;
      const maxX = bounds.x + bounds.width + padding;
      const minY = bounds.y - padding;
      const maxY = bounds.y + bounds.height + padding;
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        if (
          point.x >= minX &&
          point.x <= maxX &&
          point.y >= minY &&
          point.y <= maxY
        ) {
          hitIds.add(stroke.id);
          changed = true;
          break;
        }
      }
      if (!hitIds.has(stroke.id)) {
        nextStrokes.push(stroke);
      }
    });

    if (!changed) return false;

    setBoardStrokes(nextStrokes.filter((stroke) => !hitIds.has(stroke.id)));

    if (hitIds.size) {
      setBoardLinks(
        getBoardLinks().filter((link) => {
          const fromType = getLinkType(link.fromType);
          const toType = getLinkType(link.toType);
          if (fromType === linkTypeShape && hitIds.has(link.fromId)) {
            return false;
          }
          if (toType === linkTypeShape && hitIds.has(link.toId)) {
            return false;
          }
          return true;
        })
      );
    }

    hitIds.forEach((id) => {
      nextSelectedShapeIds.delete(id);
    });
    selectedShapeIds.clear();
    nextSelectedShapeIds.forEach((id) => selectedShapeIds.add(id));

    const linkSource = getLinkSource();
    if (linkSource?.type === linkTypeShape && hitIds.has(linkSource.id)) {
      clearLinkSelection();
    }
    const shapeEditingId = getShapeEditingId();
    if (shapeEditingId && hitIds.has(shapeEditingId)) {
      closeShapeEditor();
    }
    const shapeResizeId = getShapeResizeId();
    if (shapeResizeId && hitIds.has(shapeResizeId)) {
      clearShapeResizeState();
    }
    if (getDraggingShape()) {
      clearShapeDragState();
    }

    scheduleLinkUpdate();
    return changed;
  }

  return {
    removeShapesByEraser,
  };
}
