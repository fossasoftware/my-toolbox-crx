import {
  setupItemMenuController,
} from "./board-item-menu-controller.js";
import { setupBoardLinkControls } from "./board-link-controls-setup.js";
import { createBoardShapeToolbarSetup } from "./board-shape-toolbar-setup.js";

export function createBoardUiBootstrapController({
  documentRef,
  windowRef,
  getText,
  itemTypeColors,
  shapeFillPresets,
  shapeStrokeColorPresets,
  shapeStrokePresets,
  linkStylePresets,
  linkStyleDashed,
  linkStyleDotted,
  linkStyleDashDot,
  setItemMenuRefs,
  setItemMenuButtonRefs,
  setupItemMenuDeps,
  setShapeRefs,
  setShapeToolbarSetup,
  setupShapeToolbarDeps,
  setLinkRefs,
  setLinkControlsSetup,
  setLinkOptionRefs,
  setupLinkControlsDeps,
}) {
  function setupItemMenu() {
    const itemMenu = documentRef.getElementById("boardItemMenu");
    const itemControls = documentRef.getElementById("boardItemControls");
    setItemMenuRefs({ itemMenu, itemControls });
    const controller = setupItemMenuController({
      documentRef,
      windowRef,
      itemMenu,
      itemControls,
      itemTypeColors,
      ...setupItemMenuDeps,
    });
    setItemMenuButtonRefs(controller);
  }

  function setupShapeToolbar() {
    const refs = {
      shapeControls: documentRef.getElementById("boardShapeControls"),
      shapeCard: documentRef.getElementById("boardShapeCard"),
      shapePalette: documentRef.getElementById("boardShapePalette"),
      shapeToolbar: documentRef.getElementById("boardShapeToolbar"),
      shapeFillButton: documentRef.getElementById("boardShapeFillBtn"),
      shapeFillMenu: documentRef.getElementById("boardShapeFillMenu"),
      shapeStrokeButton: documentRef.getElementById("boardShapeStrokeBtn"),
      shapeStrokeMenu: documentRef.getElementById("boardShapeStrokeMenu"),
      shapeStrokeWidthButton: documentRef.getElementById("boardShapeStrokeWidthBtn"),
      shapeStrokeWidthMenu: documentRef.getElementById("boardShapeStrokeWidthMenu"),
      shapeLinkButton: documentRef.getElementById("boardShapeLinkBtn"),
      shapeTextButton: documentRef.getElementById("boardShapeTextBtn"),
      shapeDeleteButton: documentRef.getElementById("boardShapeDeleteBtn"),
      shapeEditor: documentRef.getElementById("boardShapeEditor"),
    };
    setShapeRefs(refs);
    const setup = createBoardShapeToolbarSetup({
      documentRef,
      getText,
      refs,
      shapeFillPresets,
      shapeStrokeColorPresets,
      shapeStrokePresets,
      ...setupShapeToolbarDeps,
    })({
      scheduleShapeToolbarUpdate: setupShapeToolbarDeps.scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition:
        setupShapeToolbarDeps.syncShapeToolbarDuringTransition,
    });
    setShapeToolbarSetup(setup);
  }

  function setupLinkControls() {
    const refs = {
      linkControls: documentRef.getElementById("boardLinkControls"),
      linkCard: documentRef.getElementById("boardLinkCard"),
      linkPalette: documentRef.getElementById("boardLinkPalette"),
      linkToolbar: documentRef.getElementById("boardLinkToolbar"),
      linkColorButton: documentRef.getElementById("boardLinkColorBtn"),
      linkColorMenu: documentRef.getElementById("boardLinkColorMenu"),
      linkStyleButton: documentRef.getElementById("boardLinkStyleBtn"),
      linkStyleMenu: documentRef.getElementById("boardLinkStyleMenu"),
      linkTextButton: documentRef.getElementById("boardLinkTextBtn"),
      linkDeleteButton: documentRef.getElementById("boardLinkDeleteBtn"),
      linkEditor: documentRef.getElementById("boardLinkEditor"),
    };
    setLinkRefs(refs);
    const setup = setupBoardLinkControls({
      documentRef,
      windowRef,
      getText,
      ...refs,
      shapeStrokeColorPresets,
      linkStylePresets,
      linkStyleDashed,
      linkStyleDotted,
      linkStyleDashDot,
      ...setupLinkControlsDeps,
    });
    setLinkControlsSetup(setup);
    setLinkOptionRefs({
      linkColorOptions: setup.linkColorOptions,
      linkStyleOptions: setup.linkStyleOptions,
    });
  }

  return {
    setupItemMenu,
    setupLinkControls,
    setupShapeToolbar,
  };
}
