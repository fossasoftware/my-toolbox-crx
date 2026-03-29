export function createBoardItemInteractionController({
  getActiveItemToolbarId,
  getBoardItems,
  getBoardZoom,
  getDraggingMixed,
  getItemElements,
  getLinkHoverTarget,
  getLinkSource,
  getResizingItem,
  getSelectedItemIds,
  getSelectedShapeIds,
  getWorldPointFromClient,
  linkTypeItem,
  finishMixedDrag,
  moveMixedDrag,
  positionItemToolbar,
  pushHistorySnapshot,
  scheduleItemToolbarUpdate,
  scheduleLinkUpdate,
  scheduleSave,
  setMixedDragUsesWindow,
  setResizingItem,
  startMixedDrag,
  syncItemSelectionElement,
  updateLinkItemHighlight,
  windowRef,
}) {
  function getItemById(id) {
    return getBoardItems().find((entry) => entry.id === id) || null;
  }

  function updateItemPosition(id, x, y) {
    const item = getItemById(id);
    const element = getItemElements().get(id);
    if (!item || !element) return;

    item.x = Math.round(x);
    item.y = Math.round(y);
    element.style.left = `${item.x}px`;
    element.style.top = `${item.y}px`;

    if (getSelectedItemIds().has(id)) {
      syncItemSelectionElement(id);
    }

    const linkSource = getLinkSource();
    if (linkSource?.type === linkTypeItem && linkSource.id === id) {
      updateLinkItemHighlight("source", id);
    }

    const linkHoverTarget = getLinkHoverTarget();
    if (linkHoverTarget?.type === linkTypeItem && linkHoverTarget.id === id) {
      updateLinkItemHighlight("hover", id);
    }

    if (getActiveItemToolbarId() === id) {
      if (element.classList.contains("is-dragging") || getDraggingMixed()) {
        positionItemToolbar(item);
      } else {
        scheduleItemToolbarUpdate();
      }
    }
  }

  function updateItemSize(id, width, height) {
    const item = getItemById(id);
    const element = getItemElements().get(id);
    if (!item || !element) return;

    item.width = Math.max(1, Math.round(width));
    item.height = Math.max(1, Math.round(height));
    element.style.width = `${item.width}px`;
    element.style.height = `${item.height}px`;

    if (getSelectedItemIds().has(id)) {
      syncItemSelectionElement(id);
    }

    const linkSource = getLinkSource();
    if (linkSource?.type === linkTypeItem && linkSource.id === id) {
      updateLinkItemHighlight("source", id);
    }

    const linkHoverTarget = getLinkHoverTarget();
    if (linkHoverTarget?.type === linkTypeItem && linkHoverTarget.id === id) {
      updateLinkItemHighlight("hover", id);
    }

    if (getActiveItemToolbarId() === id) {
      if (element.classList.contains("is-resizing") || getDraggingMixed()) {
        positionItemToolbar(item);
      } else {
        scheduleItemToolbarUpdate();
      }
    }
  }

  function startMixedDragFromItem(event) {
    if (event.button !== 0) return;
    event.preventDefault();

    const startPoint = getWorldPointFromClient(event.clientX, event.clientY);
    if (!startMixedDrag(startPoint)) return;

    setMixedDragUsesWindow(true);
    const dragThreshold = 3;
    let thresholdPassed = false;
    const startX = event.clientX;
    const startY = event.clientY;
    let pendingPoint = null;
    let rafId = null;

    const onMove = (moveEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      if (!thresholdPassed) {
        if (Math.abs(rawDx) < dragThreshold && Math.abs(rawDy) < dragThreshold) {
          return;
        }
        thresholdPassed = true;
      }

      pendingPoint = getWorldPointFromClient(
        moveEvent.clientX,
        moveEvent.clientY
      );
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (pendingPoint) {
            moveMixedDrag(pendingPoint);
          }
        });
      }
    };

    const onUp = () => {
      windowRef.removeEventListener("pointermove", onMove);
      windowRef.removeEventListener("pointerup", onUp);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pendingPoint) {
        moveMixedDrag(pendingPoint);
      }
      scheduleSave();
      const moved = finishMixedDrag();
      if (moved) {
        pushHistorySnapshot();
      }
    };

    windowRef.addEventListener("pointermove", onMove);
    windowRef.addEventListener("pointerup", onUp);
  }

  function startDrag(event, id) {
    if (event.button !== 0) return;
    event.preventDefault();

    const selectedShapeIds = getSelectedShapeIds();
    const selectedItemIds = getSelectedItemIds();
    if (
      selectedShapeIds.size &&
      selectedItemIds.size &&
      selectedItemIds.has(id)
    ) {
      startMixedDragFromItem(event);
      return;
    }

    const dragIds =
      selectedItemIds.has(id) && selectedItemIds.size > 1
        ? Array.from(selectedItemIds)
        : [id];
    const origins = new Map();
    dragIds.forEach((itemId) => {
      const item = getItemById(itemId);
      if (!item) return;
      origins.set(itemId, { x: item.x, y: item.y });
    });
    if (origins.size === 0) return;

    const dragElements = dragIds
      .map((itemId) => getItemElements().get(itemId))
      .filter(Boolean);
    const dragThreshold = 3;
    let moved = false;
    let thresholdPassed = false;
    const startX = event.clientX;
    const startY = event.clientY;
    const zoom = getBoardZoom();
    let pendingDx = 0;
    let pendingDy = 0;
    let rafId = null;

    dragElements.forEach((dragElement) => {
      dragElement.classList.add("is-dragging");
    });

    const applyMove = () => {
      rafId = null;
      const dx = pendingDx / zoom;
      const dy = pendingDy / zoom;
      origins.forEach((origin, itemId) => {
        updateItemPosition(itemId, origin.x + dx, origin.y + dy);
      });
      scheduleLinkUpdate();
    };

    const onMove = (moveEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      if (!thresholdPassed) {
        if (Math.abs(rawDx) < dragThreshold && Math.abs(rawDy) < dragThreshold) {
          return;
        }
        thresholdPassed = true;
      }
      pendingDx = rawDx;
      pendingDy = rawDy;
      if (!rafId) {
        rafId = requestAnimationFrame(applyMove);
      }
      moved = true;
    };

    const onUp = () => {
      dragElements.forEach((dragElement) => {
        dragElement.classList.remove("is-dragging");
      });
      windowRef.removeEventListener("pointermove", onMove);
      windowRef.removeEventListener("pointerup", onUp);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (thresholdPassed) {
        applyMove();
      }
      scheduleSave();
      if (moved) {
        pushHistorySnapshot();
      }
    };

    windowRef.addEventListener("pointermove", onMove);
    windowRef.addEventListener("pointerup", onUp);
  }

  function startItemResize(event, id) {
    if (event.button !== 0) return;

    const item = getItemById(id);
    const element = getItemElements().get(id);
    if (!item || !element) return;

    event.preventDefault();
    event.stopPropagation();
    setResizingItem(true);

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = Number(item.width) || 0;
    const startHeight = Number(item.height) || 0;
    const zoom = getBoardZoom();
    const styles = windowRef.getComputedStyle(element);
    const minWidth = Number.parseFloat(styles.minWidth) || 120;
    const minHeight = Number.parseFloat(styles.minHeight) || 90;
    let moved = false;

    element.classList.add("is-resizing");

    const onMove = (moveEvent) => {
      if (!getResizingItem()) return;
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const nextWidth = Math.max(minWidth, startWidth + dx);
      const nextHeight = Math.max(minHeight, startHeight + dy);
      updateItemSize(id, nextWidth, nextHeight);
      moved = true;
      scheduleLinkUpdate();
    };

    const onUp = () => {
      setResizingItem(false);
      element.classList.remove("is-resizing");
      windowRef.removeEventListener("pointermove", onMove);
      windowRef.removeEventListener("pointerup", onUp);
      if (moved) {
        scheduleSave();
        pushHistorySnapshot();
      }
    };

    windowRef.addEventListener("pointermove", onMove);
    windowRef.addEventListener("pointerup", onUp);
  }

  return {
    startDrag,
    startItemResize,
    startMixedDragFromItem,
    updateItemPosition,
    updateItemSize,
  };
}
