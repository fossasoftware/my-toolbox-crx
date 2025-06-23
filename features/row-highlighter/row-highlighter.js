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

export function initializeRowHighlighter() {
  const saveRowColorBtn = document.getElementById("saveRowColor");
  if (saveRowColorBtn) {
    saveRowColorBtn.addEventListener("click", saveRowColorSetting);
  } else {
    console.error("RowHighlighter: Missing Save Row Color button");
  }
  restoreRowColorSetting();
}
