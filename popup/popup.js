import {
  applyTextTranslations,
  getDefaultLanguage,
  getText,
  loadMessages,
} from "../core/i18n.js";
import { getSyncStorage, setSyncStorage } from "../core/storage.js";

function applyPopupTranslations() {
  document.title = getText("appName");
  applyTextTranslations();
}

async function initializePopup() {
  const prefsResult = await getSyncStorage([
    "userLanguage",
    "statusColorizerEnabled",
    "rowHighlighterEnabled",
  ]);
  if (!prefsResult.ok) {
    console.error("Could not load popup preferences:", prefsResult.error);
  }

  const storedPrefs = prefsResult.data || {};
  const langPref = storedPrefs.userLanguage || getDefaultLanguage();
  const statusColorizerEnabled = Object.prototype.hasOwnProperty.call(
    storedPrefs,
    "statusColorizerEnabled"
  )
    ? storedPrefs.statusColorizerEnabled
    : true;
  const rowHighlighterEnabled = Object.prototype.hasOwnProperty.call(
    storedPrefs,
    "rowHighlighterEnabled"
  )
    ? storedPrefs.rowHighlighterEnabled
    : true;

  await loadMessages(langPref);
  applyPopupTranslations();

  const statusColorizerToggle = document.getElementById(
    "statusColorizerTogglePopup"
  );
  const rowHighlighterToggle = document.getElementById(
    "rowHighlighterTogglePopup"
  );

  if (statusColorizerToggle) {
    statusColorizerToggle.checked = statusColorizerEnabled;
    statusColorizerToggle.addEventListener("change", async () => {
      const result = await setSyncStorage({
        statusColorizerEnabled: statusColorizerToggle.checked,
      });
      if (!result.ok) {
        console.error(
          "Error saving status colorizer toggle preference:",
          result.error
        );
      }
    });
  }

  if (rowHighlighterToggle) {
    rowHighlighterToggle.checked = rowHighlighterEnabled;
    rowHighlighterToggle.addEventListener("change", async () => {
      const result = await setSyncStorage({
        rowHighlighterEnabled: rowHighlighterToggle.checked,
      });
      if (!result.ok) {
        console.error(
          "Error saving row highlighter toggle preference:",
          result.error
        );
      }
    });
  }

  const optionsBtn = document.getElementById("openOptionsBtn");
  if (optionsBtn) {
    optionsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage((error) => {
        if (chrome.runtime.lastError || error) {
          console.error(
            "Error opening options page:",
            chrome.runtime.lastError || error
          );
        }
      });
    });
  } else {
    console.error("Options button (#openOptionsBtn) not found in popup.html");
  }

  requestAnimationFrame(() => {
    document.body.classList.remove("is-booting");
  });
}

document.addEventListener("DOMContentLoaded", initializePopup);
