import {
  flattenStrokePaths,
  getStrokePaths,
  translateStrokePaths,
} from "./board-stroke-paths.js";

export function createBoardSelectionStateController({
  documentRef,
  getBoardItems,
  getBoardLinks,
  getBoardStrokes,
  getDraggingMixed,
  getDraggingShape,
  getIsMarqueeSelecting,
  getItemElements,
  getItemMenuTargetId,
  getItemSelectionElements,
  getItemSelectionLayer,
  getLinkSource,
  getMarqueeAdditive,
  getMarqueeBaseItemSelection,
  getMarqueeBaseSelection,
  getMarqueeRect,
  getMarqueeStart,
  getMixedDragItemElements,
  getMixedDragItemSnapshot,
  getMixedDragShapeSnapshot,
  getMixedDragStart,
  getResizingShape,
  getSelectedItems,
  getSelectedItemIds,
  getSelectedShapes,
  getSelectedShapeIds,
  getShapeById,
  getShapeEditingId,
  getShapeSelectionFromShift,
  getShapeToolbarPinned,
  getShapeDragSnapshot,
  getShapeDragStart,
  getSelectableItemIdsInRect,
  getSelectableStrokeIdsInRect,
  getSelectionRect,
  getLinkType,
  itemSelectionOutset,
  linkTypeItem,
  linkTypeShape,
  pushHistorySnapshot,
  redrawCanvas,
  renderItems,
  scheduleLinkUpdate,
  scheduleSave,
  setBoardItems,
  setBoardLinks,
  setBoardStrokes,
  setDraggingMixed,
  setDraggingShape,
  setIsMarqueeSelecting,
  setMarqueeAdditive,
  setMarqueeBaseItemSelection,
  setMarqueeBaseSelection,
  setMarqueeRect,
  setMarqueeStart,
  setMixedDragItemElements,
  setMixedDragItemSnapshot,
  setMixedDragShapeSnapshot,
  setMixedDragStart,
  setMixedDragUsesWindow,
  setResizingShape,
  setSelectedItemIds,
  setSelectedShapeIds,
  setShapeDragSnapshot,
  setShapeDragStart,
  setShapeResizeHandle,
  setShapeResizeHover,
  setShapeResizeId,
  setShapeResizeSnapshot,
  setShapeSelectionFromShift,
  setShapeToolbarPinned,
  selectionRadius,
  updateEmptyState,
  updateItemPosition,
  closeItemMenu,
  closeShapeEditor,
  clearLinkSelection,
  isSelectableStroke,
}) {
  function syncItemSelectionElement(id, selectionElement = null, itemOverride = null) {
    if (!id) return;
    const element = selectionElement || getItemSelectionElements().get(id);
    if (!element) return;
    const item =
      itemOverride || getBoardItems().find((entry) => entry.id === id);
    if (!item) return;
    const itemElement = getItemElements().get(id);
    const width = itemElement ? itemElement.offsetWidth : Number(item.width) || 0;
    const height = itemElement
      ? itemElement.offsetHeight
      : Number(item.height) || 0;
    const offset = itemSelectionOutset;
    const totalWidth = Math.max(1, width + offset * 2);
    const totalHeight = Math.max(1, height + offset * 2);
    element.style.left = `${item.x - offset}px`;
    element.style.top = `${item.y - offset}px`;
    element.style.width = `${totalWidth}px`;
    element.style.height = `${totalHeight}px`;
    element.setAttribute("width", totalWidth);
    element.setAttribute("height", totalHeight);
    element.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    const rect = element.querySelector("rect");
    if (rect) {
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", totalWidth);
      rect.setAttribute("height", totalHeight);
    }
  }

  function updateItemSelectionStyles() {
    const itemSelectionLayer = getItemSelectionLayer();
    if (!itemSelectionLayer) return;

    const nextSelectedIds = new Set();
    getSelectedItemIds().forEach((id) => {
      const item = getBoardItems().find((entry) => entry.id === id);
      if (!item) return;
      nextSelectedIds.add(id);
      let selectionElement = getItemSelectionElements().get(id);
      if (!selectionElement) {
        selectionElement = documentRef.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        selectionElement.classList.add("board-item-selection");
        selectionElement.dataset.id = id;
        selectionElement.setAttribute("aria-hidden", "true");
        const rect = documentRef.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.classList.add("board-item-selection-rect");
        rect.setAttribute("rx", selectionRadius);
        rect.setAttribute("ry", selectionRadius);
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        selectionElement.appendChild(rect);
        itemSelectionLayer.appendChild(selectionElement);
        getItemSelectionElements().set(id, selectionElement);
      }
      syncItemSelectionElement(id, selectionElement, item);
    });

    if (nextSelectedIds.size !== getSelectedItemIds().size) {
      setSelectedItemIds(nextSelectedIds);
    }

    for (const [id, element] of getItemSelectionElements()) {
      if (nextSelectedIds.has(id)) continue;
      if (element) {
        element.remove();
      }
      getItemSelectionElements().delete(id);
    }
  }

  function selectShape(shape) {
    if (!shape?.id) return;
    const selectedShapeIds = getSelectedShapeIds();
    const selectedItemIds = getSelectedItemIds();
    const isAlreadySelected =
      selectedShapeIds.size === 1 &&
      selectedShapeIds.has(shape.id) &&
      selectedItemIds.size === 0;
    if (isAlreadySelected) return;
    setShapeToolbarPinned(false);
    setSelectedShapeIds(new Set([shape.id]));
    setShapeSelectionFromShift(false);
    selectedItemIds.clear();
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function toggleShapeSelection(shape) {
    if (!shape?.id) return;
    setShapeSelectionFromShift(true);
    const selectedShapeIds = getSelectedShapeIds();
    if (selectedShapeIds.has(shape.id)) {
      selectedShapeIds.delete(shape.id);
    } else {
      selectedShapeIds.add(shape.id);
    }
    setShapeToolbarPinned(selectedShapeIds.size > 1);
    redrawCanvas();
  }

  function toggleItemSelection(item) {
    if (!item?.id) return;
    const selectedItemIds = getSelectedItemIds();
    if (selectedItemIds.has(item.id)) {
      selectedItemIds.delete(item.id);
    } else {
      selectedItemIds.add(item.id);
    }
    updateItemSelectionStyles();
  }

  function clearShapeSelection() {
    if (
      !getSelectedShapeIds().size &&
      !getSelectedItemIds().size &&
      !getDraggingShape() &&
      !getDraggingMixed() &&
      !getResizingShape()
    ) {
      return;
    }
    getSelectedShapeIds().clear();
    getSelectedItemIds().clear();
    setShapeToolbarPinned(false);
    setShapeSelectionFromShift(false);
    setDraggingShape(false);
    setDraggingMixed(false);
    setShapeDragStart(null);
    setShapeDragSnapshot(null);
    setMixedDragStart(null);
    setMixedDragShapeSnapshot(null);
    setMixedDragItemSnapshot(null);
    const mixedDragItemElements = getMixedDragItemElements();
    if (mixedDragItemElements) {
      mixedDragItemElements.forEach((element) =>
        element.classList.remove("is-dragging")
      );
    }
    setMixedDragItemElements(null);
    setMixedDragUsesWindow(false);
    setResizingShape(false);
    setShapeResizeHandle(null);
    setShapeResizeSnapshot(null);
    setShapeResizeId(null);
    setShapeResizeHover(null);
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeRect(null);
    setMarqueeAdditive(false);
    setMarqueeBaseSelection(null);
    setMarqueeBaseItemSelection(null);
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function selectAllElements() {
    const nextShapes = new Set();
    getBoardStrokes().forEach((stroke) => {
      if (isSelectableStroke(stroke)) {
        nextShapes.add(stroke.id);
      }
    });
    setSelectedShapeIds(nextShapes);
    setShapeSelectionFromShift(false);
    setShapeToolbarPinned(nextShapes.size > 0);
    setSelectedItemIds(new Set(getBoardItems().map((item) => item.id)));
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function startMarqueeSelection(point, additive) {
    if (!point) return;
    setIsMarqueeSelecting(true);
    setMarqueeStart({ x: point.x, y: point.y });
    setMarqueeRect({ x: point.x, y: point.y, width: 0, height: 0 });
    setMarqueeAdditive(Boolean(additive));
    setShapeSelectionFromShift(Boolean(additive));
    setMarqueeBaseSelection(new Set(getSelectedShapeIds()));
    setMarqueeBaseItemSelection(new Set(getSelectedItemIds()));
    if (!Boolean(additive)) {
      getSelectedShapeIds().clear();
      getSelectedItemIds().clear();
    }
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function updateMarqueeSelection(point) {
    if (!getIsMarqueeSelecting() || !getMarqueeStart() || !point) return;
    const rect = getSelectionRect(getMarqueeStart(), point);
    setMarqueeRect(rect);
    if (!rect) return;
    const minSize = 4;
    if (rect.width < minSize && rect.height < minSize) {
      if (getMarqueeAdditive()) {
        setSelectedShapeIds(new Set(getMarqueeBaseSelection()));
        setSelectedItemIds(new Set(getMarqueeBaseItemSelection()));
      } else {
        getSelectedShapeIds().clear();
        getSelectedItemIds().clear();
      }
      updateItemSelectionStyles();
      redrawCanvas();
      return;
    }
    const strokeIds = getSelectableStrokeIdsInRect(rect);
    const itemIds = getSelectableItemIdsInRect(rect);
    if (getMarqueeAdditive()) {
      const nextShapes = new Set(getMarqueeBaseSelection());
      strokeIds.forEach((id) => nextShapes.add(id));
      setSelectedShapeIds(nextShapes);
      const nextItems = new Set(getMarqueeBaseItemSelection());
      itemIds.forEach((id) => nextItems.add(id));
      setSelectedItemIds(nextItems);
    } else {
      setSelectedShapeIds(new Set(strokeIds));
      setSelectedItemIds(new Set(itemIds));
    }
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function finishMarqueeSelection() {
    if (!getIsMarqueeSelecting()) return;
    const rect = getMarqueeRect();
    const minSize = 4;
    if (
      rect &&
      rect.width < minSize &&
      rect.height < minSize &&
      !getMarqueeAdditive()
    ) {
      getSelectedShapeIds().clear();
      getSelectedItemIds().clear();
    }
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeRect(null);
    setMarqueeAdditive(false);
    setMarqueeBaseSelection(null);
    setMarqueeBaseItemSelection(null);
    setShapeToolbarPinned(getSelectedShapeIds().size > 0);
    updateItemSelectionStyles();
    redrawCanvas();
  }

  function startShapeDrag(point) {
    if (!point) return;
    const selectedShapes = getSelectedShapes();
    if (!selectedShapes.length) return;
    setDraggingShape(true);
    setShapeResizeHover(null);
    setShapeDragStart({ x: point.x, y: point.y });
    const snapshot = new Map();
    selectedShapes.forEach((shape) => {
      if (shape.shapeType && shape.start && shape.end) {
        snapshot.set(shape.id, {
          start: { x: shape.start.x, y: shape.start.y },
          end: { x: shape.end.x, y: shape.end.y },
        });
        return;
      }
      if (Array.isArray(shape.points) && shape.points.length) {
        snapshot.set(shape.id, {
          points: shape.points.map((entry) => ({ x: entry.x, y: entry.y })),
          paths: translateStrokePaths(getStrokePaths(shape), 0, 0),
        });
      }
    });
    setShapeDragSnapshot(snapshot);
    if (snapshot.size === 0) {
      setDraggingShape(false);
      setShapeDragStart(null);
      setShapeDragSnapshot(null);
    }
  }

  function moveSelectedShape(point) {
    const shapeDragStart = getShapeDragStart();
    const shapeDragSnapshot = getShapeDragSnapshot();
    if (!getDraggingShape() || !shapeDragStart || !shapeDragSnapshot || !point) {
      return;
    }
    const dx = point.x - shapeDragStart.x;
    const dy = point.y - shapeDragStart.y;
    const selectedShapes = getSelectedShapes();
    selectedShapes.forEach((shape) => {
      const snapshot = shapeDragSnapshot.get(shape.id);
      if (!snapshot) return;
      if (snapshot.paths?.length) {
        const nextPaths = translateStrokePaths(snapshot.paths, dx, dy);
        shape.paths = nextPaths;
        shape.points = flattenStrokePaths(nextPaths);
      } else if (snapshot.points && Array.isArray(shape.points)) {
        shape.points = snapshot.points.map((entry) => ({
          x: entry.x + dx,
          y: entry.y + dy,
        }));
      } else if (shape.start && shape.end && snapshot.start && snapshot.end) {
        shape.start = {
          x: snapshot.start.x + dx,
          y: snapshot.start.y + dy,
        };
        shape.end = {
          x: snapshot.end.x + dx,
          y: snapshot.end.y + dy,
        };
      }
    });
    redrawCanvas();
    scheduleLinkUpdate();
  }

  function finishShapeDrag() {
    if (!getDraggingShape()) return false;
    setDraggingShape(false);
    let moved = false;
    const shapeDragSnapshot = getShapeDragSnapshot();
    if (shapeDragSnapshot) {
      const selectedShapes = getSelectedShapes();
      for (const shape of selectedShapes) {
        const snapshot = shapeDragSnapshot.get(shape.id);
        if (!snapshot) continue;
        if (snapshot.points && Array.isArray(shape.points) && shape.points.length) {
          const current = shape.points[0];
          const original = snapshot.points[0];
          if (current && original) {
            if (current.x !== original.x || current.y !== original.y) {
              moved = true;
              break;
            }
          }
        } else if (shape.start && shape.end && snapshot.start && snapshot.end) {
          if (
            shape.start.x !== snapshot.start.x ||
            shape.start.y !== snapshot.start.y ||
            shape.end.x !== snapshot.end.x ||
            shape.end.y !== snapshot.end.y
          ) {
            moved = true;
            break;
          }
        }
      }
    }
    setShapeDragStart(null);
    setShapeDragSnapshot(null);
    return moved;
  }

  function startMixedDrag(point) {
    if (!point) return false;
    const selectedShapes = getSelectedShapes();
    const selectedItems = getSelectedItems();
    if (!selectedShapes.length && !selectedItems.length) return false;
    setDraggingMixed(true);
    setMixedDragUsesWindow(false);
    setShapeResizeHover(null);
    setMixedDragStart({ x: point.x, y: point.y });
    const shapeSnapshot = new Map();
    const itemSnapshot = new Map();
    const itemElements = [];
    selectedShapes.forEach((shape) => {
      if (shape.shapeType && shape.start && shape.end) {
        shapeSnapshot.set(shape.id, {
          start: { x: shape.start.x, y: shape.start.y },
          end: { x: shape.end.x, y: shape.end.y },
        });
        return;
      }
      if (Array.isArray(shape.points) && shape.points.length) {
        shapeSnapshot.set(shape.id, {
          points: shape.points.map((entry) => ({ x: entry.x, y: entry.y })),
          paths: translateStrokePaths(getStrokePaths(shape), 0, 0),
        });
      }
    });
    selectedItems.forEach((item) => {
      itemSnapshot.set(item.id, { x: item.x, y: item.y });
      const element = getItemElements().get(item.id);
      if (element) {
        element.classList.add("is-dragging");
        itemElements.push(element);
      }
    });
    setMixedDragShapeSnapshot(shapeSnapshot);
    setMixedDragItemSnapshot(itemSnapshot);
    setMixedDragItemElements(itemElements);
    if (shapeSnapshot.size === 0 && itemSnapshot.size === 0) {
      setDraggingMixed(false);
      setMixedDragStart(null);
      setMixedDragShapeSnapshot(null);
      setMixedDragItemSnapshot(null);
      itemElements.forEach((element) => element.classList.remove("is-dragging"));
      setMixedDragItemElements(null);
      setMixedDragUsesWindow(false);
      return false;
    }
    return true;
  }

  function moveMixedDrag(point) {
    const mixedDragStart = getMixedDragStart();
    const mixedDragShapeSnapshot = getMixedDragShapeSnapshot();
    const mixedDragItemSnapshot = getMixedDragItemSnapshot();
    if (
      !getDraggingMixed() ||
      !mixedDragStart ||
      (!mixedDragShapeSnapshot && !mixedDragItemSnapshot) ||
      !point
    ) {
      return;
    }
    const dx = point.x - mixedDragStart.x;
    const dy = point.y - mixedDragStart.y;
    if (mixedDragShapeSnapshot) {
      mixedDragShapeSnapshot.forEach((snapshot, shapeId) => {
        const shape = getShapeById(shapeId);
        if (!shape) return;
        if (snapshot.paths?.length) {
          const nextPaths = translateStrokePaths(snapshot.paths, dx, dy);
          shape.paths = nextPaths;
          shape.points = flattenStrokePaths(nextPaths);
        } else if (snapshot.points && Array.isArray(shape.points)) {
          shape.points = snapshot.points.map((entry) => ({
            x: entry.x + dx,
            y: entry.y + dy,
          }));
        } else if (
          shape.start &&
          shape.end &&
          snapshot.start &&
          snapshot.end
        ) {
          shape.start = {
            x: snapshot.start.x + dx,
            y: snapshot.start.y + dy,
          };
          shape.end = {
            x: snapshot.end.x + dx,
            y: snapshot.end.y + dy,
          };
        }
      });
    }
    if (mixedDragItemSnapshot) {
      mixedDragItemSnapshot.forEach((origin, itemId) => {
        updateItemPosition(itemId, origin.x + dx, origin.y + dy);
      });
    }
    redrawCanvas();
    scheduleLinkUpdate();
  }

  function finishMixedDrag() {
    if (!getDraggingMixed()) return false;
    setDraggingMixed(false);
    let moved = false;
    const mixedDragShapeSnapshot = getMixedDragShapeSnapshot();
    if (mixedDragShapeSnapshot) {
      for (const [shapeId, snapshot] of mixedDragShapeSnapshot.entries()) {
        const shape = getShapeById(shapeId);
        if (!shape) continue;
        if (snapshot.points && Array.isArray(shape.points) && shape.points.length) {
          const current = shape.points[0];
          const original = snapshot.points[0];
          if (current && original) {
            if (current.x !== original.x || current.y !== original.y) {
              moved = true;
              break;
            }
          }
        } else if (shape.start && shape.end && snapshot.start && snapshot.end) {
          if (
            shape.start.x !== snapshot.start.x ||
            shape.start.y !== snapshot.start.y ||
            shape.end.x !== snapshot.end.x ||
            shape.end.y !== snapshot.end.y
          ) {
            moved = true;
            break;
          }
        }
      }
    }
    const mixedDragItemSnapshot = getMixedDragItemSnapshot();
    if (!moved && mixedDragItemSnapshot) {
      for (const [itemId, origin] of mixedDragItemSnapshot.entries()) {
        const item = getBoardItems().find((entry) => entry.id === itemId);
        if (!item) continue;
        if (item.x !== origin.x || item.y !== origin.y) {
          moved = true;
          break;
        }
      }
    }
    setMixedDragStart(null);
    setMixedDragShapeSnapshot(null);
    setMixedDragItemSnapshot(null);
    const mixedDragItemElements = getMixedDragItemElements();
    if (mixedDragItemElements) {
      mixedDragItemElements.forEach((element) =>
        element.classList.remove("is-dragging")
      );
    }
    setMixedDragItemElements(null);
    setMixedDragUsesWindow(false);
    return moved;
  }

  function deleteSelectedShape() {
    const selectedShapes = getSelectedShapes();
    const selectedItems = getSelectedItems();
    if (!selectedShapes.length && !selectedItems.length) return false;

    // Flush the current selection state before destructive mutations so undo
    // always returns to the exact pre-delete board, even if a delayed history
    // commit has not fired yet.
    pushHistorySnapshot();

    const selectedStrokeIds = new Set(selectedShapes.map((shape) => shape.id));
    const selectedItemIdsSnapshot = new Set(selectedItems.map((item) => item.id));
    const selectedLinkShapeIds = new Set(
      selectedShapes.filter((shape) => shape.shapeType).map((shape) => shape.id)
    );

    setBoardStrokes(
      getBoardStrokes().filter((stroke) => !selectedStrokeIds.has(stroke.id))
    );

    if (selectedItemIdsSnapshot.size) {
      setBoardItems(
        getBoardItems().filter((item) => !selectedItemIdsSnapshot.has(item.id))
      );
    }

    let links = getBoardLinks();
    if (selectedLinkShapeIds.size) {
      links = links.filter((link) => {
        const fromType = getLinkType(link.fromType);
        const toType = getLinkType(link.toType);
        if (fromType === linkTypeShape && selectedLinkShapeIds.has(link.fromId)) {
          return false;
        }
        if (toType === linkTypeShape && selectedLinkShapeIds.has(link.toId)) {
          return false;
        }
        return true;
      });
    }
    if (selectedItemIdsSnapshot.size) {
      links = links.filter((link) => {
        const fromType = getLinkType(link.fromType);
        const toType = getLinkType(link.toType);
        if (fromType === linkTypeItem && selectedItemIdsSnapshot.has(link.fromId)) {
          return false;
        }
        if (toType === linkTypeItem && selectedItemIdsSnapshot.has(link.toId)) {
          return false;
        }
        return true;
      });
    }
    setBoardLinks(links);

    const linkSource = getLinkSource();
    if (linkSource?.type === linkTypeShape && selectedLinkShapeIds.has(linkSource.id)) {
      clearLinkSelection();
    }
    if (linkSource?.type === linkTypeItem && selectedItemIdsSnapshot.has(linkSource.id)) {
      clearLinkSelection();
    }
    if (getShapeEditingId() && selectedStrokeIds.has(getShapeEditingId())) {
      closeShapeEditor();
    }
    if (
      getItemMenuTargetId() &&
      selectedItemIdsSnapshot.has(getItemMenuTargetId())
    ) {
      closeItemMenu();
    }

    getSelectedShapeIds().clear();
    getSelectedItemIds().clear();
    setDraggingShape(false);
    setShapeDragStart(null);
    setShapeDragSnapshot(null);
    setResizingShape(false);
    setShapeResizeHandle(null);
    setShapeResizeSnapshot(null);
    setShapeResizeId(null);
    setMarqueeStart(null);
    setMarqueeRect(null);
    setIsMarqueeSelecting(false);
    setMarqueeAdditive(false);
    setMarqueeBaseSelection(null);
    setMarqueeBaseItemSelection(null);
    redrawCanvas();
    renderItems();
    scheduleLinkUpdate();
    scheduleSave();
    updateEmptyState();
    pushHistorySnapshot();
    return true;
  }

  function shouldDrawShapeSelection() {
    if (getShapeSelectionFromShift()) return true;
    return getSelectedShapeIds().size > 1;
  }

  return {
    clearShapeSelection,
    deleteSelectedShape,
    finishMarqueeSelection,
    finishMixedDrag,
    finishShapeDrag,
    selectAllElements,
    selectShape,
    shouldDrawShapeSelection,
    startMarqueeSelection,
    startMixedDrag,
    startShapeDrag,
    syncItemSelectionElement,
    toggleItemSelection,
    toggleShapeSelection,
    updateItemSelectionStyles,
    updateMarqueeSelection,
    moveMixedDrag,
    moveSelectedShape,
  };
}
