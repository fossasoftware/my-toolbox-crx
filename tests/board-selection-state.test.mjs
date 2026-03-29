import test from "node:test";
import assert from "node:assert/strict";

import { createBoardSelectionStateController } from "../features/board/board-selection-state-controller.js";

test("deleteSelectedShape snapshots the full pre-delete board before removing linked entities", () => {
  let boardStrokes = [
    {
      id: "shape-1",
      shapeType: "rect",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
    },
    {
      id: "shape-2",
      shapeType: "ellipse",
      start: { x: 140, y: 0 },
      end: { x: 240, y: 100 },
    },
  ];
  let boardItems = [
    {
      id: "item-1",
      x: 20,
      y: 20,
      width: 120,
      height: 80,
    },
  ];
  let boardLinks = [
    {
      id: "link-shape-shape",
      fromId: "shape-1",
      fromType: "shape",
      toId: "shape-2",
      toType: "shape",
    },
    {
      id: "link-note-shape",
      fromId: "item-1",
      fromType: "item",
      toId: "shape-1",
      toType: "shape",
    },
  ];

  const selectedShapeIds = new Set(["shape-1", "shape-2"]);
  const selectedItemIds = new Set(["item-1"]);
  const snapshots = [];

  const controller = createBoardSelectionStateController({
    documentRef: {
      createElementNS() {
        return {
          classList: { add() {}, remove() {} },
          setAttribute() {},
          appendChild() {},
          remove() {},
          style: {},
          querySelector() {
            return null;
          },
          dataset: {},
        };
      },
    },
    getBoardItems: () => boardItems,
    getBoardLinks: () => boardLinks,
    getBoardStrokes: () => boardStrokes,
    getDraggingMixed: () => false,
    getDraggingShape: () => false,
    getIsMarqueeSelecting: () => false,
    getItemElements: () => new Map(),
    getItemMenuTargetId: () => null,
    getItemSelectionElements: () => new Map(),
    getItemSelectionLayer: () => null,
    getLinkSource: () => null,
    getMarqueeAdditive: () => false,
    getMarqueeBaseItemSelection: () => null,
    getMarqueeBaseSelection: () => null,
    getMarqueeRect: () => null,
    getMarqueeStart: () => null,
    getMixedDragItemElements: () => null,
    getMixedDragItemSnapshot: () => null,
    getMixedDragShapeSnapshot: () => null,
    getMixedDragStart: () => null,
    getResizingShape: () => false,
    getSelectedItems: () => boardItems.filter((item) => selectedItemIds.has(item.id)),
    getSelectedItemIds: () => selectedItemIds,
    getSelectedShapes: () =>
      boardStrokes.filter((stroke) => selectedShapeIds.has(stroke.id)),
    getSelectedShapeIds: () => selectedShapeIds,
    getShapeById: (id) => boardStrokes.find((stroke) => stroke.id === id) || null,
    getShapeEditingId: () => null,
    getShapeSelectionFromShift: () => false,
    getShapeToolbarPinned: () => false,
    getShapeDragSnapshot: () => null,
    getShapeDragStart: () => null,
    getSelectableItemIdsInRect: () => [],
    getSelectableStrokeIdsInRect: () => [],
    getSelectionRect: () => null,
    getLinkType: (type) => type || "item",
    itemSelectionOutset: 8,
    linkTypeItem: "item",
    linkTypeShape: "shape",
    pushHistorySnapshot: () => {
      snapshots.push({
        strokes: structuredClone(boardStrokes),
        items: structuredClone(boardItems),
        links: structuredClone(boardLinks),
      });
    },
    redrawCanvas() {},
    renderItems() {},
    scheduleLinkUpdate() {},
    scheduleSave() {},
    setBoardItems: (value) => {
      boardItems = value;
    },
    setBoardLinks: (value) => {
      boardLinks = value;
    },
    setBoardStrokes: (value) => {
      boardStrokes = value;
    },
    setDraggingMixed() {},
    setDraggingShape() {},
    setIsMarqueeSelecting() {},
    setMarqueeAdditive() {},
    setMarqueeBaseItemSelection() {},
    setMarqueeBaseSelection() {},
    setMarqueeRect() {},
    setMarqueeStart() {},
    setMixedDragItemElements() {},
    setMixedDragItemSnapshot() {},
    setMixedDragShapeSnapshot() {},
    setMixedDragStart() {},
    setMixedDragUsesWindow() {},
    setResizingShape() {},
    setSelectedItemIds() {},
    setSelectedShapeIds() {},
    setShapeDragSnapshot() {},
    setShapeDragStart() {},
    setShapeResizeHandle() {},
    setShapeResizeHover() {},
    setShapeResizeId() {},
    setShapeResizeSnapshot() {},
    setShapeSelectionFromShift() {},
    setShapeToolbarPinned() {},
    selectionRadius: 6,
    updateEmptyState() {},
    updateItemPosition() {},
    closeItemMenu() {},
    closeShapeEditor() {},
    clearLinkSelection() {},
    isSelectableStroke: () => true,
  });

  const deleted = controller.deleteSelectedShape();

  assert.equal(deleted, true);
  assert.equal(snapshots.length, 2);
  assert.deepEqual(
    snapshots[0].links.map((link) => link.id),
    ["link-shape-shape", "link-note-shape"]
  );
  assert.deepEqual(snapshots[1].links, []);
});
