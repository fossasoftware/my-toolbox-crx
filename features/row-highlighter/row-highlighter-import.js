import { importSyncSettingsJson } from "../shared/rule-settings-transfer.js";
import {
  mergeImportedNamedEntries,
  mergeNamedRuleEntry,
  sanitizeRuleAliases,
} from "../shared/rule-import-utils.js";
import { normalizeKeyword } from "./row-highlighter-table.js";
import { ROW_HIGHLIGHT_SETTINGS_KEY } from "./row-highlighter-storage.js";

function sanitizeKeywordAliases(keyword, aliases) {
  return sanitizeRuleAliases(keyword, aliases, normalizeKeyword);
}

function mergeKeywordEntry(target, source) {
  mergeNamedRuleEntry(target, source, {
    mergeFields: ["color", "enabled"],
    normalizeName: normalizeKeyword,
    primaryField: "keyword",
  });
}

function mergeImportedHighlightSettings(data) {
  if (!Array.isArray(data)) {
    console.error("Import validation failed: Data is not an array.");
    return null;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const entries = [];

  for (const item of data) {
    if (typeof item !== "object" || !item) {
      console.error("Import validation failed: Item is not an object.", item);
      return null;
    }
    if (typeof item.keyword !== "string" || item.keyword.trim() === "") {
      console.error(
        `Import validation failed: Invalid keyword "${item.keyword}".`,
        item
      );
      return null;
    }
    const keyword = item.keyword.trim();
    if (typeof item.color !== "string" || !colorRegex.test(item.color)) {
      console.error(
        `Import validation failed: Invalid color "${item.color}".`,
        item
      );
      return null;
    }
    if ("enabled" in item && typeof item.enabled !== "boolean") {
      console.error(
        `Import validation failed: Invalid enabled value "${item.enabled}".`,
        item
      );
      return null;
    }

    const aliasSources = [];
    if ("aliases" in item) {
      if (!Array.isArray(item.aliases)) {
        console.error(
          "Import validation failed: aliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.aliases);
    }
    if ("keywordAliases" in item) {
      if (!Array.isArray(item.keywordAliases)) {
        console.error(
          "Import validation failed: keywordAliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.keywordAliases);
    }
    for (const alias of aliasSources) {
      if (typeof alias !== "string") {
        console.error(
          `Import validation failed: Invalid alias "${alias}".`,
          item
        );
        return null;
      }
    }
    const aliases = sanitizeKeywordAliases(keyword, aliasSources);

    const entry = {
      keyword,
      color: item.color,
    };
    if ("enabled" in item) entry.enabled = item.enabled;
    if (aliases.length > 0) entry.aliases = aliases;
    entries.push(entry);
  }

  return mergeImportedNamedEntries(entries, {
    mergeEntry: mergeKeywordEntry,
    normalizeName: normalizeKeyword,
    primaryField: "keyword",
  });
}

export function handleRowHighlightImport(event, restoreSettings, showToast) {
  return importSyncSettingsJson({
    event,
    storageKey: ROW_HIGHLIGHT_SETTINGS_KEY,
    mergeImportedSettings: mergeImportedHighlightSettings,
    restoreSettings,
    showToast,
    parseErrorLogLabel: "Row Highlighter",
    saveErrorLogLabel: "Row Highlighter",
    readErrorLogLabel: "Row Highlighter",
  });
}
