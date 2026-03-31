export function createBoardLinkEditorController({
  getBoardLinks,
  getCtx,
  getDefaultTextSize,
  getFontFamily,
  getLinkEditor,
  getLinkEditingId,
  getLinkRenderPoints,
  getLinkTextColor,
  getStage,
  getWrapTextLines,
  setLinkEditingId,
  getLinkEditorLayout,
  linkGap,
  positionLinkEditorFromPointsRef,
  redrawCanvas,
  scheduleHistoryCommit,
  scheduleSave,
  updateLinks,
}) {
  let linkEditorOriginalText = "";

  function syncLinkEditorEmptyState() {
    const linkEditor = getLinkEditor();
    if (!linkEditor) return;
    const value = linkEditor.textContent || "";
    const isEmpty = value.trim().length === 0;
    linkEditor.classList.toggle("is-empty", isEmpty);
  }

  function positionLinkEditorFromPoints(link, from, to) {
    const linkEditor = getLinkEditor();
    if (!linkEditor || !link || !from || !to) return;
    const layout = getLinkEditorLayout({
      link,
      from,
      to,
      ctx: getCtx(),
      fontFamily: getFontFamily(),
      wrapTextLines: getWrapTextLines(),
      editorText: link.text || "",
      defaultTextSize: getDefaultTextSize(),
      linkGap,
    });
    if (!layout) return;

    linkEditor.style.left = `${layout.anchorX}px`;
    linkEditor.style.top = `${layout.anchorY}px`;
    linkEditor.style.width = `${layout.width}px`;
    linkEditor.style.height = `${layout.height}px`;
    linkEditor.style.setProperty("--shape-editor-height", `${layout.height}px`);
    linkEditor.style.color = getLinkTextColor(link);
    linkEditor.style.fontSize = `${layout.fontSize}px`;
    linkEditor.style.transform = `translate(-50%, -50%) rotate(${layout.angle}rad)`;
    linkEditor.style.transformOrigin = "center";
  }

  function positionLinkEditor(link) {
    const linkEditor = getLinkEditor();
    const stage = getStage();
    if (!linkEditor || !link?.id || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const points = getLinkRenderPoints(link, stageRect);
    if (!points) return;
    positionLinkEditorFromPointsRef(link, points.from, points.to);
  }

  function startLinkTextEditing(link) {
    const linkEditor = getLinkEditor();
    if (!linkEditor || !link?.id) return;
    setLinkEditingId(link.id);
    linkEditorOriginalText = link.text || "";
    linkEditor.textContent = linkEditorOriginalText;
    linkEditor.classList.add("is-active");
    linkEditor.setAttribute("aria-hidden", "false");
    syncLinkEditorEmptyState();
    positionLinkEditor(link);
    updateLinks();
    redrawCanvas();
    requestAnimationFrame(() => {
      linkEditor.focus();
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(linkEditor);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  function updateLinkTextFromEditor() {
    const linkEditingId = getLinkEditingId();
    const linkEditor = getLinkEditor();
    if (!linkEditingId || !linkEditor) return;
    const link = getBoardLinks().find((entry) => entry.id === linkEditingId);
    if (!link) return;

    syncLinkEditorEmptyState();
    const nextText = linkEditor.textContent
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+$/, "");
    if (nextText) {
      link.text = nextText;
    } else {
      delete link.text;
    }
    positionLinkEditor(link);
    scheduleSave();
    scheduleHistoryCommit();
    updateLinks();
    redrawCanvas();
  }

  function closeLinkEditor() {
    const linkEditor = getLinkEditor();
    if (!linkEditor) return;
    setLinkEditingId(null);
    linkEditorOriginalText = "";
    linkEditor.classList.remove("is-active");
    linkEditor.classList.remove("is-empty");
    linkEditor.setAttribute("aria-hidden", "true");
    updateLinks();
    redrawCanvas();
  }

  function commitLinkTextEditing() {
    if (!getLinkEditingId() || !getLinkEditor()) return;
    updateLinkTextFromEditor();
    closeLinkEditor();
  }

  function cancelLinkTextEditing() {
    const linkEditingId = getLinkEditingId();
    const linkEditor = getLinkEditor();
    if (!linkEditingId || !linkEditor) return;
    const link = getBoardLinks().find((entry) => entry.id === linkEditingId);
    if (link) {
      if (linkEditorOriginalText) {
        link.text = linkEditorOriginalText;
      } else {
        delete link.text;
      }
      scheduleSave();
      scheduleHistoryCommit();
    }
    closeLinkEditor();
  }

  return {
    cancelLinkTextEditing,
    closeLinkEditor,
    commitLinkTextEditing,
    positionLinkEditor,
    positionLinkEditorFromPoints,
    startLinkTextEditing,
    syncLinkEditorEmptyState,
    updateLinkTextFromEditor,
  };
}
