import { getSyncStorage, setSyncStorage } from "../../core/storage.js";
import { showToast } from "../../core/options-ui.js";

export const SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS = {
  animationEnabled: "securityLevelCustomiserAnimationEnabled",
  rainbowBorderEnabled: "securityLevelCustomiserRainbowBorderEnabled",
  textSize: "securityLevelCustomiserTextSize",
};

const DEFAULT_SECURITY_LEVEL_CUSTOMISER_SETTINGS = {
  animationEnabled: true,
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

function normalizeSecurityLevelCustomiserSettings(data = {}) {
  const keys = SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS;

  return {
    animationEnabled:
      typeof data[keys.animationEnabled] === "boolean"
        ? data[keys.animationEnabled]
        : DEFAULT_SECURITY_LEVEL_CUSTOMISER_SETTINGS.animationEnabled,
    rainbowBorderEnabled:
      typeof data[keys.rainbowBorderEnabled] === "boolean"
        ? data[keys.rainbowBorderEnabled]
        : DEFAULT_SECURITY_LEVEL_CUSTOMISER_SETTINGS.rainbowBorderEnabled,
    textSize: clampNumber(
      data[keys.textSize] ??
        DEFAULT_SECURITY_LEVEL_CUSTOMISER_SETTINGS.textSize,
      12,
      18
    ),
  };
}

function setTextSizeValue(valueElement, size) {
  if (valueElement) {
    valueElement.textContent = `${size}px`;
  }
}

function setAnimationToggleAvailability(animationToggle, enabled) {
  const label = animationToggle.closest(".settings-checkbox");
  animationToggle.disabled = !enabled;
  label?.classList.toggle("is-disabled", !enabled);
}

async function saveSecurityLevelCustomiserSetting(values) {
  const result = await setSyncStorage(values);
  if (!result.ok) {
    console.error(
      "Security Level Customiser: Error saving preferences",
      result.error
    );
    showToast("toastErrorSaving");
  }
}

export async function initializeSecurityLevelCustomiserSettings() {
  const textSizeInput = document.getElementById(
    "securityLevelCustomiserTextSize"
  );
  const textSizeValue = document.getElementById(
    "securityLevelCustomiserTextSizeValue"
  );
  const rainbowBorderToggle = document.getElementById(
    "securityLevelCustomiserRainbowBorder"
  );
  const animationToggle = document.getElementById(
    "securityLevelCustomiserAnimation"
  );

  if (
    !textSizeInput ||
    !rainbowBorderToggle ||
    !animationToggle
  ) {
    console.error("Security Level Customiser: Missing settings controls.");
    return;
  }

  const keys = SECURITY_LEVEL_CUSTOMISER_PREFERENCE_KEYS;
  const result = await getSyncStorage(Object.values(keys));
  if (!result.ok) {
    console.error(
      "Security Level Customiser: Error loading preferences",
      result.error
    );
    showToast("toastErrorLoading");
  }

  const settings = normalizeSecurityLevelCustomiserSettings(result.data || {});
  textSizeInput.value = String(settings.textSize);
  setTextSizeValue(textSizeValue, settings.textSize);
  rainbowBorderToggle.checked = settings.rainbowBorderEnabled;
  animationToggle.checked = settings.animationEnabled;
  setAnimationToggleAvailability(animationToggle, settings.rainbowBorderEnabled);

  textSizeInput.addEventListener("input", () => {
    const size = clampNumber(textSizeInput.value, 12, 18);
    setTextSizeValue(textSizeValue, size);
  });
  textSizeInput.addEventListener("change", () => {
    const size = clampNumber(textSizeInput.value, 12, 18);
    textSizeInput.value = String(size);
    setTextSizeValue(textSizeValue, size);
    saveSecurityLevelCustomiserSetting({ [keys.textSize]: size });
  });
  rainbowBorderToggle.addEventListener("change", () => {
    setAnimationToggleAvailability(animationToggle, rainbowBorderToggle.checked);
    saveSecurityLevelCustomiserSetting({
      [keys.rainbowBorderEnabled]: rainbowBorderToggle.checked,
    });
  });
  animationToggle.addEventListener("change", () => {
    saveSecurityLevelCustomiserSetting({
      [keys.animationEnabled]: animationToggle.checked,
    });
  });
}
