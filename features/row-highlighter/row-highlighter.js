import { getText, showToast, showValidationErrorModal } from "../../options/options-main.js";

const removeIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

function normalizeKeyword(keyword) {
  return typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
}

function createAliasRow(aliasValue = "", onRemove = null, options = {}) {
  const aliasRow = document.createElement("div");
  aliasRow.className = "keyword-alias-row";
  if (options.animate) {
    aliasRow.classList.add("is-entering");
  }

  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.value = aliasValue;
  aliasInput.placeholder = getText("inputKeywordAliasPlaceholder");
  aliasInput.className = "keyword-alias-input";
  aliasRow.appendChild(aliasInput);

  const removeAliasBtn = document.createElement("button");
  const removeAliasLabel = getText("keywordAliasRemoveLabel");
  removeAliasBtn.type = "button";
  removeAliasBtn.className = "keyword-alias-remove";
  removeAliasBtn.setAttribute("aria-label", removeAliasLabel);
  removeAliasBtn.title = removeAliasLabel;
  removeAliasBtn.innerHTML = removeIconSvg;
  removeAliasBtn.addEventListener("click", () => {
    animateAliasRemoval(aliasRow, onRemove);
  });
  aliasRow.appendChild(removeAliasBtn);

  return aliasRow;
}

function animateAliasRemoval(aliasRow, onRemove) {
  if (!aliasRow) return;
  aliasRow.classList.add("is-leaving");
  let removed = false;
  const finalize = () => {
    if (removed) return;
    removed = true;
    aliasRow.remove();
    if (typeof onRemove === "function") {
      onRemove();
    }
  };
  aliasRow.addEventListener("transitionend", finalize, { once: true });
  setTimeout(finalize, 200);
}

function updateButtonVisibility() {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  const saveBtn = document.getElementById("rowHighlightSave");
  const resetBtn = document.getElementById("rowHighlightReset");
  const exportBtn = document.getElementById("rowHighlightExport");
  const hasRows = tbody && tbody.children.length > 0;
  if (saveBtn) {
    saveBtn.style.display = "";
    saveBtn.disabled = !hasRows;
  }
  if (resetBtn) {
    resetBtn.style.display = "";
    resetBtn.disabled = !hasRows;
  }
  if (exportBtn) {
    exportBtn.style.display = "";
    exportBtn.disabled = !hasRows;
  }
}

function restoreHighlightSettings() {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    const tbody = document.querySelector("#rowHighlightTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const settings = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings
      : [];
    settings.forEach((item) => {
      const aliases = Array.isArray(item.aliases)
        ? item.aliases
        : Array.isArray(item.keywordAliases)
          ? item.keywordAliases
          : [];
      addRow(
        item.keyword,
        item.color,
        item.hasOwnProperty("enabled") ? item.enabled : true,
        aliases
      );
    });
    updateButtonVisibility();
  });
}

function addRow(keyword = "", color = "#ffffff", enabled = true, aliases = []) {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (!tbody) return;
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  const cellKeyword = document.createElement("td");
  cellKeyword.className = "keyword-cell";

  const keywordGroup = document.createElement("div");
  keywordGroup.className = "keyword-group";

  const keywordPrimary = document.createElement("div");
  keywordPrimary.className = "keyword-primary";

  const inputKeyword = document.createElement("input");
  inputKeyword.type = "text";
  inputKeyword.value = keyword;
  inputKeyword.placeholder = getText("inputKeywordPlaceholder");
  inputKeyword.className = "keyword-input";

  const addAliasBtn = document.createElement("button");
  const addAliasLabel = getText("keywordAliasAddLabel");
  addAliasBtn.type = "button";
  addAliasBtn.className = "keyword-alias-add";
  addAliasBtn.textContent = "+";
  addAliasBtn.setAttribute("aria-label", addAliasLabel);
  addAliasBtn.title = addAliasLabel;

  const aliasContainer = document.createElement("div");
  aliasContainer.className = "keyword-aliases";

  const updateAliasSpacing = () => {
    keywordGroup.classList.toggle(
      "has-aliases",
      aliasContainer.children.length > 0
    );
  };

  const appendAlias = (aliasValue = "", animate = false) => {
    const aliasRow = createAliasRow(aliasValue, updateAliasSpacing, {
      animate,
    });
    aliasContainer.appendChild(aliasRow);
    updateAliasSpacing();
    if (animate) {
      requestAnimationFrame(() => {
        aliasRow.classList.remove("is-entering");
      });
    }
    return aliasRow;
  };

  addAliasBtn.addEventListener("click", () => {
    const aliasRow = appendAlias("", true);
    const aliasInput = aliasRow.querySelector(".keyword-alias-input");
    if (aliasInput) aliasInput.focus();
  });

  if (Array.isArray(aliases)) {
    aliases.forEach((alias) => {
      if (typeof alias !== "string") return;
      const trimmedAlias = alias.trim();
      if (!trimmedAlias) return;
      appendAlias(trimmedAlias);
    });
  }
  updateAliasSpacing();

  keywordPrimary.appendChild(inputKeyword);
  keywordPrimary.appendChild(addAliasBtn);
  keywordGroup.appendChild(keywordPrimary);
  keywordGroup.appendChild(aliasContainer);
  cellKeyword.appendChild(keywordGroup);
  row.appendChild(cellKeyword);

  const cellColor = document.createElement("td");
  const inputColor = document.createElement("input");
  inputColor.type = "color";
  inputColor.value = color;
  cellColor.appendChild(inputColor);
  row.appendChild(cellColor);

  const cellEnabled = document.createElement("td");
  const inputEnabled = document.createElement("input");
  inputEnabled.type = "checkbox";
  inputEnabled.checked = enabled;
  cellEnabled.appendChild(inputEnabled);
  row.appendChild(cellEnabled);

  const cellAction = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "button button-delete-row";
  deleteBtn.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  deleteBtn.innerHTML = removeIconSvg;
  deleteBtn.addEventListener("click", () => {
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
  cellAction.appendChild(deleteBtn);
  row.appendChild(cellAction);

  tbody.appendChild(row);
  updateButtonVisibility();
}

function saveHighlightSettings() {
  const rows = document.querySelectorAll("#rowHighlightTable tbody tr");
  const settings = [];
  const uniqueKeywords = new Set();
  const colorRegex = /^#[0-9a-f]{6}$/i;
  let rowIndex = 0;
  for (const row of rows) {
    const idx = rowIndex++;
    const keywordInput = row.cells[0]?.querySelector(".keyword-input");
    const aliasInputs =
      row.cells[0]?.querySelectorAll(".keyword-alias-input") || [];
    const colorInput = row.cells[1]?.querySelector('input[type="color"]');
    const enabledInput = row.cells[2]?.querySelector('input[type="checkbox"]');
    if (!keywordInput || !colorInput || !enabledInput) {
      showValidationErrorModal("errorInternalRow", String(idx + 1));
      return;
    }
    const keyword = keywordInput.value.trim();
    const color = colorInput.value;
    if (!keyword) {
      showValidationErrorModal("errorKeywordEmpty", String(idx + 1));
      keywordInput.focus();
      return;
    }
    const normalizedKeyword = normalizeKeyword(keyword);
    if (uniqueKeywords.has(normalizedKeyword)) {
      showValidationErrorModal("errorDuplicateKeyword", [
        String(idx + 1),
        keyword,
      ]);
      keywordInput.focus();
      return;
    }
    uniqueKeywords.add(normalizedKeyword);
    const aliases = [];
    for (const aliasInput of aliasInputs) {
      const alias = aliasInput.value.trim();
      if (!alias) {
        continue;
      }
      const normalizedAlias = normalizeKeyword(alias);
      if (uniqueKeywords.has(normalizedAlias)) {
        showValidationErrorModal("errorDuplicateKeyword", [
          String(idx + 1),
          aliasInput.value,
        ]);
        aliasInput.focus();
        return;
      }
      uniqueKeywords.add(normalizedAlias);
      aliases.push(alias);
    }
    if (!colorRegex.test(color)) {
      showValidationErrorModal("errorInvalidColor", [
        String(idx + 1),
        color,
      ]);
      colorInput.focus();
      return;
    }
    settings.push({
      keyword,
      color,
      enabled: enabledInput ? enabledInput.checked : true,
      aliases: aliases.length > 0 ? aliases : undefined,
    });
  }
  chrome.storage.sync.set({ rowHighlightSettings: settings }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Row Highlighter: Error saving settings",
        chrome.runtime.lastError
      );
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
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Row Highlighter: Error getting settings for export",
        chrome.runtime.lastError
      );
      showToast("toastErrorGeneric");
      return;
    }
    const toExport = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings
      : [];
    const blob = new Blob([JSON.stringify(toExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `my-toolbox-row-highlight-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("toastExportSuccess");
  });
}

function sanitizeKeywordAliases(keyword, aliases) {
  const normalizedKeyword = normalizeKeyword(keyword);
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
    const normalized = normalizeKeyword(trimmed);
    if (!normalized || normalized === normalizedKeyword || aliasSet.has(normalized)) {
      continue;
    }
    aliasSet.add(normalized);
    cleaned.push(trimmed);
  }
  return cleaned;
}

function mergeKeywordEntry(target, source) {
  if (!target || !source) return;
  const aliasCandidates = [];
  if (Array.isArray(target.aliases)) {
    aliasCandidates.push(...target.aliases);
  }
  if (typeof source.keyword === "string") {
    aliasCandidates.push(source.keyword);
  }
  if (Array.isArray(source.aliases)) {
    aliasCandidates.push(...source.aliases);
  }
  const cleaned = sanitizeKeywordAliases(target.keyword, aliasCandidates);
  target.aliases = cleaned.length > 0 ? cleaned : undefined;
  if (target.color === undefined && source.color !== undefined) {
    target.color = source.color;
  }
  if (target.enabled === undefined && source.enabled !== undefined) {
    target.enabled = source.enabled;
  }
}

function mergeImportedHighlightSettings(data) {
  if (!Array.isArray(data)) {
    console.error("Import validation failed: Data is not an array.");
    return null;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const merged = [];
  const indexByName = new Map();

  const updateIndexMap = (entry, index) => {
    const names = [entry.keyword, ...(entry.aliases || [])];
    names.forEach((name) => {
      const normalized = normalizeKeyword(name);
      if (normalized) {
        indexByName.set(normalized, index);
      }
    });
  };

  for (const item of data) {
    if (typeof item !== "object" || !item) {
      console.error("Import validation failed: Item is not an object.", item);
      return null;
    }
    if (typeof item.keyword !== "string" || item.keyword.trim() === "") {
      console.error(
        `Import validation failed: Invalid keyword "${item.keyword}".`,
        item
      );
      return null;
    }
    const keyword = item.keyword.trim();
    if (typeof item.color !== "string" || !colorRegex.test(item.color)) {
      console.error(
        `Import validation failed: Invalid color "${item.color}".`,
        item
      );
      return null;
    }
    if ("enabled" in item && typeof item.enabled !== "boolean") {
      console.error(
        `Import validation failed: Invalid enabled value "${item.enabled}".`,
        item
      );
      return null;
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
    if ("keywordAliases" in item) {
      if (!Array.isArray(item.keywordAliases)) {
        console.error(
          "Import validation failed: keywordAliases must be an array of strings.",
          item
        );
        return null;
      }
      aliasSources.push(...item.keywordAliases);
    }
    for (const alias of aliasSources) {
      if (typeof alias !== "string") {
        console.error(`Import validation failed: Invalid alias "${alias}".`, item);
        return null;
      }
    }
    const aliases = sanitizeKeywordAliases(keyword, aliasSources);

    const entry = {
      keyword,
      color: item.color,
    };
    if ("enabled" in item) entry.enabled = item.enabled;
    if (aliases.length > 0) entry.aliases = aliases;

    const normalizedNames = new Set(
      [entry.keyword, ...(entry.aliases || [])]
        .map((name) => normalizeKeyword(name))
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
      mergeKeywordEntry(target, merged[index]);
      merged[index] = null;
    }
    mergeKeywordEntry(target, entry);
    updateIndexMap(target, targetIndex);
  }

  return merged.filter(Boolean);
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    let imported;
    try {
      imported = JSON.parse(e.target.result);
    } catch {
      showToast("toastImportErrorJsonParse");
      event.target.value = null;
      return;
    }
    const mergedSettings = mergeImportedHighlightSettings(imported);
    if (!mergedSettings) {
      showToast("toastImportErrorValidation");
      event.target.value = null;
      return;
    }
    chrome.storage.sync.set({ rowHighlightSettings: mergedSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Row Highlighter: Error saving imported settings",
          chrome.runtime.lastError
        );
        showToast("toastImportErrorSave");
      } else {
        showToast("toastImportSuccess");
        restoreHighlightSettings();
      }
      event.target.value = null;
    });
  };
  reader.onerror = () => {
    showToast("toastImportErrorFileRead");
    event.target.value = null;
  };
  reader.readAsText(file);
}

function resetTable() {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (tbody) tbody.innerHTML = "";
  chrome.storage.sync.set({ rowHighlightSettings: [] }, () => {
    if (chrome.runtime.lastError) {
      showToast("toastErrorSaving");
    } else {
      showToast("toastResetTable");
    }
    updateButtonVisibility();
  });
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
    confirmResetBtn.addEventListener("click", () => {
      resetModal.classList.remove("active");
      resetTable();
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
