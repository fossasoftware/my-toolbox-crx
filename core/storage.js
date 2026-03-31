function getStorageArea(areaName) {
  const area = chrome.storage?.[areaName];
  if (!area) {
    throw new Error(`Unsupported storage area "${areaName}"`);
  }
  return area;
}

export function getFromStorage(areaName, keys) {
  return new Promise((resolve) => {
    getStorageArea(areaName).get(keys, (data) => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          data: {},
          error: chrome.runtime.lastError,
        });
        return;
      }

      resolve({
        ok: true,
        data: data || {},
        error: null,
      });
    });
  });
}

export function setInStorage(areaName, values) {
  return new Promise((resolve) => {
    getStorageArea(areaName).set(values, () => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError,
        });
        return;
      }

      resolve({
        ok: true,
        error: null,
      });
    });
  });
}

export function getSyncStorage(keys) {
  return getFromStorage("sync", keys);
}

export function setSyncStorage(values) {
  return setInStorage("sync", values);
}

export function getLocalStorage(keys) {
  return getFromStorage("local", keys);
}

export function setLocalStorage(values) {
  return setInStorage("local", values);
}
