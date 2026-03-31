import {
  getBoundsOverlayPosition,
  getPointOverlayPosition,
} from "./board-ui-positioning.js";
import { syncOverlayDuringTransition } from "./board-overlay-transition.js";

export function createBoardLinkPopupController({
  getBoardZoom,
  getLinkControls,
  getLinkRenderPoints,
  getLinkSelectionBounds,
  getSelectedLink,
  getSelectedLinkId,
  getStage,
  getViewPan,
  clearLinkSelection,
  clearOtherSelections,
  closeLinkMenus,
  hideLinkControls,
  isLinkingModeActive,
  redrawCanvas,
  scheduleLinkUpdate,
  setSelectedLinkId,
  showLinkControls,
  syncLinkControls,
}) {
  let linkControlsTransitionRaf = null;
  let linkControlsTransitionUntil = 0;

  function clearLinkPopup() {
    if (!getSelectedLinkId()) {
      hideLinkControls();
      closeLinkMenus();
      return;
    }
    setSelectedLinkId(null);
    hideLinkControls();
    closeLinkMenus();
    syncLinkControls();
    scheduleLinkUpdate();
    redrawCanvas();
  }

  function selectLink(linkId) {
    if (!linkId) return;
    if (isLinkingModeActive()) {
      clearLinkSelection();
    }
    clearOtherSelections();
    closeLinkMenus();
    setSelectedLinkId(linkId);
    showLinkControls();
    updateLinkControlsPosition();
    syncLinkControls();
    scheduleLinkUpdate();
    redrawCanvas();
  }

  function positionLinkControls(from, to, link) {
    const linkControls = getLinkControls();
    const stage = getStage();
    if (!linkControls || !stage || !from || !to) return;

    const stageRect = stage.getBoundingClientRect();
    const controlsRect = linkControls.getBoundingClientRect();
    const bounds = link ? getLinkSelectionBounds(link, from, to) : null;
    const zoom = getBoardZoom();
    const pan = getViewPan();
    const position = bounds
      ? getBoundsOverlayPosition({
          containerRect: stageRect,
          overlayRect: controlsRect,
          bounds,
          zoom,
          pan,
          offset: 8,
        })
      : getPointOverlayPosition({
          containerRect: stageRect,
          overlayRect: controlsRect,
          point: {
            x: ((from.x + to.x) / 2) * zoom + pan.x,
            y: ((from.y + to.y) / 2) * zoom + pan.y,
          },
          offset: 8,
        });
    if (!position) return;

    linkControls.style.left = `${position.left}px`;
    linkControls.style.top = `${position.top}px`;
  }

  function updateLinkControlsPosition() {
    const selectedLinkId = getSelectedLinkId();
    const stage = getStage();
    if (!selectedLinkId || !stage) {
      hideLinkControls();
      return;
    }
    const link = getSelectedLink();
    if (!link) {
      clearLinkPopup();
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const points = getLinkRenderPoints(link, stageRect);
    if (!points) {
      hideLinkControls();
      return;
    }
    showLinkControls();
    positionLinkControls(points.from, points.to, link);
  }

  function syncLinkControlsDuringTransition(duration = 260) {
    syncOverlayDuringTransition({
      duration,
      getRafId: () => linkControlsTransitionRaf,
      setRafId: (value) => {
        linkControlsTransitionRaf = value;
      },
      getTransitionUntil: () => linkControlsTransitionUntil,
      setTransitionUntil: (value) => {
        linkControlsTransitionUntil = value;
      },
      shouldContinue: () => {
        const linkControls = getLinkControls();
        return Boolean(linkControls?.classList.contains("is-visible"));
      },
      onFrame: () => {
        updateLinkControlsPosition();
      },
    });
  }

  return {
    clearLinkPopup,
    positionLinkControls,
    selectLink,
    syncLinkControlsDuringTransition,
    updateLinkControlsPosition,
  };
}
