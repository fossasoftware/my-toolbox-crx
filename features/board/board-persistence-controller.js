export function createBoardPersistenceController({
  applyBoardState,
  applyViewportState,
  boardModelOptions,
  createBoardBackupPayload,
  downloadBoardBackupFile,
  getAutosaveEnabled,
  getAutosaveToggle,
  getBoardState,
  getSaveButton,
  getViewportState,
  loadStoredBoardAutosavePreference,
  loadStoredBoardState,
  loadStoredBoardViewportState,
  parseStoredBoardBackup,
  readBoardImportFile,
  saveDelay,
  saveStoredBoardAutosavePreference,
  saveStoredBoardState,
  saveStoredBoardViewportState,
  setAutosaveEnabled,
  showToast,
}) {
  let saveTimeout = 0;
  let viewportSaveTimeout = 0;

  async function loadBoardState() {
    const result = await loadStoredBoardState(boardModelOptions);
    if (!result.ok) {
      console.error("Board: Error loading data", result.error);
      showToast("toastErrorLoading");
    }
    return result.state;
  }

  async function loadBoardViewportState() {
    const result = await loadStoredBoardViewportState();
    if (!result.ok) {
      console.error("Board: Error loading viewport state", result.error);
    }
    return result.viewport;
  }

  function persistBoardState(
    state,
    {
      showSuccessToast = false,
      successToastKey = "toastSaved",
      errorToastKey = "toastErrorSaving",
    } = {}
  ) {
    saveStoredBoardState(state).then((result) => {
      if (!result.ok) {
        console.error("Board: Error saving data", result.error);
        showToast(errorToastKey);
      } else if (showSuccessToast) {
        showToast(successToastKey);
      }
    });
  }

  function saveBoardState({
    force = false,
    showSuccessToast = false,
    successToastKey = "toastSaved",
    errorToastKey = "toastErrorSaving",
  } = {}) {
    if (!force && !getAutosaveEnabled()) return;
    persistBoardState(getBoardState(), {
      showSuccessToast,
      successToastKey,
      errorToastKey,
    });
  }

  function saveBoardViewportState() {
    saveStoredBoardViewportState(getViewportState()).then((result) => {
      if (!result.ok) {
        console.error("Board: Error saving viewport state", result.error);
      }
    });
  }

  function scheduleSave() {
    if (!getAutosaveEnabled()) return;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveBoardState(), saveDelay);
  }

  function scheduleViewportSave() {
    clearTimeout(viewportSaveTimeout);
    viewportSaveTimeout = setTimeout(() => {
      viewportSaveTimeout = 0;
      saveBoardViewportState();
    }, Math.min(saveDelay, 180));
  }

  function setAutosaveState(enabled) {
    setAutosaveEnabled(Boolean(enabled));
    const autosaveToggle = getAutosaveToggle();
    if (autosaveToggle) {
      autosaveToggle.checked = Boolean(enabled);
    }
    const saveButton = getSaveButton();
    if (saveButton) {
      saveButton.disabled = Boolean(enabled);
      saveButton.setAttribute("aria-disabled", enabled ? "true" : "false");
    }
  }

  function loadAutosavePreference() {
    loadStoredBoardAutosavePreference().then((result) => {
      if (!result.ok) {
        console.error(
          "Board: Error loading autosave preference:",
          result.error
        );
        showToast("toastErrorLoading");
        return;
      }
      setAutosaveState(result.enabled);
    });
  }

  function saveAutosavePreference(enabled) {
    saveStoredBoardAutosavePreference(enabled).then((result) => {
      if (!result.ok) {
        console.error(
          "Board: Error saving autosave preference:",
          result.error
        );
        showToast("toastErrorSaving");
      }
    });
  }

  function buildBoardBackupPayload() {
    return createBoardBackupPayload(getBoardState(), getAutosaveEnabled());
  }

  function exportBoardBackup() {
    const timestamp = new Date().toISOString().slice(0, 10);
    const payload = buildBoardBackupPayload();
    downloadBoardBackupFile(payload, `my-toolbox-board-export-${timestamp}.json`);
    showToast("toastBoardExportSuccess");
  }

  async function handleBoardImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await readBoardImportFile(file);
      const imported = parseStoredBoardBackup(raw, boardModelOptions);
      if (!imported) {
        showToast("toastBoardImportErrorValidation");
        return;
      }

      if (typeof imported.autosaveEnabled === "boolean") {
        setAutosaveState(imported.autosaveEnabled);
        saveAutosavePreference(imported.autosaveEnabled);
      }

      applyBoardState(imported.state, {
        forceSave: true,
        resetHistory: true,
        showSuccessToast: true,
        successToastKey: "toastBoardImportSuccess",
        errorToastKey: "toastBoardImportErrorSave",
      });
      applyViewportState(null, { persist: true, redraw: true });
    } catch (error) {
      if (error?.code === "json-parse") {
        console.error("Board: Error parsing import file", error.cause || error);
        showToast("toastImportErrorJsonParse");
      } else {
        console.error("Board: Error reading import file", error.cause || error);
        showToast("toastImportErrorFileRead");
      }
    } finally {
      event.target.value = null;
    }
  }

  return {
    buildBoardBackupPayload,
    exportBoardBackup,
    handleBoardImport,
    loadAutosavePreference,
    loadBoardState,
    loadBoardViewportState,
    saveAutosavePreference,
    saveBoardState,
    saveBoardViewportState,
    scheduleSave,
    scheduleViewportSave,
    setAutosaveState,
  };
}
