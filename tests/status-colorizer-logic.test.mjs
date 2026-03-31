import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

async function loadStatusColorizerLogic() {
  const source = await fs.readFile(
    new URL(
      "../features/status-colorizer/status-colorizer-logic.js",
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
  return context.MyToolboxStatusColorizerLogic;
}

test("normalizeStatusName trims and lowercases values", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(logic.normalizeStatusName(" Closed "), "closed");
  assert.equal(logic.normalizeStatusName(""), "");
  assert.equal(logic.normalizeStatusName(null), "");
});

test("buildStatusLookup indexes primary names and aliases once", async () => {
  const logic = await loadStatusColorizerLogic();

  const lookup = logic.buildStatusLookup([
    {
      statusName: "Closed",
      aliases: ["Done", " completed "],
      backgroundColor: "#000000",
      textColor: "#ffffff",
    },
    {
      statusName: "done",
      backgroundColor: "#111111",
      textColor: "#eeeeee",
    },
  ]);

  assert.equal(lookup.size, 3);
  assert.equal(lookup.get("closed")?.backgroundColor, "#000000");
  assert.equal(lookup.get("done")?.backgroundColor, "#000000");
  assert.equal(lookup.get("completed")?.backgroundColor, "#000000");
});

test("findStatusSettingFromLookup resolves aliases and ignores blanks", async () => {
  const logic = await loadStatusColorizerLogic();
  const lookup = logic.buildStatusLookup([
    {
      statusName: "In Progress",
      statusAliases: ["WIP"],
      backgroundColor: "#0747A6",
      textColor: "#ffffff",
      animationClass: "ribbon",
      primaryColor: "#0747A6",
      secondaryColor: "#B0C4DE",
    },
  ]);

  assert.equal(
    logic.findStatusSettingFromLookup(lookup, " wip ")?.statusName,
    "in progress"
  );
  assert.equal(
    logic.findStatusSettingFromLookup(lookup, "in progress")?.animationClass,
    "ribbon"
  );
  assert.equal(logic.findStatusSettingFromLookup(lookup, ""), null);
});

test("normalizeStatusSetting fills ribbon fallback colors", async () => {
  const logic = await loadStatusColorizerLogic();
  const normalized = logic.normalizeStatusSetting({
    statusName: "Blocked",
    backgroundColor: "#ff0000",
    animationClass: "ribbon",
  });

  assert.equal(normalized.statusName, "blocked");
  assert.equal(normalized.backgroundColor, "#ff0000");
  assert.equal(normalized.textColor, "");
  assert.equal(normalized.animationClass, "ribbon");
  assert.equal(normalized.primaryColor, "#ff0000");
  assert.equal(normalized.secondaryColor, "#ff0000");
});

test("getStatusRibbonBackground builds the expected repeating gradient", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.getStatusRibbonBackground({
      primaryColor: "#111111",
      secondaryColor: "#eeeeee",
    }),
    "repeating-linear-gradient(45deg, #111111, #111111 10px, #eeeeee 10px, #eeeeee 20px)"
  );
});
