const defaultStatusColorSettings = [];

let statusColorSettings = [];

function loadSettings(callback) {
  chrome.storage.sync.get(
    { statusColorSettings: defaultStatusColorSettings },
    function (data) {
      statusColorSettings = data.statusColorSettings;
      if (callback) callback();
    }
  );
}

function addGlobalStyle(css) {
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
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
  let elements = document.querySelectorAll("span > div._1e0c1txw._1bsb1osq");
  elements.forEach((element) => {
    let statusText = element.textContent.trim().toLowerCase();
    let statusSetting = statusColorSettings.find(
      (x) => x.statusName.toLowerCase() === statusText
    );
    if (statusSetting) {
      let grandParentSpan = element.closest("span").parentNode.closest("span");
      if (grandParentSpan) {
        if (element.firstChild) {
          element.firstChild.style.backgroundColor =
            statusSetting.backgroundColor;
          if (element.firstChild.firstChild && statusSetting.textColor) {
            element.firstChild.firstChild.style.color = statusSetting.textColor;
          }
        }
        if (statusSetting.animationClass) {
          const ribbonCSS = generateRibbonCSS(statusSetting);
          addGlobalStyle(ribbonCSS);
          element.firstChild.classList.add(
            `ribbon-${statusSetting.statusName.replace(/\s+/g, "-")}`
          );
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
          addGlobalStyle(ribbonCSS);
          span.classList.add(
            `ribbon-${setting.statusName.replace(/\s+/g, "-")}`
          );
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
          addGlobalStyle(ribbonCSS);
          span.classList.add(
            `ribbon-${setting.statusName.replace(/\s+/g, "-")}`
          );
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
          addGlobalStyle(ribbonCSS);
          ticketButton.classList.add(
            `ribbon-${statusSetting.statusName.replace(/\s+/g, "-")}`
          );
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