import test from "node:test";
import assert from "node:assert/strict";

import {
  colorsMatch,
  mixRgb,
  parseColorToRgb,
  parseHexColor,
  rgbToString,
} from "../features/board/board-color-utils.js";

test("parseHexColor supports both short and full hex values", () => {
  assert.deepEqual(parseHexColor("#abc"), { r: 170, g: 187, b: 204 });
  assert.deepEqual(parseHexColor("#AABBCC"), { r: 170, g: 187, b: 204 });
  assert.equal(parseHexColor("nope"), null);
});

test("parseColorToRgb parses rgb strings and rejects invalid input", () => {
  assert.deepEqual(parseColorToRgb("rgb(10, 20, 30)"), {
    r: 10,
    g: 20,
    b: 30,
  });
  assert.equal(parseColorToRgb(""), null);
  assert.equal(parseColorToRgb(null), null);
});

test("colorsMatch normalizes equivalent color formats", () => {
  assert.equal(colorsMatch("#abc", "rgb(170, 187, 204)"), true);
  assert.equal(colorsMatch("#abc", "#000"), false);
});

test("mixRgb and rgbToString build interpolated rgb values", () => {
  const mixed = mixRgb(
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 200, b: 100 },
    0.5
  );

  assert.deepEqual(mixed, { r: 128, g: 100, b: 50 });
  assert.equal(rgbToString(mixed), "rgb(128, 100, 50)");
});
