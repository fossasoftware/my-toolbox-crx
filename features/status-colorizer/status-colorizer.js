import {
  getText,
  showToast,
  showValidationErrorModal,
  showResetTableModal,
  showDefaultSettingsModal,
  getLoadedDefaultSettings,
} from "../../options/options-main.js";

const removeIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

function normalizeStatusName(statusName) {
  return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
}

function createAliasRow(aliasValue = "") {
  const aliasRow = document.createElement("div");
  aliasRow.className = "status-alias-row";

  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.value = aliasValue;
  aliasInput.placeholder = getText("inputStatusAliasPlaceholder");
  aliasInput.className = "status-alias-input";
  aliasRow.appendChild(aliasInput);

  const removeAliasBtn = document.createElement("button");
  const removeAliasLabel = getText("statusAliasRemoveLabel");
  removeAliasBtn.type = "button";
  removeAliasBtn.className = "status-alias-remove";
  removeAliasBtn.setAttribute("aria-label", removeAliasLabel);
  removeAliasBtn.title = removeAliasLabel;
  removeAliasBtn.innerHTML = removeIconSvg;
  removeAliasBtn.addEventListener("click", () => {
    aliasRow.remove();
  });
  aliasRow.appendChild(removeAliasBtn);

  return aliasRow;
}

function updateButtonVisibility() {
  const tbody = document.querySelector("#statusTable tbody");
  const saveBtn = document.getElementById("saveSettings");
  const resetBtn = document.getElementById("clearAll");
  const exportBtn = document.getElementById("exportSettingsBtn");
  if (!tbody || !saveBtn || !resetBtn || !exportBtn) {
    console.error(
      "Status Colorizer: Cannot update button visibility - Elements not found."
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
        "Status Colorizer Error restoring settings:",
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
      console.error("Status Colorizer Restore failed: tbody not found!");
      return;
    }
    tbody.innerHTML = "";
    if (Array.isArray(settings)) {
      settings.forEach((setting) => {
        const aliases = Array.isArray(setting.aliases)
          ? setting.aliases
          : Array.isArray(setting.statusAliases)
            ? setting.statusAliases
            : [];
        addRow(
          setting.statusName,
          setting.backgroundColor,
          setting.textColor || "#ffffff",
          setting.animationClass,
          setting.primaryColor || "#ffffff",
          setting.secondaryColor || "#ffffff",
          aliases
        );
      });
    } else {
      console.error(
        "Status Colorizer: Settings data is not an array, cannot add rows."
      );
    }
    updateButtonVisibility();
  });
}

function addRow(
  statusName = "",
  backgroundColor = "#ffffff",
  textColor = "#000000",
  animationClass = "",
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  aliases = []
) {
  const tbody = document.querySelector("#statusTable tbody");
  if (!tbody) {
    console.error("Status Colorizer: Could not find table body");
    return;
  }
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  let cellStatus = document.createElement("td");
  cellStatus.className = "status-name-cell";

  let statusGroup = document.createElement("div");
  statusGroup.className = "status-name-group";

  let statusPrimary = document.createElement("div");
  statusPrimary.className = "status-name-primary";

  let inputStatus = document.createElement("input");
  inputStatus.type = "text";
  inputStatus.value = statusName;
  inputStatus.placeholder = getText("inputStatusPlaceholder");
  inputStatus.className = "status-name-input";

  let addAliasBtn = document.createElement("button");
  const addAliasLabel = getText("statusAliasAddLabel");
  addAliasBtn.type = "button";
  addAliasBtn.className = "status-alias-add";
  addAliasBtn.textContent = "+";
  addAliasBtn.setAttribute("aria-label", addAliasLabel);
  addAliasBtn.title = addAliasLabel;

  let aliasContainer = document.createElement("div");
  aliasContainer.className = "status-aliases";

  const appendAlias = (aliasValue = "") => {
    const aliasRow = createAliasRow(aliasValue);
    aliasContainer.appendChild(aliasRow);
    return aliasRow;
  };

  addAliasBtn.addEventListener("click", () => {
    const aliasRow = appendAlias("");
    const aliasInput = aliasRow.querySelector(".status-alias-input");
    if (aliasInput) {
      aliasInput.focus();
    }
  });

  if (Array.isArray(aliases)) {
    aliases.forEach((alias) => {
      if (typeof alias !== "string") return;
      const trimmedAlias = alias.trim();
      if (!trimmedAlias) return;
      appendAlias(trimmedAlias);
    });
  }

  statusPrimary.appendChild(inputStatus);
  statusPrimary.appendChild(addAliasBtn);
  statusGroup.appendChild(statusPrimary);
  statusGroup.appendChild(aliasContainer);
  cellStatus.appendChild(statusGroup);
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
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  removeButton.innerHTML = removeIconSvg;
  removeButton.className = "button button-delete-row";

  const applyAnimationState = (enabled) => {
    inputPrimary.disabled = !enabled;
    inputSecondary.disabled = !enabled;
    inputBg.disabled = enabled;
    row.classList.toggle("animation-enabled", enabled);
  };
  applyAnimationState(inputAnim.checked);
  inputAnim.addEventListener("change", (event) => {
    applyAnimationState(event.target.checked);
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
    const statusInput = row.cells[0]?.querySelector(".status-name-input");
    const aliasInputs =
      row.cells[0]?.querySelectorAll(".status-alias-input") || [];
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
    const statusName = normalizeStatusName(statusInput.value);
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
    const aliases = [];
    for (const aliasInput of aliasInputs) {
      const aliasRaw = aliasInput.value.trim();
      if (!aliasRaw) {
        continue;
      }
      const normalizedAlias = normalizeStatusName(aliasRaw);
      if (uniqueStatusNames.has(normalizedAlias)) {
        showValidationErrorModal("errorDuplicateStatus", [
          String(index + 1),
          aliasInput.value,
        ]);
        aliasInput.focus();
        return;
      }
      uniqueStatusNames.add(normalizedAlias);
      aliases.push(normalizedAlias);
    }
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
      aliases: aliases.length > 0 ? aliases : undefined,
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
    downloader.download = `sc-toolbox-status-colorizer-settings-${timestamp}.json`;
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
    URL.revokeObjectURL(url);
    showToast("toastExportSuccess");
  });
}
function sanitizeAliases(statusName, aliases) {
  const normalizedStatus = normalizeStatusName(statusName);
  const aliasSet = new Set();
  const cleaned = [];
  for (const alias of aliases) {
    if (typeof alias !== "string") {
      continue;
    }
    const trimmed = alias.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = normalizeStatusName(trimmed);
    if (!normalized || normalized === normalizedStatus || aliasSet.has(normalized)) {
      continue;
    }
    aliasSet.add(normalized);
    cleaned.push(trimmed);
  }
  return cleaned;
}

function mergeStatusEntry(target, source) {
  if (!target || !source) return;
  const aliasCandidates = [];
  if (Array.isArray(target.aliases)) {
    aliasCandidates.push(...target.aliases);
  }
  if (typeof source.statusName === "string") {
    aliasCandidates.push(source.statusName);
  }
  if (Array.isArray(source.aliases)) {
    aliasCandidates.push(...source.aliases);
  }
  const cleaned = sanitizeAliases(target.statusName, aliasCandidates);
  target.aliases = cleaned.length > 0 ? cleaned : undefined;
  if (target.backgroundColor === undefined && source.backgroundColor !== undefined) {
    target.backgroundColor = source.backgroundColor;
  }
  if (target.textColor === undefined && source.textColor !== undefined) {
    target.textColor = source.textColor;
  }
  if (target.animationClass === undefined && source.animationClass !== undefined) {
    target.animationClass = source.animationClass;
  }
  if (target.primaryColor === undefined && source.primaryColor !== undefined) {
    target.primaryColor = source.primaryColor;
  }
  if (target.secondaryColor === undefined && source.secondaryColor !== undefined) {
    target.secondaryColor = source.secondaryColor;
  }
}

function mergeImportedStatusSettings(data) {
  if (!Array.isArray(data)) {
    console.error("Import validation failed: Data is not an array.");
    return null;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const requiredKeys = ["statusName", "backgroundColor"];
  const merged = [];
  const indexByName = new Map();

  const updateIndexMap = (entry, index) => {
    const names = [entry.statusName, ...(entry.aliases || [])];
    names.forEach((name) => {
      const normalized = normalizeStatusName(name);
      if (normalized) {
        indexByName.set(normalized, index);
      }
    });
  };

  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      console.error("Import validation failed: Item is not an object.", item);
      return null;
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        console.error(
          `Import validation failed: Item missing required key "${key}".`,
          item
        );
        return null;
      }
    }
    if (typeof item.statusName !== "string" || item.statusName.trim() === "") {
      console.error(
        `Import validation failed: Invalid statusName "${item.statusName}".`,
        item
      );
      return null;
    }
    const statusName = item.statusName.trim();
    if (
      typeof item.backgroundColor !== "string" ||
      !colorRegex.test(item.backgroundColor)
    ) {
      console.error(
        `Import validation failed: Invalid backgroundColor "${item.backgroundColor}".`,
        item
      );
      return null;
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
      return null;
    }
    if ("animationClass" in item && item.animationClass === "ribbon") {
      if (
        !("primaryColor" in item) ||
        typeof item.primaryColor !== "string" ||
        !colorRegex.test(item.primaryColor)
      ) {
        console.error(
          "Import validation failed: Missing or invalid primaryColor for animation.",
          item
        );
        return null;
      }
      if (
        !("secondaryColor" in item) ||
        typeof item.secondaryColor !== "string" ||
        !colorRegex.test(item.secondaryColor)
      ) {
        console.error(
          "Import validation failed: Missing or invalid secondaryColor for animation.",
          item
        );
        return null;
      }
    }

    const aliasSources = [];
    if ("aliases" in item) {
      if (!Array.isArray(item.aliases)) {
        console.error(
          "Import validation failed: aliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.aliases);
    }
    if ("statusAliases" in item) {
      if (!Array.isArray(item.statusAliases)) {
        console.error(
          "Import validation failed: statusAliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.statusAliases);
    }
    for (const alias of aliasSources) {
      if (typeof alias !== "string") {
        console.error(
          `Import validation failed: Invalid alias "${alias}".`,
          item
        );
        return null;
      }
    }
    const aliases = sanitizeAliases(statusName, aliasSources);

    const entry = {
      statusName,
      backgroundColor: item.backgroundColor,
    };
    if ("textColor" in item) entry.textColor = item.textColor;
    if ("animationClass" in item) entry.animationClass = item.animationClass;
    if ("primaryColor" in item) entry.primaryColor = item.primaryColor;
    if ("secondaryColor" in item) entry.secondaryColor = item.secondaryColor;
    if (aliases.length > 0) entry.aliases = aliases;

    const normalizedNames = new Set(
      [entry.statusName, ...(entry.aliases || [])]
        .map((name) => normalizeStatusName(name))
        .filter(Boolean)
    );
    const indices = new Set();
    normalizedNames.forEach((name) => {
      const index = indexByName.get(name);
      if (index !== undefined) {
        indices.add(index);
      }
    });

    if (indices.size === 0) {
      const newIndex = merged.length;
      merged.push(entry);
      updateIndexMap(entry, newIndex);
      continue;
    }

    const [targetIndex] = indices;
    const target = merged[targetIndex];
    for (const index of indices) {
      if (index === targetIndex) continue;
      mergeStatusEntry(target, merged[index]);
      merged[index] = null;
    }
    mergeStatusEntry(target, entry);
    updateIndexMap(target, targetIndex);
  }

  return merged.filter(Boolean);
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
    const mergedSettings = mergeImportedStatusSettings(importedSettings);
    if (!mergedSettings) {
      showToast("toastImportErrorValidation");
      event.target.value = null;
      return;
    }
    chrome.storage.sync.set({ statusColorSettings: mergedSettings }, () => {
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
    console.error("Status Colorizer: Missing Confirm Reset Table button or modal");
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
    console.error("Status Colorizer: Missing Confirm Default button or modal");
  }

  restoreStatusSettings();
}
