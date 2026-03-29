(function runStatusColorizerWorker(global) {
let statusColorSettings = [];
const insertedRibbonClasses = new Set();
let statusColorizerEnabled = true;
let refreshStatusesRaf = 0;
const ruleWorkerRuntime = global.MyToolboxRuleWorkerRuntime;
const STATUS_TOUCH_ATTR = "data-my-toolbox-status-touched";
const STATUS_STYLE_ATTR = "data-my-toolbox-status-style";
const STATUS_STYLE_MISSING = "__my_toolbox_status_style_missing__";
const STATUS_RIBBON_ATTR = "data-my-toolbox-status-ribbon-class";

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

function loadStatusColorizerEnabled(callback) {
  loadWorkerBooleanPreference("statusColorizerEnabled", (enabled) => {
    statusColorizerEnabled = enabled;
    callback?.();
  });
}

function loadStatusColorSettings(callback) {
  loadWorkerArraySetting("statusColorSettings", (settings) => {
    statusColorSettings = settings;
    callback?.();
  }, {
    defaultResourcePath: "data/defaultSettings.json",
  });
}

function rememberElementStyle(element) {
  if (!element || element.hasAttribute(STATUS_TOUCH_ATTR)) {
    return;
  }

  const inlineStyle = element.getAttribute("style");
  element.setAttribute(STATUS_TOUCH_ATTR, "1");
  element.setAttribute(
    STATUS_STYLE_ATTR,
    inlineStyle == null ? STATUS_STYLE_MISSING : inlineStyle
  );
}

function restoreElementStyle(element) {
  if (!element || !element.hasAttribute(STATUS_TOUCH_ATTR)) {
    return;
  }

  const ribbonClass = element.getAttribute(STATUS_RIBBON_ATTR);
  if (ribbonClass) {
    element.classList.remove(ribbonClass);
  }

  const originalStyle = element.getAttribute(STATUS_STYLE_ATTR);
  if (originalStyle === STATUS_STYLE_MISSING) {
    element.removeAttribute("style");
  } else if (originalStyle != null) {
    element.setAttribute("style", originalStyle);
  }

  element.removeAttribute(STATUS_TOUCH_ATTR);
  element.removeAttribute(STATUS_STYLE_ATTR);
  element.removeAttribute(STATUS_RIBBON_ATTR);
}

function clearTrackedStatusStyles() {
  document
    .querySelectorAll(`[${STATUS_TOUCH_ATTR}]`)
    .forEach((element) => restoreElementStyle(element));
}

function setTrackedStyle(element, property, value, priority = "") {
  if (!element) {
    return;
  }

  rememberElementStyle(element);
  if (value === null || value === undefined || value === "") {
    element.style.removeProperty(property);
    return;
  }

  element.style.setProperty(property, value, priority);
}

function setTrackedRibbonClass(element, className) {
  if (!element) {
    return;
  }

  rememberElementStyle(element);
  const previousClass = element.getAttribute(STATUS_RIBBON_ATTR);
  if (previousClass && previousClass !== className) {
    element.classList.remove(previousClass);
  }

  if (className) {
    element.classList.add(className);
    element.setAttribute(STATUS_RIBBON_ATTR, className);
    return;
  }

  if (previousClass) {
    element.classList.remove(previousClass);
  }
  element.removeAttribute(STATUS_RIBBON_ATTR);
}

function addGlobalStyle(css, className) {
  if (insertedRibbonClasses.has(className)) return;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
  insertedRibbonClasses.add(className);
}

function normalizeStatusName(statusName) {
  return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
}

function findStatusSetting(statusText) {
  const normalizedStatus = normalizeStatusName(statusText);
  if (!normalizedStatus) return null;
  return statusColorSettings.find((setting) => {
    if (!setting) return false;
    if (normalizeStatusName(setting.statusName) === normalizedStatus) {
      return true;
    }
    const aliases = Array.isArray(setting.aliases)
      ? setting.aliases
      : Array.isArray(setting.statusAliases)
        ? setting.statusAliases
        : [];
    return aliases.some(
      (alias) => normalizeStatusName(alias) === normalizedStatus
    );
  });
}

function sanitizeStatusName(statusName) {
  return statusName.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-");
}

function generateRibbonCSS(statusSetting) {
  const { statusName, primaryColor, secondaryColor } = statusSetting;
  const className = `ribbon-${sanitizeStatusName(statusName)}`;
  const css = `
    @keyframes ${className} {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    .${className} {
      background: repeating-linear-gradient(
        45deg,
        ${primaryColor},
        ${primaryColor} 10px,
        ${secondaryColor} 10px,
        ${secondaryColor} 20px
      );
      background-size: 200% 200%;
      animation: ${className} 8s linear infinite;
      color: black;
    }
  `;
  return { css, className };
}

function paintStatuses() {
  let elements = document.querySelectorAll(
    "span > div._1e0c1txw._1bsb1osq, span._1reo15vq"
  );
  elements.forEach((element) => {
    if (
      element.matches("span._1reo15vq") &&
      element.parentElement?.closest("span._1reo15vq")
    ) {
      return;
    }
    let statusText = element.textContent.trim().toLowerCase();
    let statusSetting = findStatusSetting(statusText);
    if (statusSetting) {
      const animationEnabled = statusSetting.animationClass;
      // handle old structure where the colored element is inside a div
      if (element.matches("div._1e0c1txw._1bsb1osq")) {
        let grandParentSpan = element.closest("span").parentNode.closest("span");
        if (grandParentSpan && element.firstChild) {
          if (!animationEnabled) {
            setTrackedStyle(
              element.firstChild,
              "background-color",
              statusSetting.backgroundColor
            );
            if (element.firstChild.firstChild && statusSetting.textColor) {
              setTrackedStyle(
                element.firstChild.firstChild,
                "color",
                statusSetting.textColor
              );
            }
          } else {
            setTrackedStyle(element.firstChild, "background-color", "transparent");
            if (element.firstChild.firstChild) {
              setTrackedStyle(
                element.firstChild.firstChild,
                "background-color",
                "transparent"
              );
              if (statusSetting.textColor) {
                setTrackedStyle(
                  element.firstChild.firstChild,
                  "color",
                  statusSetting.textColor
                );
              } else {
                setTrackedStyle(element.firstChild.firstChild, "color", "");
              }
            }
          }
          if (animationEnabled) {
            const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
            addGlobalStyle(ribbonCSS, className);
            setTrackedRibbonClass(element.firstChild, className);
            element.firstChild
              .querySelectorAll(`.${className}`)
              .forEach((inner) => {
                if (inner !== element.firstChild) {
                  inner.classList.remove(className);
                }
              });
          }
        }
      } else {
        // new structure where the colored element is the span itself
        let inner = element.querySelector("span, div");
        if (!animationEnabled) {
          setTrackedStyle(
            element,
            "background-color",
            statusSetting.backgroundColor
          );
          if (inner && statusSetting.textColor) {
            setTrackedStyle(inner, "color", statusSetting.textColor);
          }
        } else {
          setTrackedStyle(element, "background-color", "transparent");
          if (inner) {
            setTrackedStyle(inner, "background-color", "transparent");
            if (statusSetting.textColor) {
              setTrackedStyle(inner, "color", statusSetting.textColor);
            } else {
              setTrackedStyle(inner, "color", "");
            }
          }
        }
        if (animationEnabled) {
          const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
          addGlobalStyle(ribbonCSS, className);
          const ribbonAncestor = element.parentElement?.closest(`.${className}`);
          if (ribbonAncestor) {
            setTrackedRibbonClass(element, "");
          } else {
            setTrackedRibbonClass(element, className);
          }
          element.querySelectorAll(`.${className}`).forEach((innerEl) => {
            if (innerEl !== element) {
              innerEl.classList.remove(className);
            }
          });
        }
      }
    }
  });

  document.querySelectorAll("td.status").forEach((td) => {
    let span = td.querySelector("span");
    if (span) {
      let statusText = span.textContent.trim().toLowerCase();
      let setting = findStatusSetting(statusText);
      if (setting) {
        if (!setting.animationClass) {
          setTrackedStyle(span, "background-color", setting.backgroundColor);
          if (setting.textColor) {
            setTrackedStyle(span, "color", setting.textColor);
          }
        } else {
          setTrackedStyle(span, "background-color", "transparent");
          if (setting.textColor) {
            setTrackedStyle(span, "color", setting.textColor);
          } else {
            setTrackedStyle(span, "color", "");
          }
        }
        if (setting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(setting);
          addGlobalStyle(ribbonCSS, className);
          setTrackedRibbonClass(span, className);
        }
      }
    }
  });

  document
    .querySelectorAll("table.issue-table td.status span")
    .forEach((span) => {
      let statusText = span.textContent.trim().toLowerCase();
      let setting = findStatusSetting(statusText);
      if (setting) {
        if (!setting.animationClass) {
          setTrackedStyle(span, "background-color", setting.backgroundColor);
          if (setting.textColor) {
            setTrackedStyle(span, "color", setting.textColor);
          }
        } else {
          setTrackedStyle(span, "background-color", "transparent");
          if (setting.textColor) {
            setTrackedStyle(span, "color", setting.textColor);
          } else {
            setTrackedStyle(span, "color", "");
          }
        }
        if (setting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(setting);
          addGlobalStyle(ribbonCSS, className);
          setTrackedRibbonClass(span, className);
        }
      }
    });

  paintTicketButton();
}

function paintTicketButton() {
  let ticketButton = document.querySelector(
    "button[data-testid='issue-field-status.ui.status-view.status-button.status-button']"
  );
  if (ticketButton) {
    let statusSpan = ticketButton.querySelector("span.css-178ag6o");
    if (statusSpan) {
      let statusText = statusSpan.textContent.trim().toLowerCase();
      let statusSetting = findStatusSetting(statusText);
      if (statusSetting) {
        if (!statusSetting.animationClass) {
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
          }
        } else {
          setTrackedStyle(ticketButton, "background-color", "");
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
        }
        if (statusSetting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
          addGlobalStyle(ribbonCSS, className);
          setTrackedRibbonClass(ticketButton, className);
        }
      }
    }
  }
}

function refreshStatuses() {
  clearTrackedStatusStyles();
  if (!statusColorizerEnabled || !statusColorSettings.length) {
    return;
  }

  paintStatuses();
}

function scheduleStatusRefresh() {
  if (refreshStatusesRaf) {
    return;
  }

  refreshStatusesRaf = requestAnimationFrame(() => {
    refreshStatusesRaf = 0;
    refreshStatuses();
  });
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
}

runWorkerOnWindowLoad(function () {
  observeDOMChanges();
  observeWorkerStorageChanges(handleStorageChanges);
  reloadStatusColorizerState(function () {
    scheduleStatusRefresh();
  });
});
})(globalThis);
