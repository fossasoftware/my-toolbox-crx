export function createNotepadPersistenceController({
  bindSyncedNotepadScroll,
  buildNotepadExportPayload,
  downloadNotepadBackup,
  getActiveSearchMatchIndex,
  getAutosaveToggle,
  getCurrentViewMode,
  getLastNonPreviewViewMode,
  getNotepadArea,
  getNotepadPreview,
  getSaveButton,
  getSearchQuery,
  loadNotepadAutosavePreference,
  loadNotepadViewModePreference,
  loadStoredNotepadContent,
  readNotepadImportFile,
  refreshSearchState,
  renderNotepadPreview,
  resetHistory,
  saveNotepadAutosavePreference,
  saveNotepadViewModePreference,
  saveStoredNotepadContent,
  searchHasQuery,
  setLastNonPreviewViewMode,
  setNotepadViewMode,
  showToast,
  waitForMarkdownLibraries,
  autosaveDelay = 750,
}) {
  let autosaveEnabled = true;
  let saveTimeout = null;

  const setAutosaveState = (enabled) => {
    autosaveEnabled = enabled;
    const autosaveToggle = getAutosaveToggle();
    const saveButton = getSaveButton();
    if (autosaveToggle) {
      autosaveToggle.checked = enabled;
    }
    if (saveButton) {
      saveButton.disabled = enabled;
      saveButton.setAttribute("aria-disabled", enabled ? "true" : "false");
    }
    if (!enabled) {
      clearTimeout(saveTimeout);
    }
  };

  const saveViewModePreference = (mode) => {
    saveNotepadViewModePreference(mode, {
      onError: (error) => {
        console.error("Notepad: Error saving view mode preference:", error);
        showToast("toastErrorSaving");
      },
    });
  };

  const loadViewModePreference = () => {
    loadNotepadViewModePreference({
      onLoaded: (mode) => {
        setNotepadViewMode(mode, { animate: false });
      },
      onError: (error) => {
        console.error("Notepad: Error loading view mode preference:", error);
        showToast("toastErrorLoading");
        setNotepadViewMode("split", { animate: false });
      },
    });
  };

  const loadAutosavePreference = () => {
    loadNotepadAutosavePreference({
      onLoaded: (enabled) => {
        setAutosaveState(enabled !== false);
      },
      onError: (error) => {
        console.error("Notepad: Error loading autosave preference:", error);
        showToast("toastErrorLoading");
      },
    });
  };

  const saveAutosavePreference = (enabled) => {
    saveNotepadAutosavePreference(enabled, {
      onError: (error) => {
        console.error("Notepad: Error saving autosave preference:", error);
        showToast("toastErrorSaving");
      },
    });
  };

  const renderMarkdownPreviewFromState = () => {
    renderNotepadPreview(getNotepadArea(), getNotepadPreview(), {
      activeSearchMatchIndex: getActiveSearchMatchIndex(),
      searchQuery: getSearchQuery(),
    });
  };

  const loadNotepadContent = () => {
    const notepadArea = getNotepadArea();
    if (!notepadArea) return;
    loadStoredNotepadContent({
      onLoaded: (content) => {
        notepadArea.value = content;
        if (searchHasQuery()) {
          refreshSearchState();
        } else {
          renderMarkdownPreviewFromState();
        }
        resetHistory(notepadArea);
      },
      onError: (error) => {
        console.error("Notepad: Error loading content:", error);
        showToast("toastErrorLoading");
      },
    });
  };

  const saveNotepadContent = ({
    showSuccessToast = true,
    successToastKey = "notepadStatusSaved",
    errorToastKey = "toastErrorSaving",
  } = {}) => {
    const notepadArea = getNotepadArea();
    if (!notepadArea) return;
    saveStoredNotepadContent(notepadArea.value, {
      onSaved: () => {
        if (showSuccessToast) {
          showToast(successToastKey);
        }
      },
      onError: (error) => {
        console.error("Notepad: Error saving content:", error);
        showToast(errorToastKey);
      },
    });
  };

  const debouncedSaveNotepad = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveNotepadContent({ showSuccessToast: false });
    }, autosaveDelay);
  };

  const exportNotepadBackup = () => {
    const notepadArea = getNotepadArea();
    downloadNotepadBackup(
      buildNotepadExportPayload({
        autosaveEnabled,
        content: notepadArea?.value || "",
        currentViewMode: getCurrentViewMode(),
        lastNonPreviewViewMode: getLastNonPreviewViewMode(),
      })
    );
    showToast("toastNotepadExportSuccess");
  };

  const importNotepadBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readNotepadImportFile(file, {
      onLoaded: (imported) => {
        const notepadArea = getNotepadArea();
        if (!notepadArea) {
          showToast("toastNotepadImportErrorSave");
          event.target.value = "";
          return;
        }

        notepadArea.value = imported.content;
        if (searchHasQuery()) {
          refreshSearchState();
        } else {
          renderMarkdownPreviewFromState();
        }
        resetHistory(notepadArea);

        if (typeof imported.autosaveEnabled === "boolean") {
          setAutosaveState(imported.autosaveEnabled);
          saveAutosavePreference(imported.autosaveEnabled);
        }

        if (
          imported.lastNonPreviewViewMode &&
          imported.lastNonPreviewViewMode !== "preview"
        ) {
          setLastNonPreviewViewMode(imported.lastNonPreviewViewMode);
        }

        if (imported.viewMode) {
          setNotepadViewMode(imported.viewMode, {
            persist: true,
            animate: false,
          });
        }

        saveNotepadContent({
          showSuccessToast: true,
          successToastKey: "toastNotepadImportSuccess",
          errorToastKey: "toastNotepadImportErrorSave",
        });
        event.target.value = "";
      },
      onParseError: (error) => {
        console.error("Notepad: Error parsing import file", error);
        showToast("toastImportErrorJsonParse");
        event.target.value = "";
      },
      onReadError: (error) => {
        console.error("Notepad: Error reading import file", error);
        showToast("toastImportErrorFileRead");
        event.target.value = "";
      },
      onValidationError: () => {
        showToast("toastNotepadImportErrorValidation");
        event.target.value = "";
      },
    });
  };

  const waitForMarkdownAndThenInit = (retries = 40, delay = 200) => {
    waitForMarkdownLibraries(loadNotepadContent, { retries, delay });
  };

  const bindSyncedScroll = () => {
    bindSyncedNotepadScroll(getNotepadArea(), getNotepadPreview());
  };

  return {
    bindSyncedScroll,
    debouncedSaveNotepad,
    exportNotepadBackup,
    getAutosaveEnabled() {
      return autosaveEnabled;
    },
    importNotepadBackup,
    loadAutosavePreference,
    loadNotepadContent,
    loadViewModePreference,
    renderMarkdownPreview: renderMarkdownPreviewFromState,
    saveAutosavePreference,
    saveNotepadContent,
    saveViewModePreference,
    setAutosaveState,
    waitForMarkdownAndThenInit,
  };
}
