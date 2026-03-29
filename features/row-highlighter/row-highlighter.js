import {
  showToast,
  showValidationErrorModal,
} from "../../core/options-ui.js";
import {
  exportSyncSettingsJson,
} from "../shared/rule-settings-transfer.js";
import {
  addRow,
  collectHighlightSettings,
  renderHighlightSettings,
  updateButtonVisibility,
} from "./row-highlighter-table.js";
import { handleRowHighlightImport } from "./row-highlighter-import.js";
import {
  ROW_HIGHLIGHT_SETTINGS_KEY,
  clearRowHighlightSettings,
  loadRowHighlightSettings,
  saveRowHighlightSettings,
} from "./row-highlighter-storage.js";

async function restoreHighlightSettings() {
  const result = await loadRowHighlightSettings();
  if (!result.ok) {
    console.error("Row Highlighter: Error restoring settings", result.error);
    showToast("toastErrorLoading");
    updateButtonVisibility();
    return;
  }

  renderHighlightSettings(result.settings);
}

async function saveHighlightSettings() {
  const settings = collectHighlightSettings();
  if (!settings) {
    return;
  }
  const result = await saveRowHighlightSettings(settings);
  if (!result.ok) {
    console.error("Row Highlighter: Error saving settings", result.error);
    showValidationErrorModal("errorSavingSettings", result.error.message);
    return;
  }
  showToast("toastSaved");
}

function handleExport() {
  exportSyncSettingsJson({
    storageKey: ROW_HIGHLIGHT_SETTINGS_KEY,
    filenamePrefix: "my-toolbox-row-highlight",
    showToast,
    errorLogLabel: "Row Highlighter",
  });
}

function handleImport(event) {
  handleRowHighlightImport(event, restoreHighlightSettings, showToast);
}

async function resetTable() {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (tbody) tbody.innerHTML = "";
  const result = await clearRowHighlightSettings();
  if (!result.ok) {
    showToast("toastErrorSaving");
  } else {
    showToast("toastResetTable");
  }
  updateButtonVisibility();
}

function showResetModal() {
  const modal = document.getElementById("rowHighlightResetModal");
  if (modal) {
    modal.classList.add("active");
  }
}

export function initializeRowHighlighter() {
  const addBtn = document.getElementById("rowHighlightAdd");
  const saveBtn = document.getElementById("rowHighlightSave");
  const resetBtn = document.getElementById("rowHighlightReset");
  const resetModal = document.getElementById("rowHighlightResetModal");
  const confirmResetBtn = document.getElementById("rowHighlightConfirmReset");
  const cancelResetBtn = document.getElementById("rowHighlightCancelReset");
  const exportBtn = document.getElementById("rowHighlightExport");
  const importBtn = document.getElementById("rowHighlightImport");
  const importFile = document.getElementById("rowHighlightImportFile");

  if (addBtn) addBtn.addEventListener("click", () => addRow());
  if (saveBtn) saveBtn.addEventListener("click", saveHighlightSettings);
  if (resetBtn) resetBtn.addEventListener("click", showResetModal);
  if (confirmResetBtn && resetModal) {
    confirmResetBtn.addEventListener("click", async () => {
      resetModal.classList.remove("active");
      await resetTable();
    });
  }
  if (cancelResetBtn && resetModal) {
    const hide = () => resetModal.classList.remove("active");
    cancelResetBtn.addEventListener("click", hide);
    resetModal.addEventListener("click", (e) => {
      if (e.target === resetModal) hide();
    });
  }
  if (exportBtn) exportBtn.addEventListener("click", handleExport);
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", handleImport);
  }

  restoreHighlightSettings();
}
