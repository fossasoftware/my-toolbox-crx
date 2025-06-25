let highlightSettings = [];
let rowHighlighterEnabled = true;

function loadRowHighlighterEnabled(callback) {
  chrome.storage.sync.get("rowHighlighterEnabled", (data) => {
    rowHighlighterEnabled = data.hasOwnProperty("rowHighlighterEnabled") ? data.rowHighlighterEnabled : true;
    if (callback) callback();
  });
}

function loadRowHighlightSettings(callback) {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    highlightSettings = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings
      : [];
    if (callback) callback();
  });
}

function ensureStyle() {
  const id = "row-highlighter-style";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .row-highlighter,
      .row-highlighter td,
      .row-highlighter [role='gridcell'] {
        background: var(--row-highlight-color) !important;
        background-color: var(--row-highlight-color) !important;
        --_1hphqkz: var(--row-highlight-color) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function highlightRows() {
  if (!highlightSettings.length) return;
  ensureStyle();
  const rows = document.querySelectorAll(
    "div[role='row'], tr[role='row'], a[data-testid='issue-navigator.ui.issue-results.detail-view.card.list-card'], a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card'], div[data-testid='platform-board-kit.ui.card.card']"
  );
  rows.forEach((row) => {
    row.classList.remove("row-highlighter");
    const text = row.innerText.toLowerCase();
    for (const item of highlightSettings) {
      if (text.includes(item.keyword.toLowerCase())) {
        row.classList.add("row-highlighter");
        row.style.setProperty("--row-highlight-color", item.color, "important");
        row.style.setProperty("--_1hphqkz", item.color, "important");
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
  loadRowHighlighterEnabled(() => {
    if (!rowHighlighterEnabled) return;
    loadRowHighlightSettings(() => {
      observe();
      highlightRows();
    });
  });
});

