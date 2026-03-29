(function runRowHighlighterWorker(global) {
  let highlightSettings = [];
  let rowHighlighterEnabled = true;
  let refreshRowsRaf = 0;
  const ruleWorkerRuntime = global.MyToolboxRuleWorkerRuntime;
  const ROW_HIGHLIGHT_TOUCH_ATTR = "data-my-toolbox-row-highlighted";
  const ROW_HIGHLIGHT_STYLE_ATTR = "data-my-toolbox-row-highlighted-style";
  const ROW_HIGHLIGHT_STYLE_MISSING = "__my_toolbox_row_highlight_style_missing__";
  const ROW_SELECTORS = [
    "div[role='row']",
    "tr[role='row']",
    "tr.issuerow",
    "a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card']",
    "div[data-testid='platform-board-kit.ui.card.card']",
    "li.activity-item",
    "a[data-test-id^='global-pages.home.ui.tab-container.tab.item-list.item-link']"
  ].join(",");

  function loadWorkerBooleanPreference(key, callback, defaultValue = true) {
    if (ruleWorkerRuntime?.loadBooleanPreference) {
      ruleWorkerRuntime.loadBooleanPreference(key, {
        defaultValue,
        logPrefix: "Row Highlighter",
        onLoaded: callback,
      });
      return;
    }

    chrome.storage.sync.get(key, (data) => {
      const value = Object.prototype.hasOwnProperty.call(data, key)
        ? data[key]
        : defaultValue;
      callback?.(value);
    });
  }

  function loadWorkerArraySetting(key, callback) {
    if (ruleWorkerRuntime?.loadArraySetting) {
      ruleWorkerRuntime.loadArraySetting(key, {
        logPrefix: "Row Highlighter",
        mapItem: (item) => Object.assign({ enabled: true }, item),
        onLoaded: callback,
      });
      return;
    }

    chrome.storage.sync.get(key, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Row Highlighter: Error loading settings", chrome.runtime.lastError);
        callback?.([]);
        return;
      }

      const items = Array.isArray(data[key]) ? data[key] : [];
      callback?.(items.map((item) => Object.assign({ enabled: true }, item)));
    });
  }

  function observeWorkerBodyMutations(callback) {
    if (ruleWorkerRuntime?.observeBodyMutations) {
      ruleWorkerRuntime.observeBodyMutations(callback);
      return;
    }

    const observer = new MutationObserver(() => {
      callback();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function runWorkerOnWindowLoad(callback) {
    if (ruleWorkerRuntime?.runOnWindowLoad) {
      ruleWorkerRuntime.runOnWindowLoad(callback);
      return;
    }

    if (document.readyState === "complete") {
      callback();
      return;
    }

    window.addEventListener("load", callback, { once: true });
  }

  function observeWorkerStorageChanges(callback) {
    if (ruleWorkerRuntime?.observeSyncStorageChanges) {
      ruleWorkerRuntime.observeSyncStorageChanges(callback);
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }

      callback?.(changes);
    });
  }

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
    loadWorkerBooleanPreference("rowHighlighterEnabled", (enabled) => {
      rowHighlighterEnabled = enabled;
      callback?.();
    });
  }

  function loadRowHighlightSettings(callback) {
    loadWorkerArraySetting("rowHighlightSettings", (settings) => {
      highlightSettings = settings;
      callback?.();
    });
  }

  function rememberRowStyle(row) {
    if (!row || row.hasAttribute(ROW_HIGHLIGHT_TOUCH_ATTR)) {
      return;
    }

    const inlineStyle = row.getAttribute("style");
    row.setAttribute(ROW_HIGHLIGHT_TOUCH_ATTR, "1");
    row.setAttribute(
      ROW_HIGHLIGHT_STYLE_ATTR,
      inlineStyle == null ? ROW_HIGHLIGHT_STYLE_MISSING : inlineStyle
    );
  }

  function restoreRowStyle(row) {
    if (!row || !row.hasAttribute(ROW_HIGHLIGHT_TOUCH_ATTR)) {
      return;
    }

    const originalStyle = row.getAttribute(ROW_HIGHLIGHT_STYLE_ATTR);
    if (originalStyle === ROW_HIGHLIGHT_STYLE_MISSING) {
      row.removeAttribute("style");
    } else if (originalStyle != null) {
      row.setAttribute("style", originalStyle);
    }

    row.removeAttribute(ROW_HIGHLIGHT_TOUCH_ATTR);
    row.removeAttribute(ROW_HIGHLIGHT_STYLE_ATTR);
  }

  function clearHighlightedRows() {
    document
      .querySelectorAll(`[${ROW_HIGHLIGHT_TOUCH_ATTR}]`)
      .forEach((row) => restoreRowStyle(row));
  }

  function highlightRows() {
    clearHighlightedRows();
    if (!rowHighlighterEnabled || !highlightSettings.length) return;
    const rows = document.querySelectorAll(ROW_SELECTORS);
    rows.forEach((row) => {
      const text = row.innerText.toLowerCase();
      for (const item of highlightSettings) {
        if (item.enabled === false) continue;
        const keywords = getKeywordVariants(item);
        if (!keywords.length) continue;
        const matched = keywords.some((keyword) => text.includes(keyword));
        if (!matched) continue;
        rememberRowStyle(row);
        row.style.setProperty("background-color", item.color, "important");
        break;
      }
    });
  }

  function scheduleHighlightRefresh() {
    if (refreshRowsRaf) {
      return;
    }

    refreshRowsRaf = requestAnimationFrame(() => {
      refreshRowsRaf = 0;
      highlightRows();
    });
  }

  function reloadRowHighlighterState(callback) {
    loadRowHighlighterEnabled(() => {
      loadRowHighlightSettings(() => {
        callback?.();
      });
    });
  }

  function handleStorageChanges(changes) {
    if (!changes?.rowHighlighterEnabled && !changes?.rowHighlightSettings) {
      return;
    }

    reloadRowHighlighterState(() => {
      scheduleHighlightRefresh();
    });
  }

  function observe() {
    observeWorkerBodyMutations(scheduleHighlightRefresh);
  }

  runWorkerOnWindowLoad(() => {
    observe();
    observeWorkerStorageChanges(handleStorageChanges);
    reloadRowHighlighterState(() => {
      scheduleHighlightRefresh();
    });
  });
})(globalThis);
