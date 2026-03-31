import test from "node:test";
import assert from "node:assert/strict";

import { TOOL_DRAW, TOOL_ERASE } from "../features/board/board-config.js";
import {
  eraseDrawStroke,
  flattenLegacyEraserStrokes,
} from "../features/board/board-stroke-erasing.js";

function makeDrawStroke() {
  return {
    id: "draw-1",
    mode: TOOL_DRAW,
    size: 8,
    color: "#f00",
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ],
  };
}

function makeMiddleEraser() {
  return {
    id: "erase-1",
    mode: TOOL_ERASE,
    size: 16,
    points: [
      { x: 10, y: -4 },
      { x: 10, y: 4 },
    ],
  };
}

test("eraseDrawStroke removes only the touched middle section and keeps one stroke id", () => {
  const result = eraseDrawStroke(makeDrawStroke(), makeMiddleEraser());

  assert.equal(result.changed, true);
  assert.deepEqual(result.replacementIds, ["draw-1"]);
  assert.equal(result.strokes.length, 1);
  assert.equal(result.strokes[0].id, "draw-1");
  assert.equal(result.strokes[0].mode, TOOL_DRAW);
  assert.equal(result.strokes[0].paths.length, 2);
  assert.ok(result.strokes[0].paths[0].at(-1).x < 10);
  assert.ok(result.strokes[0].paths[1][0].x > 10);
});

test("eraseDrawStroke leaves a far-away stroke unchanged", () => {
  const stroke = makeDrawStroke();
  const result = eraseDrawStroke(stroke, {
    mode: TOOL_ERASE,
    size: 16,
    points: [
      { x: 200, y: 200 },
      { x: 220, y: 220 },
    ],
  });

  assert.equal(result.changed, false);
  assert.deepEqual(result.replacementIds, ["draw-1"]);
  assert.equal(result.strokes.length, 1);
  assert.equal(result.strokes[0], stroke);
});

test("flattenLegacyEraserStrokes removes erase strokes from saved draw data", () => {
  const nextStrokes = flattenLegacyEraserStrokes([
    makeDrawStroke(),
    makeMiddleEraser(),
  ]);

  assert.equal(nextStrokes.length, 1);
  assert.equal(nextStrokes[0].id, "draw-1");
  assert.equal(nextStrokes[0].mode, TOOL_DRAW);
  assert.equal(nextStrokes[0].paths.length, 2);
  assert.equal(nextStrokes.some((stroke) => stroke.mode === TOOL_ERASE), false);
});
