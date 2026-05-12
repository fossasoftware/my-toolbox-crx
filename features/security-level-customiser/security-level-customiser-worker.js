(function runSecurityLevelCustomiserWorker(global) {
  if (global.MyToolboxSecurityLevelCustomiserWorkerStarted) {
    return;
  }
  global.MyToolboxSecurityLevelCustomiserWorkerStarted = true;

  const constants = global.MyToolboxSecurityLevelCustomiserConstants;
  const dom = global.MyToolboxSecurityLevelCustomiserDom;
  const events = global.MyToolboxSecurityLevelCustomiserEvents;
  const issueKeyUtils = global.MyToolboxSecurityLevelCustomiserIssueKey;
  const observers = global.MyToolboxSecurityLevelCustomiserObservers;
  const preferencesApi = global.MyToolboxSecurityLevelCustomiserPreferences;
  const storeFactory = global.MyToolboxSecurityLevelCustomiserStore;
  const ruleWorkerRuntime = global.MyToolboxRuleWorkerRuntime;

  if (
    !constants ||
    !dom ||
    !events ||
    !issueKeyUtils ||
    !observers ||
    !preferencesApi ||
    !storeFactory
  ) {
    console.debug("Security Level Customiser: worker dependencies are missing");
    return;
  }

  const { REFRESH_MIN_INTERVAL_MS } = constants;
  const { getCurrentIssueKey, getIssueKeyFromUrl, getRefreshTimestamp } =
    issueKeyUtils;
  const { paintSecurityLevelButtons, resetSecurityLevelCustomisation } = dom;
  const { createSecurityLevelEventHandlers } = events;
  const { observeWorkerBodyMutations, observeWorkerViewportActivity } =
    observers;
  const {
    SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES,
    isSecurityLevelCustomiserPreferenceChange,
    loadSecurityLevelCustomiserPreferences,
  } = preferencesApi;
  const { createSecurityLevelStore } = storeFactory;

  let lastIssueKey = "";
  let lastRefreshAt = 0;
  let refreshRaf = 0;
  let refreshTimer = 0;
  let securityLevelCustomiserPreferences =
    SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES;

  const securityLevelStore = createSecurityLevelStore({
    onUpdated: scheduleSecurityLevelRefresh,
  });
  const {
    fetchSecurityLevel,
    getStoredSecurityLevel,
    hasRecentFetchFailure,
    setCachedSecurityLevel,
  } = securityLevelStore;

  function loadSecurityLevelCustomiserState(callback) {
    loadSecurityLevelCustomiserPreferences((preferences) => {
      securityLevelCustomiserPreferences = preferences;
      callback?.();
    });
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

  function isSecurityLevelCustomiserEnabled() {
    return securityLevelCustomiserPreferences.enabled;
  }

  function refreshSecurityLevelCustomisation() {
    if (!isSecurityLevelCustomiserEnabled()) {
      resetSecurityLevelCustomisation();
      return;
    }

    const issueKey = getCurrentIssueKey();
    if (issueKey !== lastIssueKey) {
      lastIssueKey = issueKey;
    }

    paintSecurityLevelButtons(issueKey, {
      getStoredSecurityLevel,
      hasRecentFetchFailure,
      preferences: securityLevelCustomiserPreferences,
    });

    if (issueKey) {
      fetchSecurityLevel(issueKey);
    }
  }

  function queueSecurityLevelRefreshFrame() {
    clearTimeout(refreshTimer);
    refreshTimer = 0;

    if (refreshRaf) {
      return;
    }

    refreshRaf = requestAnimationFrame(() => {
      refreshRaf = 0;
      lastRefreshAt = getRefreshTimestamp();
      refreshSecurityLevelCustomisation();
    });
  }

  function scheduleSecurityLevelRefresh() {
    if (document.visibilityState === "hidden") {
      return;
    }

    const elapsed = getRefreshTimestamp() - lastRefreshAt;
    if (!lastRefreshAt || elapsed >= REFRESH_MIN_INTERVAL_MS) {
      queueSecurityLevelRefreshFrame();
      return;
    }

    if (refreshRaf || refreshTimer) {
      return;
    }

    refreshTimer = window.setTimeout(() => {
      refreshTimer = 0;
      queueSecurityLevelRefreshFrame();
    }, REFRESH_MIN_INTERVAL_MS - elapsed);
  }

  function preloadSecurityLevelFromUrl() {
    if (!isSecurityLevelCustomiserEnabled()) {
      return;
    }

    const issueKey = getIssueKeyFromUrl();
    if (!issueKey) {
      return;
    }

    const cached = getStoredSecurityLevel(issueKey);
    if (cached?.name) {
      scheduleSecurityLevelRefresh();
    }
    fetchSecurityLevel(issueKey);
  }

  function observeSecurityLevelChanges() {
    const eventHandlers = createSecurityLevelEventHandlers({
      fetchSecurityLevel,
      getCurrentIssueKey,
      isEnabled: isSecurityLevelCustomiserEnabled,
      scheduleSecurityLevelRefresh,
      setCachedSecurityLevel,
    });

    observeWorkerBodyMutations(scheduleSecurityLevelRefresh);
    observeWorkerViewportActivity(scheduleSecurityLevelRefresh, ruleWorkerRuntime);
    document.addEventListener(
      "click",
      eventHandlers.handleSecurityLevelOptionClick,
      { capture: true }
    );
    document.addEventListener(
      "click",
      eventHandlers.handleSecurityLevelContainerClick,
      { capture: true }
    );
    document.addEventListener(
      "keydown",
      eventHandlers.handleSecurityLevelContainerKeydown,
      { capture: true }
    );
    window.addEventListener("popstate", scheduleSecurityLevelRefresh);
  }

  function applySecurityLevelCustomiserState() {
    if (!isSecurityLevelCustomiserEnabled()) {
      resetSecurityLevelCustomisation();
      return;
    }

    preloadSecurityLevelFromUrl();
    scheduleInitialRefreshes();
  }

  function handleStorageChanges(changes) {
    if (!isSecurityLevelCustomiserPreferenceChange(changes)) {
      return;
    }

    loadSecurityLevelCustomiserState(applySecurityLevelCustomiserState);
  }

  function scheduleInitialRefreshes() {
    scheduleSecurityLevelRefresh();
    requestAnimationFrame(scheduleSecurityLevelRefresh);
    window.setTimeout(scheduleSecurityLevelRefresh, 250);
    window.setTimeout(scheduleSecurityLevelRefresh, 1200);
  }

  observeSecurityLevelChanges();
  observeWorkerStorageChanges(handleStorageChanges);
  loadSecurityLevelCustomiserState(applySecurityLevelCustomiserState);
})(globalThis);
