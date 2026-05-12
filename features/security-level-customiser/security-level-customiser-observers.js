(function attachSecurityLevelCustomiserObservers(global) {
  if (global.MyToolboxSecurityLevelCustomiserObservers) {
    return;
  }

  const constants = global.MyToolboxSecurityLevelCustomiserConstants || {};
  const { LOADING_ATTR, STYLE_ID, VALUE_ATTR } = constants;

  function observeWorkerBodyMutations(callback) {
    const observer = new MutationObserver((records) => {
      if (
        records.length &&
        records.every(
          (record) =>
            record.target?.id === STYLE_ID ||
            record.target?.getAttribute?.(VALUE_ATTR) ||
            record.target?.getAttribute?.(LOADING_ATTR)
        )
      ) {
        return;
      }

      callback();
    });

    const startObserving = () => {
      if (!document.body) {
        return false;
      }

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["aria-label", "class", "data-testid", "title"],
        childList: true,
        subtree: true,
      });
      return true;
    };

    if (startObserving()) {
      return;
    }

    const readyObserver = new MutationObserver(() => {
      if (!startObserving()) {
        return;
      }

      readyObserver.disconnect();
      callback();
    });
    readyObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  }

  function observeWorkerViewportActivity(callback, ruleWorkerRuntime) {
    if (ruleWorkerRuntime?.observeViewportActivity) {
      ruleWorkerRuntime.observeViewportActivity(callback);
      return;
    }

    document.addEventListener("scroll", callback, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", callback, { passive: true });
    document.addEventListener("visibilitychange", callback, {
      passive: true,
    });
  }

  global.MyToolboxSecurityLevelCustomiserObservers = {
    observeWorkerBodyMutations,
    observeWorkerViewportActivity,
  };
})(globalThis);
