let currentMessages = {};
let currentLang = "en";
const supportedLangs = ["en", "uk"];
let colorizerToggleEl;
let colorizerSliderEl;
let toggleWrapperEl;
let preloadedColorizerEnabled = null;
try {
  const stored = localStorage.getItem("colorizerEnabled");
  if (stored !== null) {
    preloadedColorizerEnabled = stored !== "false";
  }
} catch (e) {
  preloadedColorizerEnabled = null;
}
async function loadMessages(lang) {
  if (!supportedLangs.includes(lang)) {
    lang = "en";
  }
  try {
    const url = chrome.runtime.getURL(`../_locales/${lang}/messages.json`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const messages = await response.json();
    currentMessages = messages;
    return messages;
  } catch (error) {
    console.error(
      `Could not load popup messages for language "${lang}":`,
      error
    );
    if (lang !== "en") {
      return await loadMessages("en");
    } else {
      return {};
    }
  }
}
function getText(key, substitutions = null) {
  const messageObj = currentMessages[key];
  if (!messageObj || !messageObj.message) {
    return key;
  }
  let message = messageObj.message;
  if (substitutions) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    subs.forEach((sub, index) => {
      const regex = new RegExp(`\\$${index + 1}`, "g");
      message = message.replace(regex, sub);
    });
  }
  return message;
}
function applyPopupTranslations() {
  if (!currentMessages || Object.keys(currentMessages).length === 0) {
    return;
  }
  document.title = getText("appName");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = getText(key);
  });
}

function loadColorizerToggle(done) {
  chrome.storage.sync.get("colorizerEnabled", (data) => {
    if (colorizerToggleEl) {
      colorizerToggleEl.checked = data.colorizerEnabled !== false;
    }
    requestAnimationFrame(() => {
      if (colorizerSliderEl) {
        colorizerSliderEl.classList.remove("no-transition");
      }
      if (toggleWrapperEl) {
        toggleWrapperEl.classList.remove("loading");
      }
      if (typeof done === "function") {
        done();
      }
    });
  });
}

function saveColorizerToggle() {
  if (!colorizerToggleEl) return;
  const enabled = colorizerToggleEl.checked;
  chrome.storage.sync.set({ colorizerEnabled: enabled }, () => {
    try {
      localStorage.setItem("colorizerEnabled", String(enabled));
    } catch (e) {
      console.debug("Unable to access localStorage", e);
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "setColorizerEnabled", enabled },
          () => {
            if (chrome.runtime.lastError) {
              console.debug("No receiver for setColorizerEnabled");
            }
          }
        );
      }
    });
  });
}

async function initializePopup() {
  const langPref = await new Promise((resolve) => {
    chrome.storage.sync.get("userLanguage", (data) => {
      resolve(data.userLanguage || "en");
    });
  });
  currentLang = langPref;
  await loadMessages(currentLang);
  applyPopupTranslations();
  colorizerToggleEl = document.getElementById("colorizerToggle");
  colorizerSliderEl = document.querySelector("#colorizerToggle + .switch-slider");
  toggleWrapperEl = document.querySelector(".toggle-wrapper");
  if (preloadedColorizerEnabled !== null && colorizerToggleEl) {
    colorizerToggleEl.checked = preloadedColorizerEnabled;
  }
  if (colorizerSliderEl) {
    colorizerSliderEl.classList.add("no-transition");
  }
  if (toggleWrapperEl) {
    toggleWrapperEl.classList.add("loading");
  }
  if (colorizerToggleEl) {
    colorizerToggleEl.addEventListener("change", saveColorizerToggle);
    loadColorizerToggle(() => {
      document.body.classList.remove("preload");
    });
  } else {
    document.body.classList.remove("preload");
  }
  const optionsBtn = document.getElementById("openOptionsBtn");
  if (optionsBtn) {
    optionsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage((err) => {
        if (chrome.runtime.lastError || err) {
          console.error(
            "Error opening options page:",
            chrome.runtime.lastError || err
          );
        }
      });
    });
  } else {
    console.error("Options button (#openOptionsBtn) not found in popup.html");
  }
}
document.addEventListener("DOMContentLoaded", initializePopup);
