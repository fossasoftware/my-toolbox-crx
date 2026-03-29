import test from "node:test";
import assert from "node:assert/strict";

import { createBoardHistoryManager } from "../features/board/board-history.js";

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

test("board history supports undo and redo across captured snapshots", () => {
  const history = createBoardHistoryManager({ historyLimit: 5 });
  const stateOne = { value: 1 };
  const stateTwo = { value: 2 };

  assert.equal(history.captureSnapshot(stateOne, cloneState), true);
  assert.equal(history.captureSnapshot(stateTwo, cloneState), true);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);

  const undone = history.undo();
  assert.deepEqual(undone, stateOne);
  assert.equal(history.canRedo(), true);

  const redone = history.redo();
  assert.deepEqual(redone, stateTwo);
  assert.equal(history.canRedo(), false);
});

test("syncCurrentSignature preserves redo when the applied state was normalized", () => {
  const history = createBoardHistoryManager({ historyLimit: 5 });
  const stateOne = { value: 1 };
  const stateTwo = { value: 2 };

  history.captureSnapshot(stateOne, cloneState);
  history.captureSnapshot(stateTwo, cloneState);

  const undone = history.undo();
  assert.deepEqual(undone, stateOne);
  assert.equal(history.canRedo(), true);

  const normalizedAppliedState = { value: 1, normalized: true };
  history.syncCurrentSignature(normalizedAppliedState);

  const captured = history.captureSnapshot(normalizedAppliedState, cloneState);
  assert.equal(captured, false);
  assert.equal(history.canRedo(), true);
  assert.deepEqual(history.redo(), stateTwo);
});
