import {
  closeItemMenu as closeManagedItemMenu,
  openItemMenu as openManagedItemMenu,
} from "./board-item-menu-controller.js";
import { getItemMenuPosition as getFloatingItemMenuPosition } from "./board-ui-positioning.js";

export function createBoardItemMenuShellController({
  getBoardItems,
  getItemMenu,
  getStage,
  getTargetId,
  itemMenuOffset,
  setTargetId,
  syncItemMenuSelection,
  syncItemMenuTextOptions,
}) {
  function getMenuItem() {
    const targetId = getTargetId();
    if (!targetId) return null;
    return getBoardItems().find((entry) => entry.id === targetId) || null;
  }

  function positionItemMenu(clientX, clientY) {
    const itemMenu = getItemMenu();
    const stage = getStage();
    if (!itemMenu || !stage) return;
    const position = getFloatingItemMenuPosition({
      containerRect: stage.getBoundingClientRect(),
      menuRect: itemMenu.getBoundingClientRect(),
      clientX,
      clientY,
      offset: itemMenuOffset,
    });
    if (!position) return;
    itemMenu.style.left = `${position.left}px`;
    itemMenu.style.top = `${position.top}px`;
  }

  function openItemMenu(item, event) {
    openManagedItemMenu({
      item,
      event,
      itemMenu: getItemMenu(),
      setMenuTargetId: setTargetId,
      syncItemMenuSelection,
      syncItemMenuTextOptions,
      positionItemMenu,
    });
  }

  function closeItemMenu() {
    closeManagedItemMenu({
      itemMenu: getItemMenu(),
      clearMenuTargetId: () => {
        setTargetId(null);
      },
    });
  }

  return {
    closeItemMenu,
    getMenuItem,
    openItemMenu,
    positionItemMenu,
  };
}
