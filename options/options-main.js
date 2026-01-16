import { initializeStatusColorizer } from "../features/status-colorizer/status-colorizer.js";
import { initializeStatusColorizerTab } from "../features/status-colorizer/status-colorizer-tab.js";
import { initializeRowHighlighter } from "../features/row-highlighter/row-highlighter.js";
import { initializeRowHighlighterTab } from "../features/row-highlighter/row-highlighter-tab.js";
import { initializeNotepad } from "../features/notepad/notepad.js";
import { initializeNotepadTab } from "../features/notepad/notepad-tab.js";
import { initializeSettingsTab } from "../features/settings/settings-tab.js";
import { initializeBookmarks } from "../features/bookmarks/bookmarks.js";
import { initializeBookmarksTab } from "../features/bookmarks/bookmarks-tab.js";

let currentMessages = {};
let currentLang = "en";
const supportedLangs = ["en", "uk"];
let loadedDefaultSettings = [];
let toastTimeout;
let toastHideTimeout;
let toastClickHandler;
let toastActionHandler;
let toastHoverEnterHandler;
let toastHoverLeaveHandler;
let toastOnHide;
let toastStartTime = 0;
let toastRemaining = 0;
const TOAST_HIDE_DURATION = 240;
const TOAST_VISIBLE_DURATION = 2600;

function updateVersionText() {
  const manifest = chrome.runtime.getManifest();
  const versionEl = document.getElementById("appVersion");
  if (versionEl && manifest && manifest.version) {
    versionEl.textContent = getText("versionText", manifest.version);
  }
}

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
export function showToast(
  messageKey = "toastSaved",
  substitutions = null,
  options = null
) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  if (toastOnHide) {
    toastOnHide();
    toastOnHide = null;
  }
  if (toastClickHandler) {
    toast.removeEventListener("click", toastClickHandler);
    toastClickHandler = null;
  }
  if (toastActionHandler) {
    const actionButton = toast.querySelector(".toast-action");
    if (actionButton) {
      actionButton.removeEventListener("click", toastActionHandler);
    }
    toastActionHandler = null;
  }
  if (toastHoverEnterHandler) {
    toast.removeEventListener("mouseenter", toastHoverEnterHandler);
    toast.removeEventListener("mouseleave", toastHoverLeaveHandler);
    toastHoverEnterHandler = null;
    toastHoverLeaveHandler = null;
  }
  const messageText = getText(messageKey, substitutions);
  const actionLabelKey = options?.actionLabelKey;
  const actionLabel = options?.actionLabel;
  const onAction = options?.onAction;
  toastOnHide = typeof options?.onHide === "function" ? options.onHide : null;
  if (onAction && (actionLabelKey || actionLabel)) {
    toast.textContent = "";
    const body = document.createElement("div");
    body.className = "toast-body";
    const message = document.createElement("span");
    message.className = "toast-message";
    message.textContent = messageText;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-action";
    const label = actionLabelKey ? getText(actionLabelKey) : actionLabel;
    button.textContent = label;
    button.setAttribute("aria-label", label);
    toastActionHandler = (event) => {
      event.preventDefault();
      const handler = onAction;
      if (toastActionHandler) {
        button.removeEventListener("click", toastActionHandler);
        toastActionHandler = null;
      }
      handler();
    };
    button.addEventListener("click", toastActionHandler);
    body.appendChild(message);
    body.appendChild(button);
    toast.appendChild(body);
  } else {
    toast.textContent = messageText;
  }
  if (options && typeof options.onClick === "function" && !onAction) {
    toastClickHandler = (event) => {
      event.preventDefault();
      const handler = options.onClick;
      toast.removeEventListener("click", toastClickHandler);
      toastClickHandler = null;
      handler();
    };
    toast.addEventListener("click", toastClickHandler);
  }
  clearTimeout(toastTimeout);
  clearTimeout(toastHideTimeout);
  toast.classList.remove("hide");
  toast.classList.add("show");
  const duration =
    options && Number.isFinite(options.duration)
      ? options.duration
      : TOAST_VISIBLE_DURATION;
  const startHideTimer = (delay) => {
    toastRemaining = delay;
    toastStartTime = Date.now();
    toastTimeout = setTimeout(() => {
      toast.classList.add("hide");
      toastHideTimeout = setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("hide");
        if (toastClickHandler) {
          toast.removeEventListener("click", toastClickHandler);
          toastClickHandler = null;
        }
        if (toastActionHandler) {
          const actionButton = toast.querySelector(".toast-action");
          if (actionButton) {
            actionButton.removeEventListener("click", toastActionHandler);
          }
          toastActionHandler = null;
        }
        if (toastHoverEnterHandler) {
          toast.removeEventListener("mouseenter", toastHoverEnterHandler);
          toast.removeEventListener("mouseleave", toastHoverLeaveHandler);
          toastHoverEnterHandler = null;
          toastHoverLeaveHandler = null;
        }
        if (toastOnHide) {
          toastOnHide();
          toastOnHide = null;
        }
      }, TOAST_HIDE_DURATION);
    }, delay);
  };
  startHideTimer(duration);
  if (options?.pauseOnHover) {
    toastHoverEnterHandler = () => {
      if (!toastTimeout || toast.classList.contains("hide")) return;
      const elapsed = Date.now() - toastStartTime;
      toastRemaining = Math.max(0, toastRemaining - elapsed);
      clearTimeout(toastTimeout);
      toastTimeout = null;
    };
    toastHoverLeaveHandler = () => {
      if (toast.classList.contains("hide")) return;
      if (toastRemaining > 0) {
        startHideTimer(toastRemaining);
      }
    };
    toast.addEventListener("mouseenter", toastHoverEnterHandler);
    toast.addEventListener("mouseleave", toastHoverLeaveHandler);
  }
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

function updateTableAddButtonWidths() {
  const buttons = document.querySelectorAll(".table-add-button");
  if (buttons.length === 0) return;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  buttons.forEach((button) => {
    const label = button.querySelector(".btn-label");
    if (!label) return;
    const icon = button.querySelector("svg, img");
    const buttonStyles = getComputedStyle(button);
    const padding =
      parseFloat(buttonStyles.getPropertyValue("--table-add-padding")) || 10;
    const gap =
      parseFloat(buttonStyles.getPropertyValue("--table-add-gap")) || 6;
    const iconWidth = icon
      ? parseFloat(getComputedStyle(icon).width) || 0
      : 0;

    const labelStyles = getComputedStyle(label);
    context.font = `${labelStyles.fontStyle} ${labelStyles.fontWeight} ${labelStyles.fontSize} ${labelStyles.fontFamily}`;
    const text = (label.textContent || "").trim();
    const labelWidth = text ? context.measureText(text).width : 0;
    const effectiveGap = iconWidth > 0 && labelWidth > 0 ? gap : 0;
    const expandedWidth = Math.ceil(
      labelWidth + iconWidth + effectiveGap + padding * 2
    );
    if (expandedWidth > 0) {
      button.style.setProperty(
        "--table-add-expanded-width",
        `${expandedWidth}px`
      );
    }
  });
}

function updateTableEmptyState(table) {
  const wrapper = table.closest(".table-with-add");
  if (!wrapper) return;
  const tbody = table.tBodies[0];
  const hasRows = tbody ? tbody.children.length > 0 : false;
  wrapper.classList.toggle("is-empty", !hasRows);
  const thead = table.querySelector("thead");
  if (thead) {
    wrapper.style.setProperty(
      "--table-add-header-height",
      `${thead.getBoundingClientRect().height}px`
    );
  }
}

function refreshTableEmptyStates(container = document) {
  const tables = container.querySelectorAll(".table-with-add table");
  if (tables.length === 0) return;
  tables.forEach((table) => updateTableEmptyState(table));
}

function initializeTableEmptyStates() {
  const tables = document.querySelectorAll(".table-with-add table");
  if (tables.length === 0) return;

  tables.forEach((table) => {
    const tbody = table.tBodies[0];
    updateTableEmptyState(table);
    if (!tbody) return;
    const observer = new MutationObserver(() => updateTableEmptyState(table));
    observer.observe(tbody, { childList: true });
  });

  window.addEventListener("resize", () => {
    refreshTableEmptyStates();
  });
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
    .querySelectorAll('#statusTable tbody .status-name-input')
    .forEach((input) => {
      input.placeholder = getText("inputStatusPlaceholder");
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-input')
    .forEach((input) => {
      input.placeholder = getText("inputStatusAliasPlaceholder");
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-add')
    .forEach((button) => {
      const label = getText("statusAliasAddLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-remove')
    .forEach((button) => {
      const label = getText("statusAliasRemoveLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-input')
    .forEach((input) => {
      input.placeholder = getText("inputKeywordPlaceholder");
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-input')
    .forEach((input) => {
      input.placeholder = getText("inputKeywordAliasPlaceholder");
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-add')
    .forEach((button) => {
      const label = getText("keywordAliasAddLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-remove')
    .forEach((button) => {
      const label = getText("keywordAliasRemoveLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  const notepadArea = document.getElementById("notepadArea");
  if (notepadArea) {
    notepadArea.placeholder = getText("notepadPlaceholder");
  }

  const addRowBtn = document.getElementById("addRow");
  if (addRowBtn) {
    const label = getText("addRowButton");
    addRowBtn.setAttribute("aria-label", label);
    addRowBtn.removeAttribute("title");
  }
  const rowAddBtn = document.getElementById("rowHighlightAdd");
  if (rowAddBtn) {
    const label = getText("addKeywordButton");
    rowAddBtn.setAttribute("aria-label", label);
    rowAddBtn.removeAttribute("title");
  }
  const bookmarkAddButton = document.getElementById("bookmarkAddButton");
  if (bookmarkAddButton) {
    const label = getText("bookmarkAddLabel");
    bookmarkAddButton.setAttribute("aria-label", label);
    bookmarkAddButton.title = label;
  }
  document
    .querySelectorAll(".bookmark-drag-handle, .bookmark-item-action-icon")
    .forEach((button) => {
      const labelKey = button.dataset.labelKey;
      if (!labelKey) return;
      button.setAttribute("aria-label", getText(labelKey));
    });

  updateTableAddButtonWidths();
  refreshTableEmptyStates();
}

async function setLanguage(lang) {
  currentLang = supportedLangs.includes(lang) ? lang : "en";
  await loadMessages(currentLang);
  applyTranslations();
  updateVersionText();

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
  const validationErrorModal = document.getElementById("validationErrorModal");
  const validationErrorOkBtn = document.getElementById("validationErrorOkBtn");

  await Promise.all([
    initializeStatusColorizerTab(),
    initializeRowHighlighterTab(),
    initializeNotepadTab(),
    initializeBookmarksTab(),
    initializeSettingsTab(),
  ]);

  const confirmResetTableModal = document.getElementById("confirmModal");
  const cancelResetTableBtn = document.getElementById("cancelDelete");
  const confirmDefaultModal = document.getElementById("resetConfirmModal");
  const cancelDefaultBtn = document.getElementById("cancelReset");
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const tabGroups = document.querySelectorAll(".tab-group");
  const shareExtensionBtn = document.getElementById("shareExtensionBtn");

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

  updateVersionText();

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () => {
      if (sideMenu.classList.contains("open")) {
        sideMenu.classList.add("animating-close");
        menuToggle.classList.remove("active");
        if (pageContainer) {
          pageContainer.classList.remove("shifted");
        }
        sideMenu.addEventListener(
          "animationend",
          () => {
            sideMenu.classList.remove("animating-close");
            sideMenu.classList.remove("open");
          },
          { once: true }
        );
      } else {
        sideMenu.classList.add("open", "animating-open");
        menuToggle.classList.add("active");
        if (pageContainer) {
          pageContainer.classList.add("shifted");
        }
        sideMenu.addEventListener(
          "animationend",
          () => sideMenu.classList.remove("animating-open"),
          { once: true }
        );
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
  if (shareExtensionBtn) {
    const shareUrl =
      "https://chromewebstore.google.com/detail/my-toolbox/nppomdgnebmeeilmhbkdnidaohhblcbi";
    shareExtensionBtn.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: getText("appName"),
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error?.name === "AbortError") {
            return;
          }
        }
      }
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("toastShareCopied");
      } catch (error) {
        console.error("Share copy failed:", error);
        showToast("toastErrorGeneric");
      }
    });
  }

  tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetTabId = link.dataset.tab;
      tabLinks.forEach((l) => l.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      link.classList.add("active");
      const linkGroup = link.closest(".tab-group");
      if (linkGroup) {
        linkGroup.classList.add("is-open");
        const toggle = linkGroup.querySelector(".tab-group-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "true");
        }
      }
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add("active");
        requestAnimationFrame(() => {
          refreshTableEmptyStates(targetPane);
        });
      } else {
        console.error(`Tab pane with ID ${targetTabId} not found!`);
      }
    });
  });

  tabGroups.forEach((group) => {
    const toggle = group.querySelector(".tab-group-toggle");
    if (!toggle) return;
    const hasActive = group.querySelector(".tab-link.active");
    if (hasActive) {
      group.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    } else {
      toggle.setAttribute(
        "aria-expanded",
        group.classList.contains("is-open") ? "true" : "false"
      );
    }
    toggle.addEventListener("click", () => {
      const isOpen = group.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
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


  initializeStatusColorizer();
  initializeRowHighlighter();
  initializeNotepad();
  initializeBookmarks();
  initializeTableEmptyStates();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      refreshTableEmptyStates();
    });
  }

});
