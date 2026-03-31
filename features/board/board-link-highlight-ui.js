import { ITEM_SELECTION_OUTSET, SELECTION_RADIUS } from "./board-config.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function ensureLinkItemSelectionElement({
  kind,
  itemSelectionLayer,
  selectionElement = null,
}) {
  if (selectionElement) return selectionElement;
  if (!itemSelectionLayer) return null;

  const element = document.createElementNS(SVG_NS, "svg");
  element.classList.add("board-item-selection", "board-item-link-selection");
  element.classList.add(kind === "source" ? "is-source" : "is-hover");
  element.setAttribute("aria-hidden", "true");

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.classList.add("board-item-link-selection-rect");
  rect.setAttribute("vector-effect", "non-scaling-stroke");
  element.appendChild(rect);

  itemSelectionLayer.appendChild(element);
  return element;
}

export function clearLinkItemHighlight(selectionElement = null) {
  selectionElement?.remove();
  return null;
}

export function syncLinkItemSelectionElement({
  selectionElement,
  item,
  itemElements,
}) {
  if (!selectionElement || !item) return selectionElement;

  const itemElement = itemElements?.get(item.id);
  const width = itemElement ? itemElement.offsetWidth : Number(item.width) || 0;
  const height = itemElement
    ? itemElement.offsetHeight
    : Number(item.height) || 0;
  const offset = ITEM_SELECTION_OUTSET;
  const totalWidth = Math.max(1, width + offset * 2);
  const totalHeight = Math.max(1, height + offset * 2);

  selectionElement.style.left = `${item.x - offset}px`;
  selectionElement.style.top = `${item.y - offset}px`;
  selectionElement.style.width = `${totalWidth}px`;
  selectionElement.style.height = `${totalHeight}px`;
  selectionElement.setAttribute("width", totalWidth);
  selectionElement.setAttribute("height", totalHeight);
  selectionElement.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

  const rect = selectionElement.querySelector("rect");
  if (rect) {
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", totalWidth);
    rect.setAttribute("height", totalHeight);
    rect.setAttribute("rx", SELECTION_RADIUS);
    rect.setAttribute("ry", SELECTION_RADIUS);
  }

  return selectionElement;
}

export function updateLinkItemHighlight({
  id,
  kind,
  items = [],
  itemElements,
  itemSelectionLayer,
  selectionElement = null,
}) {
  if (!id) {
    return clearLinkItemHighlight(selectionElement);
  }

  const item = items.find((entry) => entry.id === id);
  if (!item) {
    return clearLinkItemHighlight(selectionElement);
  }

  const nextSelectionElement = ensureLinkItemSelectionElement({
    kind,
    itemSelectionLayer,
    selectionElement,
  });
  if (!nextSelectionElement) return null;

  return syncLinkItemSelectionElement({
    selectionElement: nextSelectionElement,
    item,
    itemElements,
  });
}
