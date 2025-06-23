let rowColorSetting = null;

function loadRowColorSetting(callback) {
  chrome.storage.sync.get("rowColorSetting", (data) => {
    rowColorSetting = data.rowColorSetting || null;
    if (callback) callback();
  });
}

function paintRows() {
  if (!rowColorSetting || !rowColorSetting.keyword) return;
  const keyword = rowColorSetting.keyword.toLowerCase();
  const rows = document.querySelectorAll("div[role='row']");
  rows.forEach((row) => {
    if (row.innerText.toLowerCase().includes(keyword)) {
      row.style.setProperty("background-color", rowColorSetting.color, "important");
    }
  });
}

function observeDOMChanges() {
  const observer = new MutationObserver(paintRows);
  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener("load", () => {
  loadRowColorSetting(() => {
    observeDOMChanges();
    paintRows();
  });
});
