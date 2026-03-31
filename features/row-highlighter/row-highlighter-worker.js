(function runRowHighlighterWorker(global) {
  let highlightSettings = [];
  let compiledHighlightMatchers = [];
  let rowHighlighterEnabled = true;
  let refreshRowsRaf = 0;
  let viewportRefreshTimer = 0;
  let lastHighlightRefreshAt = 0;
  let pendingHighlightRefreshMode = null;
  let workerStarted = false;
  let rowSearchCache = new WeakMap();
  const ruleWorkerRuntime = global.MyToolboxRuleWorkerRuntime;
  const rowHighlighterLogic = global.MyToolboxRowHighlighterLogic || {};
  const {
    compileHighlightMatchers = () => [],
    findMatchedHighlight = () => null,
    normalizeSearchText = (text) =>
      typeof text === "string"
        ? text.replace(/\s+/g, " ").trim().toLowerCase()
        : "",
  } = rowHighlighterLogic;
  const ROW_HIGHLIGHT_CLASS = "my-toolbox-row-highlighted";
  const ROW_HIGHLIGHT_COLOR_VAR = "--my-toolbox-row-highlight-color";
  const ROW_HIGHLIGHT_TOUCH_ATTR = "data-my-toolbox-row-highlighted";
  const ROW_HIGHLIGHT_STYLE_ID = "my-toolbox-row-highlight-style";
  const ROW_SELECTORS = [
    "div[data-testid='virtual-table.table.main'] div[role='row']",
    "tr[role='row']",
    "tr.issuerow",
    "a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card']",
    "div[data-testid='platform-board-kit.ui.card.card']",
    "li.activity-item",
    "a[data-test-id^='global-pages.home.ui.tab-container.tab.item-list.item-link']"
  ].join(",");
  const VIEWPORT_REFRESH_MIN_INTERVAL_MS = 120;
  const VIEWPORT_ROW_MARGIN_PX = 240;

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

  function observeWorkerViewportActivity(callback) {
    if (ruleWorkerRuntime?.observeViewportActivity) {
      ruleWorkerRuntime.observeViewportActivity(callback);
      return;
    }

    let shortTimer = 0;
    let lateTimer = 0;
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      callback();
    }, 1200);

    const notifyViewportActivity = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      callback();
      clearTimeout(shortTimer);
      clearTimeout(lateTimer);
      shortTimer = window.setTimeout(callback, 80);
      lateTimer = window.setTimeout(callback, 260);
    };

    document.addEventListener("scroll", notifyViewportActivity, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", notifyViewportActivity, {
      capture: true,
      passive: true,
    });
    document.addEventListener("wheel", notifyViewportActivity, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchmove", notifyViewportActivity, {
      capture: true,
      passive: true,
    });
    document.addEventListener("mouseover", notifyViewportActivity, {
      capture: true,
    });
    document.addEventListener("focusin", notifyViewportActivity, {
      capture: true,
    });
    window.addEventListener("resize", notifyViewportActivity, { passive: true });
    document.addEventListener("visibilitychange", notifyViewportActivity, {
      passive: true,
    });

    return () => {
      clearInterval(heartbeat);
      clearTimeout(shortTimer);
      clearTimeout(lateTimer);
    };
  }

  function clearRowSearchCache() {
    rowSearchCache = new WeakMap();
  }

  function getRefreshTimestamp() {
    return typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  function clearViewportRefreshTimer() {
    if (!viewportRefreshTimer) {
      return;
    }

    clearTimeout(viewportRefreshTimer);
    viewportRefreshTimer = 0;
  }

  function ensureRowHighlightStyle() {
    if (document.getElementById(ROW_HIGHLIGHT_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = ROW_HIGHLIGHT_STYLE_ID;
    style.textContent = `
      .${ROW_HIGHLIGHT_CLASS} {
        background-color: var(${ROW_HIGHLIGHT_COLOR_VAR}) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function getRowCacheKey(row) {
    return [
      row.getAttribute("data-testid"),
      row.getAttribute("data-test-id"),
      row.getAttribute("data-issue-key"),
      row.querySelector("[data-issue-key]")?.getAttribute("data-issue-key"),
      row.querySelector("a.issue-link")?.getAttribute("href"),
      row.querySelector("[data-testid*='cell-wrapper-row'][data-testid$='-issuekey'] a")?.getAttribute("href"),
    ]
      .filter(Boolean)
      .join("|");
  }

  function collectSearchableTextParts(row, selectors) {
    return selectors
      .flatMap((selector) =>
        [...row.querySelectorAll(selector)].map((element) => element.textContent || "")
      )
      .map((text) => normalizeSearchText(text))
      .filter(Boolean);
  }

  function collectIssueTableRowText(row) {
    const parts = collectSearchableTextParts(row, [
      "[data-testid*='cell-wrapper-row'][data-testid$='-issuekey']",
      "[data-testid*='cell-wrapper-row'][data-testid$='-summary']",
      "[data-testid*='cell-wrapper-row'][data-testid$='-status']",
      "[data-testid='native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell']",
      "[data-testid='native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell']",
      "td.issuekey",
      "td.summary",
      "td.status",
      ".issue-link",
    ]);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  function collectIssueNavigatorCardText(row) {
    const parts = collectSearchableTextParts(row, [
      "[data-testid='inline-card-resolved-view']",
      "[data-testid='inline-card-icon-and-title']",
      "[data-testid='inline-card-resolved-view-lozenge']",
      "[data-testid='inline-card-resolved-view-lozenge--text']",
      "[data-testid*='issue-key']",
      "[data-testid*='issue-summary']",
      "[data-testid*='status-lozenge']",
      ".issue-link",
    ]);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  function collectBoardCardText(row) {
    const parts = collectSearchableTextParts(row, [
      "[data-testid*='card'] [data-testid*='summary']",
      "[data-testid*='card'] [data-testid*='issue-key']",
      "[data-testid*='card'] [data-testid*='status']",
      "[data-testid*='status-lozenge']",
      "[data-testid*='issue-key']",
      "[data-testid*='summary']",
      ".issue-link",
    ]);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  function collectActivityItemText(row) {
    const parts = collectSearchableTextParts(row, [
      "[data-testid='inline-card-resolved-view']",
      "[data-testid='inline-card-icon-and-title']",
      "[data-testid='inline-card-resolved-view-lozenge']",
      "[data-testid='inline-card-resolved-view-lozenge--text']",
      "[data-testid='common-components-status-lozenge.status-lozenge']",
      "[data-testid='common-components-status-lozenge.status-lozenge--text']",
      "a[data-testid='inline-card-resolved-view']",
      "a[href*='/browse/']",
    ]);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  function collectHomeItemText(row) {
    const parts = collectSearchableTextParts(row, [
      "[data-testid*='issue-key']",
      "[data-testid*='issue-summary']",
      "[data-testid*='status']",
      "[data-testid*='status-lozenge']",
      "strong",
      "span",
    ]);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  function buildSearchableRowText(row) {
    const extractors = [
      {
        match: () =>
          row.matches(
            "div[data-testid='virtual-table.table.main'] div[role='row'], tr[role='row'], tr.issuerow, tr[data-testid='native-issue-table.ui.issue-row']"
          ),
        collect: collectIssueTableRowText,
      },
      {
        match: () =>
          row.matches(
            "a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card']"
          ),
        collect: collectIssueNavigatorCardText,
      },
      {
        match: () =>
          row.matches("div[data-testid='platform-board-kit.ui.card.card']"),
        collect: collectBoardCardText,
      },
      {
        match: () => row.matches("li.activity-item"),
        collect: collectActivityItemText,
      },
      {
        match: () =>
          row.matches(
            "a[data-test-id^='global-pages.home.ui.tab-container.tab.item-list.item-link']"
          ),
        collect: collectHomeItemText,
      },
    ];

    for (const extractor of extractors) {
      if (!extractor.match()) {
        continue;
      }
      const text = extractor.collect(row);
      if (text) {
        return text;
      }
    }

    return normalizeSearchText(row.textContent || "");
  }

  function getSearchableRowText(row) {
    const cacheKey = getRowCacheKey(row);
    if (!cacheKey) {
      return buildSearchableRowText(row);
    }

    const cached = rowSearchCache.get(row);
    if (cached?.key === cacheKey) {
      return cached.text;
    }

    const text = buildSearchableRowText(row);
    rowSearchCache.set(row, {
      key: cacheKey,
      text,
    });
    return text;
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
      compiledHighlightMatchers = compileHighlightMatchers(settings);
      clearRowSearchCache();
      callback?.();
    });
  }

  function rememberRowStyle(row) {
    if (!row || row.hasAttribute(ROW_HIGHLIGHT_TOUCH_ATTR)) {
      return;
    }

    row.setAttribute(ROW_HIGHLIGHT_TOUCH_ATTR, "1");
  }

  function restoreRowStyle(row) {
    if (!row || !row.hasAttribute(ROW_HIGHLIGHT_TOUCH_ATTR)) {
      return;
    }

    row.classList.remove(ROW_HIGHLIGHT_CLASS);
    row.style.removeProperty(ROW_HIGHLIGHT_COLOR_VAR);
    row.removeAttribute(ROW_HIGHLIGHT_TOUCH_ATTR);
  }

  function isDataRow(row) {
    if (!row) {
      return false;
    }

    if (row.matches("tr[role='row'], tr.issuerow")) {
      return true;
    }

    if (
      row.matches(
        "a[data-testid='issue-navigator.ui.issue-results.detail-view.card-list.card'], div[data-testid='platform-board-kit.ui.card.card'], li.activity-item, a[data-test-id^='global-pages.home.ui.tab-container.tab.item-list.item-link']"
      )
    ) {
      return true;
    }

    return Boolean(
      row.querySelector(
        "[data-testid*='cell-wrapper-row'][data-testid$='-issuekey'], [data-testid*='cell-wrapper-row'][data-testid$='-status']"
      )
    );
  }

  function getCandidateRows() {
    return [...document.querySelectorAll(ROW_SELECTORS)].filter(isDataRow);
  }

  function isRowNearViewport(row) {
    if (!row?.getBoundingClientRect) {
      return true;
    }

    const rect = row.getBoundingClientRect();
    return (
      rect.bottom >= -VIEWPORT_ROW_MARGIN_PX &&
      rect.top <= window.innerHeight + VIEWPORT_ROW_MARGIN_PX &&
      rect.right >= -VIEWPORT_ROW_MARGIN_PX &&
      rect.left <= window.innerWidth + VIEWPORT_ROW_MARGIN_PX
    );
  }

  function getViewportCandidateRows() {
    return getCandidateRows().filter(isRowNearViewport);
  }

  function highlightRows(mode = "full") {
    ensureRowHighlightStyle();
    const trackedRows = new Set(
      document.querySelectorAll(`[${ROW_HIGHLIGHT_TOUCH_ATTR}]`)
    );

    if (!rowHighlighterEnabled || !compiledHighlightMatchers.length) {
      trackedRows.forEach((row) => restoreRowStyle(row));
      return;
    }

    const rows =
      mode === "viewport" ? getViewportCandidateRows() : getCandidateRows();
    const currentRows = new Set(rows);
    const matchedRows = new Set();
    rows.forEach((row) => {
      const text = getSearchableRowText(row);
      const matchedItem = findMatchedHighlight(compiledHighlightMatchers, text);

      if (!matchedItem) {
        if (trackedRows.has(row)) {
          restoreRowStyle(row);
        }
        return;
      }

      matchedRows.add(row);
      rememberRowStyle(row);
      row.classList.add(ROW_HIGHLIGHT_CLASS);
      row.style.setProperty(ROW_HIGHLIGHT_COLOR_VAR, matchedItem.color);
    });

    trackedRows.forEach((row) => {
      if (!document.contains(row)) {
        restoreRowStyle(row);
        return;
      }

      if (mode === "viewport") {
        if (currentRows.has(row) && !matchedRows.has(row)) {
          restoreRowStyle(row);
        }
        return;
      }

      if (!matchedRows.has(row) || !currentRows.has(row)) {
        restoreRowStyle(row);
      }
    });
  }

  function mergeHighlightRefreshMode(mode) {
    if (pendingHighlightRefreshMode === "full" || mode === "full") {
      pendingHighlightRefreshMode = "full";
      return;
    }

    pendingHighlightRefreshMode = "viewport";
  }

  function queueHighlightRefreshFrame(mode = "full") {
    clearViewportRefreshTimer();
    mergeHighlightRefreshMode(mode);
    if (refreshRowsRaf) {
      return;
    }

    refreshRowsRaf = requestAnimationFrame(() => {
      refreshRowsRaf = 0;
      lastHighlightRefreshAt = getRefreshTimestamp();
      const refreshMode = pendingHighlightRefreshMode || "full";
      pendingHighlightRefreshMode = null;
      highlightRows(refreshMode);
    });
  }

  function scheduleViewportHighlightRefresh() {
    if (document.visibilityState === "hidden") {
      return;
    }

    const elapsed = getRefreshTimestamp() - lastHighlightRefreshAt;
    if (!lastHighlightRefreshAt || elapsed >= VIEWPORT_REFRESH_MIN_INTERVAL_MS) {
      queueHighlightRefreshFrame("viewport");
      return;
    }

    if (refreshRowsRaf || viewportRefreshTimer) {
      mergeHighlightRefreshMode("viewport");
      return;
    }

    viewportRefreshTimer = window.setTimeout(() => {
      viewportRefreshTimer = 0;
      queueHighlightRefreshFrame("viewport");
    }, VIEWPORT_REFRESH_MIN_INTERVAL_MS - elapsed);
  }

  function scheduleHighlightRefresh(reason = "default") {
    if (reason === "viewport") {
      scheduleViewportHighlightRefresh();
      return;
    }

    queueHighlightRefreshFrame();
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
    observeWorkerBodyMutations(() => {
      clearRowSearchCache();
      scheduleHighlightRefresh();
    });
    observeWorkerViewportActivity(() => {
      scheduleHighlightRefresh("viewport");
    });
  }

  function scheduleInitialHighlightRefreshes() {
    scheduleHighlightRefresh();
    requestAnimationFrame(() => {
      scheduleHighlightRefresh();
    });
    window.setTimeout(() => {
      scheduleHighlightRefresh();
    }, 250);
    window.setTimeout(() => {
      scheduleHighlightRefresh();
    }, 1200);
  }

  function startRowHighlighterWorker() {
    if (workerStarted) {
      return;
    }
    workerStarted = true;

    observe();
    observeWorkerStorageChanges(handleStorageChanges);
    reloadRowHighlighterState(() => {
      scheduleInitialHighlightRefreshes();
    });
    runWorkerOnWindowLoad(scheduleInitialHighlightRefreshes);
  }

  startRowHighlighterWorker();
})(globalThis);
