import {
  getBottomCenteredOverlayPosition,
  getBoundsOverlayPosition,
} from "./board-ui-positioning.js";
import {
  scheduleOverlayFrame,
  syncOverlayDuringTransition as syncOverlayDuringTransitionLoop,
} from "./board-overlay-transition.js";
import { syncShapeToolbarUi } from "./board-shape-toolbar-ui.js";

export function createBoardShapeToolbarController({
  defaultStrokeColor,
  getBoardSettings,
  getBoardZoom,
  getCurrentTool,
  getRefs,
  getSelectedItemIds,
  getSelectedStrokeCount,
  getSelectedShapeTargets,
  getShapeSelectionBoundsForToolbar,
  getShapeToolbarPinned,
  getTransitionUntil,
  getViewPan,
  getScheduleRafId,
  getTransitionRafId,
  lineTool,
  selectTool,
  setScheduleRafId,
  setShapeColorButtonSwatch,
  setShapeColorMenuState,
  setStrokeWidthPreview,
  setTransitionRafId,
  setTransitionUntil,
  syncShapeColorMenu,
  syncShapeEditorPosition,
  syncShapePaletteVisibility,
  syncShapeSizeMenu,
  closeShapeColorMenus,
}) {
  function positionShapeToolbarAtBottom() {
    const { helpControls, shapeControls, stage, zoomControls } = getRefs();
    if (!shapeControls || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const controlsRect = shapeControls.getBoundingClientRect();
    // The toolbar band moved to the top, but zoom (bottom-right) and help
    // (bottom-left) still float over the stage bottom — avoid both.
    const blockerRects = [];
    if (zoomControls) {
      blockerRects.push(zoomControls.getBoundingClientRect());
    }
    if (helpControls) {
      blockerRects.push(helpControls.getBoundingClientRect());
    }
    const position = getBottomCenteredOverlayPosition({
      containerRect: stageRect,
      overlayRect: controlsRect,
      offset: 12,
      blockerRects,
    });
    if (!position) return;
    shapeControls.style.left = `${position.left}px`;
    shapeControls.style.top = `${position.top}px`;
  }

  function positionShapeToolbar(bounds) {
    const { shapeControls, stage } = getRefs();
    if (!shapeControls || !stage || !bounds) return;
    const stageRect = stage.getBoundingClientRect();
    const controlsRect = shapeControls.getBoundingClientRect();
    const position = getBoundsOverlayPosition({
      containerRect: stageRect,
      overlayRect: controlsRect,
      bounds,
      zoom: getBoardZoom(),
      pan: getViewPan(),
      offset: 8,
    });
    if (!position) return;
    shapeControls.style.left = `${position.left}px`;
    shapeControls.style.top = `${position.top}px`;
  }

  function syncShapeToolbar() {
    const shapes = getSelectedShapeTargets();
    const refs = getRefs();
    const toolbarState = syncShapeToolbarUi({
      currentTool: getCurrentTool(),
      selectTool,
      shapes,
      selectedStrokeCount: getSelectedStrokeCount(),
      selectedItemCount: getSelectedItemIds().size,
      shapeToolbarPinned: getShapeToolbarPinned(),
      refs: {
        shapeControls: refs.shapeControls,
        shapeCard: refs.shapeCard,
        shapeToolbar: refs.shapeToolbar,
        shapeDeleteButton: refs.shapeDeleteButton,
        shapeFillButton: refs.shapeFillButton,
        shapeFillMenu: refs.shapeFillMenu,
        shapeStrokeButton: refs.shapeStrokeButton,
        shapeStrokeMenu: refs.shapeStrokeMenu,
        shapeStrokeWidthButton: refs.shapeStrokeWidthButton,
        shapeStrokeWidthMenu: refs.shapeStrokeWidthMenu,
        shapeTextButton: refs.shapeTextButton,
        shapeLinkButton: refs.shapeLinkButton,
      },
      settings: getBoardSettings(),
      lineTool,
      defaultStrokeColor,
      helpers: {
        closeShapeColorMenus,
        setShapeColorButtonSwatch,
        syncShapeColorMenu,
        setShapeColorMenuState,
        setStrokeWidthPreview,
        syncShapeSizeMenu,
        syncShapePaletteVisibility,
      },
    });
    if (!toolbarState.visible) {
      return;
    }
    if (toolbarState.usePinnedToolbar) {
      positionShapeToolbarAtBottom();
    } else {
      const bounds = getShapeSelectionBoundsForToolbar(shapes);
      if (bounds) {
        positionShapeToolbar(bounds);
      }
    }
  }

  function scheduleShapeToolbarUpdate() {
    scheduleOverlayFrame({
      getRafId: getScheduleRafId,
      setRafId: setScheduleRafId,
      shouldSchedule: () => Boolean(getRefs().shapeControls),
      onFrame: () => {
        syncShapeToolbar();
        syncShapeEditorPosition();
      },
    });
  }

  function syncShapeToolbarDuringTransition(duration = 260) {
    syncOverlayDuringTransitionLoop({
      duration,
      getRafId: getTransitionRafId,
      setRafId: setTransitionRafId,
      getTransitionUntil,
      setTransitionUntil,
      shouldContinue: () =>
        Boolean(getRefs().shapeControls?.classList.contains("is-visible")) &&
        getSelectedShapeTargets().length > 0,
      onFrame: () => {
        const shapes = getSelectedShapeTargets();
        if (!shapes.length) return;
        const usePinnedToolbar = getShapeToolbarPinned() || shapes.length > 1;
        if (usePinnedToolbar) {
          positionShapeToolbarAtBottom();
        } else {
          const bounds = getShapeSelectionBoundsForToolbar(shapes);
          if (bounds) {
            positionShapeToolbar(bounds);
          }
        }
      },
    });
  }

  return {
    positionShapeToolbar,
    positionShapeToolbarAtBottom,
    scheduleShapeToolbarUpdate,
    syncShapeToolbar,
    syncShapeToolbarDuringTransition,
  };
}
