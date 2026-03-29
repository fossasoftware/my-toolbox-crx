import {
  LINK_BASE_HIT_WIDTH,
  LINK_BASE_STROKE_WIDTH,
  LINK_STYLE_DASH_DOT,
  LINK_STYLE_DASHED,
  LINK_STYLE_DOTTED,
} from "./board-config.js";

export function getLinkSvgZoom(boardZoom) {
  const zoom = Number(boardZoom);
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
}

export function toLinkSvgPoint(point, zoom = 1) {
  return {
    x: point.x * zoom,
    y: point.y * zoom,
  };
}

export function clearRenderedLinkElements(linksSvg) {
  if (!linksSvg) return;

  linksSvg
    .querySelectorAll(".board-link, .board-link-hit, .board-link-label")
    .forEach((line) => {
      if (line.classList.contains("board-link-preview")) return;
      line.remove();
    });
}

function ensureLinkPreviewLine(linksSvg, linkPreviewLine) {
  if (!linksSvg) return null;
  if (linkPreviewLine) return linkPreviewLine;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.classList.add("board-link", "board-link-preview");
  linksSvg.appendChild(line);
  return line;
}

export function clearLinkPreviewLine(linkPreviewLine) {
  if (linkPreviewLine) {
    linkPreviewLine.remove();
  }
  return null;
}

export function updateLinkPreviewLine({
  linksSvg,
  linkPreviewLine,
  from,
  to,
  zoom,
}) {
  const line = ensureLinkPreviewLine(linksSvg, linkPreviewLine);
  if (!line || !from || !to) return line;

  const scaledFrom = toLinkSvgPoint(from, zoom);
  const scaledTo = toLinkSvgPoint(to, zoom);
  line.setAttribute("x1", scaledFrom.x);
  line.setAttribute("y1", scaledFrom.y);
  line.setAttribute("x2", scaledTo.x);
  line.setAttribute("y2", scaledTo.y);
  line.style.strokeWidth = `${LINK_BASE_STROKE_WIDTH * zoom}px`;
  line.style.strokeDasharray = `${8 * zoom} ${6 * zoom}`;

  if (linksSvg) {
    linksSvg.appendChild(line);
  }

  return line;
}

function applyLinkDashStyle(line, style, zoom) {
  if (style === LINK_STYLE_DASHED) {
    line.style.strokeDasharray = `${8 * zoom} ${6 * zoom}`;
    return;
  }
  if (style === LINK_STYLE_DOTTED) {
    line.style.strokeDasharray = `${2 * zoom} ${6 * zoom}`;
    return;
  }
  if (style === LINK_STYLE_DASH_DOT) {
    line.style.strokeDasharray = `${8 * zoom} ${4 * zoom} ${2 * zoom} ${4 * zoom}`;
    return;
  }
  line.style.removeProperty("stroke-dasharray");
}

function createLinkSvgElements({
  link,
  from,
  to,
  zoom,
  selected,
  handleLinkPointerDown,
}) {
  const scaledFrom = toLinkSvgPoint(from, zoom);
  const scaledTo = toLinkSvgPoint(to, zoom);
  const x1 = scaledFrom.x;
  const y1 = scaledFrom.y;
  const x2 = scaledTo.x;
  const y2 = scaledTo.y;

  const onPointerDown = (event) => {
    handleLinkPointerDown(event, link);
  };

  const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  hitLine.classList.add("board-link-hit");
  hitLine.dataset.id = link.id;
  hitLine.setAttribute("x1", x1);
  hitLine.setAttribute("y1", y1);
  hitLine.setAttribute("x2", x2);
  hitLine.setAttribute("y2", y2);
  hitLine.style.strokeWidth = `${LINK_BASE_HIT_WIDTH * zoom}px`;
  hitLine.addEventListener("pointerdown", onPointerDown);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.classList.add("board-link");
  line.dataset.id = link.id;
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.style.strokeWidth = `${LINK_BASE_STROKE_WIDTH * zoom}px`;
  if (link.color) {
    line.style.stroke = link.color;
  }
  applyLinkDashStyle(line, link.style, zoom);
  if (selected) {
    line.classList.add("is-selected");
  }
  line.addEventListener("pointerdown", onPointerDown);

  return { hitLine, line };
}

export function renderBoardLinks({
  links,
  linksSvg,
  selectedLinkId,
  linkEditingId,
  zoom,
  getLinkRenderPoints,
  createLinkLabelElement,
  positionLinkEditorFromPoints,
  handleLinkPointerDown,
}) {
  clearRenderedLinkElements(linksSvg);

  const validLinks = [];
  let selectedLinkPoints = null;
  let selectedLink = null;

  links.forEach((link) => {
    const points = getLinkRenderPoints(link);
    if (!points) return;

    const { from, to } = points;
    validLinks.push(link);

    const selected = selectedLinkId === link.id;
    const { hitLine, line } = createLinkSvgElements({
      link,
      from,
      to,
      zoom,
      selected,
      handleLinkPointerDown,
    });

    if (selected) {
      selectedLinkPoints = { from, to };
      selectedLink = link;
    }

    linksSvg.appendChild(hitLine);
    linksSvg.appendChild(line);

    if (linkEditingId === link.id) {
      positionLinkEditorFromPoints(link, from, to);
      return;
    }

    const label = createLinkLabelElement(link, from, to);
    if (!label) return;

    label.addEventListener("pointerdown", (event) => {
      handleLinkPointerDown(event, link);
    });
    linksSvg.appendChild(label);
  });

  return {
    validLinks,
    selectedLinkPoints,
    selectedLink,
  };
}
