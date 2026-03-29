export function createBoardShapeEditorController({
  getCtx,
  getShapeById,
  getShapeBounds,
  getShapeEditor,
  getShapeEditingId,
  getShapeFontFamily,
  getShapeTextColor,
  getShapeTextSize,
  getWrapShapeTextLines,
  getDefaultShapeSize,
  setShapeEditingId,
  toolLine,
  redrawCanvas,
  scheduleHistoryCommit,
  scheduleSave,
}) {
  let shapeEditorOriginalText = "";

  function syncShapeEditorEmptyState() {
    const shapeEditor = getShapeEditor();
    if (!shapeEditor) return;
    const value = shapeEditor.textContent || "";
    const isEmpty = value.trim().length === 0;
    shapeEditor.classList.toggle("is-empty", isEmpty);
  }

  function positionShapeEditor(shape) {
    const shapeEditor = getShapeEditor();
    if (!shapeEditor || !shape?.start || !shape?.end) return;

    if (shape.shapeType === toolLine) {
      const dx = shape.end.x - shape.start.x;
      const dy = shape.end.y - shape.start.y;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length < 1) return;

      const fontSize = getShapeTextSize(shape);
      const lineHeight = Math.round(fontSize * 1.3);
      const padding = 10;
      let lineCount = 1;
      const ctx = getCtx();
      if (ctx) {
        ctx.font = `${fontSize}px ${getShapeFontFamily()}`;
        const maxWidth = Math.max(1, length - padding * 2);
        const lines = getWrapShapeTextLines(shape.text || "", maxWidth);
        if (lines.length) {
          lineCount = lines.length;
        }
      }

      const width = Math.max(1, length);
      const height = Math.max(lineHeight, lineCount * lineHeight + padding * 2);
      const midX = (shape.start.x + shape.end.x) / 2;
      const midY = (shape.start.y + shape.end.y) / 2;
      let nx = -dy / length;
      let ny = dx / length;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const strokeSize = Number(shape.size) || getDefaultShapeSize() || 4;
      const offset = Math.max(8, strokeSize / 2 + 4);
      const anchorX = midX + nx * (offset + height / 2);
      const anchorY = midY + ny * (offset + height / 2);
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
      }
      shapeEditor.style.left = `${anchorX}px`;
      shapeEditor.style.top = `${anchorY}px`;
      shapeEditor.style.width = `${width}px`;
      shapeEditor.style.height = `${height}px`;
      shapeEditor.style.setProperty("--shape-editor-height", `${height}px`);
      shapeEditor.style.color = getShapeTextColor(shape);
      shapeEditor.style.fontSize = `${fontSize}px`;
      shapeEditor.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
      shapeEditor.style.transformOrigin = "center";
      return;
    }

    shapeEditor.style.transform = "";
    shapeEditor.style.transformOrigin = "";
    const bounds = getShapeBounds(shape.start, shape.end);
    if (!bounds) return;
    const minWidth = 40;
    const minHeight = 24;
    const width = Math.max(minWidth, bounds.width);
    const height = Math.max(minHeight, bounds.height);
    const left = bounds.x + (bounds.width - width) / 2;
    const top = bounds.y + (bounds.height - height) / 2;
    shapeEditor.style.left = `${left}px`;
    shapeEditor.style.top = `${top}px`;
    shapeEditor.style.width = `${width}px`;
    shapeEditor.style.height = `${height}px`;
    shapeEditor.style.setProperty("--shape-editor-height", `${height}px`);
    shapeEditor.style.color = getShapeTextColor(shape);
    shapeEditor.style.fontSize = `${getShapeTextSize(shape)}px`;
  }

  function startShapeTextEditing(shape) {
    const shapeEditor = getShapeEditor();
    if (!shapeEditor || !shape?.id) return;
    setShapeEditingId(shape.id);
    shapeEditorOriginalText = shape.text || "";
    shapeEditor.textContent = shapeEditorOriginalText;
    shapeEditor.classList.add("is-active");
    shapeEditor.setAttribute("aria-hidden", "false");
    syncShapeEditorEmptyState();
    positionShapeEditor(shape);
    redrawCanvas();
    requestAnimationFrame(() => {
      shapeEditor.focus();
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(shapeEditor);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  function syncShapeEditorPosition() {
    const shapeEditingId = getShapeEditingId();
    const shapeEditor = getShapeEditor();
    if (!shapeEditingId || !shapeEditor) return;
    const shape = getShapeById(shapeEditingId);
    if (!shape) {
      closeShapeEditor();
      return;
    }
    positionShapeEditor(shape);
  }

  function updateShapeTextFromEditor() {
    const shapeEditingId = getShapeEditingId();
    const shapeEditor = getShapeEditor();
    if (!shapeEditingId || !shapeEditor) return;
    const shape = getShapeById(shapeEditingId);
    if (!shape) return;
    syncShapeEditorEmptyState();
    const nextText = shapeEditor.textContent
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+$/, "");
    if (nextText) {
      shape.text = nextText;
    } else {
      delete shape.text;
    }
    positionShapeEditor(shape);
    scheduleSave();
    scheduleHistoryCommit();
  }

  function closeShapeEditor() {
    const shapeEditor = getShapeEditor();
    if (!shapeEditor) return;
    setShapeEditingId(null);
    shapeEditorOriginalText = "";
    shapeEditor.classList.remove("is-active");
    shapeEditor.classList.remove("is-empty");
    shapeEditor.setAttribute("aria-hidden", "true");
    redrawCanvas();
  }

  function commitShapeTextEditing() {
    if (!getShapeEditingId() || !getShapeEditor()) return;
    updateShapeTextFromEditor();
    closeShapeEditor();
  }

  function cancelShapeTextEditing() {
    const shapeEditingId = getShapeEditingId();
    const shapeEditor = getShapeEditor();
    if (!shapeEditingId || !shapeEditor) return;
    const shape = getShapeById(shapeEditingId);
    if (shape) {
      if (shapeEditorOriginalText) {
        shape.text = shapeEditorOriginalText;
      } else {
        delete shape.text;
      }
      scheduleSave();
      scheduleHistoryCommit();
    }
    closeShapeEditor();
  }

  return {
    cancelShapeTextEditing,
    closeShapeEditor,
    commitShapeTextEditing,
    positionShapeEditor,
    startShapeTextEditing,
    syncShapeEditorEmptyState,
    syncShapeEditorPosition,
    updateShapeTextFromEditor,
  };
}
