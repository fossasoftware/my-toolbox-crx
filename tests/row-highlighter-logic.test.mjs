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

test("normalizePriority accepts only integer priorities from 0 to 10", async () => {
  const logic = await loadRowHighlighterLogic();

  assert.equal(logic.normalizePriority(0), 0);
  assert.equal(logic.normalizePriority("10"), 10);
  assert.equal(logic.normalizePriority(-1), 0);
  assert.equal(logic.normalizePriority(11), 0);
  assert.equal(logic.normalizePriority(1.5), 0);
  assert.equal(logic.normalizePriority("bad"), 0);
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
  assert.equal(matchers[0].priority, 0);
});

test("keywordMatchesText matches complete words and phrases only", async () => {
  const logic = await loadRowHighlighterLogic();

  assert.equal(logic.keywordMatchesText("AI", "AI review needed"), true);
  assert.equal(logic.keywordMatchesText("AI", "Waiting on AI, please"), true);
  assert.equal(logic.keywordMatchesText("AI", "Failing integration"), false);
  assert.equal(logic.keywordMatchesText("L1", "Labels: L1"), true);
  assert.equal(logic.keywordMatchesText("L1", "Labels: L10"), false);
  assert.equal(
    logic.keywordMatchesText("customer reply", "Pending customer reply."),
    true
  );
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
  assert.equal(logic.findMatchedHighlight(matchers, "Issue is unblocked"), null);
  assert.equal(logic.findMatchedHighlight(matchers, "No match here"), null);
});

test("findMatchedHighlight prefers the highest priority matching keyword set", async () => {
  const logic = await loadRowHighlighterLogic();

  const matchers = logic.compileHighlightMatchers([
    {
      keyword: "AI",
      color: "#ff0",
      priority: 1,
    },
    {
      keyword: "blocked",
      color: "#f00",
      priority: 5,
    },
    {
      keyword: "review",
      color: "#0f0",
      priority: 5,
    },
  ]);

  assert.equal(
    logic.findMatchedHighlight(matchers, "AI work is blocked in review")?.color,
    "#f00"
  );
  assert.equal(
    logic.findMatchedHighlight(matchers, "AI work needs review")?.color,
    "#0f0"
  );
});
