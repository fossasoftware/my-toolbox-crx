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

async function loadStatusColorizerWorkerSource() {
  return fs.readFile(
    new URL(
      "../features/status-colorizer/status-colorizer-worker.js",
      import.meta.url
    ),
    "utf8"
  );
}

test("normalizeStatusName trims and lowercases values", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(logic.normalizeStatusName(" Closed "), "closed");
  assert.equal(logic.normalizeStatusName(""), "");
  assert.equal(logic.normalizeStatusName(null), "");
});

test("expandStatusTextCandidates resolves updated Jira button labels", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.deepEqual(
    [...logic.expandStatusTextCandidates(
      ["Awaiting reporter - Change status"]
    )],
    [
      "Awaiting reporter - Change status",
      "Awaiting reporter",
    ]
  );
  assert.deepEqual(
    [...logic.expandStatusTextCandidates("Status: Awaiting reporter")],
    ["Status: Awaiting reporter", "Awaiting reporter"]
  );
});

test("status surface strategy distinguishes wrappers from atomic lozenges", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.shouldUseNestedStatusBadge({
      tagName: "div",
      testId: "issue.fields.status.common.ui.status-lozenge.3",
    }),
    true
  );
  assert.equal(
    logic.shouldUseNestedStatusBadge({
      tagName: "button",
      testId: "issue.fields.status.common.ui.status-lozenge.4",
    }),
    false
  );
  assert.equal(
    logic.shouldUseNestedStatusBadge({
      tagName: "span",
      testId: "common-components-status-lozenge.status-lozenge",
    }),
    false
  );
  assert.equal(
    logic.shouldUseNestedStatusBadge({ isIssueTableCell: true }),
    true
  );
});

test("updated Jira text and workflow selectors are stable attributes", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.ticketButtonText,
    "[data-testid$='status-button--text'], [data-test-id$='status-button--text']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.workflowStatusNode,
    "g[data-drag-type='status']"
  );
  assert.equal(
    logic.isStatusBadgeTextTestId(
      "issue.fields.status.common.ui.status-lozenge.4--text"
    ),
    true
  );
});

test("status button border uses the painted base color", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.getStatusButtonBorderColor({
      animationClass: "glow",
      backgroundColor: "#006b7e",
      primaryColor: "#111111",
    }),
    "#006b7e"
  );
  assert.equal(
    logic.getStatusButtonBorderColor({
      animationClass: "ribbon",
      backgroundColor: "#0747a6",
      primaryColor: "#0052cc",
    }),
    "#0052cc"
  );
  assert.equal(logic.getStatusButtonBorderColor(null), "");
});

test("status button keeps its base color beneath the pseudo surface", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const surfaceRuleStart = source.indexOf(
    ".${STATUS_BUTTON_SURFACE_CLASS} {"
  );
  const surfaceRuleEnd = source.indexOf(
    ".${STATUS_BUTTON_SURFACE_CLASS}::before"
  );
  const surfaceRule = source.slice(surfaceRuleStart, surfaceRuleEnd);
  const trackedBackgrounds = source.match(
    /`var\(\$\{STATUS_VAR_BG\}, transparent\)`/g
  ) || [];

  assert.notEqual(surfaceRuleStart, -1);
  assert.notEqual(surfaceRuleEnd, -1);
  assert.match(
    surfaceRule,
    /background-color: var\(\$\{STATUS_VAR_BG\}, transparent\) !important;/
  );
  assert.equal(trackedBackgrounds.length, 2);
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

test("normalizeStatusSetting derives ribbon colors from the background", async () => {
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
  assert.equal(normalized.secondaryColor, "#ff3d3d");
});

test("normalizeStatusSetting uses legacy ribbon primaryColor as the migrated background", async () => {
  const logic = await loadStatusColorizerLogic();
  const normalized = logic.normalizeStatusSetting({
    statusName: "Open",
    backgroundColor: "#111111",
    animationClass: "ribbon",
    primaryColor: "#0065ff",
    secondaryColor: "#b3d4ff",
  });

  assert.equal(normalized.backgroundColor, "#0065ff");
  assert.equal(normalized.primaryColor, "#0065ff");
  assert.equal(normalized.secondaryColor, "#3d8aff");
});

test("normalizeStatusSetting preserves supported animations and drops unknown ones", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.normalizeStatusSetting({
      statusName: "Open",
      backgroundColor: "#0065ff",
      animationClass: "shimmer",
    }).animationClass,
    "shimmer"
  );
  assert.equal(
    logic.normalizeStatusSetting({
      statusName: "Open",
      backgroundColor: "#0065ff",
      animationClass: "stripes",
    }).animationClass,
    ""
  );
});

test("getStatusRibbonBackground builds the expected repeating gradient", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.getStatusRibbonBackground({
      backgroundColor: "#111111",
    }),
    "repeating-linear-gradient(45deg, #111111, #111111 10px, #4a4a4a 10px, #4a4a4a 20px)"
  );
});

test("migrateStatusSettings removes legacy ribbon colors and statusAliases", async () => {
  const logic = await loadStatusColorizerLogic();
  const migration = logic.migrateStatusSettings([
    {
      statusName: " Open ",
      statusAliases: ["WIP", " open "],
      backgroundColor: "#111111",
      textColor: "#ffffff",
      animationClass: "ribbon",
      primaryColor: "#0065ff",
      secondaryColor: "#b3d4ff",
    },
  ]);

  assert.equal(migration.changed, true);
  assert.equal(
    JSON.stringify(migration.settings),
    JSON.stringify([
      {
        statusName: "open",
        backgroundColor: "#0065ff",
        textColor: "#ffffff",
        animationClass: "ribbon",
        aliases: ["wip"],
      },
    ])
  );
});
