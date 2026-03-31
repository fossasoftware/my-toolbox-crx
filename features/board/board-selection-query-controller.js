import {
  collectSelectedItems,
  collectSelectedStrokes,
  getSelectableItemIdsInRect,
  getSelectableStrokeIdsInRect,
  getShapeSelectionBoundsForToolbar,
} from "./board-selection.js";

export function createBoardSelectionQueryController({
  getBoardItems,
  getBoardStrokes,
  getSelectedItemIds,
  getSelectedShapeIds,
  getShapeHitPadding,
  isSelectableStroke,
  setSelectedItemIds,
  setSelectedShapeIds,
  updateItemSelectionStyles,
}) {
  function getSelectableStrokeIdsInRectFromState(rect) {
    return getSelectableStrokeIdsInRect(getBoardStrokes(), rect, {
      isSelectableStroke,
      getShapeHitPadding,
    });
  }

  function getSelectableItemIdsInRectFromState(rect) {
    return getSelectableItemIdsInRect(getBoardItems(), rect);
  }

  function isShapeSelected(id) {
    return Boolean(id && getSelectedShapeIds().has(id));
  }

  function getSelectedShapes() {
    const selectedIds = getSelectedShapeIds();
    if (!selectedIds.size) return [];
    const { selected, existingIds } = collectSelectedStrokes(
      getBoardStrokes(),
      selectedIds
    );
    if (existingIds.size !== selectedIds.size) {
      setSelectedShapeIds(existingIds);
    }
    return selected;
  }

  function getShapeById(id) {
    if (!id) return null;
    return getBoardStrokes().find((stroke) => stroke.id === id) || null;
  }

  function getSelectedShapeTargets() {
    return getSelectedShapes().filter((shape) => shape?.shapeType);
  }

  function getSingleSelectedShape() {
    const shapes = getSelectedShapeTargets();
    if (shapes.length !== 1) return null;
    return shapes[0];
  }

  function getSelectedItems() {
    const selectedIds = getSelectedItemIds();
    if (!selectedIds.size) return [];
    const { selected, existingIds } = collectSelectedItems(
      getBoardItems(),
      selectedIds
    );
    if (existingIds.size !== selectedIds.size) {
      setSelectedItemIds(existingIds);
      updateItemSelectionStyles();
    }
    return selected;
  }

  function getShapeSelectionBoundsForToolbarFromState(shapes) {
    return getShapeSelectionBoundsForToolbar(shapes, getShapeHitPadding);
  }

  return {
    getSelectableItemIdsInRect: getSelectableItemIdsInRectFromState,
    getSelectableStrokeIdsInRect: getSelectableStrokeIdsInRectFromState,
    getSelectedItems,
    getSelectedShapes,
    getSelectedShapeTargets,
    getShapeById,
    getShapeSelectionBoundsForToolbar: getShapeSelectionBoundsForToolbarFromState,
    getSingleSelectedShape,
    isShapeSelected,
  };
}
