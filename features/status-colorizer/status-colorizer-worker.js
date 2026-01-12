let statusColorSettings = [];
const insertedRibbonClasses = new Set();
let statusColorizerEnabled = true;

function loadStatusColorizerEnabled(callback) {
  chrome.storage.sync.get("statusColorizerEnabled", (data) => {
    statusColorizerEnabled = data.hasOwnProperty("statusColorizerEnabled") ? data.statusColorizerEnabled : true;
    if (callback) callback();
  });
}

function loadStatusColorSettings(callback) {
  chrome.storage.sync.get("statusColorSettings", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Status Colorizer: Error loading settings", chrome.runtime.lastError);
      statusColorSettings = [];
      if (callback) callback();
      return;
    }

    if (!data.hasOwnProperty("statusColorSettings")) {
      const defaultsUrl = chrome.runtime.getURL("data/defaultSettings.json");
      fetch(defaultsUrl)
        .then((response) => (response.ok ? response.json() : []))
        .then((defaults) => {
          if (Array.isArray(defaults)) {
            statusColorSettings = defaults;
            chrome.storage.sync.set({ statusColorSettings: defaults });
          } else {
            statusColorSettings = [];
          }
        })
        .catch((error) => {
          console.error("Status Colorizer: Failed to load default settings", error);
          statusColorSettings = [];
        })
        .finally(() => {
          if (callback) callback();
        });
      return;
    }

    statusColorSettings = Array.isArray(data.statusColorSettings)
      ? data.statusColorSettings
      : [];

    if (callback) callback();
  });
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
            element.firstChild.style.backgroundColor =
              statusSetting.backgroundColor;
            if (element.firstChild.firstChild && statusSetting.textColor) {
              element.firstChild.firstChild.style.color = statusSetting.textColor;
            }
          } else {
            element.firstChild.style.backgroundColor = "transparent";
            if (element.firstChild.firstChild) {
              element.firstChild.firstChild.style.backgroundColor = "transparent";
              if (statusSetting.textColor) {
                element.firstChild.firstChild.style.color = statusSetting.textColor;
              } else {
                element.firstChild.firstChild.style.color = "";
              }
            }
          }
          if (animationEnabled) {
            const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
            addGlobalStyle(ribbonCSS, className);
            element.firstChild.classList.add(className);
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
          element.style.backgroundColor = statusSetting.backgroundColor;
          if (inner && statusSetting.textColor) {
            inner.style.color = statusSetting.textColor;
          }
        } else {
          element.style.backgroundColor = "transparent";
          if (inner) {
            inner.style.backgroundColor = "transparent";
            if (statusSetting.textColor) {
              inner.style.color = statusSetting.textColor;
            } else {
              inner.style.color = "";
            }
          }
        }
        if (animationEnabled) {
          const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
          addGlobalStyle(ribbonCSS, className);
          const ribbonAncestor = element.parentElement?.closest(`.${className}`);
          if (ribbonAncestor) {
            element.classList.remove(className);
          } else {
            element.classList.add(className);
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
          span.style.backgroundColor = setting.backgroundColor;
          if (setting.textColor) {
            span.style.color = setting.textColor;
          }
        } else {
          span.style.backgroundColor = "transparent";
          if (setting.textColor) {
            span.style.color = setting.textColor;
          } else {
            span.style.color = "";
          }
        }
        if (setting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(setting);
          addGlobalStyle(ribbonCSS, className);
          span.classList.add(className);
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
          span.style.backgroundColor = setting.backgroundColor;
          if (setting.textColor) {
            span.style.color = setting.textColor;
          }
        } else {
          span.style.backgroundColor = "transparent";
          if (setting.textColor) {
            span.style.color = setting.textColor;
          } else {
            span.style.color = "";
          }
        }
        if (setting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(setting);
          addGlobalStyle(ribbonCSS, className);
          span.classList.add(className);
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
          ticketButton.style.setProperty(
            "background-color",
            statusSetting.backgroundColor,
            "important"
          );
          if (statusSetting.textColor) {
            ticketButton.style.setProperty(
              "color",
              statusSetting.textColor,
              "important"
            );
          }
        } else {
          ticketButton.style.removeProperty("background-color");
          if (statusSetting.textColor) {
            ticketButton.style.setProperty(
              "color",
              statusSetting.textColor,
              "important"
            );
          } else {
            ticketButton.style.removeProperty("color");
          }
        }
        if (statusSetting.animationClass) {
          const { css: ribbonCSS, className } = generateRibbonCSS(statusSetting);
          addGlobalStyle(ribbonCSS, className);
          ticketButton.classList.add(className);
        }
      }
    }
  }
}

function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    paintStatuses();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

window.addEventListener("load", function () {
  loadStatusColorizerEnabled(() => {
    if (!statusColorizerEnabled) return;
    loadStatusColorSettings(function () {
      observeDOMChanges();
      paintStatuses();
    });
  });
});
