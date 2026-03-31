import test from "node:test";
import assert from "node:assert/strict";

import {
  buildStrokeWithPaths,
  normalizeStrokePath,
  translateStrokePaths,
} from "../features/board/board-stroke-paths.js";

test("normalizeStrokePath removes invalid and duplicate points", () => {
  const path = normalizeStrokePath([
    { x: 1, y: 2 },
    { x: 1, y: 2 },
    null,
    { x: Number.NaN, y: 4 },
    { x: 3, y: 4 },
  ]);

  assert.deepEqual(path, [
    { x: 1, y: 2 },
    { x: 3, y: 4 },
  ]);
});

test("buildStrokeWithPaths preserves metadata and flattens normalized paths", () => {
  const stroke = {
    id: "stroke-1",
    mode: "draw",
    color: "#fff",
  };

  const nextStroke = buildStrokeWithPaths(stroke, [
    [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }],
    [{ x: 20, y: 0 }],
  ]);

  assert.equal(nextStroke.id, "stroke-1");
  assert.equal(nextStroke.mode, "draw");
  assert.deepEqual(nextStroke.paths, [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }],
    [{ x: 20, y: 0 }],
  ]);
  assert.deepEqual(nextStroke.points, [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
  ]);
});

test("translateStrokePaths shifts every point without mutating the source paths", () => {
  const source = [
    [{ x: 0, y: 0 }, { x: 5, y: 5 }],
    [{ x: 10, y: 10 }],
  ];

  const translated = translateStrokePaths(source, 3, -2);

  assert.deepEqual(translated, [
    [{ x: 3, y: -2 }, { x: 8, y: 3 }],
    [{ x: 13, y: 8 }],
  ]);
  assert.deepEqual(source, [
    [{ x: 0, y: 0 }, { x: 5, y: 5 }],
    [{ x: 10, y: 10 }],
  ]);
});
