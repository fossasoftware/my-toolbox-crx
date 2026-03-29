import { setItemTextSizePreview } from "./board-item-toolbar-setup.js";

function getClosestPreset(activeSize, presets) {
  let closest = presets[0];
  presets.forEach((size) => {
    if (Math.abs(size - activeSize) < Math.abs(closest - activeSize)) {
      closest = size;
    }
  });
  return closest;
}

export function syncItemMenuSelection({
  item,
  itemMenuColorButtons,
  getItemColorKey,
}) {
  if (!itemMenuColorButtons.length) return;

  const activeKey = getItemColorKey(item);
  itemMenuColorButtons.forEach((button) => {
    const isActive = button.dataset.colorKey === activeKey;
    button.setAttribute("aria-checked", isActive ? "true" : "false");
    button.classList.toggle("is-selected", isActive);
  });
}

export function syncItemToolbar({
  item,
  itemToolbars,
  textSizePresets,
  getItemTextColor,
  getItemTextSize,
  setShapeColorButtonSwatch,
  syncShapeColorMenu,
  syncShapeSizeMenu,
}) {
  if (!item?.id) return;

  const toolbar = itemToolbars.get(item.id);
  if (!toolbar) return;

  const activeColor = getItemTextColor(item);
  const colorButton = toolbar.querySelector(".board-item-color-button");
  const colorMenu = toolbar.closest(".board-item-toolbar-card")?.querySelector(
    ".board-item-color-menu"
  );
  if (colorButton) {
    setShapeColorButtonSwatch(colorButton, activeColor);
  }
  if (colorMenu) {
    syncShapeColorMenu(colorMenu, activeColor);
  }

  const sizeButton = toolbar.querySelector(".board-item-size-button");
  const sizeMenu = toolbar.closest(".board-item-toolbar-card")?.querySelector(
    ".board-item-size-menu"
  );
  if (!sizeButton) return;

  const activeSize = getItemTextSize(item);
  const closest = getClosestPreset(activeSize, textSizePresets);
  setItemTextSizePreview(sizeButton, closest);
  if (sizeMenu) {
    syncShapeSizeMenu(sizeMenu, closest);
  }
}

export function syncItemMenuTextOptions({
  item,
  itemMenuTextColorButtons,
  itemMenuTextSizeButtons,
  getItemTextColor,
  getItemTextSize,
  colorsMatch,
}) {
  if (!item) return;

  if (itemMenuTextColorButtons.length) {
    const activeColor = getItemTextColor(item);
    itemMenuTextColorButtons.forEach((button) => {
      const color = button.dataset.textColor;
      const isActive = colorsMatch(color, activeColor);
      button.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  if (itemMenuTextSizeButtons.length) {
    const activeSize = getItemTextSize(item);
    itemMenuTextSizeButtons.forEach((button) => {
      const sizeValue = Number(button.dataset.textSize);
      const isActive =
        Number.isFinite(sizeValue) && sizeValue === Number(activeSize);
      button.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }
}
