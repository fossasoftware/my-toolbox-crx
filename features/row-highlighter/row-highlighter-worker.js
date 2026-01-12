let highlightSettings = [];
let rowHighlighterEnabled = true;

function normalizeKeyword(keyword) {
  return typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
}

function getKeywordVariants(item) {
  const aliases = Array.isArray(item.aliases)
    ? item.aliases
    : Array.isArray(item.keywordAliases)
      ? item.keywordAliases
      : [];
  return [item.keyword, ...aliases]
    .map((value) => normalizeKeyword(value))
    .filter(Boolean);
}

function loadRowHighlighterEnabled(callback) {
  chrome.storage.sync.get("rowHighlighterEnabled", (data) => {
    rowHighlighterEnabled = data.hasOwnProperty("rowHighlighterEnabled") ? data.rowHighlighterEnabled : true;
    if (callback) callback();
  });
}

function loadRowHighlightSettings(callback) {
  chrome.storage.sync.get("rowHighlightSettings", (data) => {
    highlightSettings = Array.isArray(data.rowHighlightSettings)
      ? data.rowHighlightSettings.map((i) =>
          Object.assign({ enabled: true }, i)
        )
      : [];
    if (callback) callback();
  });
}

function highlightRows() {
  if (!highlightSettings.length) return;
  const rows = document.querySelectorAll(
    [
      "div[role='row']",
      "tr[role='row']",
      "tr.issuerow",
      "a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card']",
      "div[data-testid='platform-board-kit.ui.card.card']",
      "li.activity-item",
      "a[data-test-id^='global-pages.home.ui.tab-container.tab.item-list.item-link']"
    ].join(",")
  );
  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    for (const item of highlightSettings) {
      if (item.enabled === false) continue;
      const keywords = getKeywordVariants(item);
      if (!keywords.length) continue;
      const matched = keywords.some((keyword) => text.includes(keyword));
      if (!matched) continue;
      row.style.setProperty("background-color", item.color, "important");
      break;
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
