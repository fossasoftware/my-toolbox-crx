let statusColorSettings = [];

function loadSettings(callback) {
  chrome.storage.sync.get("statusColorSettings", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Colorizer: Error loading settings", chrome.runtime.lastError);
      statusColorSettings = [];
      if (callback) callback();
      return;
    }

    statusColorSettings = data.statusColorSettings;

    if (!Array.isArray(statusColorSettings) || statusColorSettings.length === 0) {
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
          console.error("Colorizer: Failed to load default settings", error);
          statusColorSettings = [];
        })
        .finally(() => {
          if (callback) callback();
        });
      return;
    }

    if (callback) callback();
  });
}

const styleCache = new Set();
function addGlobalStyle(css, id) {
  if (id && styleCache.has(id)) return;
  const style = document.createElement("style");
  if (id) style.dataset.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
  if (id) styleCache.add(id);
}

function generateRibbonCSS(statusSetting) {
  const { statusName, primaryColor, secondaryColor } = statusSetting;
  const className = `ribbon-${statusName.replace(/\s+/g, "-")}`;
  return `
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
}

function paintStatuses() {
  let elements = document.querySelectorAll(
    "span > div._1e0c1txw._1bsb1osq, span._2rko1l7b"
  );
  elements.forEach((element) => {
    let statusText = element.textContent.trim().toLowerCase();
    let statusSetting = statusColorSettings.find(
      (x) => x.statusName.toLowerCase() === statusText
    );
    if (statusSetting) {
      // handle old structure where the colored element is inside a div
      if (element.matches("div._1e0c1txw._1bsb1osq")) {
        let grandParentSpan = element.closest("span").parentNode.closest("span");
        if (grandParentSpan && element.firstChild) {
          element.firstChild.style.backgroundColor =
            statusSetting.backgroundColor;
          if (element.firstChild.firstChild && statusSetting.textColor) {
            element.firstChild.firstChild.style.color = statusSetting.textColor;
          }
          if (statusSetting.animationClass) {
            const ribbonCSS = generateRibbonCSS(statusSetting);
            const cls = `ribbon-${statusSetting.statusName.replace(/\s+/g, "-")}`;
            addGlobalStyle(ribbonCSS, cls);
            element.firstChild.classList.add(cls);
          }
        }
      } else {
        // new structure where the colored element is the span itself
        element.style.backgroundColor = statusSetting.backgroundColor;
        let inner = element.querySelector("span, div");
        if (inner && statusSetting.textColor) {
          inner.style.color = statusSetting.textColor;
        }
        if (statusSetting.animationClass) {
          const ribbonCSS = generateRibbonCSS(statusSetting);
          const cls = `ribbon-${statusSetting.statusName.replace(/\s+/g, "-")}`;
          addGlobalStyle(ribbonCSS, cls);
          element.classList.add(cls);
        }
      }
    }
  });

  document.querySelectorAll("td.status").forEach((td) => {
    let span = td.querySelector("span");
    if (span) {
      let statusText = span.textContent.trim().toLowerCase();
      let setting = statusColorSettings.find(
        (x) => x.statusName.toLowerCase() === statusText
      );
      if (setting) {
        span.style.backgroundColor = setting.backgroundColor;
        if (setting.textColor) {
          span.style.color = setting.textColor;
        }
        if (setting.animationClass) {
          const ribbonCSS = generateRibbonCSS(setting);
          const cls = `ribbon-${setting.statusName.replace(/\s+/g, "-")}`;
          addGlobalStyle(ribbonCSS, cls);
          span.classList.add(cls);
        }
      }
    }
  });

  document
    .querySelectorAll("table.issue-table td.status span")
    .forEach((span) => {
      let statusText = span.textContent.trim().toLowerCase();
      let setting = statusColorSettings.find(
        (x) => x.statusName.toLowerCase() === statusText
      );
      if (setting) {
        span.style.backgroundColor = setting.backgroundColor;
        if (setting.textColor) {
          span.style.color = setting.textColor;
        }
        if (setting.animationClass) {
          const ribbonCSS = generateRibbonCSS(setting);
          const cls = `ribbon-${setting.statusName.replace(/\s+/g, "-")}`;
          addGlobalStyle(ribbonCSS, cls);
          span.classList.add(cls);
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
      let statusSetting = statusColorSettings.find(
        (x) => x.statusName.toLowerCase() === statusText
      );
      if (statusSetting) {
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
        if (statusSetting.animationClass) {
          const ribbonCSS = generateRibbonCSS(statusSetting);
          const cls = `ribbon-${statusSetting.statusName.replace(/\s+/g, "-")}`;
          addGlobalStyle(ribbonCSS, cls);
          ticketButton.classList.add(cls);
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
  loadSettings(function () {
    observeDOMChanges();
    paintStatuses();
  });
});