import {
  showToast,
  showValidationErrorModal,
  showResetTableModal,
  showDefaultSettingsModal,
  getLoadedDefaultSettings,
} from "../../core/options-ui.js";
import {
  exportSyncSettingsJson,
} from "../shared/rule-settings-transfer.js";
import {
  addRow,
  collectStatusSettings,
  renderStatusSettings,
  updateButtonVisibility,
} from "./status-colorizer-table.js";
import {
  handleStatusSettingsImport,
} from "./status-colorizer-import.js";
import {
  STATUS_COLOR_SETTINGS_KEY,
  clearStatusColorSettings,
  loadStatusColorSettings,
  resetStatusColorSettings,
  saveStatusColorSettings,
} from "./status-colorizer-storage.js";

async function restoreStatusSettings() {
  const loadedDefaults = getLoadedDefaultSettings();
  const result = await loadStatusColorSettings(loadedDefaults);
  if (!result.ok) {
    console.error("Status Colorizer Error restoring settings:", result.error);
    showToast("toastErrorLoading");
    updateButtonVisibility();
    return;
  }

  renderStatusSettings(result.settings);
}

async function saveStatusSettings() {
  const settings = collectStatusSettings();
  if (!settings) {
    return;
  }
  const result = await saveStatusColorSettings(settings);
  if (!result.ok) {
    console.error("Error saving settings:", result.error);
    showValidationErrorModal("errorSavingSettings", result.error.message);
    return;
  }
  showToast("toastSaved");
}
function handleExport() {
  exportSyncSettingsJson({
    storageKey: STATUS_COLOR_SETTINGS_KEY,
    filenamePrefix: "my-toolbox-status-colorizer-settings",
    showToast,
    errorLogLabel: "Status Colorizer",
  });
}
function handleImport(event) {
  handleStatusSettingsImport(event, restoreStatusSettings, showToast);
}

export function initializeStatusColorizer() {
  const addRowBtn = document.getElementById("addRow");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const defaultSettingsBtn = document.getElementById("resetStatusSettings");
  const resetTableBtn = document.getElementById("clearAll");
  const exportSettingsBtn = document.getElementById("exportSettingsBtn");
  const importSettingsBtn = document.getElementById("importSettingsBtn");
  const importFileInput = document.getElementById("importFile");
  const confirmResetTableModal = document.getElementById("confirmModal");
  const confirmResetTableBtn = document.getElementById("confirmDelete");
  const confirmDefaultModal = document.getElementById("resetConfirmModal");
  const confirmDefaultBtn = document.getElementById("confirmReset");

  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => addRow());
  } else {
    console.error("Status Colorizer: Missing Add Row button");
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveStatusSettings);
  } else {
    console.error("Status Colorizer: Missing Save Settings button");
  }
  if (defaultSettingsBtn) {
    defaultSettingsBtn.addEventListener("click", showDefaultSettingsModal);
  } else {
    console.error("Status Colorizer: Missing Default Settings button");
  }
  if (resetTableBtn) {
    resetTableBtn.addEventListener("click", showResetTableModal);
  } else {
    console.error("Status Colorizer: Missing Reset Table button");
  }
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener("click", handleExport);
  } else {
    console.error("Status Colorizer: Missing Export Settings button");
  }
  if (importSettingsBtn && importFileInput) {
    importSettingsBtn.addEventListener("click", () => {
      importFileInput.click();
    });
    importFileInput.addEventListener("change", handleImport);
  } else {
    console.error("Status Colorizer: Missing Import Settings button or file input");
  }

  if (confirmResetTableBtn && confirmResetTableModal) {
    confirmResetTableBtn.addEventListener("click", async () => {
      const result = await clearStatusColorSettings();
      if (!result.ok) {
        console.error("!!! Reset Table Save Error:", result.error);
        showToast("toastErrorGeneric");
      } else {
        showToast("toastResetTable");
        const tbody = document.querySelector("#statusTable tbody");
        if (tbody) tbody.innerHTML = "";
        updateButtonVisibility();
      }
      confirmResetTableModal.classList.remove("active");
    });
  } else {
    console.error("Status Colorizer: Missing Confirm Reset Table button or modal");
  }

  if (confirmDefaultBtn && confirmDefaultModal) {
    confirmDefaultBtn.addEventListener("click", async () => {
      const loadedDefaults = getLoadedDefaultSettings();
      if (
        !loadedDefaults ||
        !Array.isArray(loadedDefaults) ||
        loadedDefaults.length === 0
      ) {
        console.error(
          "Cannot reset to default, default settings were not loaded correctly!"
        );
        showToast("toastErrorGeneric");
        confirmDefaultModal.classList.remove("active");
        return;
      }
      const result = await resetStatusColorSettings(loadedDefaults);
      if (!result.ok) {
        console.error("Error resetting settings:", result.error);
        showToast("toastErrorGeneric");
      } else {
        showToast("toastResetDefault");
        await restoreStatusSettings();
      }
      confirmDefaultModal.classList.remove("active");
    });
  } else {
    console.error("Status Colorizer: Missing Confirm Default button or modal");
  }

  restoreStatusSettings();
}
