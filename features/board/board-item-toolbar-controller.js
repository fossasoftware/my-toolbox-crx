import { getBoundsOverlayPosition } from "./board-ui-positioning.js";

export function closeItemToolbarMenus(documentRef) {
  documentRef.querySelectorAll(".board-item-toolbar-card").forEach((card) => {
    const palette = card.querySelector(".board-item-toolbar-palette");
    card
      .querySelectorAll(".board-item-color-menu, .board-item-size-menu")
      .forEach((menu) => {
        menu.classList.remove("is-open");
        menu.setAttribute("aria-hidden", "true");
      });
    card
      .querySelectorAll(".board-item-color-button, .board-item-size-button")
      .forEach((button) => {
        button.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      });
    if (palette) {
      palette.classList.remove("is-open");
      palette.setAttribute("aria-hidden", "true");
    }
    card.classList.remove("is-expanded");
  });
}

export function showItemToolbar({
  itemControls,
  itemToolbars,
  item,
  setActiveItemToolbarId,
  syncItemToolbar,
  scheduleItemToolbarUpdate,
}) {
  if (!itemControls || !item) return;

  const toolbar = itemToolbars.get(item.id);
  if (!toolbar) return;

  if (!itemControls.contains(toolbar)) {
    itemControls.innerHTML = "";
    itemControls.appendChild(toolbar);
  }

  setActiveItemToolbarId(item.id);
  itemControls.classList.add("is-visible");
  itemControls.setAttribute("aria-hidden", "false");
  syncItemToolbar(item);
  scheduleItemToolbarUpdate();
}

export function hideItemToolbar({ itemControls, closeItemToolbarMenus }) {
  if (!itemControls) return;

  itemControls.classList.remove("is-visible");
  itemControls.setAttribute("aria-hidden", "true");
  closeItemToolbarMenus();
}

export function positionItemToolbar({
  itemControls,
  stage,
  item,
  zoom,
  pan,
}) {
  if (!itemControls || !stage || !item) return;

  const position = getBoundsOverlayPosition({
    containerRect: stage.getBoundingClientRect(),
    overlayRect: itemControls.getBoundingClientRect(),
    bounds: {
      x: Number(item.x) || 0,
      y: Number(item.y) || 0,
      width: Math.max(1, Number(item.width) || 0),
      height: Math.max(1, Number(item.height) || 0),
    },
    zoom,
    pan,
    offset: 8,
  });
  if (!position) return;

  itemControls.style.left = `${position.left}px`;
  itemControls.style.top = `${position.top}px`;
}
