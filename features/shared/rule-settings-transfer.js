import { getSyncStorage, setSyncStorage } from "../../core/storage.js";

export function exportSyncSettingsJson({
  storageKey,
  filenamePrefix,
  showToast,
  errorLogLabel = "Settings",
}) {
  return getSyncStorage(storageKey).then((result) => {
    if (!result.ok) {
      console.error(`${errorLogLabel}: Error getting settings for export`, result.error);
      showToast("toastErrorGeneric");
      return;
    }

    const settings = Array.isArray(result.data[storageKey])
      ? result.data[storageKey]
      : [];
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${filenamePrefix}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("toastExportSuccess");
  });
}

export function importSyncSettingsJson({
  event,
  storageKey,
  mergeImportedSettings,
  restoreSettings,
  showToast,
  parseErrorLogLabel = "Settings",
  saveErrorLogLabel = "Settings",
  readErrorLogLabel = "Settings",
}) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (loadEvent) => {
    let importedSettings;
    try {
      importedSettings = JSON.parse(loadEvent.target.result);
    } catch (error) {
      console.error(`${parseErrorLogLabel}: Error parsing JSON file`, error);
      showToast("toastImportErrorJsonParse");
      event.target.value = null;
      return;
    }

    const mergedSettings = mergeImportedSettings(importedSettings);
    if (!mergedSettings) {
      showToast("toastImportErrorValidation");
      event.target.value = null;
      return;
    }

    const saveResult = await setSyncStorage({ [storageKey]: mergedSettings });
    if (!saveResult.ok) {
      console.error(
        `${saveErrorLogLabel}: Error saving imported settings`,
        saveResult.error
      );
      showToast("toastImportErrorSave");
      event.target.value = null;
      return;
    }

    showToast("toastImportSuccess");
    await restoreSettings();
    event.target.value = null;
  };

  reader.onerror = (readEvent) => {
    console.error(`${readErrorLogLabel}: Error reading file`, readEvent);
    showToast("toastImportErrorFileRead");
    event.target.value = null;
  };

  reader.readAsText(file);
}
