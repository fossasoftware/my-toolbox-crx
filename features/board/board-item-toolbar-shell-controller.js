import {
  closeItemToolbarMenus as closeItemToolbarMenusController,
  hideItemToolbar as hideItemToolbarController,
  positionItemToolbar as positionItemToolbarController,
  showItemToolbar as showItemToolbarController,
} from "./board-item-toolbar-controller.js";
import {
  scheduleOverlayFrame,
  syncOverlayDuringTransition as syncOverlayDuringTransitionLoop,
} from "./board-overlay-transition.js";

export function createBoardItemToolbarShellController({
  documentRef,
  getActiveItemToolbarId,
  getBoardItems,
  getItemControls,
  getItemToolbars,
  getStage,
  getViewPan,
  getZoom,
  setActiveItemToolbarId,
  syncItemToolbar,
}) {
  let itemToolbarRaf = null;
  let itemToolbarTransitionRaf = null;
  let itemToolbarTransitionUntil = 0;

  function closeItemToolbarMenus() {
    closeItemToolbarMenusController(documentRef);
    scheduleItemToolbarUpdate();
    syncItemToolbarDuringTransition();
  }

  function getActiveItemForToolbar() {
    const activeId = getActiveItemToolbarId();
    if (!activeId) return null;
    return getBoardItems().find((entry) => entry.id === activeId) || null;
  }

  function showItemToolbar(item) {
    showItemToolbarController({
      itemControls: getItemControls(),
      itemToolbars: getItemToolbars(),
      item,
      setActiveItemToolbarId,
      syncItemToolbar,
      scheduleItemToolbarUpdate,
    });
  }

  function hideItemToolbar() {
    hideItemToolbarController({
      itemControls: getItemControls(),
      closeItemToolbarMenus,
    });
  }

  function positionItemToolbar(item) {
    positionItemToolbarController({
      itemControls: getItemControls(),
      stage: getStage(),
      item,
      zoom: getZoom(),
      pan: getViewPan(),
    });
  }

  function scheduleItemToolbarUpdate() {
    scheduleOverlayFrame({
      getRafId: () => itemToolbarRaf,
      setRafId: (value) => {
        itemToolbarRaf = value;
      },
      shouldSchedule: () => Boolean(getItemControls()),
      onFrame: () => {
        if (!getItemControls()?.classList.contains("is-visible")) return;
        const item = getActiveItemForToolbar();
        if (!item) return;
        positionItemToolbar(item);
      },
    });
  }

  function syncItemToolbarDuringTransition(duration = 260) {
    syncOverlayDuringTransitionLoop({
      duration,
      getRafId: () => itemToolbarTransitionRaf,
      setRafId: (value) => {
        itemToolbarTransitionRaf = value;
      },
      getTransitionUntil: () => itemToolbarTransitionUntil,
      setTransitionUntil: (value) => {
        itemToolbarTransitionUntil = value;
      },
      shouldContinue: () =>
        Boolean(getItemControls()?.classList.contains("is-visible")) &&
        Boolean(getActiveItemForToolbar()),
      onFrame: () => {
        const item = getActiveItemForToolbar();
        if (!item) return;
        positionItemToolbar(item);
      },
    });
  }

  return {
    closeItemToolbarMenus,
    getActiveItemForToolbar,
    hideItemToolbar,
    positionItemToolbar,
    scheduleItemToolbarUpdate,
    showItemToolbar,
    syncItemToolbarDuringTransition,
  };
}
