import { normalizeStatusAnimationClass } from "./status-colorizer-animations.js";

const COLOR_REGEX = /^#[0-9a-f]{6}$/i;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatusName(statusName) {
  return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
}

function isHexColor(value) {
  return typeof value === "string" && COLOR_REGEX.test(value);
}

function normalizeColor(value, fallback = "#ffffff") {
  return isHexColor(value) ? value : fallback;
}

function getAliases(setting, statusName) {
  const aliasSources = [];
  if (Array.isArray(setting.aliases)) {
    aliasSources.push(...setting.aliases);
  }
  if (Array.isArray(setting.statusAliases)) {
    aliasSources.push(...setting.statusAliases);
  }

  const normalizedStatusName = normalizeStatusName(statusName);
  const seen = new Set();
  const aliases = [];
  aliasSources.forEach((alias) => {
    const normalizedAlias = normalizeStatusName(alias);
    if (
      !normalizedAlias ||
      normalizedAlias === normalizedStatusName ||
      seen.has(normalizedAlias)
    ) {
      return;
    }
    seen.add(normalizedAlias);
    aliases.push(normalizedAlias);
  });

  return aliases;
}

export function normalizeStoredStatusSetting(setting) {
  if (!isObject(setting)) {
    return null;
  }

  const statusName = normalizeStatusName(setting.statusName);
  if (!statusName) {
    return null;
  }

  const animationClass = normalizeStatusAnimationClass(setting.animationClass);
  const legacyRibbonPrimaryColor =
    animationClass === "ribbon" && isHexColor(setting.primaryColor)
      ? setting.primaryColor
      : "";
  const backgroundColor =
    legacyRibbonPrimaryColor || normalizeColor(setting.backgroundColor);
  const normalized = {
    statusName,
    backgroundColor,
  };
  const textColor = normalizeColor(setting.textColor, "");
  if (textColor) {
    normalized.textColor = textColor;
  }
  if (animationClass) {
    normalized.animationClass = animationClass;
  }

  const aliases = getAliases(setting, statusName);
  if (aliases.length > 0) {
    normalized.aliases = aliases;
  }

  return normalized;
}

export function migrateStatusColorSettings(settings) {
  const source = Array.isArray(settings) ? settings : [];
  const migrated = source
    .map((setting) => normalizeStoredStatusSetting(setting))
    .filter(Boolean);

  return {
    changed: JSON.stringify(source) !== JSON.stringify(migrated),
    settings: migrated,
  };
}
