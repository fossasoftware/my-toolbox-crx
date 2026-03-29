import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeImportedNamedEntries,
  mergeNamedRuleEntry,
  sanitizeRuleAliases,
} from "../features/shared/rule-import-utils.js";

function normalizeName(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

test("sanitizeRuleAliases removes duplicates, blanks, and the primary name", () => {
  const aliases = sanitizeRuleAliases(
    "Done",
    [" done ", "QA", "qa", "", null, " Ready "],
    normalizeName
  );

  assert.deepEqual(aliases, ["QA", "Ready"]);
});

test("mergeNamedRuleEntry keeps target values and absorbs aliases from the source", () => {
  const target = {
    name: "Done",
    color: "#0f0",
  };
  const source = {
    name: "Ready",
    aliases: ["QA", "done"],
    color: "#f00",
  };

  mergeNamedRuleEntry(target, source, {
    primaryField: "name",
    aliasField: "aliases",
    mergeFields: ["color"],
    normalizeName,
  });

  assert.equal(target.color, "#0f0");
  assert.deepEqual(target.aliases, ["Ready", "QA"]);
});

test("mergeImportedNamedEntries merges alias-linked entries into one rule", () => {
  const mergeEntry = (target, source) =>
    mergeNamedRuleEntry(target, source, {
      primaryField: "name",
      aliasField: "aliases",
      mergeFields: ["color"],
      normalizeName,
    });

  const merged = mergeImportedNamedEntries(
    [
      { name: "Done", color: "#0f0" },
      { name: "QA", aliases: ["Ready"] },
      { name: "ready", color: "#ff0" },
    ],
    {
      primaryField: "name",
      aliasField: "aliases",
      normalizeName,
      mergeEntry,
    }
  );

  assert.deepEqual(merged, [
    { name: "Done", color: "#0f0" },
    { name: "QA", aliases: ["Ready"], color: "#ff0" },
  ]);
});
