import { parseColorToRgb } from "./board-color-utils.js";

export function createBoardCursorController({
  getCurrentTool,
  getDefaultColor,
  getDrawColor,
  getDrawOpacity,
  getDrawSize,
  getEraserCursor,
  getEraserSize,
  getPenCursor,
  getStage,
  getViewPan,
  getBoardZoom,
  getWorldPoint,
  toolDraw,
  toolErase,
}) {
  // The pen/eraser cursor elements are children of #boardViewport, which is
  // transformed by translate(pan) scale(zoom). To render under the real
  // pointer at any zoom/pan we must position them in WORLD coordinates — the
  // viewport transform then maps them back onto the pointer. Using raw
  // screen-relative coordinates double-applies the transform and the cursor
  // drifts away from the ink (which is drawn in world space on the canvas).
  function getStageRelativePoint(input) {
    const stage = getStage();
    if (!stage || !input) {
      return null;
    }

    if (
      Number.isFinite(input.clientX) &&
      Number.isFinite(input.clientY) &&
      typeof getWorldPoint === "function"
    ) {
      return getWorldPoint(input.clientX, input.clientY);
    }

    if (Number.isFinite(input.x) && Number.isFinite(input.y)) {
      // input.x/y are stage-relative screen coordinates; convert to world.
      const zoom = (typeof getBoardZoom === "function" && getBoardZoom()) || 1;
      const pan =
        (typeof getViewPan === "function" && getViewPan()) || { x: 0, y: 0 };
      return {
        x: (input.x - pan.x) / zoom,
        y: (input.y - pan.y) / zoom,
      };
    }

    return null;
  }

  function showPenCursor() {
    const penCursor = getPenCursor();
    if (!penCursor) return;
    penCursor.classList.add("is-visible");
  }

  function hidePenCursor() {
    const penCursor = getPenCursor();
    if (!penCursor) return;
    penCursor.classList.remove("is-visible");
  }

  function updatePenCursorStyle() {
    const penCursor = getPenCursor();
    if (!penCursor) return;
    const size = Math.max(1, Number(getDrawSize()) || 1);
    penCursor.style.width = `${size}px`;
    penCursor.style.height = `${size}px`;
    const color = getDrawColor() || getDefaultColor();
    const rawOpacity = Number(getDrawOpacity());
    const opacity =
      Number.isFinite(rawOpacity) && rawOpacity >= 0 && rawOpacity <= 1
        ? rawOpacity
        : 1;
    const rgb = parseColorToRgb(color) || { r: 13, g: 24, b: 28 };
    const fill = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    penCursor.style.backgroundColor = fill;
    penCursor.style.borderColor = fill;
  }

  function updateEraserCursorSize() {
    const eraserCursor = getEraserCursor();
    if (!eraserCursor) return;
    const size = Math.max(1, Number(getEraserSize()) || Number(getDrawSize()) || 1);
    eraserCursor.style.width = `${size}px`;
    eraserCursor.style.height = `${size}px`;
  }

  function showEraserCursor() {
    const eraserCursor = getEraserCursor();
    if (!eraserCursor) return;
    updateEraserCursorSize();
    eraserCursor.classList.add("is-visible");
  }

  function hideEraserCursor() {
    const eraserCursor = getEraserCursor();
    if (!eraserCursor) return;
    eraserCursor.classList.remove("is-visible");
  }

  function updateEraserCursor(input, rectOverride = null) {
    const eraserCursor = getEraserCursor();
    if (!eraserCursor || getCurrentTool() !== toolErase || !getStage()) return;
    const point = getStageRelativePoint(input);
    if (!point) return;
    eraserCursor.style.left = `${point.x}px`;
    eraserCursor.style.top = `${point.y}px`;
    showEraserCursor();
  }

  function updatePenCursor(input, rectOverride = null) {
    const penCursor = getPenCursor();
    if (!penCursor || getCurrentTool() !== toolDraw || !getStage()) return;
    const point = getStageRelativePoint(input);
    if (!point) return;
    penCursor.style.left = `${point.x}px`;
    penCursor.style.top = `${point.y}px`;
    showPenCursor();
  }

  return {
    hideEraserCursor,
    hidePenCursor,
    showEraserCursor,
    showPenCursor,
    updateEraserCursor,
    updateEraserCursorSize,
    updatePenCursor,
    updatePenCursorStyle,
  };
}
