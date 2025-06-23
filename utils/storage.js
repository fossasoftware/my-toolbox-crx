import { showToast } from "../options/options-main.js";

export function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (data) => {
      if (chrome.runtime.lastError) {
        console.error(`Storage get error for ${key}:`, chrome.runtime.lastError);
        showToast('toastErrorLoading');
        resolve(null);
      } else {
        resolve(data[key]);
      }
    });
  });
}

export function storageSet(obj) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error(`Storage set error for ${Object.keys(obj).join(', ')}:`, chrome.runtime.lastError);
        showToast('toastErrorSaving');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
