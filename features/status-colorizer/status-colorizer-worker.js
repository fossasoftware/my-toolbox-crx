(function runStatusColorizerWorker(global) {
let statusColorSettings = [];
let compiledStatusLookup = new Map();
let statusColorizerEnabled = true;
let refreshStatusesRaf = 0;
let viewportRefreshTimer = 0;
let lastStatusRefreshAt = 0;
let workerStarted = false;
const ruleWorkerRuntime = global.MyToolboxRuleWorkerRuntime;
const statusColorizerLogic = global.MyToolboxStatusColorizerLogic || {};
const {
  STATUS_SURFACE_SELECTORS = {},
  buildStatusLookup = () => new Map(),
  expandStatusTextCandidates = (values) => {
    const source = Array.isArray(values) ? values : [values];
    return source
      .map((value) =>
        typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
      )
      .filter(Boolean);
  },
  findStatusSettingFromLookup = () => null,
  getStatusButtonBorderColor = (statusSetting) =>
    statusSetting?.animationClass === "ribbon"
      ? statusSetting?.primaryColor || statusSetting?.backgroundColor || ""
      : statusSetting?.backgroundColor || statusSetting?.primaryColor || "",
  isStatusBadgeTextTestId = (testId) =>
    typeof testId === "string" &&
    /status-lozenge(?:\.[^.]+)?--text$/.test(testId),
  migrateStatusSettings = (settings) => ({
    changed: false,
    settings: Array.isArray(settings) ? settings : [],
  }),
  normalizeStatusTextCandidate = (text) =>
    typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "",
  shouldUseNestedStatusBadge = ({
    tagName = "",
    testId = "",
    isIssueTableCell = false,
  } = {}) =>
    isIssueTableCell ||
    (String(tagName).toUpperCase() === "DIV" &&
      testId.startsWith("issue.fields.status.common.ui.status-lozenge.") &&
      !testId.includes("--")),
} = statusColorizerLogic;
const STATUS_TOUCH_ATTR = "data-my-toolbox-status-touched";
const STATUS_PROPS_ATTR = "data-my-toolbox-status-props";
const STATUS_STYLE_ID = "my-toolbox-status-colorizer-style";
const STATUS_BASE_CLASS = "my-toolbox-status-colored";
const STATUS_RIBBON_CLASS = "my-toolbox-status-ribbon";
const STATUS_BUTTON_SURFACE_CLASS = "my-toolbox-status-button-surface";
const STATUS_BUTTON_RIBBON_CLASS = "my-toolbox-status-button-ribbon";
const STATUS_WORKFLOW_CLASS = "my-toolbox-status-workflow";
const STATUS_ANIMATION_SURFACE_CLASS = "my-toolbox-status-animation-surface";
const STATUS_ANIMATION_CLASS_BY_NAME = {
  ping: "my-toolbox-status-anim-ping",
  breathe: "my-toolbox-status-anim-breathe",
  nudge: "my-toolbox-status-anim-nudge",
  shimmer: "my-toolbox-status-anim-shimmer",
  glow: "my-toolbox-status-anim-glow",
  urgent: "my-toolbox-status-anim-urgent",
  sweep: "my-toolbox-status-anim-sweep",
};
const STATUS_ANIMATION_CLASS_NAMES = Object.values(STATUS_ANIMATION_CLASS_BY_NAME);
const STATUS_VAR_BG = "--my-toolbox-status-bg";
const STATUS_VAR_FG = "--my-toolbox-status-fg";
const STATUS_VAR_PRIMARY = "--my-toolbox-status-primary";
const STATUS_VAR_SECONDARY = "--my-toolbox-status-secondary";
const STATUS_VAR_STROKE = "--my-toolbox-status-stroke";
const STATUS_RIBBON_DELAY_VAR = "--my-toolbox-status-ribbon-delay";
const STATUS_RIBBON_TILE_SIZE = "28.284271px";
const STATUS_RIBBON_ANIMATION_DURATION_MS = 1200;
const STATUS_RIBBON_ANIMATION_DURATION =
  `${STATUS_RIBBON_ANIMATION_DURATION_MS}ms`;
const ATLASSIAN_STATUS_BADGE_SELECTOR =
  "[data-testid^='issue.fields.status.common.ui.status-lozenge.']";
const HISTORY_STATUS_BADGE_SELECTOR =
  "[data-testid='common-components-status-lozenge.status-lozenge']";
const HISTORY_STATUS_BADGE_TEXT_SELECTOR =
  "[data-testid='common-components-status-lozenge.status-lozenge--text']";
const INLINE_CARD_STATUS_BADGE_SELECTOR =
  "[data-testid='inline-card-resolved-view-lozenge']";
const INLINE_CARD_STATUS_BADGE_TEXT_SELECTOR =
  "[data-testid='inline-card-resolved-view-lozenge--text']";
const JQL_PICKER_STATUS_BADGE_SELECTOR =
  "[data-testid='jql-builder-basic-picker.ui.format-option-label.lozenge-option-label.lozenge']";
const GENERIC_STATUS_BADGE_CONTAINER_SELECTOR =
  "[data-testid*='status-lozenge']:not([data-testid$='--text']), [data-test-id*='status-lozenge']:not([data-test-id$='--text'])";
const GENERIC_STATUS_BADGE_TEXT_SELECTOR =
  "[data-testid*='status-lozenge'][data-testid$='--text'], [data-test-id*='status-lozenge'][data-test-id$='--text']";
const ISSUE_TABLE_STATUS_CELL_SELECTOR =
  "[data-testid*='cell-wrapper-row'][data-testid$='-status'], [data-testid*='native-issue-table'][data-testid*='status']";
const CLASSIC_STATUS_BADGE_SELECTOR =
  "td.status > span.jira-issue-status-lozenge, table.issue-table td.status span.jira-issue-status-lozenge";
const ISSUE_STATUS_BUTTON_SELECTOR =
  "button[data-testid='issue-field-status.ui.status-view.status-button.status-button']";
const ISSUE_STATUS_BUTTON_TEXT_SELECTOR =
  STATUS_SURFACE_SELECTORS.ticketButtonText ||
  "[data-testid$='status-button--text'], [data-test-id$='status-button--text']";
const WORKFLOW_STATUS_NODE_SELECTOR =
  STATUS_SURFACE_SELECTORS.workflowStatusNode ||
  "g[data-drag-type='status']";
const HOME_LIST_ITEM_SELECTOR = "li[data-testid^='home-list-item-']";
const STATUS_BADGE_CONTAINER_SELECTORS = [
  ATLASSIAN_STATUS_BADGE_SELECTOR,
  HISTORY_STATUS_BADGE_SELECTOR,
  INLINE_CARD_STATUS_BADGE_SELECTOR,
  JQL_PICKER_STATUS_BADGE_SELECTOR,
  GENERIC_STATUS_BADGE_CONTAINER_SELECTOR,
  ISSUE_TABLE_STATUS_CELL_SELECTOR,
  CLASSIC_STATUS_BADGE_SELECTOR,
];
const STATUS_BADGE_TEXT_SELECTORS = [
  HISTORY_STATUS_BADGE_TEXT_SELECTOR,
  INLINE_CARD_STATUS_BADGE_TEXT_SELECTOR,
  GENERIC_STATUS_BADGE_TEXT_SELECTOR,
];
const STATUS_BADGE_SELECTORS = [
  ...STATUS_BADGE_CONTAINER_SELECTORS,
  ...STATUS_BADGE_TEXT_SELECTORS,
];
const STATUS_BADGE_CONTAINER_SELECTOR = STATUS_BADGE_CONTAINER_SELECTORS.join(",");
const STATUS_BADGE_TEXT_SELECTOR = STATUS_BADGE_TEXT_SELECTORS.join(",");
const VIEWPORT_REFRESH_MIN_INTERVAL_MS = 120;
let activeStatusElements = null;
const TRACKED_STATUS_CLASSES = [
  STATUS_BASE_CLASS,
  STATUS_RIBBON_CLASS,
  STATUS_BUTTON_SURFACE_CLASS,
  STATUS_BUTTON_RIBBON_CLASS,
  STATUS_WORKFLOW_CLASS,
  STATUS_ANIMATION_SURFACE_CLASS,
  ...STATUS_ANIMATION_CLASS_NAMES,
];

function loadWorkerBooleanPreference(key, callback, defaultValue = true) {
  if (ruleWorkerRuntime?.loadBooleanPreference) {
    ruleWorkerRuntime.loadBooleanPreference(key, {
      defaultValue,
      logPrefix: "Status Colorizer",
      onLoaded: callback,
    });
    return;
  }

  chrome.storage.sync.get(key, (data) => {
    const value = Object.prototype.hasOwnProperty.call(data, key)
      ? data[key]
      : defaultValue;
    callback?.(value);
  });
}

function loadWorkerArraySetting(
  key,
  callback,
  { defaultResourcePath = "", mapItem } = {}
) {
  if (ruleWorkerRuntime?.loadArraySetting) {
    ruleWorkerRuntime.loadArraySetting(key, {
      defaultResourcePath,
      logPrefix: "Status Colorizer",
      mapItem,
      onLoaded: callback,
    });
    return;
  }

  chrome.storage.sync.get(key, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Status Colorizer: Error loading settings", chrome.runtime.lastError);
      callback?.([]);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(data, key) && defaultResourcePath) {
      fetch(chrome.runtime.getURL(defaultResourcePath))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((defaults) => {
          const items = Array.isArray(defaults)
            ? typeof mapItem === "function"
              ? defaults.map((item) => mapItem(item))
              : defaults
            : [];
          chrome.storage.sync.set({ [key]: items });
          callback?.(items);
        })
        .catch((error) => {
          console.error("Status Colorizer: Failed to load default settings", error);
          callback?.([]);
        });
      return;
    }

    const items = Array.isArray(data[key]) ? data[key] : [];
    callback?.(
      typeof mapItem === "function" ? items.map((item) => mapItem(item)) : items
    );
  });
}

function observeWorkerBodyMutations(callback) {
  if (ruleWorkerRuntime?.observeBodyMutations) {
    ruleWorkerRuntime.observeBodyMutations(callback);
    return;
  }

  const observer = new MutationObserver(() => {
    callback();
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: [
      "aria-label",
      "class",
      "data-test-id",
      "data-testid",
      "title",
    ],
    characterData: true,
    childList: true,
    subtree: true,
  });
}

function runWorkerOnWindowLoad(callback) {
  if (ruleWorkerRuntime?.runOnWindowLoad) {
    ruleWorkerRuntime.runOnWindowLoad(callback);
    return;
  }

  if (document.readyState === "complete") {
    callback();
    return;
  }

  window.addEventListener("load", callback, { once: true });
}

function observeWorkerStorageChanges(callback) {
  if (ruleWorkerRuntime?.observeSyncStorageChanges) {
    ruleWorkerRuntime.observeSyncStorageChanges(callback);
    return;
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    callback?.(changes);
  });
}

function observeWorkerViewportActivity(callback) {
  if (ruleWorkerRuntime?.observeViewportActivity) {
    ruleWorkerRuntime.observeViewportActivity(callback);
    return;
  }

  let shortTimer = 0;
  let lateTimer = 0;
  const heartbeat = window.setInterval(() => {
    if (document.visibilityState === "hidden") {
      return;
    }
    callback();
  }, 1200);

  const notifyViewportActivity = () => {
    if (document.visibilityState === "hidden") {
      return;
    }
    callback();
    clearTimeout(shortTimer);
    clearTimeout(lateTimer);
    shortTimer = window.setTimeout(callback, 80);
    lateTimer = window.setTimeout(callback, 260);
  };

  document.addEventListener("scroll", notifyViewportActivity, {
    capture: true,
    passive: true,
  });
  window.addEventListener("scroll", notifyViewportActivity, {
    capture: true,
    passive: true,
  });
  document.addEventListener("wheel", notifyViewportActivity, {
    capture: true,
    passive: true,
  });
  document.addEventListener("touchmove", notifyViewportActivity, {
    capture: true,
    passive: true,
  });
  document.addEventListener("mouseover", notifyViewportActivity, {
    capture: true,
  });
  document.addEventListener("focusin", notifyViewportActivity, {
    capture: true,
  });
  window.addEventListener("resize", notifyViewportActivity, { passive: true });
  document.addEventListener("visibilitychange", notifyViewportActivity, {
    passive: true,
  });

  return () => {
    clearInterval(heartbeat);
    clearTimeout(shortTimer);
    clearTimeout(lateTimer);
  };
}

function loadStatusColorizerEnabled(callback) {
  loadWorkerBooleanPreference("statusColorizerEnabled", (enabled) => {
    statusColorizerEnabled = enabled;
    callback?.();
  });
}

function loadStatusColorSettings(callback) {
  loadWorkerArraySetting("statusColorSettings", (settings) => {
    const migration = migrateStatusSettings(settings);
    statusColorSettings = migration.settings;
    compiledStatusLookup = buildStatusLookup(statusColorSettings);
    if (migration.changed) {
      chrome.storage.sync.set({ statusColorSettings: statusColorSettings }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Status Colorizer: Failed to persist migrated settings",
            chrome.runtime.lastError
          );
        }
      });
    }
    callback?.();
  }, {
    defaultResourcePath: "data/defaultSettings.json",
  });
}

function ensureStatusColorizerStyle() {
  if (document.getElementById(STATUS_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STATUS_STYLE_ID;
  style.textContent = `
    @keyframes my-toolbox-status-ribbon-move {
      0% { transform: translate3d(calc(-1 * ${STATUS_RIBBON_TILE_SIZE}), 0, 0); }
      100% { transform: translate3d(0, 0, 0); }
    }

    @keyframes my-toolbox-status-ping {
      0% {
        box-shadow: 0 0 0 0 color-mix(
          in srgb,
          var(${STATUS_VAR_BG}, #00a3bf) 55%,
          transparent
        );
      }
      80%, 100% {
        box-shadow: 0 0 0 14px transparent;
      }
    }

    @keyframes my-toolbox-status-breathe {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.78; }
    }

    @keyframes my-toolbox-status-nudge {
      0%, 88%, 100% { transform: translateX(0); }
      92% { transform: translateX(-3px); }
      96% { transform: translateX(3px); }
    }

    @keyframes my-toolbox-status-shimmer {
      0% { left: -60%; }
      60%, 100% { left: 120%; }
    }

    @keyframes my-toolbox-status-glow {
      0%, 100% { box-shadow: 0 0 0 0 transparent; }
      50% {
        box-shadow: 0 0 12px 2px color-mix(
          in srgb,
          var(${STATUS_VAR_BG}, #ffc400) 60%,
          transparent
        );
      }
    }

    @keyframes my-toolbox-status-urgent {
      0%, 100% {
        transform: translateX(0);
        box-shadow: 0 0 0 0 color-mix(
          in srgb,
          var(${STATUS_VAR_BG}, #de350b) 50%,
          transparent
        );
      }
      25% { transform: translateX(-1px); }
      50% {
        transform: translateX(1px);
        box-shadow: 0 0 0 6px transparent;
      }
      75% { transform: translateX(-1px); }
    }

    @keyframes my-toolbox-status-sweep {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .${STATUS_BASE_CLASS} {
      background-color: var(${STATUS_VAR_BG}, transparent) !important;
    }

    .${STATUS_RIBBON_CLASS} {
      position: relative !important;
      z-index: 0 !important;
      isolation: isolate !important;
      overflow: hidden !important;
      background-color: transparent !important;
      background-image: none !important;
    }

    .${STATUS_RIBBON_CLASS}::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: calc(100% + ${STATUS_RIBBON_TILE_SIZE});
      z-index: -1;
      pointer-events: none;
      border-radius: inherit;
      background-image: repeating-linear-gradient(
        45deg,
        var(${STATUS_VAR_PRIMARY}, transparent),
        var(${STATUS_VAR_PRIMARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 20px
      ) !important;
      background-repeat: repeat !important;
      animation: my-toolbox-status-ribbon-move ${STATUS_RIBBON_ANIMATION_DURATION} linear infinite !important;
      animation-delay: var(${STATUS_RIBBON_DELAY_VAR}, 0ms) !important;
      will-change: transform;
    }

    .${STATUS_RIBBON_CLASS} > * {
      position: relative !important;
      z-index: 1 !important;
    }

    .${STATUS_BUTTON_SURFACE_CLASS} {
      position: relative !important;
      overflow: hidden !important;
      background-color: var(${STATUS_VAR_BG}, transparent) !important;
      background-image: none !important;
    }

    .${STATUS_BUTTON_SURFACE_CLASS}::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: calc(100% + ${STATUS_RIBBON_TILE_SIZE});
      z-index: 0;
      pointer-events: none;
      border-radius: inherit;
      background-color: var(${STATUS_VAR_BG}, transparent) !important;
      background-image: none !important;
    }

    .${STATUS_BUTTON_SURFACE_CLASS}.${STATUS_BUTTON_RIBBON_CLASS}::before {
      background-color: transparent !important;
      background-image: repeating-linear-gradient(
        45deg,
        var(${STATUS_VAR_PRIMARY}, transparent),
        var(${STATUS_VAR_PRIMARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 20px
      ) !important;
      background-repeat: repeat !important;
      animation: my-toolbox-status-ribbon-move ${STATUS_RIBBON_ANIMATION_DURATION} linear infinite !important;
      animation-delay: var(${STATUS_RIBBON_DELAY_VAR}, 0ms) !important;
      will-change: transform;
    }

    .${STATUS_BUTTON_SURFACE_CLASS} > * {
      position: relative !important;
      z-index: 1 !important;
    }

    .${STATUS_ANIMATION_SURFACE_CLASS} {
      position: relative !important;
      isolation: isolate !important;
      overflow: hidden !important;
    }

    .${STATUS_ANIMATION_SURFACE_CLASS} > * {
      position: relative !important;
      z-index: 1 !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.ping} {
      animation: my-toolbox-status-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.breathe} {
      animation: my-toolbox-status-breathe 3.2s ease-in-out infinite !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.nudge} {
      animation: my-toolbox-status-nudge 2.8s ease-in-out infinite !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.shimmer}::after {
      content: "";
      position: absolute;
      top: 0;
      left: -60%;
      width: 40%;
      height: 100%;
      z-index: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.28),
        transparent
      );
      transform: skewX(-20deg);
      animation: my-toolbox-status-shimmer 2.6s ease-in-out infinite;
      pointer-events: none;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.glow} {
      animation: my-toolbox-status-glow 2.2s ease-in-out infinite !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.urgent} {
      animation: my-toolbox-status-urgent 1.4s ease-in-out infinite !important;
    }

    .${STATUS_ANIMATION_CLASS_BY_NAME.sweep}::after {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      z-index: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: my-toolbox-status-sweep 1.4s ease-out 1 forwards;
      pointer-events: none;
    }

    .${STATUS_WORKFLOW_CLASS} rect {
      fill: var(${STATUS_VAR_BG}, transparent) !important;
      stroke: var(${STATUS_VAR_STROKE}, transparent) !important;
    }

    .${STATUS_WORKFLOW_CLASS} text,
    .${STATUS_WORKFLOW_CLASS} tspan {
      fill: var(${STATUS_VAR_FG}, currentColor) !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .${STATUS_BASE_CLASS},
      .${STATUS_BASE_CLASS} *,
      .${STATUS_BASE_CLASS}::before,
      .${STATUS_BASE_CLASS}::after,
      .${STATUS_BUTTON_SURFACE_CLASS},
      .${STATUS_BUTTON_SURFACE_CLASS} *,
      .${STATUS_BUTTON_SURFACE_CLASS}::before,
      .${STATUS_BUTTON_SURFACE_CLASS}::after,
      .${STATUS_ANIMATION_SURFACE_CLASS},
      .${STATUS_ANIMATION_SURFACE_CLASS} *,
      .${STATUS_ANIMATION_SURFACE_CLASS}::before,
      .${STATUS_ANIMATION_SURFACE_CLASS}::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function rememberTrackedStatusElement(element) {
  if (!element) {
    return;
  }

  if (activeStatusElements) {
    activeStatusElements.add(element);
  }

  element.setAttribute(STATUS_TOUCH_ATTR, "1");
}

function readTrackedProperties(element) {
  if (!element?.hasAttribute(STATUS_PROPS_ATTR)) {
    return {};
  }

  try {
    const data = JSON.parse(element.getAttribute(STATUS_PROPS_ATTR) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeTrackedProperties(element, properties) {
  const entries = Object.keys(properties);
  if (entries.length === 0) {
    element.removeAttribute(STATUS_PROPS_ATTR);
    return;
  }

  element.setAttribute(STATUS_PROPS_ATTR, JSON.stringify(properties));
}

function rememberTrackedProperty(element, property) {
  if (!element || !property) {
    return;
  }

  const trackedProperties = readTrackedProperties(element);
  if (Object.prototype.hasOwnProperty.call(trackedProperties, property)) {
    return;
  }

  trackedProperties[property] = {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
  writeTrackedProperties(element, trackedProperties);
}

function restoreTrackedStatusElement(element) {
  if (!element || !element.hasAttribute(STATUS_TOUCH_ATTR)) {
    return;
  }

  const trackedProperties = readTrackedProperties(element);
  Object.entries(trackedProperties).forEach(([property, state]) => {
    const value = typeof state?.value === "string" ? state.value : "";
    const priority = typeof state?.priority === "string" ? state.priority : "";
    if (value) {
      element.style.setProperty(property, value, priority);
      return;
    }
    element.style.removeProperty(property);
  });

  TRACKED_STATUS_CLASSES.forEach((className) => {
    element.classList.remove(className);
  });
  if (!element.getAttribute("style")) {
    element.removeAttribute("style");
  }

  element.removeAttribute(STATUS_TOUCH_ATTR);
  element.removeAttribute(STATUS_PROPS_ATTR);
}

function cleanupTrackedStatusStyles() {
  const activeElements = activeStatusElements || new Set();
  document
    .querySelectorAll(`[${STATUS_TOUCH_ATTR}]`)
    .forEach((element) => {
      if (!activeElements.has(element) || !document.contains(element)) {
        restoreTrackedStatusElement(element);
      }
    });
}

function setTrackedStyle(element, property, value, priority = "") {
  if (!element) {
    return;
  }

  rememberTrackedStatusElement(element);
  rememberTrackedProperty(element, property);
  if (value === null || value === undefined || value === "") {
    element.style.removeProperty(property);
    return;
  }

  element.style.setProperty(property, value, priority);
}

function setTrackedClassState(element, className, enabled) {
  if (!element) {
    return;
  }

  rememberTrackedStatusElement(element);
  if (enabled) {
    element.classList.add(className);
    return;
  }

  element.classList.remove(className);
}

function setTrackedStatusVariable(element, variableName, value) {
  setTrackedStyle(element, variableName, value || "");
}

function getStatusAnimationClassName(animationClass) {
  return STATUS_ANIMATION_CLASS_BY_NAME[animationClass] || "";
}

function isRibbonAnimation(animationClass) {
  return animationClass === "ribbon";
}

function setTrackedStatusAnimation(element, animationClass) {
  const nextClassName = getStatusAnimationClassName(animationClass);
  STATUS_ANIMATION_CLASS_NAMES.forEach((className) => {
    setTrackedClassState(element, className, className === nextClassName);
  });
  setTrackedClassState(
    element,
    STATUS_ANIMATION_SURFACE_CLASS,
    Boolean(nextClassName)
  );
}

function setTrackedStatusPalette(element, statusSetting) {
  if (!element || !statusSetting) {
    return;
  }

  setTrackedStatusVariable(element, STATUS_VAR_BG, statusSetting.backgroundColor);
  setTrackedStatusVariable(element, STATUS_VAR_FG, statusSetting.textColor);
  setTrackedStatusVariable(element, STATUS_VAR_PRIMARY, statusSetting.primaryColor);
  setTrackedStatusVariable(element, STATUS_VAR_SECONDARY, statusSetting.secondaryColor);
  setTrackedStatusVariable(
    element,
    STATUS_VAR_STROKE,
    statusSetting.secondaryColor ||
      statusSetting.backgroundColor ||
      statusSetting.primaryColor
  );
}

function clearTrackedRibbonStyles(element) {
  setTrackedStyle(element, STATUS_RIBBON_DELAY_VAR, "");
  setTrackedStyle(element, "background-image", "");
  setTrackedStyle(element, "background-repeat", "");
  setTrackedStyle(element, "background-size", "");
  setTrackedStyle(element, "background-position", "");
  setTrackedStyle(element, "animation", "");
  setTrackedStyle(element, "transition", "");
}

function setTrackedRibbonPhase(element) {
  if (
    !element?.style.getPropertyValue ||
    element.style.getPropertyValue(STATUS_RIBBON_DELAY_VAR)
  ) {
    return;
  }

  const phase = getRefreshTimestamp() % STATUS_RIBBON_ANIMATION_DURATION_MS;
  setTrackedStyle(element, STATUS_RIBBON_DELAY_VAR, `${-phase}ms`);
}

function findStatusSetting(statusText) {
  return findStatusSettingFromLookup(compiledStatusLookup, statusText);
}

function getRefreshTimestamp() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function clearViewportRefreshTimer() {
  if (!viewportRefreshTimer) {
    return;
  }

  clearTimeout(viewportRefreshTimer);
  viewportRefreshTimer = 0;
}

function getTicketButtonStatusTexts(ticketButton) {
  if (!ticketButton) {
    return [];
  }

  const textTarget = ticketButton.querySelector?.(
    ISSUE_STATUS_BUTTON_TEXT_SELECTOR
  );
  return expandStatusTextCandidates([
    textTarget?.textContent,
    ticketButton.textContent,
    ticketButton.getAttribute?.("aria-label"),
    ticketButton.getAttribute?.("title"),
  ]);
}

function getStatusBadgeTestId(element) {
  return (
    element?.getAttribute?.("data-testid") ||
    element?.getAttribute?.("data-test-id") ||
    ""
  );
}

function isStatusBadgeTextElement(element) {
  return isStatusBadgeTextTestId(getStatusBadgeTestId(element));
}

function getStatusBadgeContainer(element) {
  if (!element?.closest) {
    return null;
  }

  const startElement = isStatusBadgeTextElement(element)
    ? element.parentElement
    : element;
  return startElement?.closest(STATUS_BADGE_CONTAINER_SELECTOR) || element;
}

function getNestedVisualBadge(element) {
  if (!element?.matches) {
    return null;
  }

  const testId = getStatusBadgeTestId(element);
  const isIssueTableCell = element.matches(ISSUE_TABLE_STATUS_CELL_SELECTOR);
  if (!shouldUseNestedStatusBadge({
    tagName: element.tagName,
    testId,
    isIssueTableCell,
  })) {
    return null;
  }

  return (
    element.querySelector(STATUS_BADGE_CONTAINER_SELECTOR) ||
    element.querySelector(
      ":scope > span:not([data-testid$='--text']):not([data-test-id$='--text']), :scope > div:not([data-testid$='--text']):not([data-test-id$='--text'])"
    )
  );
}

function getStatusButtonCandidates(element) {
  const container = getStatusBadgeContainer(element);
  return [
    element?.closest?.("button"),
    container?.closest?.("button"),
    ...(container?.querySelectorAll?.("button") || []),
    ...(element?.querySelectorAll?.("button") || []),
  ].filter(Boolean);
}

function findStatusButtonTarget(element, statusSetting) {
  const buttons = [...new Set(getStatusButtonCandidates(element))];
  if (buttons.length === 0) {
    return null;
  }

  if (!statusSetting) {
    return buttons[0];
  }

  return (
    buttons.find(
      (button) =>
        findStatusSettingFromCandidates([
          button.textContent,
          button.getAttribute("aria-label"),
          button.getAttribute("title"),
        ]) === statusSetting
    ) || buttons[0]
  );
}

function resolveStatusBadgePaintTarget(element, statusSetting = null) {
  if (!element) {
    return null;
  }

  const statusButton = findStatusButtonTarget(element, statusSetting);
  if (statusButton) {
    return statusButton;
  }

  const container = getStatusBadgeContainer(element);
  const visualBadge = getNestedVisualBadge(container);

  return visualBadge || container || element.parentElement || element;
}

function collectStatusTextElements(container) {
  if (!container?.querySelectorAll) {
    return [];
  }

  return [...container.querySelectorAll(STATUS_BADGE_TEXT_SELECTOR)];
}

function addStatusTextCandidate(candidates, text) {
  expandStatusTextCandidates(text).forEach((value) => candidates.add(value));
}

function getStatusBadgeTextCandidates(element) {
  const candidates = new Set();
  const container = getStatusBadgeContainer(element);
  const paintTarget = resolveStatusBadgePaintTarget(element);
  const textElements = collectStatusTextElements(container);
  const sources = [element, container, paintTarget, ...textElements];

  sources.forEach((source) => {
    addStatusTextCandidate(candidates, source?.textContent);
    addStatusTextCandidate(candidates, source?.getAttribute?.("aria-label"));
    addStatusTextCandidate(candidates, source?.getAttribute?.("title"));
  });

  return [...candidates];
}

function findStatusSettingFromCandidates(statusTexts) {
  const texts = Array.isArray(statusTexts) ? statusTexts : [statusTexts];
  for (const statusText of texts) {
    const statusSetting = findStatusSetting(statusText);
    if (statusSetting) {
      return statusSetting;
    }
  }

  return null;
}

function getHomeListStatusRegion(item) {
  if (!item?.children?.length) {
    return null;
  }

  const contentChildren = [...item.children].filter(
    (child) =>
      child.tagName !== "A" && normalizeStatusTextCandidate(child.textContent)
  );
  return contentChildren[contentChildren.length - 1] || null;
}

function isHomeListStatusTextLeaf(element) {
  if (!element || element.children.length > 0) {
    return false;
  }

  const text = normalizeStatusTextCandidate(element.textContent);
  return Boolean(text && findStatusSetting(text));
}

function resolveHomeListStatusPaintTarget(textElement, item) {
  const statusText = normalizeStatusTextCandidate(textElement?.textContent);
  if (!statusText || !item) {
    return null;
  }

  let target = textElement;
  let current = textElement;
  while (current?.parentElement && current.parentElement !== item) {
    const parent = current.parentElement;
    if (normalizeStatusTextCandidate(parent.textContent) !== statusText) {
      break;
    }
    if (parent.matches("span, button")) {
      target = parent;
    }
    current = parent;
  }

  return target;
}

function collectHomeListStatusTargets() {
  const targets = new Set();
  document.querySelectorAll(HOME_LIST_ITEM_SELECTOR).forEach((item) => {
    const region = getHomeListStatusRegion(item);
    if (!region?.querySelectorAll) {
      return;
    }

    region.querySelectorAll("span, div").forEach((element) => {
      if (!isHomeListStatusTextLeaf(element)) {
        return;
      }

      const target = resolveHomeListStatusPaintTarget(element, item);
      if (target) {
        targets.add(target);
      }
    });
  });

  return [...targets];
}

function applyStatusSettingToBadge(outerBadge, statusSetting) {
  if (!outerBadge || !statusSetting) {
    return;
  }

  ensureStatusColorizerStyle();
  const innerText = outerBadge.querySelector(":scope > span, :scope > div");
  const textTarget = innerText || outerBadge;
  const animationClass = statusSetting.animationClass || "";
  const usesRibbon = isRibbonAnimation(animationClass);
  setTrackedStatusPalette(outerBadge, statusSetting);
  setTrackedClassState(outerBadge, STATUS_BASE_CLASS, true);
  setTrackedClassState(outerBadge, STATUS_RIBBON_CLASS, usesRibbon);
  setTrackedStatusAnimation(outerBadge, animationClass);

  if (usesRibbon) {
    setTrackedRibbonPhase(outerBadge);
    setTrackedStyle(outerBadge, "background-color", "transparent");
  } else {
    setTrackedStyle(outerBadge, STATUS_RIBBON_DELAY_VAR, "");
    setTrackedStyle(outerBadge, "background-color", "");
  }
  if (innerText) {
    setTrackedStyle(
      innerText,
      "background-color",
      usesRibbon ? "transparent" : ""
    );
  }
  setTrackedStyle(
    textTarget,
    "color",
    statusSetting.textColor || "",
    statusSetting.textColor ? "important" : ""
  );
}

function applyStatusSettingToBadgeSource(sourceBadge, statusSetting) {
  const paintTarget = resolveStatusBadgePaintTarget(sourceBadge, statusSetting);
  if (!paintTarget) {
    return;
  }
  const usesRibbon = isRibbonAnimation(statusSetting.animationClass || "");

  if (paintTarget.matches?.("button")) {
    applyStatusSettingToTicketButton(paintTarget, statusSetting);
  } else {
    applyStatusSettingToBadge(paintTarget, statusSetting);
  }

  collectStatusTextElements(getStatusBadgeContainer(sourceBadge)).forEach(
    (textElement) => {
      setTrackedStyle(
        textElement,
        "color",
        statusSetting.textColor || "",
        statusSetting.textColor ? "important" : ""
      );
      setTrackedStyle(
        textElement,
        "background-color",
        usesRibbon ? "transparent" : ""
      );
    }
  );
}

function applyStatusSettingToHomeListStatus(statusBadge, statusSetting) {
  applyStatusSettingToBadge(statusBadge, statusSetting);
  const textColor = statusSetting.textColor || "";
  statusBadge.querySelectorAll?.("span, div").forEach((target) => {
    setTrackedStyle(target, "color", textColor, textColor ? "important" : "");
    setTrackedStyle(target, "background-color", "transparent", "important");
    setTrackedStyle(target, "background-image", "none", "important");
  });
}

function collectUniqueElements(...selectors) {
  const elements = new Set();
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      elements.add(element);
    });
  });
  return elements;
}

function paintStatusTargets(
  targets,
  { getStatusText, getStatusTexts, applyStatusSetting }
) {
  targets.forEach((target) => {
    const statusTexts =
      typeof getStatusTexts === "function"
        ? getStatusTexts(target)
        : getStatusText(target);
    const statusSetting = findStatusSettingFromCandidates(statusTexts);
    if (!statusSetting) {
      return;
    }

    applyStatusSetting(target, statusSetting);
  });
}

function applyStatusSettingToWorkflowNode(statusNode, statusSetting) {
  if (!statusNode || !statusSetting) {
    return;
  }

  ensureStatusColorizerStyle();
  setTrackedStatusPalette(statusNode, statusSetting);
  setTrackedClassState(statusNode, STATUS_WORKFLOW_CLASS, true);
}

function getTicketButtonStyleTargets(ticketButton) {
  return ticketButton ? [ticketButton] : [];
}

function getTicketButtonTextTargets(ticketButton) {
  return [
    ...new Set(
      getTicketButtonStyleTargets(ticketButton).flatMap((target) => [
        target,
        ...(target.querySelectorAll?.("span, div, svg") || []),
      ])
    ),
  ];
}

function getTicketButtonSurfaceBlockers(ticketButton) {
  if (!ticketButton?.querySelectorAll) {
    return [];
  }

  return [
    ...ticketButton.querySelectorAll(
      ":scope > span, :scope > div, :scope > span span, :scope > span div, :scope > div span, :scope > div div"
    ),
  ].filter((target) => {
    const isDirectEmptyOverlay =
      target.parentElement === ticketButton &&
      target.matches("div") &&
      !getStatusBadgeTestId(target).includes("status-lozenge") &&
      !normalizeStatusTextCandidate(target.textContent);

    return !isDirectEmptyOverlay;
  });
}

function clearTicketButtonHoverOverlay(ticketButton) {
  getTicketButtonSurfaceBlockers(ticketButton).forEach((target) => {
    setTrackedStyle(target, "background-color", "transparent", "important");
    setTrackedStyle(target, "background-image", "none", "important");
  });
}

function setTicketButtonColor(ticketButton, statusSetting) {
  const textColor = statusSetting.textColor || "";
  getTicketButtonTextTargets(ticketButton).forEach((target) => {
    if (textColor) {
      setTrackedStyle(target, "color", textColor, "important");
      return;
    }

    setTrackedStyle(target, "color", "");
  });
}

function clearTicketButtonRibbonStyles(ticketButton) {
  getTicketButtonStyleTargets(ticketButton).forEach((target) => {
    clearTrackedRibbonStyles(target);
    setTrackedStatusAnimation(target, "");
  });
}

function setTicketButtonBackground(ticketButton, animationClass = "") {
  getTicketButtonStyleTargets(ticketButton).forEach((target) => {
    clearTrackedRibbonStyles(target);
    setTrackedStyle(
      target,
      "background-color",
      `var(${STATUS_VAR_BG}, transparent)`,
      "important"
    );
    setTrackedStyle(target, "background-image", "none", "important");
    setTrackedClassState(target, STATUS_BASE_CLASS, true);
    setTrackedClassState(target, STATUS_BUTTON_SURFACE_CLASS, true);
    setTrackedClassState(target, STATUS_BUTTON_RIBBON_CLASS, false);
    setTrackedClassState(target, STATUS_RIBBON_CLASS, false);
    setTrackedStatusAnimation(target, animationClass);
  });
  clearTicketButtonHoverOverlay(ticketButton);
}

function setTicketButtonRibbonStyles(ticketButton) {
  getTicketButtonStyleTargets(ticketButton).forEach((target) => {
    if (!target.classList.contains(STATUS_BUTTON_RIBBON_CLASS)) {
      clearTrackedRibbonStyles(target);
    }
    setTrackedRibbonPhase(target);
    setTrackedStyle(
      target,
      "background-color",
      `var(${STATUS_VAR_BG}, transparent)`,
      "important"
    );
    setTrackedStyle(target, "background-image", "none", "important");
    setTrackedClassState(target, STATUS_BASE_CLASS, false);
    setTrackedClassState(target, STATUS_BUTTON_SURFACE_CLASS, true);
    setTrackedClassState(target, STATUS_BUTTON_RIBBON_CLASS, true);
    setTrackedClassState(target, STATUS_RIBBON_CLASS, false);
    setTrackedStatusAnimation(target, "");
  });
  clearTicketButtonHoverOverlay(ticketButton);
}

function applyStatusSettingToTicketButton(ticketButton, statusSetting) {
  if (!ticketButton || !statusSetting) {
    return;
  }

  ensureStatusColorizerStyle();
  getTicketButtonStyleTargets(ticketButton).forEach((target) => {
    setTrackedStatusPalette(target, statusSetting);
    const borderColor = getStatusButtonBorderColor(statusSetting);
    setTrackedStyle(
      target,
      "border-color",
      borderColor,
      borderColor ? "important" : ""
    );
  });
  const animationClass = statusSetting.animationClass || "";
  if (!animationClass || !isRibbonAnimation(animationClass)) {
    setTicketButtonBackground(ticketButton, animationClass);
    setTicketButtonColor(ticketButton, statusSetting);
    return;
  }

  setTicketButtonColor(ticketButton, statusSetting);
  setTicketButtonRibbonStyles(ticketButton);
}

function collectBadgeTargets() {
  return collectUniqueElements(...STATUS_BADGE_SELECTORS);
}

function collectTicketButtonTargets() {
  const ticketButton = document.querySelector(ISSUE_STATUS_BUTTON_SELECTOR);
  return ticketButton ? [ticketButton] : [];
}

function collectWorkflowTargets() {
  return [...document.querySelectorAll(WORKFLOW_STATUS_NODE_SELECTOR)];
}

function getStatusSurfaces() {
  return [
    {
      collectTargets: collectBadgeTargets,
      getStatusTexts: getStatusBadgeTextCandidates,
      applyStatusSetting: applyStatusSettingToBadgeSource,
    },
    {
      collectTargets: collectTicketButtonTargets,
      getStatusTexts: getTicketButtonStatusTexts,
      applyStatusSetting: applyStatusSettingToTicketButton,
    },
    {
      collectTargets: collectHomeListStatusTargets,
      getStatusText: (statusBadge) => statusBadge.textContent,
      applyStatusSetting: applyStatusSettingToHomeListStatus,
    },
    {
      collectTargets: collectWorkflowTargets,
      getStatusText: (statusNode) => statusNode.textContent,
      applyStatusSetting: applyStatusSettingToWorkflowNode,
    },
  ];
}

function paintStatuses() {
  getStatusSurfaces().forEach((surface) => {
    paintStatusTargets(surface.collectTargets(), surface);
  });
}

function refreshStatuses() {
  activeStatusElements = new Set();
  if (!statusColorizerEnabled || !compiledStatusLookup.size) {
    cleanupTrackedStatusStyles();
    activeStatusElements = null;
    return;
  }

  ensureStatusColorizerStyle();
  paintStatuses();
  cleanupTrackedStatusStyles();
  activeStatusElements = null;
}

function queueStatusRefreshFrame() {
  clearViewportRefreshTimer();
  if (refreshStatusesRaf) {
    return;
  }

  refreshStatusesRaf = requestAnimationFrame(() => {
    refreshStatusesRaf = 0;
    lastStatusRefreshAt = getRefreshTimestamp();
    refreshStatuses();
  });
}

function scheduleViewportStatusRefresh() {
  if (document.visibilityState === "hidden") {
    return;
  }

  const elapsed = getRefreshTimestamp() - lastStatusRefreshAt;
  if (!lastStatusRefreshAt || elapsed >= VIEWPORT_REFRESH_MIN_INTERVAL_MS) {
    queueStatusRefreshFrame();
    return;
  }

  if (refreshStatusesRaf || viewportRefreshTimer) {
    return;
  }

  viewportRefreshTimer = window.setTimeout(() => {
    viewportRefreshTimer = 0;
    queueStatusRefreshFrame();
  }, VIEWPORT_REFRESH_MIN_INTERVAL_MS - elapsed);
}

function scheduleStatusRefresh(reason = "default") {
  if (reason === "viewport") {
    scheduleViewportStatusRefresh();
    return;
  }

  queueStatusRefreshFrame();
}

function reloadStatusColorizerState(callback) {
  loadStatusColorizerEnabled(() => {
    loadStatusColorSettings(() => {
      callback?.();
    });
  });
}

function handleStorageChanges(changes) {
  if (!changes?.statusColorizerEnabled && !changes?.statusColorSettings) {
    return;
  }

  reloadStatusColorizerState(() => {
    scheduleStatusRefresh();
  });
}

function observeDOMChanges() {
  observeWorkerBodyMutations(scheduleStatusRefresh);
  observeWorkerViewportActivity(() => {
    scheduleStatusRefresh("viewport");
  });
  document.addEventListener("mouseover", scheduleStatusRefresh, {
    capture: true,
    passive: true,
  });
  document.addEventListener("focusin", scheduleStatusRefresh, {
    capture: true,
    passive: true,
  });
}

function scheduleInitialStatusRefreshes() {
  scheduleStatusRefresh();
  requestAnimationFrame(() => {
    scheduleStatusRefresh();
  });
  window.setTimeout(() => {
    scheduleStatusRefresh();
  }, 250);
  window.setTimeout(() => {
    scheduleStatusRefresh();
  }, 1200);
}

function startStatusColorizerWorker() {
  if (workerStarted) {
    return;
  }
  workerStarted = true;

  observeDOMChanges();
  observeWorkerStorageChanges(handleStorageChanges);
  reloadStatusColorizerState(function () {
    scheduleInitialStatusRefreshes();
  });
  runWorkerOnWindowLoad(scheduleInitialStatusRefreshes);
}

startStatusColorizerWorker();
})(globalThis);
