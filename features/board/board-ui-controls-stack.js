import { createBoardHelpControlsController } from "./board-help-controls-controller.js";
import { createBoardInkControlsController } from "./board-ink-controls-controller.js";
import { createBoardMainToolbarController } from "./board-main-toolbar-controller.js";
import { createBoardSettingsControlsController } from "./board-settings-controls-controller.js";
import { createBoardToolbarPopupController } from "./board-toolbar-popup-controller.js";

export function createBoardUiControlsStack({
  documentRef,
  windowRef,
  getText,
  getCurrentTool,
  getBoardSettings,
  getBoardToolbarDock,
  setBoardToolbarDock,
  getBoardToolbarPanel,
  setBoardToolbarPanel,
  getNotesMenu,
  setNotesMenu,
  getNotesToggle,
  setNotesToggle,
  getShapesMenu,
  setShapesMenu,
  getShapesToggle,
  setShapesToggle,
  getHelpControls,
  setHelpControls,
  getHelpButton,
  setHelpButton,
  getHelpPanel,
  setHelpPanel,
  getAutosaveToggle,
  getClearModal,
  setInputRefs,
  setBackupRefs,
  getEraserRefs,
  setEraserRefs,
  getPenRefs,
  setPenRefs,
  getItemTitle,
  boardItemLifecycleApi,
  boardToolbarPopupApi,
  boardUiSetupApi,
  boardShellApi,
  boardPersistenceApi,
  boardLifecycleApi,
  boardUiPreview,
  boardCursorApi,
  itemTypeColors,
  shapeToolLabels,
  shapeTools,
  shapeStrokeColorPresets,
}) {
  let boardMainToolbar = null;

  const boardToolbarPopup = createBoardToolbarPopupController({
    getBoardToolbarDock,
    getBoardToolbarPanel,
    getEraserCard: () => getEraserRefs().eraserCard,
    getEraserPanel: () => getEraserRefs().eraserPanel,
    getEraserToggle: () => getEraserRefs().eraserToggle,
    getNotesMenu,
    getNotesToggle,
    getPenCard: () => getPenRefs().penCard,
    getPenPanel: () => getPenRefs().penPanel,
    getPenToggle: () => getPenRefs().penToggle,
    getShapesMenu,
    getShapesToggle,
    updateShapeMenuActive: (...args) =>
      boardMainToolbar?.updateShapeMenuActive(...args),
  });

  boardMainToolbar = createBoardMainToolbarController({
    addItem: boardItemLifecycleApi.addItem,
    assignElements: ({
      boardToolbarDock: nextBoardToolbarDock,
      boardToolbarPanel: nextBoardToolbarPanel,
      notesMenu: nextNotesMenu,
      notesToggle: nextNotesToggle,
      shapesMenu: nextShapesMenu,
      shapesToggle: nextShapesToggle,
    }) => {
      setBoardToolbarDock(nextBoardToolbarDock);
      setBoardToolbarPanel(nextBoardToolbarPanel);
      setNotesMenu(nextNotesMenu);
      setNotesToggle(nextNotesToggle);
      setShapesMenu(nextShapesMenu);
      setShapesToggle(nextShapesToggle);
    },
    closeNotesMenu: boardToolbarPopupApi.closeNotesMenu,
    closeShapesMenu: boardToolbarPopupApi.closeShapesMenu,
    documentRef,
    getCurrentTool,
    getItemTitle,
    getNotesMenu,
    getNotesToggle,
    getShapesMenu,
    getShapesToggle,
    getText,
    itemTypeColors,
    setTool: boardShellApi.setTool,
    shapeToolLabels,
    shapeTools,
    syncToolbarPopupState: boardToolbarPopupApi.syncToolbarPopupState,
    toggleNotesMenu: boardToolbarPopupApi.toggleNotesMenu,
    toggleShapesMenu: boardToolbarPopupApi.toggleShapesMenu,
    windowRef,
  });

  const boardHelpControlsController = createBoardHelpControlsController({
    assignHelpElements: ({
      helpButton: nextHelpButton,
      helpControls: nextHelpControls,
      helpPanel: nextHelpPanel,
    }) => {
      setHelpButton(nextHelpButton);
      setHelpControls(nextHelpControls);
      setHelpPanel(nextHelpPanel);
    },
    closeHelpPanelRef: boardUiSetupApi.closeHelpPanel,
    documentRef,
    getHelpControls,
    getHelpButton,
    getHelpPanel,
    getText,
    windowRef,
  });

  const boardSettingsControls = createBoardSettingsControlsController({
    assignBackupElements: ({
      boardBackupButton,
      boardImportButton,
      boardImportFileInput,
    }) => {
      setBackupRefs({
        boardBackupButton,
        boardImportButton,
        boardImportFileInput,
      });
    },
    assignInputElements: ({
      autosaveToggle,
      clearButton,
      clearModal,
      clearModalCancelButton,
      clearModalConfirmButton,
      redoButton,
      saveButton,
      undoButton,
    }) => {
      setInputRefs({
        autosaveToggle,
        clearButton,
        clearModal,
        clearModalCancelButton,
        clearModalConfirmButton,
        redoButton,
        saveButton,
        undoButton,
      });
    },
    clearBoard: boardLifecycleApi.clearBoard,
    documentRef,
    exportBoardBackup: boardPersistenceApi.exportBoardBackup,
    getAutosaveToggle,
    getClearModal,
    getText,
    handleBoardImport: boardPersistenceApi.handleBoardImport,
    redoBoard: boardShellApi.redoBoard,
    saveAutosavePreference: boardPersistenceApi.saveAutosavePreference,
    saveBoardState: boardPersistenceApi.saveBoardState,
    setAutosaveState: boardPersistenceApi.setAutosaveState,
    undoBoard: boardShellApi.undoBoard,
    updateHistoryButtons: boardShellApi.updateHistoryButtons,
    windowRef,
  });

  const boardInkControls = createBoardInkControlsController({
    closeEraserPanel: boardToolbarPopupApi.closeEraserPanel,
    closePenPanel: boardToolbarPopupApi.closePenPanel,
    documentRef,
    getBoardSettings,
    getEraserRefs,
    getPenRefs,
    getText,
    scheduleSave: boardPersistenceApi.scheduleSave,
    setEraserPanelState: boardToolbarPopupApi.setEraserPanelState,
    setEraserRefs,
    setEraserSizePreview: boardUiPreview.setEraserSizePreview,
    setPenOpacityIconPreview: boardUiPreview.setPenOpacityIconPreview,
    setPenOpacityPreview: boardUiPreview.setPenOpacityPreview,
    setPenPanelState: boardToolbarPopupApi.setPenPanelState,
    setPenRefs,
    setPenSizeIconPreview: boardUiPreview.setPenSizeIconPreview,
    setPenStrokeWidthPreview: boardUiPreview.setPenStrokeWidthPreview,
    shapeStrokeColorPresets,
    syncShapeColorMenu: boardUiPreview.syncShapeColorMenu,
    updateEraserCursorSize: boardCursorApi.updateEraserCursorSize,
    updatePenCursorStyle: boardCursorApi.updatePenCursorStyle,
    windowRef,
  });

  return {
    boardHelpControlsController,
    boardInkControls,
    boardMainToolbar,
    boardSettingsControls,
    boardToolbarPopup,
  };
}
