export function createBoardLinkInteractionController({
  createLinkId,
  getBoardLinks,
  getCurrentTool,
  getLinkDragActive,
  getLinkHoverTarget,
  getLinkPreviewPoint,
  getLinkSource,
  getStage,
  setLinkDragActive,
  setLinkHoverTarget,
  setLinkPreviewPoint,
  setLinkSource,
  clearLinkItemHighlight,
  updateLinkItemHighlight,
  redrawCanvas,
  getWorldPointFromClient,
  updateLinkPreviewFromState,
  clearLinkPreviewLine,
  updateLinks,
  scheduleSave,
  pushHistorySnapshot,
  makeLinkEndpoint,
  findLinkableShapeAtPoint,
  isSameLinkEndpoint,
  isLinkBetweenEndpoints,
  linkTypeItem,
  linkTypeShape,
  toolLink,
}) {
  function setSource(endpoint) {
    setLinkSource(endpoint);
    if (!endpoint) return;
    clearLinkItemHighlight("source");
    if (endpoint.type === linkTypeItem) {
      updateLinkItemHighlight("source", endpoint.id);
    } else if (endpoint.type === linkTypeShape) {
      redrawCanvas();
    }
  }

  function isLinkingModeActive() {
    return getCurrentTool() === toolLink || getLinkDragActive() || Boolean(getLinkSource());
  }

  function updateLinkModeClass() {
    const stage = getStage();
    if (!stage) return;
    stage.classList.toggle("board-mode-link", isLinkingModeActive());
  }

  function startLinkFromToolbar(endpoint, event) {
    if (!endpoint?.id) return;
    const source = getLinkSource();
    if (source && isSameLinkEndpoint(source, endpoint)) {
      clearLinkSelection();
      updateLinkModeClass();
      return;
    }
    if (source) {
      clearLinkSelection();
    }
    setSource(endpoint);
    setLinkDragActive(true);
    if (event) {
      setLinkPreviewPoint(getWorldPointFromClient(event.clientX, event.clientY));
    }
    updateLinkHoverTarget(endpoint);
    updateLinkPreviewFromState();
    updateLinkModeClass();
  }

  function handleLinkSelection(endpoint, event) {
    if (!endpoint?.id) return;
    const source = getLinkSource();
    if (!source) {
      setSource(endpoint);
      setLinkDragActive(true);
      if (event) {
        if (event.target?.setPointerCapture) {
          event.target.setPointerCapture(event.pointerId);
        }
        setLinkPreviewPoint(getWorldPointFromClient(event.clientX, event.clientY));
        updateLinkHoverTarget(endpoint);
        updateLinkPreviewFromState();
      }
      return;
    }
    if (isSameLinkEndpoint(source, endpoint)) {
      clearLinkSelection();
      return;
    }
    createLinkBetween(source, endpoint);
    clearLinkSelection();
    updateLinks();
  }

  function clearLinkSelection() {
    const source = getLinkSource();
    if (!source) {
      clearLinkHoverTarget();
      clearLinkPreviewLine();
      setLinkPreviewPoint(null);
      setLinkDragActive(false);
      updateLinkModeClass();
      return;
    }
    clearLinkItemHighlight("source");
    setLinkSource(null);
    if (source.type === linkTypeShape) {
      redrawCanvas();
    }
    setLinkDragActive(false);
    setLinkPreviewPoint(null);
    clearLinkPreviewLine();
    clearLinkHoverTarget();
    clearLinkItemHighlight("hover");
    updateLinkModeClass();
  }

  function createLinkBetween(first, second) {
    if (!first?.id || !second?.id) return false;
    const links = getBoardLinks();
    const linkExists = links.some((link) =>
      isLinkBetweenEndpoints(link, first, second)
    );
    if (linkExists) return false;
    links.push({
      id: createLinkId(),
      fromId: first.id,
      toId: second.id,
      fromType: first.type,
      toType: second.type,
    });
    scheduleSave();
    pushHistorySnapshot();
    return true;
  }

  function getLinkEndpointFromEvent(event) {
    if (!event) return null;
    const itemElement = event.target.closest?.(".board-item");
    if (itemElement?.dataset?.id) {
      return makeLinkEndpoint(linkTypeItem, itemElement.dataset.id);
    }
    if (!getStage()) return null;
    const point = getWorldPointFromClient(event.clientX, event.clientY);
    const shape = findLinkableShapeAtPoint(point);
    if (shape?.id) {
      return makeLinkEndpoint(linkTypeShape, shape.id);
    }
    return null;
  }

  function updateLinkHoverTarget(endpoint) {
    let next = endpoint || null;
    const source = getLinkSource();
    if (next && source && isSameLinkEndpoint(next, source)) {
      next = null;
    }
    const prev = getLinkHoverTarget();
    if (prev?.type === linkTypeItem && (!next || next.id !== prev.id)) {
      clearLinkItemHighlight("hover");
    }
    if (next?.type === linkTypeItem) {
      updateLinkItemHighlight("hover", next.id);
    }
    setLinkHoverTarget(next);
    const shapeChanged =
      (prev?.type === linkTypeShape || next?.type === linkTypeShape) &&
      (!prev || !next || prev.id !== next.id);
    if (shapeChanged) {
      redrawCanvas();
    }
  }

  function clearLinkHoverTarget() {
    updateLinkHoverTarget(null);
  }

  function finishLinkDrag() {
    if (!getLinkDragActive()) return;
    setLinkDragActive(false);
    const source = getLinkSource();
    const hoverTarget = getLinkHoverTarget();
    if (
      source &&
      hoverTarget &&
      !isSameLinkEndpoint(source, hoverTarget)
    ) {
      createLinkBetween(source, hoverTarget);
      clearLinkSelection();
      updateLinks();
      return;
    }
    if (getCurrentTool() !== toolLink) {
      clearLinkSelection();
      return;
    }
    clearLinkHoverTarget();
    setLinkPreviewPoint(null);
    clearLinkPreviewLine();
    updateLinkModeClass();
  }

  return {
    clearLinkHoverTarget,
    clearLinkSelection,
    createLinkBetween,
    finishLinkDrag,
    getLinkEndpointFromEvent,
    handleLinkSelection,
    isLinkingModeActive,
    setLinkSource: setSource,
    startLinkFromToolbar,
    updateLinkHoverTarget,
    updateLinkModeClass,
  };
}
