let highlightSettings = [];

function loadSettings(callback) {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    highlightSettings = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings
      : [];
    if (callback) callback();
  });
}

function highlightRows() {
  if (!highlightSettings.length) return;
  const rows = document.querySelectorAll("div[role='row']");
  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    for (const item of highlightSettings) {
      if (text.includes(item.keyword.toLowerCase())) {
        row.style.setProperty("background-color", item.color, "important");
        break;
      }
    }
  });
}

function observe() {
  const observer = new MutationObserver(highlightRows);
  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener("load", () => {
  loadSettings(() => {
    observe();
    highlightRows();
  });
});
