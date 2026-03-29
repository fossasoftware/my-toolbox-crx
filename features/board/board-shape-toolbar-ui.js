function setAriaHidden(element, hidden) {
  if (!element) return;
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function setShapeToolbarVisibility(refs, visible) {
  const { shapeControls, shapeCard, shapeToolbar, shapeDeleteButton } = refs;
  if (shapeControls) {
    shapeControls.classList.toggle("is-visible", visible);
    shapeControls.setAttribute("aria-hidden", visible ? "false" : "true");
  }
  setAriaHidden(shapeCard, !visible);
  setAriaHidden(shapeToolbar, !visible);
  setAriaHidden(shapeDeleteButton, !visible);
}

export function syncShapeToolbarUi({
  currentTool,
  selectTool,
  shapes,
  selectedStrokeCount,
  selectedItemCount,
  shapeToolbarPinned,
  refs,
  settings,
  lineTool,
  defaultStrokeColor,
  helpers,
}) {
  const { closeShapeColorMenus, syncShapePaletteVisibility } = helpers;

  if (!refs.shapeControls) {
    return { visible: false, usePinnedToolbar: false };
  }

  const shouldHide =
    currentTool !== selectTool ||
    !shapes.length ||
    shapes.length > 1 ||
    selectedStrokeCount > 1 ||
    selectedItemCount > 0;

  if (shouldHide) {
    setShapeToolbarVisibility(refs, false);
    closeShapeColorMenus();
    return { visible: false, usePinnedToolbar: false };
  }

  setShapeToolbarVisibility(refs, true);

  const usePinnedToolbar = shapeToolbarPinned || shapes.length > 1;
  const primary = shapes[0];
  const hasFillable = shapes.some((shape) => shape.shapeType !== lineTool);

  if (refs.shapeFillButton) {
    refs.shapeFillButton.disabled = !hasFillable;
    refs.shapeFillButton.setAttribute(
      "aria-disabled",
      !hasFillable ? "true" : "false"
    );
    const fillValue = primary.fillColor || "";
    helpers.setShapeColorButtonSwatch(refs.shapeFillButton, fillValue, {
      none: fillValue === "",
    });
    helpers.syncShapeColorMenu(refs.shapeFillMenu, fillValue);
    if (!hasFillable) {
      helpers.setShapeColorMenuState(
        refs.shapeFillButton,
        refs.shapeFillMenu,
        false
      );
    }
  }

  if (refs.shapeStrokeButton) {
    const strokeColor =
      primary.color || settings.color || defaultStrokeColor;
    helpers.setShapeColorButtonSwatch(refs.shapeStrokeButton, strokeColor);
    helpers.syncShapeColorMenu(refs.shapeStrokeMenu, strokeColor);
  }

  if (refs.shapeStrokeWidthButton) {
    const width = Number(primary.size) || Number(settings.size);
    if (Number.isFinite(width)) {
      helpers.setStrokeWidthPreview(width);
      helpers.syncShapeSizeMenu(refs.shapeStrokeWidthMenu, width);
    }
  }

  if (refs.shapeTextButton) {
    const canEditText = shapes.length === 1 && !usePinnedToolbar;
    refs.shapeTextButton.disabled = !canEditText;
    refs.shapeTextButton.setAttribute(
      "aria-hidden",
      canEditText ? "false" : "true"
    );
    refs.shapeTextButton.style.display = canEditText ? "" : "none";
  }

  if (refs.shapeLinkButton) {
    const canLink = shapes.length === 1 && !usePinnedToolbar;
    refs.shapeLinkButton.disabled = !canLink;
    refs.shapeLinkButton.setAttribute(
      "aria-hidden",
      canLink ? "false" : "true"
    );
    refs.shapeLinkButton.style.display = canLink ? "" : "none";
  }

  syncShapePaletteVisibility();
  return { visible: true, usePinnedToolbar };
}
