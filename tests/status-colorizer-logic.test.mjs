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
    logic.STATUS_SURFACE_SELECTORS.boardCardStatus,
    "[data-testid='platform-board-kit.ui.card.jira-card-contents.status']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.recentActivityStatusText,
    "[data-testid='state-metadata-element--text']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.smartCardStatus,
    "span[data-smart-element='State'][data-smart-element-lozenge='true'][data-testid='state-metadata-element']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.smartCardStatusButton,
    "button[data-testid='state-metadata-element'][aria-haspopup='true']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.stateTransitionMenuItem,
    "button[data-testid^='state-metadata-element-item-'][role='menuitem']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.stateTransitionMenuItemBadge,
    "[data-item-title='true'] > span"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.ticketButtonText,
    "[data-testid$='status-button--text'], [data-test-id$='status-button--text']"
  );
  assert.equal(
    logic.STATUS_SURFACE_SELECTORS.transitionStatusBadge,
    "[data-testid='issue-field-status.ui.status-view.transition'] [data-testid^='issue.fields.status.common.ui.status-lozenge.']"
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

test("board status keeps button paint and aligns only the nested border", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const resolverStart = source.indexOf(
    "function resolveStatusBadgePaintTarget("
  );
  const resolverEnd = source.indexOf(
    "function collectStatusTextElements("
  );
  const resolver = source.slice(resolverStart, resolverEnd);
  const buttonTargetIndex = resolver.indexOf(
    "findStatusButtonTarget(element, statusSetting)"
  );
  const applyStart = source.indexOf(
    "function applyStatusSettingToBadgeSource("
  );
  const applyEnd = source.indexOf(
    "function applyStatusSettingToHomeListStatus("
  );
  const applyFunction = source.slice(applyStart, applyEnd);

  assert.notEqual(buttonTargetIndex, -1);
  assert.doesNotMatch(resolver, /getBoardCardNestedVisualBadge/);
  assert.match(
    source,
    /const statusWrapper = boardStatus\.querySelector\(\s*ATLASSIAN_STATUS_BADGE_SELECTOR\s*\);/
  );
  assert.match(
    source,
    /return getNestedVisualBadge\(statusWrapper\) \|\| statusWrapper;/
  );
  assert.match(
    applyFunction,
    /const boardNestedVisual = getBoardCardNestedVisualBadge\(sourceBadge\);/
  );
  assert.match(
    applyFunction,
    /setTrackedStyle\(\s*boardNestedVisual,\s*"border-color",\s*borderColor,\s*borderColor \? "important" : ""\s*\);/
  );
  assert.doesNotMatch(
    applyFunction,
    /applyStatusSettingToBadge\(boardNestedVisual/
  );
});

test("recent activity and transition statuses use isolated stable paths", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const recentCollectorStart = source.indexOf(
    "function collectRecentActivityStatusTargets("
  );

  assert.notEqual(recentCollectorStart, -1);
  assert.match(
    source,
    /querySelectorAll\(RECENT_ACTIVITY_STATUS_TEXT_SELECTOR\)/
  );
  assert.match(
    source,
    /STATUS_BADGE_CONTAINER_SELECTORS = \[[\s\S]*TRANSITION_STATUS_BADGE_SELECTOR,/
  );
  assert.match(
    source,
    /while \(current\?\.parentElement\?\.matches\?\.\("span"\)\)/
  );
  assert.match(
    source,
    /if \(element\.matches\?\.\(RECENT_ACTIVITY_STATUS_TEXT_SELECTOR\)\) \{[\s\S]*return resolveSameTextStatusSpan\(element\) \|\| element;/
  );
  assert.doesNotMatch(source, /a\[href\*=['"]\/browse\//);
});

test("smart-card statuses resolve buttons before the recent span fallback", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const resolverStart = source.indexOf(
    "function resolveStatusBadgePaintTarget("
  );
  const resolverEnd = source.indexOf(
    "function collectStatusTextElements("
  );
  const resolver = source.slice(resolverStart, resolverEnd);
  const smartButtonIndex = resolver.indexOf(
    "SMART_CARD_STATUS_BUTTON_SELECTOR"
  );
  const sameSpanIndex = resolver.indexOf(
    "resolveSameTextStatusSpan(element)"
  );

  assert.notEqual(smartButtonIndex, -1);
  assert.notEqual(sameSpanIndex, -1);
  assert.ok(smartButtonIndex < sameSpanIndex);
  assert.match(
    resolver,
    /if \(smartCardButton\?\.closest\?\.\(SMART_CARD_STATUS_SELECTOR\)\) \{\s*return smartCardButton;/
  );
});

test("state transition popup paints only canonical badges", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const collectorStart = source.indexOf(
    "function collectStateTransitionMenuBadges("
  );
  const collectorEnd = source.indexOf(
    "function getHomeListStatusRegion("
  );
  const collector = source.slice(collectorStart, collectorEnd);

  assert.notEqual(collectorStart, -1);
  assert.notEqual(collectorEnd, -1);
  assert.match(
    collector,
    /querySelectorAll\(STATE_TRANSITION_MENU_ITEM_SELECTOR\)/
  );
  assert.match(
    collector,
    /menuItem\.querySelector\(\s*STATE_TRANSITION_MENU_ITEM_BADGE_SELECTOR\s*\)/
  );
  assert.match(
    source,
    /collectTargets: collectStateTransitionMenuBadges,\s*getStatusText: \(statusBadge\) => statusBadge\.textContent,\s*applyStatusSetting: applyStatusSettingToBadge,/
  );
  assert.doesNotMatch(collector, /targets\.add\(menuItem\)/);
});

test("status surface border uses the painted base color", async () => {
  const logic = await loadStatusColorizerLogic();

  assert.equal(
    logic.getStatusSurfaceBorderColor({
      animationClass: "glow",
      backgroundColor: "#006b7e",
      primaryColor: "#111111",
    }),
    "#006b7e"
  );
  assert.equal(
    logic.getStatusSurfaceBorderColor({
      animationClass: "ribbon",
      backgroundColor: "#0747a6",
      primaryColor: "#0052cc",
    }),
    "#0052cc"
  );
  assert.equal(logic.getStatusSurfaceBorderColor(null), "");
});

test("non-button badges apply a tracked base-color border", async () => {
  const source = await loadStatusColorizerWorkerSource();
  const badgeFunctionStart = source.indexOf(
    "function applyStatusSettingToBadge("
  );
  const badgeFunctionEnd = source.indexOf(
    "function applyStatusSettingToBadgeSource("
  );
  const badgeFunction = source.slice(badgeFunctionStart, badgeFunctionEnd);

  assert.notEqual(badgeFunctionStart, -1);
  assert.notEqual(badgeFunctionEnd, -1);
  assert.match(
    badgeFunction,
    /const borderColor = getStatusSurfaceBorderColor\(statusSetting\);/
  );
  assert.match(
    badgeFunction,
    /setTrackedStyle\(\s*outerBadge,\s*"border-color",\s*borderColor,\s*borderColor \? "important" : ""\s*\);/
  );
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
