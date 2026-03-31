import { LINK_TYPE_ITEM, LINK_TYPE_SHAPE } from "./board-config.js";
import { getShapeCenter } from "./board-link-geometry.js";

export function makeLinkEndpoint(type, id) {
  return { type, id };
}

export function getLinkType(type) {
  return type || LINK_TYPE_ITEM;
}

export function isSameLinkEndpoint(a, b) {
  return Boolean(a && b && a.type === b.type && a.id === b.id);
}

export function isLinkBetweenEndpoints(link, first, second) {
  if (!link || !first || !second) return false;

  const fromType = getLinkType(link.fromType);
  const toType = getLinkType(link.toType);
  return (
    (link.fromId === first.id &&
      fromType === first.type &&
      link.toId === second.id &&
      toType === second.type) ||
    (link.fromId === second.id &&
      fromType === second.type &&
      link.toId === first.id &&
      toType === first.type)
  );
}

export function linkHasEndpoint(link, type, id) {
  if (!link || !id || !type) return false;

  const fromType = getLinkType(link.fromType);
  const toType = getLinkType(link.toType);
  return (
    (link.fromId === id && fromType === type) ||
    (link.toId === id && toType === type)
  );
}

export function getItemWorldRect(element, stageRect, { zoom, pan }) {
  if (!element || !stageRect) return null;

  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left - stageRect.left - pan.x) / zoom,
    y: (rect.top - stageRect.top - pan.y) / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  };
}

function getItemEndpointData(id, stageRect, { itemElements, zoom, pan }) {
  const element = itemElements.get(id);
  if (!element) return null;

  const localRect = getItemWorldRect(element, stageRect, { zoom, pan });
  if (!localRect) return null;

  return {
    type: LINK_TYPE_ITEM,
    id,
    rect: localRect,
    center: {
      x: localRect.x + localRect.width / 2,
      y: localRect.y + localRect.height / 2,
    },
  };
}

function getShapeEndpointData(id, { strokes }) {
  const shape = strokes.find((stroke) => stroke?.id === id && stroke.shapeType);
  if (!shape) return null;

  const center = getShapeCenter(shape);
  if (!center) return null;
  return { type: LINK_TYPE_SHAPE, id, shape, center };
}

export function getEndpointDataFromEndpoint(
  endpoint,
  stageRect,
  { itemElements, strokes, zoom, pan }
) {
  if (!endpoint?.id) return null;

  const type = getLinkType(endpoint.type);
  if (type === LINK_TYPE_ITEM) {
    return getItemEndpointData(endpoint.id, stageRect, {
      itemElements,
      zoom,
      pan,
    });
  }
  if (type === LINK_TYPE_SHAPE) {
    return getShapeEndpointData(endpoint.id, { strokes });
  }
  return null;
}

export function getLinkEndpointData(
  link,
  side,
  stageRect,
  { itemElements, strokes, zoom, pan }
) {
  const id = link?.[`${side}Id`];
  if (!id) return null;

  const type = getLinkType(link?.[`${side}Type`]);
  if (type === LINK_TYPE_ITEM) {
    return getItemEndpointData(id, stageRect, {
      itemElements,
      zoom,
      pan,
    });
  }
  if (type === LINK_TYPE_SHAPE) {
    return getShapeEndpointData(id, { strokes });
  }
  return null;
}
