import {
  syncItemMenuSelection as syncItemMenuSelectionUi,
  syncItemMenuTextOptions as syncItemMenuTextOptionsUi,
  syncItemToolbar as syncItemToolbarUi,
} from "./board-item-ui.js";

export function createBoardItemStyleController({
  colorsMatch,
  getItemColorKey,
  getItemTextColor,
  getItemTextSize,
  getItemTitle,
  getRefs,
  itemTypeColors,
  scheduleHistoryCommit,
  scheduleSave,
  setShapeColorButtonSwatch,
  syncShapeColorMenu,
  syncShapeSizeMenu,
  textSizePresets,
  updateItemTextStyles,
  updateItemTitleElement,
  applyItemColorStyles,
}) {
  function applyItemColorChoice(item, colorKey) {
    if (!item) return;
    const color = itemTypeColors[colorKey];
    if (!color) return;
    if (colorKey === item.type) {
      delete item.color;
    } else {
      item.color = color;
    }
    item.title = getItemTitle(colorKey);
    updateItemTitleElement(item);
    const element = getRefs().itemElements.get(item.id);
    if (element) {
      const header = element.querySelector(".board-item-header");
      applyItemColorStyles(item, element, header);
    }
    scheduleSave();
    scheduleHistoryCommit();
  }

  function syncItemMenuSelection(item) {
    syncItemMenuSelectionUi({
      item,
      itemMenuColorButtons: getRefs().itemMenuColorButtons,
      getItemColorKey,
    });
  }

  function applyItemTextColorChoice(item, color) {
    if (!item || !color) return;
    item.textColor = color;
    updateItemTextStyles(item);
    scheduleSave();
    scheduleHistoryCommit();
    syncItemToolbar(item);
  }

  function applyItemTextSizeChoice(item, size) {
    if (!item || !Number.isFinite(size)) return;
    item.textSize = size;
    updateItemTextStyles(item);
    scheduleSave();
    scheduleHistoryCommit();
    syncItemToolbar(item);
  }

  function syncItemToolbar(item) {
    syncItemToolbarUi({
      item,
      itemToolbars: getRefs().itemToolbars,
      textSizePresets,
      getItemTextColor,
      getItemTextSize,
      setShapeColorButtonSwatch,
      syncShapeColorMenu,
      syncShapeSizeMenu,
    });
  }

  function syncItemMenuTextOptions(item) {
    syncItemMenuTextOptionsUi({
      item,
      itemMenuTextColorButtons: getRefs().itemMenuTextColorButtons,
      itemMenuTextSizeButtons: getRefs().itemMenuTextSizeButtons,
      getItemTextColor,
      getItemTextSize,
      colorsMatch,
    });
  }

  return {
    applyItemColorChoice,
    applyItemTextColorChoice,
    applyItemTextSizeChoice,
    syncItemMenuSelection,
    syncItemMenuTextOptions,
    syncItemToolbar,
  };
}
