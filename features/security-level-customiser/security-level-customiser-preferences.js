(function attachSecurityLevelCustomiserPreferences(global) {
  if (global.MyToolboxSecurityLevelCustomiserPreferences) {
    return;
  }

  const SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS = {
    animationEnabled: "securityLevelCustomiserAnimationEnabled",
    enabled: "securityLevelCustomiserEnabled",
    rainbowBorderEnabled: "securityLevelCustomiserRainbowBorderEnabled",
    textSize: "securityLevelCustomiserTextSize",
  };
  const SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES = {
    animationEnabled: true,
    enabled: true,
    rainbowBorderEnabled: true,
    textSize: 14,
  };

  function clampNumber(value, min, max) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return min;
    }
    return Math.min(max, Math.max(min, numberValue));
  }

  function normalizeSecurityLevelCustomiserPreferences(data = {}) {
    const defaults = SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES;
    const keys = SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS;

    return {
      animationEnabled:
        typeof data[keys.animationEnabled] === "boolean"
          ? data[keys.animationEnabled]
          : defaults.animationEnabled,
      enabled:
        typeof data[keys.enabled] === "boolean"
          ? data[keys.enabled]
          : defaults.enabled,
      rainbowBorderEnabled:
        typeof data[keys.rainbowBorderEnabled] === "boolean"
          ? data[keys.rainbowBorderEnabled]
          : defaults.rainbowBorderEnabled,
      textSize: clampNumber(data[keys.textSize] ?? defaults.textSize, 12, 18),
    };
  }

  function loadSecurityLevelCustomiserPreferences(callback) {
    chrome.storage.sync.get(
      Object.values(SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS),
      (data) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Security Level Customiser: Error loading preferences",
            chrome.runtime.lastError
          );
          callback?.(SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES);
          return;
        }

        callback?.(normalizeSecurityLevelCustomiserPreferences(data || {}));
      }
    );
  }

  function isSecurityLevelCustomiserPreferenceChange(changes) {
    const keys = new Set(Object.values(SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS));
    return Object.keys(changes || {}).some((key) => keys.has(key));
  }

  global.MyToolboxSecurityLevelCustomiserPreferences = {
    SECURITY_LEVEL_CUSTOMISER_DEFAULT_PREFERENCES,
    SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS,
    isSecurityLevelCustomiserPreferenceChange,
    loadSecurityLevelCustomiserPreferences,
    normalizeSecurityLevelCustomiserPreferences,
  };
})(globalThis);
