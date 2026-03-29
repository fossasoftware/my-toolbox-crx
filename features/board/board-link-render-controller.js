import { LINK_TYPE_ITEM, LINK_TYPE_SHAPE } from "./board-config.js";
import { syncLinkControlsState } from "./board-link-controls-ui.js";
import {
  getLinkRenderPoints as getResolvedLinkRenderPoints,
  updateLinkPreviewFromState as syncLinkPreviewFromState,
} from "./board-link-preview.js";
import {
  clearLinkPreviewLine as removeLinkPreviewLine,
  getLinkSvgZoom as getSafeLinkSvgZoom,
  renderBoardLinks,
  updateLinkPreviewLine as syncLinkPreviewLine,
} from "./board-link-svg.js";

export function getBoardLinkEndpointType(link, side) {
  const type = link?.[`${side}Type`];
  return type || LINK_TYPE_ITEM;
}

export function boardLinkEndpointExists(link, side, { items, strokes }) {
  const id = link?.[`${side}Id`];
  if (!id) return false;

  const type = getBoardLinkEndpointType(link, side);
  if (type === LINK_TYPE_ITEM) {
    return items.some((item) => item?.id === id);
  }
  if (type === LINK_TYPE_SHAPE) {
    return strokes.some((stroke) => stroke?.id === id && stroke.shapeType);
  }
  return false;
}

export function shouldPersistUnresolvedBoardLink(link, { items, strokes }) {
  return (
    boardLinkEndpointExists(link, "from", { items, strokes }) &&
    boardLinkEndpointExists(link, "to", { items, strokes })
  );
}

export function getPersistedBoardLinks(links, validLinks, { items, strokes }) {
  const validLinkIds = new Set(validLinks.map((link) => link.id));
  return links.filter(
    (link) =>
      validLinkIds.has(link.id) ||
      shouldPersistUnresolvedBoardLink(link, { items, strokes })
  );
}

export function createBoardLinkRenderController({
  getBoardItems,
  clearLinkPopup,
  closeLinkEditor,
  createLinkLabelElement,
  getBoardLinks,
  getBoardStrokes,
  getCurrentTool,
  getEndpointDataFromEndpoint,
  getLinkEndpointData,
  getLinkHoverTarget,
  getItemElements,
  getLastLinkClickId,
  getLastLinkClickTime,
  getLinkAnchorPoint,
  getLinkColorOptions,
  getLinkControlsRefs,
  getLinkDefaultColor,
  getLinkEditingId,
  getLinkGapForEndpoint,
  getLinkPreviewLine,
  getLinkPreviewPoint,
  getLinkSource,
  getLinkStyleOptions,
  getLinkUpdateRaf,
  getLinksSvg,
  getOffsetLinkPoint,
  getSelectedLinkId,
  getStage,
  getViewPan,
  getZoom,
  hideLinkControls,
  isSameLinkEndpoint,
  linkDoubleClickDelay,
  linkStyleDashDot,
  linkStyleDashed,
  linkStyleDotted,
  linkStyleSolid,
  linkTool,
  positionLinkControls,
  positionLinkEditorFromPoints,
  pushHistorySnapshot,
  redrawCanvas,
  scheduleHistoryCommit,
  scheduleSave,
  selectLink,
  setBoardLinks,
  setLastLinkClickId,
  setLastLinkClickTime,
  setLinkPreviewLine,
  setLinkUpdateRaf,
  setSelectedLinkId,
  showLinkControls,
  startLinkTextEditing,
  syncShapeColorMenu,
  setShapeColorButtonSwatch,
  toolSelect,
}) {
  function clearLinkPreviewLine() {
    setLinkPreviewLine(removeLinkPreviewLine(getLinkPreviewLine()));
  }

  function updateLinkPreviewLine(from, to) {
    setLinkPreviewLine(
      syncLinkPreviewLine({
        linksSvg: getLinksSvg(),
        linkPreviewLine: getLinkPreviewLine(),
        from,
        to,
        zoom: getSafeLinkSvgZoom(getZoom()),
      })
    );
  }

  function getLinkRenderPoints(link, stageRect) {
    return getResolvedLinkRenderPoints({
      link,
      stageRect,
      getLinkEndpointData,
      itemElements: getItemElements(),
      strokes: getBoardStrokes(),
      zoom: getZoom(),
      pan: getViewPan(),
      getLinkAnchorPoint,
      getLinkGapForEndpoint,
      offsetLinkPoint: getOffsetLinkPoint(),
    });
  }

  function updateLinkPreviewFromState() {
    syncLinkPreviewFromState({
      stage: getStage(),
      linkSource: getLinkSource(),
      linkHoverTarget: getLinkHoverTarget(),
      linkPreviewPoint: getLinkPreviewPoint(),
      getEndpointDataFromEndpoint,
      itemElements: getItemElements(),
      strokes: getBoardStrokes(),
      zoom: getZoom(),
      pan: getViewPan(),
      isSameLinkEndpoint,
      getLinkAnchorPoint,
      getLinkGapForEndpoint,
      offsetLinkPoint: getOffsetLinkPoint(),
      clearLinkPreviewLine,
      updateLinkPreviewLine,
    });
  }

  function scheduleLinkUpdate() {
    if (getLinkUpdateRaf()) return;
    setLinkUpdateRaf(
      requestAnimationFrame(() => {
        setLinkUpdateRaf(null);
        updateLinks();
      })
    );
  }

  function getSelectedLink() {
    const selectedLinkId = getSelectedLinkId();
    if (!selectedLinkId) return null;
    return getBoardLinks().find((link) => link.id === selectedLinkId) || null;
  }

  function applyLinkStyleChoice(style) {
    const link = getSelectedLink();
    if (!link) return;
    if (
      ![
        linkStyleSolid,
        linkStyleDashed,
        linkStyleDotted,
        linkStyleDashDot,
      ].includes(style)
    ) {
      return;
    }
    link.style = style;
    scheduleSave();
    scheduleHistoryCommit();
    syncLinkControls();
    updateLinks();
  }

  function applyLinkColorChoice(color) {
    const link = getSelectedLink();
    if (!link || !color) return;
    link.color = color;
    scheduleSave();
    scheduleHistoryCommit();
    syncLinkControls();
    updateLinks();
  }

  function syncLinkControls() {
    const refs = getLinkControlsRefs();
    syncLinkControlsState({
      link: getSelectedLink(),
      linkStyleButton: refs.linkStyleButton,
      linkColorButton: refs.linkColorButton,
      linkColorMenu: refs.linkColorMenu,
      linkStyleOptions: getLinkStyleOptions(),
      linkColorOptions: getLinkColorOptions(),
      getDefaultColor: getLinkDefaultColor,
      setShapeColorButtonSwatch,
      syncShapeColorMenu,
    });
  }

  function handleLinkPointerDown(event, link) {
    const currentTool = getCurrentTool();
    if (currentTool !== toolSelect && currentTool !== linkTool) return;
    if (!link?.id) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const now = performance.now();
    const isDoubleClick =
      getLastLinkClickId() === link.id &&
      now - getLastLinkClickTime() <= linkDoubleClickDelay;

    setLastLinkClickId(link.id);
    setLastLinkClickTime(now);

    selectLink(link.id);

    if (isDoubleClick) {
      startLinkTextEditing(link);
      setLastLinkClickId(null);
      setLastLinkClickTime(0);
    }
  }

  function updateLinks() {
    const linksSvg = getLinksSvg();
    const stage = getStage();
    if (!linksSvg || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width < 2 || stageRect.height < 2) {
      return;
    }
    const selectedLinkId = getSelectedLinkId();
    const boardLinks = getBoardLinks();
    const { validLinks, selectedLinkPoints, selectedLink } = renderBoardLinks({
      links: boardLinks,
      linksSvg,
      selectedLinkId,
      linkEditingId: getLinkEditingId(),
      zoom: getSafeLinkSvgZoom(getZoom()),
      getLinkRenderPoints: (link) => getLinkRenderPoints(link, stageRect),
      createLinkLabelElement,
      positionLinkEditorFromPoints,
      handleLinkPointerDown,
    });
    const persistedLinks = getPersistedBoardLinks(boardLinks, validLinks, {
      items: getBoardItems(),
      strokes: getBoardStrokes(),
    });
    if (persistedLinks.length !== boardLinks.length) {
      setBoardLinks(persistedLinks);
      scheduleSave();
    }
    if (selectedLinkId && selectedLinkPoints) {
      showLinkControls();
      positionLinkControls(
        selectedLinkPoints.from,
        selectedLinkPoints.to,
        selectedLink
      );
    } else if (selectedLinkId && !selectedLinkPoints) {
      clearLinkPopup();
    }
  }

  function removeLink(id) {
    setBoardLinks(getBoardLinks().filter((link) => link.id !== id));
    if (getSelectedLinkId() === id) {
      setSelectedLinkId(null);
      hideLinkControls();
      syncLinkControls();
      redrawCanvas();
    }
    if (getLinkEditingId() === id) {
      closeLinkEditor();
    }
    updateLinks();
    scheduleSave();
    pushHistorySnapshot();
  }

  return {
    applyLinkColorChoice,
    applyLinkStyleChoice,
    clearLinkPreviewLine,
    getLinkRenderPoints,
    getSelectedLink,
    handleLinkPointerDown,
    removeLink,
    scheduleLinkUpdate,
    syncLinkControls,
    updateLinkPreviewFromState,
    updateLinkPreviewLine,
    updateLinks,
  };
}
