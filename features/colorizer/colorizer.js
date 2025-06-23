import {
  getText,
  showToast,
  showValidationErrorModal,
  showResetTableModal,
  showDefaultSettingsModal,
  getLoadedDefaultSettings,
} from "../../options/options-main.js";

function updateButtonVisibility() {
  const tbody = document.querySelector("#statusTable tbody");
  const saveBtn = document.getElementById("saveSettings");
  const resetBtn = document.getElementById("clearAll");
  const exportBtn = document.getElementById("exportSettingsBtn");
  if (!tbody || !saveBtn || !resetBtn || !exportBtn) {
    console.error(
      "Colorizer: Cannot update button visibility - Elements not found."
    );
    return;
  }
  const rowCount = tbody.children.length;
  const shouldShow = rowCount > 0;
  saveBtn.style.display = shouldShow ? "" : "none";
  resetBtn.style.display = shouldShow ? "" : "none";
  exportBtn.style.display = shouldShow ? "" : "none";
}

function restoreStatusSettings() {
  const loadedDefaults = getLoadedDefaultSettings();

  chrome.storage.sync.get("statusColorSettings", function (data) {
    if (chrome.runtime.lastError) {
      console.error(
        "Colorizer Error restoring settings:",
        chrome.runtime.lastError
      );
      showToast("toastErrorLoading");
      updateButtonVisibility();
      return;
    }
    let usedDefaults = false;
    let settings;

    if (!data.hasOwnProperty("statusColorSettings")) {
      settings = loadedDefaults;
      usedDefaults = true;
    } else {
      settings = data.statusColorSettings;

      if (!Array.isArray(settings) || settings.length === 0) {
        settings = [];
      }
    }

    const tbody = document.querySelector("#statusTable tbody");
    if (!tbody) {
      console.error("Colorizer Restore failed: tbody not found!");
      return;
    }
    tbody.innerHTML = "";
    if (Array.isArray(settings)) {
      settings.forEach((setting) => {
        addRow(
          setting.statusName,
          setting.backgroundColor,
          setting.textColor || "#ffffff",
          setting.animationClass,
          setting.primaryColor || "#ffffff",
          setting.secondaryColor || "#ffffff"
        );
      });
    } else {
      console.error(
        "Colorizer: Settings data is not an array, cannot add rows."
      );
    }
    updateButtonVisibility();
  });
}

function restoreRowColorSetting() {
  chrome.storage.sync.get("rowColorSetting", (data) => {
    const keywordInput = document.getElementById("rowKeyword");
    const colorInput = document.getElementById("rowColor");
    if (!keywordInput || !colorInput) return;
    const setting = data.rowColorSetting || { keyword: "", color: "#ffff00" };
    keywordInput.value = setting.keyword || "";
    colorInput.value = setting.color || "#ffff00";
  });
}

function saveRowColorSetting() {
  const keywordInput = document.getElementById("rowKeyword");
  const colorInput = document.getElementById("rowColor");
  if (!keywordInput || !colorInput) return;
  const setting = {
    keyword: keywordInput.value.trim().toLowerCase(),
    color: colorInput.value,
  };
  chrome.storage.sync.set({ rowColorSetting: setting }, () => {
    if (chrome.runtime.lastError) {
      console.error("RowColor Save Error", chrome.runtime.lastError);
      showToast("toastErrorSaving");
    } else {
      showToast("toastSaved");
    }
  });
}

function addRow(
  statusName = "",
  backgroundColor = "#ffffff",
  textColor = "#000000",
  animationClass = "",
  primaryColor = "#000000",
  secondaryColor = "#ffffff"
) {
  const tbody = document.querySelector("#statusTable tbody");
  if (!tbody) {
    console.error("Colorizer: Could not find table body");
    return;
  }
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  let cellStatus = document.createElement("td");
  let inputStatus = document.createElement("input");
  inputStatus.type = "text";
  inputStatus.value = statusName;
  inputStatus.placeholder = getText("inputStatusPlaceholder");
  cellStatus.appendChild(inputStatus);
  row.appendChild(cellStatus);

  let cellBg = document.createElement("td");
  let inputBg = document.createElement("input");
  inputBg.type = "color";
  inputBg.value = backgroundColor;
  cellBg.appendChild(inputBg);
  row.appendChild(cellBg);

  let cellText = document.createElement("td");
  let inputText = document.createElement("input");
  inputText.type = "color";
  inputText.value = textColor;
  cellText.appendChild(inputText);
  row.appendChild(cellText);

  let cellAnim = document.createElement("td");
  let inputAnim = document.createElement("input");
  inputAnim.type = "checkbox";
  inputAnim.checked = animationClass === "ribbon";
  cellAnim.appendChild(inputAnim);
  row.appendChild(cellAnim);

  let cellPrimary = document.createElement("td");
  let inputPrimary = document.createElement("input");
  inputPrimary.type = "color";
  inputPrimary.value = primaryColor;
  inputPrimary.disabled = !inputAnim.checked;
  cellPrimary.appendChild(inputPrimary);
  row.appendChild(cellPrimary);

  let cellSecondary = document.createElement("td");
  let inputSecondary = document.createElement("input");
  inputSecondary.type = "color";
  inputSecondary.value = secondaryColor;
  inputSecondary.disabled = !inputAnim.checked;
  cellSecondary.appendChild(inputSecondary);
  row.appendChild(cellSecondary);

  let cellAction = document.createElement("td");
  let removeButton = document.createElement("button");
  removeButton.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  removeButton.className = "button button-delete-row";

  inputAnim.addEventListener("change", (event) => {
    inputPrimary.disabled = !event.target.checked;
    inputSecondary.disabled = !event.target.checked;
  });
  removeButton.addEventListener("click", () => {
    row.classList.add("row-leaving");
    row.addEventListener(
      "animationend",
      () => {
        row.remove();
        updateButtonVisibility();
      },
      { once: true }
    );
  });
  cellAction.appendChild(removeButton);
  row.appendChild(cellAction);
  tbody.appendChild(row);
  updateButtonVisibility();
}

function saveStatusSettings() {
  const rows = document.querySelectorAll("#statusTable tbody tr");
  const settings = [];
  const uniqueStatusNames = new Set();
  const colorRegex = /^#[0-9a-f]{6}$/i;
  let rowIndex = 0;
  for (const row of rows) {
    const index = rowIndex++;
    const statusInput = row.cells[0]?.querySelector('input[type="text"]');
    const bgInput = row.cells[1]?.querySelector('input[type="color"]');
    const textInput = row.cells[2]?.querySelector('input[type="color"]');
    const animCheckbox = row.cells[3]?.querySelector('input[type="checkbox"]');
    const primaryInput = row.cells[4]?.querySelector('input[type="color"]');
    const secondaryInput = row.cells[5]?.querySelector('input[type="color"]');
    if (
      !statusInput ||
      !bgInput ||
      !textInput ||
      !animCheckbox ||
      !primaryInput ||
      !secondaryInput
    ) {
      showValidationErrorModal("errorInternalRow", String(index + 1));
      return;
    }
    const statusName = statusInput.value.trim().toLowerCase();
    const backgroundColor = bgInput.value;
    const textColor = textInput.value;
    const animationEnabled = animCheckbox.checked;
    const primaryColor = primaryInput.value;
    const secondaryColor = secondaryInput.value;
    if (!statusName) {
      showValidationErrorModal("errorStatusEmpty", String(index + 1));
      statusInput.focus();
      return;
    }
    if (uniqueStatusNames.has(statusName)) {
      showValidationErrorModal("errorDuplicateStatus", [
        String(index + 1),
        statusInput.value,
      ]);
      statusInput.focus();
      return;
    }
    uniqueStatusNames.add(statusName);
    if (!colorRegex.test(backgroundColor)) {
      showValidationErrorModal("errorInvalidBgColor", [
        String(index + 1),
        backgroundColor,
      ]);
      bgInput.focus();
      return;
    }
    if (!colorRegex.test(textColor)) {
      showValidationErrorModal("errorInvalidTextColor", [
        String(index + 1),
        textColor,
      ]);
      textInput.focus();
      return;
    }
    if (animationEnabled) {
      if (!colorRegex.test(primaryColor)) {
        showValidationErrorModal("errorInvalidPrimaryColor", [
          String(index + 1),
          primaryColor,
        ]);
        primaryInput.focus();
        return;
      }
      if (!colorRegex.test(secondaryColor)) {
        showValidationErrorModal("errorInvalidSecondaryColor", [
          String(index + 1),
          secondaryColor,
        ]);
        secondaryInput.focus();
        return;
      }
    }
    settings.push({
      statusName,
      backgroundColor,
      textColor,
      animationClass: animationEnabled ? "ribbon" : "",
      primaryColor: animationEnabled ? primaryColor : undefined,
      secondaryColor: animationEnabled ? secondaryColor : undefined,
    });
  }
  chrome.storage.sync.set({ statusColorSettings: settings }, function () {
    if (chrome.runtime.lastError) {
      console.error("Error saving settings:", chrome.runtime.lastError);
      showValidationErrorModal(
        "errorSavingSettings",
        chrome.runtime.lastError.message
      );
    } else {
      showToast("toastSaved");
    }
  });
}
function handleExport() {
  chrome.storage.sync.get("statusColorSettings", (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error getting settings for export:",
        chrome.runtime.lastError
      );
      showToast("toastErrorGeneric");
      return;
    }
    const settingsToExport = data.statusColorSettings || [];
    const jsonString = JSON.stringify(settingsToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloader = document.createElement("a");
    downloader.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    downloader.download = `sc-toolbox-colorizer-settings-${timestamp}.json`;
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
    URL.revokeObjectURL(url);
    showToast("toastExportSuccess");
  });
}
function validateImportedData(data) {
  if (!Array.isArray(data)) {
    console.error("Import validation failed: Data is not an array.");
    return false;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const requiredKeys = ["statusName", "backgroundColor"];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      console.error("Import validation failed: Item is not an object.", item);
      return false;
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        console.error(
          `Import validation failed: Item missing required key "${key}".`,
          item
        );
        return false;
      }
    }
    if (typeof item.statusName !== "string" || item.statusName.trim() === "") {
      console.error(
        `Import validation failed: Invalid statusName "${item.statusName}".`,
        item
      );
      return false;
    }
    if (
      typeof item.backgroundColor !== "string" ||
      !colorRegex.test(item.backgroundColor)
    ) {
      console.error(
        `Import validation failed: Invalid backgroundColor "${item.backgroundColor}".`,
        item
      );
      return false;
    }
    if (
      "textColor" in item &&
      (typeof item.textColor !== "string" ||
        !colorRegex.test(item.textColor)) &&
      item.textColor !== ""
    ) {
      console.error(
        `Import validation failed: Invalid textColor "${item.textColor}".`,
        item
      );
      return false;
    }
    if ("animationClass" in item && item.animationClass === "ribbon") {
      if (
        !("primaryColor" in item) ||
        typeof item.primaryColor !== "string" ||
        !colorRegex.test(item.primaryColor)
      ) {
        console.error(
          `Import validation failed: Missing or invalid primaryColor for animation.`,
          item
        );
        return false;
      }
      if (
        !("secondaryColor" in item) ||
        typeof item.secondaryColor !== "string" ||
        !colorRegex.test(item.secondaryColor)
      ) {
        console.error(
          `Import validation failed: Missing or invalid secondaryColor for animation.`,
          item
        );
        return false;
      }
    }
  }
  return true;
}
function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    let importedSettings;
    try {
      importedSettings = JSON.parse(text);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      showToast("toastImportErrorJsonParse");
      event.target.value = null;
      return;
    }
    if (!validateImportedData(importedSettings)) {
      showToast("toastImportErrorValidation");
      event.target.value = null;
      return;
    }
    chrome.storage.sync.set({ statusColorSettings: importedSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving imported settings:",
          chrome.runtime.lastError
        );
        showToast("toastImportErrorSave");
      } else {
        showToast("toastImportSuccess");
        restoreStatusSettings();
      }
      event.target.value = null;
    });
  };
  reader.onerror = (e) => {
    console.error("Error reading file:", e);
    showToast("toastImportErrorFileRead");
    event.target.value = null;
  };
  reader.readAsText(file);
}

export function initializeColorizer() {
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
  const saveRowColorBtn = document.getElementById("saveRowColor");

  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => addRow());
  } else {
    console.error("Colorizer: Missing Add Row button");
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveStatusSettings);
  } else {
    console.error("Colorizer: Missing Save Settings button");
  }
  if (defaultSettingsBtn) {
    defaultSettingsBtn.addEventListener("click", showDefaultSettingsModal);
  } else {
    console.error("Colorizer: Missing Default Settings button");
  }
  if (resetTableBtn) {
    resetTableBtn.addEventListener("click", showResetTableModal);
  } else {
    console.error("Colorizer: Missing Reset Table button");
  }
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener("click", handleExport);
  } else {
    console.error("Colorizer: Missing Export Settings button");
  }
  if (importSettingsBtn && importFileInput) {
    importSettingsBtn.addEventListener("click", () => {
      importFileInput.click();
    });
    importFileInput.addEventListener("change", handleImport);
  } else {
    console.error("Colorizer: Missing Import Settings button or file input");
  }

  if (saveRowColorBtn) {
    saveRowColorBtn.addEventListener("click", saveRowColorSetting);
  } else {
    console.error("Colorizer: Missing Save Row Color button");
  }

  if (confirmResetTableBtn && confirmResetTableModal) {
    confirmResetTableBtn.addEventListener("click", () => {
      chrome.storage.sync.set({ statusColorSettings: [] }, function () {
        if (chrome.runtime.lastError) {
          console.error(
            "!!! Reset Table Save Error:",
            chrome.runtime.lastError
          );
          showToast("toastErrorGeneric");
        } else {
          showToast("toastResetTable");
          const tbody = document.querySelector("#statusTable tbody");
          if (tbody) tbody.innerHTML = "";
          updateButtonVisibility();
        }
        confirmResetTableModal.classList.remove("active");
      });
    });
  } else {
    console.error("Colorizer: Missing Confirm Reset Table button or modal");
  }

  if (confirmDefaultBtn && confirmDefaultModal) {
    confirmDefaultBtn.addEventListener("click", () => {
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
      chrome.storage.sync.set(
        { statusColorSettings: loadedDefaults },
        function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error resetting settings:",
              chrome.runtime.lastError
            );
            showToast("toastErrorGeneric");
          } else {
            showToast("toastResetDefault");
            restoreStatusSettings();
          }
          confirmDefaultModal.classList.remove("active");
        }
      );
    });
  } else {
    console.error("Colorizer: Missing Confirm Default button or modal");
  }

  restoreStatusSettings();
  restoreRowColorSetting();
}