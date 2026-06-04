export function bindAutosaveControls({
  autosaveToggle,
  debouncedSaveNotepad,
  saveAutosavePreference,
  setAutosaveState,
}) {
  if (!autosaveToggle) {
    console.error("Notepad: Missing autosave toggle");
    return;
  }

  autosaveToggle.addEventListener("change", () => {
    const enabled = autosaveToggle.checked;
    setAutosaveState(enabled);
    saveAutosavePreference(enabled);
    if (enabled) {
      debouncedSaveNotepad();
    }
  });
}

export function bindSaveControls({
  redoButton,
  redoNotepad,
  saveButton,
  saveNotepadContent,
  undoButton,
  undoNotepad,
}) {
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      saveNotepadContent();
    });
  } else {
    console.error("Notepad: Missing save button");
  }

  if (undoButton) {
    undoButton.addEventListener("click", () => {
      undoNotepad();
    });
  } else {
    console.error("Notepad: Missing undo button");
  }

  if (redoButton) {
    redoButton.addEventListener("click", () => {
      redoNotepad();
    });
  } else {
    console.error("Notepad: Missing redo button");
  }
}

export function bindFormatButtons({ applyMarkdownFormat, formatButtons }) {
  formatButtons.forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      applyMarkdownFormat(button.dataset.format);
    });
  });
}

export function bindViewButtons({
  resolveNextViewMode,
  setNotepadViewMode,
  viewButtons,
}) {
  viewButtons.forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      const nextMode = resolveNextViewMode(button.dataset.viewMode);
      setNotepadViewMode(nextMode, {
        persist: true,
        focusEditor: nextMode !== "preview",
      });
    });
  });
}

export function bindImportExportControls({
  importButton,
  importFileInput,
  importNotepadBackup,
  exportButton,
  exportNotepadBackup,
}) {
  if (exportButton) {
    exportButton.addEventListener("click", exportNotepadBackup);
  }

  if (importButton && importFileInput) {
    importButton.addEventListener("click", () => {
      importFileInput.click();
    });
    importFileInput.addEventListener("change", importNotepadBackup);
  }
}

export function bindSearchToggle({ searchToggleButton, toggleSearch }) {
  if (!searchToggleButton) {
    return;
  }

  searchToggleButton.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  searchToggleButton.addEventListener("click", () => {
    toggleSearch();
  });
}

export function bindSearchControls({
  handleCloseClick,
  handleInputChange,
  handleInputKeydown,
  handleNextClick,
  handlePrevClick,
  searchCloseButton,
  searchInput,
  searchNextButton,
  searchPrevButton,
}) {
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      handleInputChange(searchInput.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      handleInputKeydown(event);
    });
  }

  if (searchPrevButton) {
    searchPrevButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    searchPrevButton.addEventListener("click", () => {
      handlePrevClick();
    });
  }

  if (searchNextButton) {
    searchNextButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    searchNextButton.addEventListener("click", () => {
      handleNextClick();
    });
  }

  if (searchCloseButton) {
    searchCloseButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    searchCloseButton.addEventListener("click", () => {
      handleCloseClick();
    });
  }
}
