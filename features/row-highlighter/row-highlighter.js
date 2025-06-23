import { getText, showToast } from "../../options/options-main.js";

function updateButtonVisibility() {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  const saveBtn = document.getElementById("rowHighlightSave");
  const resetBtn = document.getElementById("rowHighlightReset");
  const exportBtn = document.getElementById("rowHighlightExport");
  const shouldShow = tbody && tbody.children.length > 0;
  if (saveBtn) saveBtn.style.display = shouldShow ? "" : "none";
  if (resetBtn) resetBtn.style.display = shouldShow ? "" : "none";
  if (exportBtn) exportBtn.style.display = shouldShow ? "" : "none";
}

function restoreHighlightSettings() {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    const tbody = document.querySelector("#rowHighlightTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const settings = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings
      : [];
    settings.forEach((item) => addRow(item.keyword, item.color));
    updateButtonVisibility();
  });
}

function addRow(keyword = "", color = "#ffffff") {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (!tbody) return;
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  const cellKeyword = document.createElement("td");
  const inputKeyword = document.createElement("input");
  inputKeyword.type = "text";
  inputKeyword.value = keyword;
  inputKeyword.placeholder = getText("inputKeywordPlaceholder");
  cellKeyword.appendChild(inputKeyword);
  row.appendChild(cellKeyword);

  const cellColor = document.createElement("td");
  const inputColor = document.createElement("input");
  inputColor.type = "color";
  inputColor.value = color;
  cellColor.appendChild(inputColor);
  row.appendChild(cellColor);

  const cellAction = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "button button-delete-row";
  deleteBtn.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
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
  const colorRegex = /^#[0-9a-f]{6}$/i;
  for (const [index, row] of rows.entries()) {
    const keywordInput = row.cells[0]?.querySelector('input[type="text"]');
    const colorInput = row.cells[1]?.querySelector('input[type="color"]');
    if (!keywordInput || !colorInput) {
      showToast("toastErrorGeneric");
      return;
    }
    const keyword = keywordInput.value.trim();
    const color = colorInput.value;
    if (!keyword) {
      showToast("toastErrorGeneric");
      keywordInput.focus();
      return;
    }
    if (!colorRegex.test(color)) {
      showToast("toastErrorGeneric");
      colorInput.focus();
      return;
    }
    settings.push({ keyword, color });
  }
  chrome.storage.sync.set({ rowHighlightSettings: settings }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Row Highlighter: Error saving settings",
        chrome.runtime.lastError
      );
      showToast("toastErrorSaving");
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
    link.download = `sc-toolbox-row-highlight-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("toastExportSuccess");
  });
}

function validateImportedData(data) {
  if (!Array.isArray(data)) return false;
  const colorRegex = /^#[0-9a-f]{6}$/i;
  for (const item of data) {
    if (typeof item !== "object" || !item) return false;
    if (typeof item.keyword !== "string" || item.keyword.trim() === "")
      return false;
    if (typeof item.color !== "string" || !colorRegex.test(item.color))
      return false;
  }
  return true;
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
    if (!validateImportedData(imported)) {
      showToast("toastImportErrorValidation");
      event.target.value = null;
      return;
    }
    chrome.storage.sync.set({ rowHighlightSettings: imported }, () => {
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

export function initializeRowHighlighter() {
  const addBtn = document.getElementById("rowHighlightAdd");
  const saveBtn = document.getElementById("rowHighlightSave");
  const resetBtn = document.getElementById("rowHighlightReset");
  const exportBtn = document.getElementById("rowHighlightExport");
  const importBtn = document.getElementById("rowHighlightImport");
  const importFile = document.getElementById("rowHighlightImportFile");

  if (addBtn) addBtn.addEventListener("click", () => addRow());
  if (saveBtn) saveBtn.addEventListener("click", saveHighlightSettings);
  if (resetBtn) resetBtn.addEventListener("click", resetTable);
  if (exportBtn) exportBtn.addEventListener("click", handleExport);
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", handleImport);
  }

  restoreHighlightSettings();
}
