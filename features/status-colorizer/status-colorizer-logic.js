(function attachStatusColorizerLogic(global) {
  if (global.MyToolboxStatusColorizerLogic) {
    return;
  }

  function normalizeStatusName(statusName) {
    return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
  }

  function normalizeStatusTextCandidate(text) {
    return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
  }

  function expandStatusTextCandidates(values) {
    const source = Array.isArray(values) ? values : [values];
    const candidates = new Set();

    source.forEach((text) => {
      const value = normalizeStatusTextCandidate(text);
      if (!value) {
        return;
      }

      candidates.add(value);
      const labelValue = value.match(
        /^(?:status|статус)\s*[:：-]\s*(.+)$/i
      )?.[1];
      if (labelValue) {
        candidates.add(normalizeStatusTextCandidate(labelValue));
      }

      const changeStatusValue = value.match(
        /^(.+?)\s*[-–—]\s*(?:change|update)\s+(?:the\s+)?status$/i
      )?.[1];
      if (changeStatusValue) {
        candidates.add(normalizeStatusTextCandidate(changeStatusValue));
      }
    });

    return [...candidates];
  }

  function isStatusBadgeTextTestId(testId) {
    return typeof testId === "string" &&
      /status-lozenge(?:\.[^.]+)?--text$/.test(testId);
  }

  function shouldUseNestedStatusBadge({
    tagName = "",
    testId = "",
    isIssueTableCell = false,
  } = {}) {
    if (isIssueTableCell) {
      return true;
    }

    if (String(tagName).toUpperCase() !== "DIV") {
      return false;
    }

    return (
      (testId.startsWith("issue.fields.status.common.ui.status-lozenge.") &&
        !testId.includes("--")) ||
      testId ===
        "jql-builder-basic-picker.ui.format-option-label.lozenge-option-label.lozenge"
    );
  }

  const STATUS_SURFACE_SELECTORS = Object.freeze({
    boardCardStatus:
      "[data-testid='platform-board-kit.ui.card.jira-card-contents.status']",
    recentActivityStatusText:
      "[data-testid='state-metadata-element--text']",
    smartCardStatus:
      "span[data-smart-element='State'][data-smart-element-lozenge='true'][data-testid='state-metadata-element']",
    smartCardStatusButton:
      "button[data-testid='state-metadata-element'][aria-haspopup='true']",
    stateTransitionMenuItem:
      "button[data-testid^='state-metadata-element-item-'][role='menuitem']",
    stateTransitionMenuItemBadge: "[data-item-title='true'] > span",
    ticketButtonText:
      "[data-testid$='status-button--text'], [data-test-id$='status-button--text']",
    transitionStatusBadge:
      "[data-testid='issue-field-status.ui.status-view.transition'] [data-testid^='issue.fields.status.common.ui.status-lozenge.']",
    workflowStatusNode: "g[data-drag-type='status']",
  });

  function getStatusAliases(setting) {
    return Array.isArray(setting?.aliases)
      ? setting.aliases
      : Array.isArray(setting?.statusAliases)
        ? setting.statusAliases
        : [];
  }

  const SUPPORTED_STATUS_ANIMATIONS = new Set([
    "",
    "ping",
    "breathe",
    "nudge",
    "shimmer",
    "glow",
    "urgent",
    "sweep",
    "ribbon",
  ]);

  function normalizeStatusAnimationClass(animationClass) {
    return typeof animationClass === "string" &&
      SUPPORTED_STATUS_ANIMATIONS.has(animationClass)
      ? animationClass
      : "";
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function parseHexColor(value) {
    if (!isHexColor(value)) {
      return null;
    }

    return {
      r: Number.parseInt(value.slice(1, 3), 16),
      g: Number.parseInt(value.slice(3, 5), 16),
      b: Number.parseInt(value.slice(5, 7), 16),
    };
  }

  function componentToHex(value) {
    return Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  }

  function rgbToHex({ r, g, b }) {
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
  }

  function lightenHexColor(value, amount = 0.24) {
    const color = parseHexColor(value);
    if (!color) {
      return value || "";
    }

    return rgbToHex({
      r: color.r + (255 - color.r) * amount,
      g: color.g + (255 - color.g) * amount,
      b: color.b + (255 - color.b) * amount,
    });
  }

  function normalizeStatusSetting(setting) {
    const rawBackgroundColor =
      typeof setting?.backgroundColor === "string" ? setting.backgroundColor : "";
    const animationClass = normalizeStatusAnimationClass(setting?.animationClass);
    const backgroundColor =
      animationClass === "ribbon" && isHexColor(setting?.primaryColor)
        ? setting.primaryColor
        : rawBackgroundColor;
    const primaryColor = backgroundColor;
    const secondaryColor = lightenHexColor(primaryColor || backgroundColor);

    return {
      statusName: normalizeStatusName(setting?.statusName),
      backgroundColor,
      textColor: typeof setting?.textColor === "string" ? setting.textColor : "",
      animationClass,
      primaryColor,
      secondaryColor,
    };
  }

  function getStatusSurfaceBorderColor(statusSetting) {
    if (!statusSetting || typeof statusSetting !== "object") {
      return "";
    }

    if (statusSetting.animationClass === "ribbon") {
      return statusSetting.primaryColor || statusSetting.backgroundColor || "";
    }

    return statusSetting.backgroundColor || statusSetting.primaryColor || "";
  }

  function buildStatusLookup(settings) {
    const lookup = new Map();

    settings.forEach((setting) => {
      if (!setting) {
        return;
      }

      const normalizedSetting = normalizeStatusSetting(setting);
      const variants = [
        normalizedSetting.statusName,
        ...getStatusAliases(setting).map(normalizeStatusName),
      ].filter(Boolean);

      variants.forEach((variant) => {
        if (!lookup.has(variant)) {
          lookup.set(variant, normalizedSetting);
        }
      });
    });

    return lookup;
  }

  function findStatusSettingFromLookup(lookup, statusText) {
    const normalizedStatus = normalizeStatusName(statusText);
    if (!normalizedStatus || !(lookup instanceof Map)) {
      return null;
    }

    return lookup.get(normalizedStatus) || null;
  }

  function getStatusRibbonBackground(statusSetting) {
    const primaryColor =
      typeof statusSetting?.primaryColor === "string" &&
      statusSetting.primaryColor
        ? statusSetting.primaryColor
        : statusSetting?.backgroundColor || "";
    const secondaryColor = lightenHexColor(primaryColor);
    return `repeating-linear-gradient(45deg, ${primaryColor}, ${primaryColor} 10px, ${secondaryColor} 10px, ${secondaryColor} 20px)`;
  }

  function normalizeStoredStatusSetting(setting) {
    if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
      return null;
    }

    const statusName = normalizeStatusName(setting.statusName);
    if (!statusName) {
      return null;
    }

    const animationClass = normalizeStatusAnimationClass(setting.animationClass);
    const backgroundColor =
      animationClass === "ribbon" && isHexColor(setting.primaryColor)
        ? setting.primaryColor
        : setting.backgroundColor;
    const normalized = {
      statusName,
      backgroundColor:
        typeof backgroundColor === "string" ? backgroundColor : "#ffffff",
    };
    if (isHexColor(setting.textColor)) {
      normalized.textColor = setting.textColor;
    }
    if (animationClass) {
      normalized.animationClass = animationClass;
    }

    const aliases = [];
    const seenAliases = new Set();
    getStatusAliases(setting).forEach((alias) => {
      const normalizedAlias = normalizeStatusName(alias);
      if (
        !normalizedAlias ||
        normalizedAlias === statusName ||
        seenAliases.has(normalizedAlias)
      ) {
        return;
      }
      seenAliases.add(normalizedAlias);
      aliases.push(normalizedAlias);
    });
    if (aliases.length > 0) {
      normalized.aliases = aliases;
    }

    return normalized;
  }

  function migrateStatusSettings(settings) {
    const source = Array.isArray(settings) ? settings : [];
    const migrated = source
      .map((setting) => normalizeStoredStatusSetting(setting))
      .filter(Boolean);

    return {
      changed: JSON.stringify(source) !== JSON.stringify(migrated),
      settings: migrated,
    };
  }

  global.MyToolboxStatusColorizerLogic = {
    STATUS_SURFACE_SELECTORS,
    buildStatusLookup,
    expandStatusTextCandidates,
    findStatusSettingFromLookup,
    getStatusAliases,
    getStatusSurfaceBorderColor,
    getStatusRibbonBackground,
    lightenHexColor,
    migrateStatusSettings,
    normalizeStatusAnimationClass,
    normalizeStatusName,
    normalizeStatusSetting,
    normalizeStatusTextCandidate,
    isStatusBadgeTextTestId,
    shouldUseNestedStatusBadge,
  };
})(globalThis);
