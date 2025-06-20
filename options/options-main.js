import { initializeColorizer } from "../features/colorizer/colorizer.js";
import { initializeNotepad } from "../features/notepad/notepad.js";

let currentMessages = {};
let currentLang = "en";
const supportedLangs = ["en", "uk"];
let loadedDefaultSettings = [];

export async function loadMessages(lang) {
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
    console.error(`Could not load messages for language "${lang}":`, error);
    if (lang !== "en") {
      return await loadMessages("en");
    } else {
      return {};
    }
  }
}
export function getText(key, substitutions = null) {
  const messageObj = currentMessages[key];
  if (!messageObj || typeof messageObj.message !== "string") {
    return key;
  }
  let message = messageObj.message;
  const subs = substitutions
    ? Array.isArray(substitutions)
      ? substitutions
      : [substitutions]
    : [];
  if (messageObj.placeholders && subs.length > 0) {
    Object.keys(messageObj.placeholders).forEach((placeholderName) => {
      const placeholderData = messageObj.placeholders[placeholderName];
      if (placeholderData && typeof placeholderData.content === "string") {
        const contentMarker = placeholderData.content;
        const substitutionIndex = parseInt(contentMarker.substring(1), 10) - 1;
        if (substitutionIndex >= 0 && substitutionIndex < subs.length) {
          const substitutionValue = subs[substitutionIndex];
          const placeholderInMessage = `$${placeholderName.toUpperCase()}$`;
          try {
            const regex = new RegExp(
              `\\$${placeholderName.toUpperCase()}\\$`,
              "g"
            );
            message = message.replace(regex, substitutionValue);
          } catch (e) {
            console.error(
              `Error creating regex for placeholder: $${placeholderName.toUpperCase()}$`,
              e
            );
          }
        } else {
        }
      }
    });
  } else if (subs.length > 0 && !messageObj.placeholders) {
    subs.forEach((sub, index) => {
      const regex = new RegExp(`\\$${index + 1}`, "g");
      message = message.replace(regex, sub);
    });
  }
  return message;
}
export function showToast(messageKey = "toastSaved", substitutions = null) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = getText(messageKey, substitutions);
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
export function showValidationErrorModal(messageKey, substitutions = null) {
  const modal = document.getElementById("validationErrorModal");
  const messageElement = document.getElementById("validationErrorMessage");
  if (modal && messageElement) {
    messageElement.textContent = getText(messageKey, substitutions);
    modal.classList.add("active");
  } else {
    console.error(
      "Validation error modal elements not found! Falling back to alert."
    );
    alert(getText(messageKey, substitutions));
  }
}
export function showResetTableModal() {
  const resetModal = document.getElementById("confirmModal");
  if (resetModal) {
    resetModal.classList.add("active");
    applyTranslations();
  } else {
    console.error("Could not find Reset Table Confirm Modal overlay");
  }
}
export function showDefaultSettingsModal() {
  const defaultModal = document.getElementById("resetConfirmModal");
  if (defaultModal) {
    defaultModal.classList.add("active");
    applyTranslations();
  } else {
    console.error("Could not find Default Settings Confirm Modal overlay");
  }
}
export function getLoadedDefaultSettings() {
  return loadedDefaultSettings;
}

function applyTranslations() {
  if (!currentMessages) return;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translation = getText(key);
    if (element.hasAttribute("data-i18n-html")) {
      element.innerHTML = translation;
    } else if (element.placeholder !== undefined) {
      element.placeholder = translation;
    } else if (
      [
        "BUTTON",
        "OPTION",
        "LABEL",
        "H1",
        "H2",
        "H5",
        "P",
        "TH",
        "TITLE",
      ].includes(element.tagName)
    ) {
      element.textContent = translation;
    } else {
      element.textContent = translation;
    }
    if (key === "optionsTitle") {
      document.title = getText("appName") + " - " + translation;
    }
  });
  document
    .querySelectorAll('#statusTable tbody input[type="text"]')
    .forEach((input) => {
      input.placeholder = getText("inputStatusPlaceholder");
    });
  const notepadArea = document.getElementById("notepadArea");
  if (notepadArea) {
    notepadArea.placeholder = getText("notepadPlaceholder");
  }
}

async function setLanguage(lang) {
  currentLang = supportedLangs.includes(lang) ? lang : "en";
  await loadMessages(currentLang);
  applyTranslations();

  const langButtonsContainer = document.querySelector(".language-buttons");
  const langOptions = document.querySelectorAll(".lang-option");
  langOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
  });
  if (langButtonsContainer) {
    langButtonsContainer.classList.toggle("show-uk", currentLang === "uk");
  }

  chrome.storage.sync.set({ userLanguage: currentLang }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error saving language preference:",
        chrome.runtime.lastError
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const languageButtonsContainer = document.querySelector(".language-buttons");
  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const pageContainer = document.querySelector(".page-container");
  const confirmResetTableModal = document.getElementById("confirmModal");
  const cancelResetTableBtn = document.getElementById("cancelDelete");
  const confirmDefaultModal = document.getElementById("resetConfirmModal");
  const cancelDefaultBtn = document.getElementById("cancelReset");
  const validationErrorModal = document.getElementById("validationErrorModal");
  const validationErrorOkBtn = document.getElementById("validationErrorOkBtn");
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabPanes = document.querySelectorAll(".tab-pane");

  const langPref = await new Promise((resolve) => {
    chrome.storage.sync.get("userLanguage", (data) => {
      resolve(data.userLanguage || "en");
    });
  });
  try {
    const defaultSettingsURL = chrome.runtime.getURL(
      "./data/defaultSettings.json"
    );
    const response = await fetch(defaultSettingsURL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    loadedDefaultSettings = await response.json();
  } catch (error) {
    console.error("CRITICAL: Failed to load default settings.", error);
    showToast("toastErrorLoading");
    loadedDefaultSettings = [];
  }
  await setLanguage(langPref);

  const manifest = chrome.runtime.getManifest();
  const versionEl = document.getElementById("appVersion");
  if (versionEl && manifest && manifest.version) {
    versionEl.textContent = getText("versionText", manifest.version);
  }

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.toggle("open");
      if (pageContainer) {
        pageContainer.classList.toggle("shifted");
      }
    });
  }

  if (languageButtonsContainer) {
    languageButtonsContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".lang-option");
      if (button && button.dataset.lang) {
        const newLang = button.dataset.lang;
        if (newLang !== currentLang) {
          setLanguage(newLang);
        }
      }
    });
  } else {
    console.error("Missing Language Buttons container");
  }

  if (cancelResetTableBtn && confirmResetTableModal) {
    cancelResetTableBtn.addEventListener("click", () =>
      confirmResetTableModal.classList.remove("active")
    );
  } else {
    console.error("Missing Cancel Reset Table button or modal");
  }
  if (cancelDefaultBtn && confirmDefaultModal) {
    cancelDefaultBtn.addEventListener("click", () =>
      confirmDefaultModal.classList.remove("active")
    );
  } else {
    console.error("Missing Cancel Default button or modal");
  }
  if (validationErrorOkBtn && validationErrorModal) {
    validationErrorOkBtn.addEventListener("click", () =>
      validationErrorModal.classList.remove("active")
    );
  } else {
    console.error("Missing Validation Error OK button or modal");
  }

  tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetTabId = link.dataset.tab;
      tabLinks.forEach((l) => l.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      link.classList.add("active");
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add("active");
      } else {
        console.error(`Tab pane with ID ${targetTabId} not found!`);
      }
    });
  });

  [confirmResetTableModal, confirmDefaultModal, validationErrorModal].forEach(
    (modal) => {
      if (modal) {
        modal.addEventListener("click", (event) => {
          if (event.target === modal) {
            modal.classList.remove("active");
          }
        });
      }
    }
  );

  initializeColorizer();
  initializeNotepad();

});