import test from "node:test";
import assert from "node:assert/strict";

import {
  ERASER_SIZE_MIN,
  TOOL_DRAW,
  TOOL_ERASE,
  ZOOM_MAX,
  ZOOM_MIN,
} from "../features/board/board-config.js";
import {
  makeDefaultBoardState,
  makeDefaultBoardViewportState,
  normalizeBoardState,
  normalizeBoardViewportState,
} from "../features/board/board-model.js";

test("makeDefaultBoardState uses the configured minimum eraser size", () => {
  const state = makeDefaultBoardState();

  assert.equal(state.settings.eraserSize, ERASER_SIZE_MIN);
});

test("makeDefaultBoardViewportState starts at the default zoom and origin", () => {
  assert.deepEqual(makeDefaultBoardViewportState(), {
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
});

test("normalizeBoardState clamps eraserSize to the minimum value", () => {
  const state = normalizeBoardState({
    settings: {
      eraserSize: 4,
    },
  });

  assert.equal(state.settings.eraserSize, ERASER_SIZE_MIN);
});

test("normalizeBoardViewportState clamps zoom and sanitizes pan", () => {
  assert.deepEqual(
    normalizeBoardViewportState({
      zoom: ZOOM_MAX + 10,
      pan: { x: 120, y: "bad" },
    }),
    {
      zoom: ZOOM_MAX,
      pan: { x: 120, y: 0 },
    }
  );

  assert.deepEqual(normalizeBoardViewportState({ zoom: ZOOM_MIN - 1 }), {
    zoom: ZOOM_MIN,
    pan: { x: 0, y: 0 },
  });
});

test("normalizeBoardState rewrites legacy erase strokes into normalized draw paths", () => {
  const state = normalizeBoardState({
    strokes: [
      {
        id: "draw-1",
        mode: TOOL_DRAW,
        size: 8,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
        ],
      },
      {
        id: "erase-1",
        mode: TOOL_ERASE,
        size: 16,
        points: [
          { x: 10, y: -4 },
          { x: 10, y: 4 },
        ],
      },
    ],
    items: [],
    settings: {
      eraserSize: 4,
    },
  });

  assert.equal(state.strokes.length, 1);
  assert.equal(state.strokes[0].id, "draw-1");
  assert.equal(state.strokes[0].mode, TOOL_DRAW);
  assert.equal(state.strokes[0].paths.length, 2);
  assert.equal(state.strokes.some((stroke) => stroke.mode === TOOL_ERASE), false);
  assert.equal(state.settings.eraserSize, ERASER_SIZE_MIN);
});
