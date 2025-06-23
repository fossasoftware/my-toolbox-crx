// Row Highlighter options logic
import { showToast, showValidationErrorModal } from "../../options/options-main.js";

function updateButtonVisibility() {
  const tbody = document.querySelector("#rowHighlighterTable tbody");
  const saveBtn = document.getElementById("saveRowSettings");
  const resetBtn = document.getElementById("clearRowSettings");
  if (!tbody || !saveBtn || !resetBtn) return;
  const rows = tbody.children.length;
  const show = rows > 0;
  saveBtn.style.display = show ? "" : "none";
  resetBtn.style.display = show ? "" : "none";
}

function addRow(keyword = "", color = "#ffff00") {
  const tbody = document.querySelector("#rowHighlighterTable tbody");
  if (!tbody) return;
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  const cellKeyword = document.createElement("td");
  const inputKeyword = document.createElement("input");
  inputKeyword.type = "text";
  inputKeyword.value = keyword;
  inputKeyword.placeholder = ""; // set via i18n in applyTranslations
  cellKeyword.appendChild(inputKeyword);
  row.appendChild(cellKeyword);

  const cellColor = document.createElement("td");
  const inputColor = document.createElement("input");
  inputColor.type = "color";
  inputColor.value = color;
  cellColor.appendChild(inputColor);
  row.appendChild(cellColor);

  const cellAction = document.createElement("td");
  const removeButton = document.createElement("button");
  removeButton.setAttribute("aria-label", "delete");
  removeButton.className = "button button-delete-row";
  removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
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

function restoreSettings() {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    const settings = Array.isArray(data.rowHighlightSettings) ? data.rowHighlightSettings : [];
    const tbody = document.querySelector("#rowHighlighterTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    settings.forEach((s) => addRow(s.keyword, s.color));
    updateButtonVisibility();
  });
}

function saveSettings() {
  const rows = document.querySelectorAll("#rowHighlighterTable tbody tr");
  const settings = [];
  const keywords = new Set();
  const colorRegex = /^#[0-9a-f]{6}$/i;
  let index = 0;
  for (const row of rows) {
    const keywordInput = row.cells[0].querySelector("input[type='text']");
    const colorInput = row.cells[1].querySelector("input[type='color']");
    if (!keywordInput || !colorInput) {
      showValidationErrorModal("errorInternalRow", String(index + 1));
      return;
    }
    const keyword = keywordInput.value.trim().toLowerCase();
    const color = colorInput.value;
    if (!keyword) {
      showValidationErrorModal("errorKeywordEmpty", String(index + 1));
      keywordInput.focus();
      return;
    }
    if (keywords.has(keyword)) {
      showValidationErrorModal("errorDuplicateKeyword", [String(index + 1), keywordInput.value]);
      keywordInput.focus();
      return;
    }
    keywords.add(keyword);
    if (!colorRegex.test(color)) {
      showValidationErrorModal("errorInvalidRowColor", [String(index + 1), color]);
      colorInput.focus();
      return;
    }
    settings.push({ keyword, color });
    index++;
  }
  chrome.storage.sync.set({ rowHighlightSettings: settings }, () => {
    if (chrome.runtime.lastError) {
      console.error("RowHighlighter Save Error", chrome.runtime.lastError);
      showToast("toastErrorSaving");
    } else {
      showToast("toastSaved");
      restoreSettings();
    }
  });
}

function clearSettings() {
  const tbody = document.querySelector("#rowHighlighterTable tbody");
  if (tbody) tbody.innerHTML = "";
  chrome.storage.sync.set({ rowHighlightSettings: [] }, () => {
    updateButtonVisibility();
    showToast("toastResetTable");
  });
}

export function initializeRowHighlighter() {
  const addBtn = document.getElementById("addRowKeyword");
  const saveBtn = document.getElementById("saveRowSettings");
  const clearBtn = document.getElementById("clearRowSettings");
  if (addBtn) addBtn.addEventListener("click", () => addRow());
  if (saveBtn) saveBtn.addEventListener("click", saveSettings);
  if (clearBtn) clearBtn.addEventListener("click", clearSettings);
  restoreSettings();
}
