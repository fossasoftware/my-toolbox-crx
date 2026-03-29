import { ERASER_SIZE_MAX, ERASER_SIZE_MIN } from "./board-config.js";

export function createBoardInkControlsController({
  closeEraserPanel,
  closePenPanel,
  documentRef,
  getBoardSettings,
  getEraserRefs,
  getPenRefs,
  getText,
  scheduleSave,
  setEraserPanelState,
  setEraserRefs,
  setPenPanelState,
  setPenRefs,
  setEraserSizePreview,
  setPenOpacityIconPreview,
  setPenOpacityPreview,
  setPenSizeIconPreview,
  setPenStrokeWidthPreview,
  shapeStrokeColorPresets,
  syncShapeColorMenu,
  updateEraserCursorSize,
  updatePenCursorStyle,
  windowRef,
}) {
  function clampOpacity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.min(1, Math.max(0, numeric));
  }

  function clampEraserSize(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return ERASER_SIZE_MIN;
    }
    return Math.min(ERASER_SIZE_MAX, Math.max(ERASER_SIZE_MIN, Math.round(numeric)));
  }

  function buildPenColorOptions() {
    const { penColors } = getPenRefs();
    if (!penColors || !Array.isArray(shapeStrokeColorPresets)) return;

    penColors.innerHTML = "";
    shapeStrokeColorPresets.forEach((preset) => {
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className = "board-shape-color-option";
      option.setAttribute("role", "radio");
      option.setAttribute("aria-checked", "false");
      option.setAttribute("data-color", preset.value);
      option.setAttribute("aria-label", getText(preset.label));
      const dot = documentRef.createElement("span");
      dot.className = "board-shape-color-dot";
      dot.style.setProperty("--shape-color", preset.value || "#ffffff");
      option.appendChild(dot);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyPenColorChoice(preset.value);
      });
      penColors.appendChild(option);
    });
  }

  function syncPenControls() {
    const settings = getBoardSettings();
    const color =
      settings.color || shapeStrokeColorPresets[0]?.value || "#0d181c";
    const size = Number(settings.size) || 4;
    const opacity = Number(settings.opacity);
    const { penColors } = getPenRefs();

    if (penColors) {
      syncShapeColorMenu(penColors, color);
    }
    setPenStrokeWidthPreview(size);
    setPenOpacityPreview(Number.isFinite(opacity) ? opacity : 1);
    setPenSizeIconPreview(size, color);
    setPenOpacityIconPreview(Number.isFinite(opacity) ? opacity : 1, color);
    updatePenCursorStyle();
  }

  function syncEraserControls() {
    const { eraserSizeInput, eraserSizeValue } = getEraserRefs();
    if (!eraserSizeInput || !eraserSizeValue) return;

    const settings = getBoardSettings();
    const size = Number(settings.eraserSize);
    const rounded = clampEraserSize(size);
    settings.eraserSize = rounded;
    eraserSizeInput.value = String(rounded);
    eraserSizeValue.textContent = String(rounded);
    setEraserSizePreview(rounded);
  }

  function applyPenColorChoice(color) {
    if (!color) return;
    getBoardSettings().color = color;
    syncPenControls();
    scheduleSave();
  }

  function applyPenSizeChoice(size) {
    if (!Number.isFinite(size)) return;
    getBoardSettings().size = size;
    updateEraserCursorSize();
    syncPenControls();
    scheduleSave();
  }

  function applyPenOpacityChoice(opacity) {
    if (!Number.isFinite(opacity)) return;
    getBoardSettings().opacity = clampOpacity(opacity);
    syncPenControls();
    scheduleSave();
  }

  function applyEraserSizeChoice(size) {
    getBoardSettings().eraserSize = clampEraserSize(size);
    updateEraserCursorSize();
    syncEraserControls();
    scheduleSave();
  }

  function setupPenMenu() {
    setPenRefs({
      penCard: documentRef.getElementById("boardPenCard"),
      penColors: documentRef.getElementById("boardPenColors"),
      penOpacityIcon: documentRef.getElementById("boardPenOpacityIcon"),
      penOpacityInput: documentRef.getElementById("boardPenOpacity"),
      penOpacityValue: documentRef.getElementById("boardPenOpacityValue"),
      penPanel: documentRef.getElementById("boardPenPanel"),
      penSizeIcon: documentRef.getElementById("boardPenSizeIcon"),
      penSizeInput: documentRef.getElementById("boardPenSize"),
      penSizeValue: documentRef.getElementById("boardPenSizeValue"),
      penToggle: documentRef.getElementById("boardPenToggle"),
    });

    const {
      penColors,
      penOpacityInput,
      penPanel,
      penSizeInput,
      penToggle,
    } = getPenRefs();
    if (!penToggle || !penPanel) return;

    penToggle.setAttribute("aria-label", getText("boardToolDraw"));
    penToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = penPanel.classList.contains("is-open");
      setPenPanelState(!isOpen);
    });

    penPanel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    penPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    if (penColors) {
      penColors.setAttribute("aria-label", getText("boardStrokeColor"));
      buildPenColorOptions();
    }

    if (penSizeInput) {
      penSizeInput.setAttribute("aria-label", getText("boardStrokeSize"));
      penSizeInput.addEventListener("input", () => {
        const size = Math.round(Number(penSizeInput.value) || 4);
        applyPenSizeChoice(size);
      });
    }

    if (penOpacityInput) {
      penOpacityInput.setAttribute("aria-label", getText("boardPenOpacity"));
      penOpacityInput.addEventListener("input", () => {
        const rawValue = Math.round(Number(penOpacityInput.value) || 0);
        const next = Number.isFinite(rawValue) ? rawValue / 100 : 1;
        applyPenOpacityChoice(next);
      });
    }

    documentRef.addEventListener("pointerdown", (event) => {
      const { penPanel: activePanel, penToggle: activeToggle } = getPenRefs();
      if (!activePanel || !activeToggle) return;
      if (activePanel.contains(event.target) || activeToggle.contains(event.target)) {
        return;
      }
      closePenPanel();
    });

    windowRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePenPanel();
      }
    });

    syncPenControls();
  }

  function setupEraserMenu() {
    setEraserRefs({
      eraserCard: documentRef.getElementById("boardEraserCard"),
      eraserPanel: documentRef.getElementById("boardEraserPanel"),
      eraserSizeIcon: documentRef.getElementById("boardEraserSizeIcon"),
      eraserSizeInput: documentRef.getElementById("boardEraserSize"),
      eraserSizeValue: documentRef.getElementById("boardEraserSizeValue"),
      eraserToggle: documentRef.getElementById("boardEraserToggle"),
    });

    const { eraserPanel, eraserSizeInput, eraserToggle } = getEraserRefs();
    if (!eraserToggle || !eraserPanel) return;

    eraserToggle.setAttribute("aria-label", getText("boardToolErase"));
    eraserToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = eraserPanel.classList.contains("is-open");
      setEraserPanelState(!isOpen);
    });

    eraserPanel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    eraserPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    if (eraserSizeInput) {
      eraserSizeInput.min = String(ERASER_SIZE_MIN);
      eraserSizeInput.max = String(ERASER_SIZE_MAX);
      eraserSizeInput.setAttribute("aria-label", getText("boardStrokeSize"));
      eraserSizeInput.addEventListener("input", () => {
        const size = clampEraserSize(eraserSizeInput.value);
        applyEraserSizeChoice(size);
      });
    }

    documentRef.addEventListener("pointerdown", (event) => {
      const {
        eraserPanel: activePanel,
        eraserToggle: activeToggle,
      } = getEraserRefs();
      if (!activePanel || !activeToggle) return;
      if (
        activePanel.contains(event.target) ||
        activeToggle.contains(event.target)
      ) {
        return;
      }
      closeEraserPanel();
    });

    windowRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeEraserPanel();
      }
    });

    syncEraserControls();
  }

  return {
    applyEraserSizeChoice,
    applyPenColorChoice,
    applyPenOpacityChoice,
    applyPenSizeChoice,
    buildPenColorOptions,
    setupEraserMenu,
    setupPenMenu,
    syncEraserControls,
    syncPenControls,
  };
}
