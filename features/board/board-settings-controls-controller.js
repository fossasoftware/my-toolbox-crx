export function createBoardSettingsControlsController({
  assignBackupElements,
  assignInputElements,
  clearBoard,
  documentRef,
  exportBoardBackup,
  getAutosaveToggle,
  getClearModal,
  getText,
  handleBoardImport,
  redoBoard,
  saveAutosavePreference,
  saveBoardState,
  setAutosaveState,
  undoBoard,
  updateHistoryButtons,
  windowRef,
}) {
  function openBoardClearModal() {
    const clearModal = getClearModal();
    if (!clearModal) return;
    clearModal.classList.add("active");
  }

  function closeBoardClearModal() {
    const clearModal = getClearModal();
    if (!clearModal) return;
    clearModal.classList.remove("active");
  }

  function setupInputs() {
    const clearButton = documentRef.getElementById("boardClearBtn");
    const clearModal = documentRef.getElementById("boardClearModal");
    const clearModalConfirmButton = documentRef.getElementById(
      "boardClearConfirmBtn"
    );
    const clearModalCancelButton = documentRef.getElementById(
      "boardClearCancelBtn"
    );
    const undoButton = documentRef.getElementById("boardUndoBtn");
    const redoButton = documentRef.getElementById("boardRedoBtn");
    const autosaveToggle = documentRef.getElementById("boardAutosaveToggle");
    const saveButton = documentRef.getElementById("boardSaveBtn");

    assignInputElements({
      autosaveToggle,
      clearButton,
      clearModal,
      clearModalCancelButton,
      clearModalConfirmButton,
      redoButton,
      saveButton,
      undoButton,
    });

    if (clearButton) {
      clearButton.setAttribute("aria-label", getText("boardActionClear"));
      clearButton.addEventListener("click", () => {
        openBoardClearModal();
      });
    }
    if (clearModalConfirmButton) {
      clearModalConfirmButton.addEventListener("click", () => {
        clearBoard();
        closeBoardClearModal();
      });
    }
    if (clearModalCancelButton) {
      clearModalCancelButton.addEventListener("click", () => {
        closeBoardClearModal();
      });
    }
    if (clearModal) {
      clearModal.addEventListener("click", (event) => {
        if (event.target === clearModal) {
          closeBoardClearModal();
        }
      });
    }
    windowRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeBoardClearModal();
      }
    });
    if (undoButton) {
      undoButton.addEventListener("click", () => {
        undoBoard();
      });
    }
    if (redoButton) {
      redoButton.addEventListener("click", () => {
        redoBoard();
      });
    }
    if (autosaveToggle) {
      autosaveToggle.addEventListener("change", () => {
        const enabled = getAutosaveToggle()?.checked;
        setAutosaveState(Boolean(enabled));
        saveAutosavePreference(Boolean(enabled));
        if (enabled) {
          saveBoardState({ force: true });
        }
      });
    }
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        saveBoardState({ force: true, showSuccessToast: true });
      });
    }

    updateHistoryButtons();
  }

  function setupBoardBackupControls() {
    const boardBackupButton = documentRef.getElementById("boardBackupBtn");
    const boardImportButton = documentRef.getElementById("boardImportBtn");
    const boardImportFileInput = documentRef.getElementById("boardImportFile");

    assignBackupElements({
      boardBackupButton,
      boardImportButton,
      boardImportFileInput,
    });

    if (boardBackupButton) {
      boardBackupButton.addEventListener("click", exportBoardBackup);
    }

    if (boardImportButton && boardImportFileInput) {
      boardImportButton.addEventListener("click", () => {
        boardImportFileInput.click();
      });
      boardImportFileInput.addEventListener("change", handleBoardImport);
    }
  }

  return {
    closeBoardClearModal,
    openBoardClearModal,
    setupBoardBackupControls,
    setupInputs,
  };
}
