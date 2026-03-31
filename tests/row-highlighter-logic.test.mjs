import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

async function loadRowHighlighterLogic() {
  const source = await fs.readFile(
    new URL(
      "../features/row-highlighter/row-highlighter-logic.js",
      import.meta.url
    ),
    "utf8"
  );

  const context = {
    globalThis: {},
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.MyToolboxRowHighlighterLogic;
}

test("normalizeKeyword trims and lowercases values", async () => {
  const logic = await loadRowHighlighterLogic();

  assert.equal(logic.normalizeKeyword(" Waiting "), "waiting");
  assert.equal(logic.normalizeKeyword(""), "");
  assert.equal(logic.normalizeKeyword(null), "");
});

test("normalizeSearchText collapses whitespace and lowercases", async () => {
  const logic = await loadRowHighlighterLogic();

  assert.equal(
    logic.normalizeSearchText("  Waiting   For   Customer \n "),
    "waiting for customer"
  );
});

test("getKeywordVariants merges primary keyword and aliases", async () => {
  const logic = await loadRowHighlighterLogic();

  assert.deepEqual(
    [...logic.getKeywordVariants({
      keyword: "Blocked",
      aliases: [" Waiting ", "blocked", ""],
    })],
    ["blocked", "waiting", "blocked"]
  );
});

test("compileHighlightMatchers normalizes aliases and ignores disabled entries", async () => {
  const logic = await loadRowHighlighterLogic();

  const matchers = logic.compileHighlightMatchers([
    {
      keyword: "Escalated",
      aliases: ["Hot", " escalated "],
      color: "#ff0000",
    },
    {
      keyword: "Ignore",
      color: "#000000",
      enabled: false,
    },
  ]);

  assert.equal(matchers.length, 1);
  assert.equal(matchers[0].color, "#ff0000");
  assert.deepEqual([...matchers[0].keywords], ["escalated", "hot"]);
});

test("findMatchedHighlight resolves the first matching keyword set", async () => {
  const logic = await loadRowHighlighterLogic();

  const matchers = logic.compileHighlightMatchers([
    {
      keyword: "waiting",
      aliases: ["pending"],
      color: "#ff0",
    },
    {
      keyword: "blocked",
      color: "#f00",
    },
  ]);

  assert.equal(
    logic.findMatchedHighlight(matchers, "Issue is pending customer reply")?.color,
    "#ff0"
  );
  assert.equal(
    logic.findMatchedHighlight(matchers, "Issue is blocked in review")?.color,
    "#f00"
  );
  assert.equal(logic.findMatchedHighlight(matchers, "No match here"), null);
});
