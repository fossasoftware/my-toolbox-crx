(function attachRuleWorkerRuntime(global) {
  if (global.MyToolboxRuleWorkerRuntime) {
    return;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function getSyncStorage(key, callback) {
    chrome.storage.sync.get(key, (data) => {
      callback({
        data: data || {},
        error: chrome.runtime.lastError || null,
      });
    });
  }

  function setSyncStorage(key, value, callback) {
    chrome.storage.sync.set({ [key]: value }, () => {
      callback?.(chrome.runtime.lastError || null);
    });
  }

  function loadBooleanPreference(
    key,
    { defaultValue = true, logPrefix = "Rule Worker", onLoaded, onError } = {}
  ) {
    getSyncStorage(key, ({ data, error }) => {
      if (error) {
        console.error(`${logPrefix}: Error loading ${key}`, error);
        onError?.(error);
        onLoaded?.(defaultValue);
        return;
      }

      const value = hasOwn(data, key) ? data[key] : defaultValue;
      onLoaded?.(value);
    });
  }

  function normalizeArraySetting(value, mapItem, defaultValue = []) {
    const items = Array.isArray(value) ? value : defaultValue;
    if (typeof mapItem !== "function") {
      return items;
    }
    return items.map((item) => mapItem(item));
  }

  function loadJsonResource(path, { logPrefix = "Rule Worker", onLoaded, onError } = {}) {
    fetch(chrome.runtime.getURL(path))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        onLoaded?.(data);
      })
      .catch((error) => {
        console.error(`${logPrefix}: Failed to load ${path}`, error);
        onError?.(error);
      });
  }

  function loadArraySetting(
    key,
    {
      defaultValue = [],
      defaultResourcePath = "",
      logPrefix = "Rule Worker",
      mapItem,
      onLoaded,
      onError,
    } = {}
  ) {
    getSyncStorage(key, ({ data, error }) => {
      if (error) {
        console.error(`${logPrefix}: Error loading ${key}`, error);
        onError?.(error);
        onLoaded?.(normalizeArraySetting(defaultValue, mapItem, defaultValue));
        return;
      }

      if (!hasOwn(data, key) && defaultResourcePath) {
        loadJsonResource(defaultResourcePath, {
          logPrefix,
          onLoaded: (resourceData) => {
            const items = normalizeArraySetting(resourceData, mapItem, defaultValue);
            setSyncStorage(key, items, (persistError) => {
              if (persistError) {
                console.error(`${logPrefix}: Error saving ${key}`, persistError);
              }
            });
            onLoaded?.(items);
          },
          onError: (resourceError) => {
            onError?.(resourceError);
            onLoaded?.(normalizeArraySetting(defaultValue, mapItem, defaultValue));
          },
        });
        return;
      }

      onLoaded?.(normalizeArraySetting(data[key], mapItem, defaultValue));
    });
  }

  function observeBodyMutations(callback) {
    const observer = new MutationObserver(() => {
      callback();
    });

    const startObserving = () => {
      if (!document.body) {
        return false;
      }
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return true;
    };

    if (!startObserving()) {
      const readyObserver = new MutationObserver(() => {
        if (startObserving()) {
          readyObserver.disconnect();
        }
      });
      readyObserver.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
      });
    }

    return observer;
  }

  function runOnWindowLoad(callback) {
    if (document.readyState === "complete") {
      callback();
      return;
    }

    window.addEventListener("load", callback, { once: true });
  }

  function observeSyncStorageChanges(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }

      callback?.(changes);
    });
  }

  global.MyToolboxRuleWorkerRuntime = {
    loadArraySetting,
    loadBooleanPreference,
    observeSyncStorageChanges,
    observeBodyMutations,
    runOnWindowLoad,
  };
})(globalThis);
