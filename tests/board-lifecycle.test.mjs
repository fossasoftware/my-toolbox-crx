import test from "node:test";
import assert from "node:assert/strict";

import { createBoardLifecycleController } from "../features/board/board-lifecycle-controller.js";

test("initializeBoard restores viewport after items are rendered", async () => {
  const callOrder = [];
  const boardState = {
    items: [],
    strokes: [],
    links: [],
  };

  const lifecycle = createBoardLifecycleController({
    applyViewportState: async () => {
      callOrder.push("applyViewportState");
    },
    closeItemMenu() {},
    closeLinkEditor() {},
    closeShapeEditor() {},
    consoleRef: console,
    documentRef: {
      getElementById(id) {
        return id === "boardTab" ? {} : null;
      },
    },
    getBoardState: () => boardState,
    getEmptyState: () => null,
    getHotkeysBound: () => true,
    hideLinkControls() {},
    loadAutosavePreference() {
      callOrder.push("loadAutosavePreference");
    },
    loadBoardState: async () => boardState,
    loadBoardViewportState: async () => ({ zoom: 1.5, pan: { x: 10, y: 20 } }),
    pushHistorySnapshot() {},
    redrawCanvas() {
      callOrder.push("redrawCanvas");
    },
    renderItems() {
      callOrder.push("renderItems");
    },
    resetHistory() {},
    scheduleSave() {},
    setBoardState() {},
    setHotkeysBound() {},
    setSelectedLinkId() {},
    setTool() {
      callOrder.push("setTool");
    },
    setupBoardBackupControls() {},
    setupCanvas() {},
    setupEraserMenu() {},
    setupHelpControls() {},
    setupInputs() {},
    setupItemMenu() {},
    setupLinkControls() {},
    setupPenMenu() {},
    setupShapeToolbar() {},
    setupToolbar() {},
    toolSelect: "select",
    updateHistoryButtons() {},
    windowRef: {
      addEventListener() {},
    },
    handleBoardHotkeys() {},
  });

  await lifecycle.initializeBoard();

  assert.ok(callOrder.indexOf("renderItems") !== -1);
  assert.ok(callOrder.indexOf("applyViewportState") !== -1);
  assert.ok(
    callOrder.indexOf("renderItems") < callOrder.indexOf("applyViewportState")
  );
  assert.ok(
    callOrder.indexOf("applyViewportState") < callOrder.indexOf("redrawCanvas")
  );
});
