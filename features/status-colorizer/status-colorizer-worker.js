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
  buildStatusLookup = () => new Map(),
  findStatusSettingFromLookup = () => null,
  getStatusRibbonBackground = () => "",
} = statusColorizerLogic;
const STATUS_TOUCH_ATTR = "data-my-toolbox-status-touched";
const STATUS_PROPS_ATTR = "data-my-toolbox-status-props";
const STATUS_STYLE_ID = "my-toolbox-status-colorizer-style";
const STATUS_BASE_CLASS = "my-toolbox-status-colored";
const STATUS_RIBBON_CLASS = "my-toolbox-status-ribbon";
const STATUS_BUTTON_RIBBON_CLASS = "my-toolbox-status-button-ribbon";
const STATUS_WORKFLOW_CLASS = "my-toolbox-status-workflow";
const STATUS_VAR_BG = "--my-toolbox-status-bg";
const STATUS_VAR_FG = "--my-toolbox-status-fg";
const STATUS_VAR_PRIMARY = "--my-toolbox-status-primary";
const STATUS_VAR_SECONDARY = "--my-toolbox-status-secondary";
const STATUS_VAR_STROKE = "--my-toolbox-status-stroke";
const ATLASSIAN_STATUS_BADGE_SELECTOR =
  "[data-testid^='issue.fields.status.common.ui.status-lozenge.'] > span";
const HISTORY_STATUS_BADGE_SELECTOR =
  "[data-testid='common-components-status-lozenge.status-lozenge']";
const INLINE_CARD_STATUS_BADGE_SELECTOR =
  "[data-testid='inline-card-resolved-view-lozenge']";
const CLASSIC_STATUS_BADGE_SELECTOR =
  "td.status > span.jira-issue-status-lozenge, table.issue-table td.status span.jira-issue-status-lozenge";
const ISSUE_STATUS_BUTTON_SELECTOR =
  "button[data-testid='issue-field-status.ui.status-view.status-button.status-button']";
const WORKFLOW_STATUS_NODE_SELECTOR =
  "svg[data-testid='accessible-workflow-diagram.svg-root'] g[data-drag-type='status']";
const STATUS_BADGE_SELECTORS = [
  ATLASSIAN_STATUS_BADGE_SELECTOR,
  HISTORY_STATUS_BADGE_SELECTOR,
  INLINE_CARD_STATUS_BADGE_SELECTOR,
  CLASSIC_STATUS_BADGE_SELECTOR,
];
const VIEWPORT_REFRESH_MIN_INTERVAL_MS = 120;
let activeStatusElements = null;
const TRACKED_STATUS_CLASSES = [
  STATUS_BASE_CLASS,
  STATUS_RIBBON_CLASS,
  STATUS_BUTTON_RIBBON_CLASS,
  STATUS_WORKFLOW_CLASS,
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
    statusColorSettings = settings;
    compiledStatusLookup = buildStatusLookup(settings);
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
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    .${STATUS_BASE_CLASS} {
      background-color: var(${STATUS_VAR_BG}, transparent) !important;
    }

    .${STATUS_RIBBON_CLASS} {
      background-color: transparent !important;
      background-image: repeating-linear-gradient(
        45deg,
        var(${STATUS_VAR_PRIMARY}, transparent),
        var(${STATUS_VAR_PRIMARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 10px,
        var(${STATUS_VAR_SECONDARY}, transparent) 20px
      ) !important;
      background-repeat: repeat !important;
      background-size: 200% 200% !important;
      animation: my-toolbox-status-ribbon-move 8s linear infinite !important;
    }

    .${STATUS_WORKFLOW_CLASS} rect {
      fill: var(${STATUS_VAR_BG}, transparent) !important;
      stroke: var(${STATUS_VAR_STROKE}, transparent) !important;
    }

    .${STATUS_WORKFLOW_CLASS} text,
    .${STATUS_WORKFLOW_CLASS} tspan {
      fill: var(${STATUS_VAR_FG}, currentColor) !important;
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

function setTrackedStaticRibbonStyles(element, statusSetting) {
  setTrackedStyle(
    element,
    "background-image",
    getStatusRibbonBackground(statusSetting),
    "important"
  );
  setTrackedStyle(element, "background-repeat", "repeat", "important");
  setTrackedStyle(element, "background-size", "200% 200%", "important");
  setTrackedStyle(element, "background-position", "0% 50%", "important");
  setTrackedStyle(element, "animation", "none", "important");
  setTrackedStyle(element, "transition", "none", "important");
}

function clearTrackedRibbonStyles(element) {
  setTrackedStyle(element, "background-image", "");
  setTrackedStyle(element, "background-repeat", "");
  setTrackedStyle(element, "background-size", "");
  setTrackedStyle(element, "background-position", "");
  setTrackedStyle(element, "animation", "");
  setTrackedStyle(element, "transition", "");
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

function getTicketButtonStatusText(ticketButton) {
  return (
    ticketButton
      ?.querySelector("span.css-178ag6o")
      ?.textContent || ""
  );
}

function applyStatusSettingToBadge(outerBadge, statusSetting) {
  if (!outerBadge || !statusSetting) {
    return;
  }

  ensureStatusColorizerStyle();
  const innerText = outerBadge.querySelector(":scope > span, :scope > div");
  const textTarget = innerText || outerBadge;
  setTrackedStatusPalette(outerBadge, statusSetting);
  setTrackedClassState(outerBadge, STATUS_BASE_CLASS, true);
  setTrackedClassState(
    outerBadge,
    STATUS_RIBBON_CLASS,
    statusSetting.animationClass === "ribbon"
  );

  if (statusSetting.animationClass === "ribbon") {
    setTrackedStyle(outerBadge, "background-color", "transparent");
  } else {
    setTrackedStyle(outerBadge, "background-color", "");
  }
  if (innerText) {
    setTrackedStyle(
      innerText,
      "background-color",
      statusSetting.animationClass === "ribbon" ? "transparent" : ""
    );
  }
  setTrackedStyle(textTarget, "color", statusSetting.textColor || "");
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

function paintStatusTargets(targets, { getStatusText, applyStatusSetting }) {
  targets.forEach((target) => {
    const statusSetting = findStatusSetting(getStatusText(target));
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

function applyStatusSettingToTicketButton(ticketButton, statusSetting) {
  if (!ticketButton || !statusSetting) {
    return;
  }

  ensureStatusColorizerStyle();
  setTrackedStatusPalette(ticketButton, statusSetting);
  if (!statusSetting.animationClass) {
    clearTrackedRibbonStyles(ticketButton);
    setTrackedStyle(
      ticketButton,
      "background-color",
      statusSetting.backgroundColor,
      "important"
    );
    if (statusSetting.textColor) {
      setTrackedStyle(
        ticketButton,
        "color",
        statusSetting.textColor,
        "important"
      );
    } else {
      setTrackedStyle(ticketButton, "color", "");
    }
    setTrackedClassState(ticketButton, STATUS_BUTTON_RIBBON_CLASS, false);
    return;
  }

  setTrackedStyle(ticketButton, "background-color", "transparent", "important");
  if (statusSetting.textColor) {
    setTrackedStyle(
      ticketButton,
      "color",
      statusSetting.textColor,
      "important"
    );
  } else {
    setTrackedStyle(ticketButton, "color", "");
  }
  setTrackedStaticRibbonStyles(ticketButton, statusSetting);
  setTrackedClassState(ticketButton, STATUS_BUTTON_RIBBON_CLASS, false);
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
      getStatusText: (badge) => badge.textContent,
      applyStatusSetting: applyStatusSettingToBadge,
    },
    {
      collectTargets: collectTicketButtonTargets,
      getStatusText: getTicketButtonStatusText,
      applyStatusSetting: applyStatusSettingToTicketButton,
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
