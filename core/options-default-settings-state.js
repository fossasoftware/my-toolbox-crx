let loadedDefaultSettings = [];

export function setLoadedDefaultSettings(settings) {
  loadedDefaultSettings = Array.isArray(settings) ? settings : [];
}

export function getLoadedDefaultSettings() {
  return loadedDefaultSettings;
}
