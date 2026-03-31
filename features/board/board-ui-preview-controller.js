import { colorsMatch } from "./board-color-utils.js";
import { clamp } from "./board-geometry.js";

export function createBoardUiPreviewController({
  getEraserRefs,
  getPenRefs,
  getShapeStrokeWidthButton,
  setShapeStrokeWidthPreview,
}) {
  function setShapeColorButtonSwatch(button, color, { none = false } = {}) {
    if (!button) return;
    const swatch = button.querySelector(".board-shape-color-swatch");
    if (!swatch) return;
    const displayColor = color || "#ffffff";
    swatch.style.setProperty("--shape-color", displayColor);
    swatch.classList.toggle("is-none", none);
  }

  function syncShapeColorMenu(menu, value) {
    if (!menu) return;
    const target = value || "";
    const options = menu.querySelectorAll(".board-shape-color-option");
    options.forEach((option) => {
      const optionColor = option.getAttribute("data-color") || "";
      let isActive = false;
      if (target === "" && optionColor === "") {
        isActive = true;
      } else if (target && optionColor && colorsMatch(optionColor, target)) {
        isActive = true;
      }
      option.classList.toggle("is-selected", isActive);
      option.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  function syncShapeSizeMenu(menu, value) {
    if (!menu) return;
    const numeric = Number(value);
    const options = menu.querySelectorAll(".board-shape-size-option");
    options.forEach((option) => {
      const optionValue = Number(option.getAttribute("data-size"));
      const isActive =
        Number.isFinite(numeric) &&
        Number.isFinite(optionValue) &&
        optionValue === numeric;
      option.classList.toggle("is-selected", isActive);
      option.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  function setStrokeWidthPreview(size) {
    setShapeStrokeWidthPreview(getShapeStrokeWidthButton(), size);
  }

  function setPenStrokeWidthPreview(size) {
    const { penSizeInput, penSizeValue } = getPenRefs();
    if (!penSizeInput || !penSizeValue) return;
    const numeric = Number(size);
    if (!Number.isFinite(numeric)) return;
    const rounded = Math.round(numeric);
    penSizeInput.value = String(rounded);
    penSizeValue.textContent = String(rounded);
  }

  function setPenOpacityPreview(opacity) {
    const { penOpacityInput, penOpacityValue } = getPenRefs();
    if (!penOpacityInput || !penOpacityValue) return;
    const numeric = Number(opacity);
    if (!Number.isFinite(numeric)) return;
    const percent = clamp(numeric, 0, 1) * 100;
    const rounded = Math.round(percent);
    penOpacityInput.value = String(rounded);
    penOpacityValue.textContent = String(rounded);
  }

  function setPenSizeIconPreview(size, color) {
    const { penSizeIcon, penSizeInput } = getPenRefs();
    if (!penSizeIcon) return;
    const numeric = Number(size);
    if (!Number.isFinite(numeric)) return;
    const max = (penSizeInput && Number(penSizeInput.max)) || 18;
    const scale = max > 0 ? clamp(numeric / max, 0, 1) : 0;
    penSizeIcon.style.setProperty("--pen-preview-scale", `${scale}`);
    penSizeIcon.style.setProperty("--pen-preview-opacity", "1");
    if (color) {
      penSizeIcon.style.setProperty("--pen-preview-color", color);
    }
  }

  function setPenOpacityIconPreview(opacity, color) {
    const { penOpacityIcon } = getPenRefs();
    if (!penOpacityIcon) return;
    const numeric = Number(opacity);
    if (!Number.isFinite(numeric)) return;
    const safe = clamp(numeric, 0, 1);
    penOpacityIcon.style.setProperty("--pen-preview-scale", "0.65");
    penOpacityIcon.style.setProperty("--pen-preview-opacity", `${safe}`);
    if (color) {
      penOpacityIcon.style.setProperty("--pen-preview-color", color);
    }
  }

  function setEraserSizePreview(size) {
    const { eraserSizeIcon, eraserSizeInput } = getEraserRefs();
    if (!eraserSizeIcon) return;
    const numeric = Number(size);
    if (!Number.isFinite(numeric)) return;
    const max = (eraserSizeInput && Number(eraserSizeInput.max)) || 64;
    const scale = clamp(numeric / max, 0, 1);
    eraserSizeIcon.style.setProperty("--eraser-preview-scale", `${scale}`);
  }

  return {
    setEraserSizePreview,
    setPenOpacityIconPreview,
    setPenOpacityPreview,
    setPenSizeIconPreview,
    setPenStrokeWidthPreview,
    setShapeColorButtonSwatch,
    setStrokeWidthPreview,
    syncShapeColorMenu,
    syncShapeSizeMenu,
  };
}
