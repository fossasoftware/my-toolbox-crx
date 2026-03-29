import { importSyncSettingsJson } from "../shared/rule-settings-transfer.js";
import {
  mergeImportedNamedEntries,
  mergeNamedRuleEntry,
  sanitizeRuleAliases,
} from "../shared/rule-import-utils.js";
import { normalizeStatusName } from "./status-colorizer-table.js";
import { STATUS_COLOR_SETTINGS_KEY } from "./status-colorizer-storage.js";

function sanitizeAliases(statusName, aliases) {
  return sanitizeRuleAliases(statusName, aliases, normalizeStatusName);
}

function mergeStatusEntry(target, source) {
  mergeNamedRuleEntry(target, source, {
    mergeFields: [
      "backgroundColor",
      "textColor",
      "animationClass",
      "primaryColor",
      "secondaryColor",
    ],
    normalizeName: normalizeStatusName,
    primaryField: "statusName",
  });
}

function mergeImportedStatusSettings(data) {
  if (!Array.isArray(data)) {
    console.error("Import validation failed: Data is not an array.");
    return null;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const requiredKeys = ["statusName", "backgroundColor"];
  const entries = [];

  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      console.error("Import validation failed: Item is not an object.", item);
      return null;
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        console.error(
          `Import validation failed: Item missing required key "${key}".`,
          item
        );
        return null;
      }
    }
    if (typeof item.statusName !== "string" || item.statusName.trim() === "") {
      console.error(
        `Import validation failed: Invalid statusName "${item.statusName}".`,
        item
      );
      return null;
    }
    const statusName = item.statusName.trim();
    if (
      typeof item.backgroundColor !== "string" ||
      !colorRegex.test(item.backgroundColor)
    ) {
      console.error(
        `Import validation failed: Invalid backgroundColor "${item.backgroundColor}".`,
        item
      );
      return null;
    }
    if (
      "textColor" in item &&
      (typeof item.textColor !== "string" ||
        !colorRegex.test(item.textColor)) &&
      item.textColor !== ""
    ) {
      console.error(
        `Import validation failed: Invalid textColor "${item.textColor}".`,
        item
      );
      return null;
    }
    if ("animationClass" in item && item.animationClass === "ribbon") {
      if (
        !("primaryColor" in item) ||
        typeof item.primaryColor !== "string" ||
        !colorRegex.test(item.primaryColor)
      ) {
        console.error(
          "Import validation failed: Missing or invalid primaryColor for animation.",
          item
        );
        return null;
      }
      if (
        !("secondaryColor" in item) ||
        typeof item.secondaryColor !== "string" ||
        !colorRegex.test(item.secondaryColor)
      ) {
        console.error(
          "Import validation failed: Missing or invalid secondaryColor for animation.",
          item
        );
        return null;
      }
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
    if ("statusAliases" in item) {
      if (!Array.isArray(item.statusAliases)) {
        console.error(
          "Import validation failed: statusAliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.statusAliases);
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
    const aliases = sanitizeAliases(statusName, aliasSources);

    const entry = {
      statusName,
      backgroundColor: item.backgroundColor,
    };
    if ("textColor" in item) entry.textColor = item.textColor;
    if ("animationClass" in item) entry.animationClass = item.animationClass;
    if ("primaryColor" in item) entry.primaryColor = item.primaryColor;
    if ("secondaryColor" in item) entry.secondaryColor = item.secondaryColor;
    if (aliases.length > 0) entry.aliases = aliases;
    entries.push(entry);
  }

  return mergeImportedNamedEntries(entries, {
    mergeEntry: mergeStatusEntry,
    normalizeName: normalizeStatusName,
    primaryField: "statusName",
  });
}

export function handleStatusSettingsImport(event, restoreSettings, showToast) {
  return importSyncSettingsJson({
    event,
    storageKey: STATUS_COLOR_SETTINGS_KEY,
    mergeImportedSettings: mergeImportedStatusSettings,
    restoreSettings,
    showToast,
    parseErrorLogLabel: "Status Colorizer",
    saveErrorLogLabel: "Status Colorizer",
    readErrorLogLabel: "Status Colorizer",
  });
}
