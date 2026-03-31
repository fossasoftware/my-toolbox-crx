export function getLinkRenderPoints({
  link,
  stageRect,
  getLinkEndpointData,
  itemElements,
  strokes,
  zoom,
  pan,
  getLinkAnchorPoint,
  getLinkGapForEndpoint,
  offsetLinkPoint,
}) {
  if (!link || !stageRect) return null;

  const fromData = getLinkEndpointData(link, "from", stageRect, {
    itemElements,
    strokes,
    zoom,
    pan,
  });
  const toData = getLinkEndpointData(link, "to", stageRect, {
    itemElements,
    strokes,
    zoom,
    pan,
  });
  if (!fromData || !toData) return null;

  const fromAnchor =
    getLinkAnchorPoint(fromData, toData.center) || fromData.center;
  const toAnchor =
    getLinkAnchorPoint(toData, fromData.center) || toData.center;
  const from = offsetLinkPoint(fromAnchor, toAnchor, getLinkGapForEndpoint(fromData));
  const to = offsetLinkPoint(toAnchor, fromAnchor, getLinkGapForEndpoint(toData));
  if (!from || !to) return null;

  return { from, to, fromData, toData };
}

export function updateLinkPreviewFromState({
  stage,
  linkSource,
  linkHoverTarget,
  linkPreviewPoint,
  getEndpointDataFromEndpoint,
  itemElements,
  strokes,
  zoom,
  pan,
  isSameLinkEndpoint,
  getLinkAnchorPoint,
  getLinkGapForEndpoint,
  offsetLinkPoint,
  clearLinkPreviewLine,
  updateLinkPreviewLine,
}) {
  if (!stage || !linkSource || !linkPreviewPoint) {
    clearLinkPreviewLine();
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const sourceData = getEndpointDataFromEndpoint(linkSource, stageRect, {
    itemElements,
    strokes,
    zoom,
    pan,
  });
  if (!sourceData) {
    clearLinkPreviewLine();
    return;
  }

  let targetPoint = linkPreviewPoint;
  let hoverData = null;
  if (linkHoverTarget && !isSameLinkEndpoint(linkHoverTarget, linkSource)) {
    hoverData = getEndpointDataFromEndpoint(linkHoverTarget, stageRect, {
      itemElements,
      strokes,
      zoom,
      pan,
    });
    if (hoverData) {
      targetPoint =
        getLinkAnchorPoint(hoverData, sourceData.center) || hoverData.center;
    }
  }

  const fromAnchor =
    getLinkAnchorPoint(sourceData, targetPoint) || sourceData.center;
  const fromGap = getLinkGapForEndpoint(sourceData);
  const from = offsetLinkPoint(fromAnchor, targetPoint, fromGap);
  const to = hoverData
    ? offsetLinkPoint(targetPoint, fromAnchor, getLinkGapForEndpoint(hoverData))
    : targetPoint;

  updateLinkPreviewLine(from, to);
}
