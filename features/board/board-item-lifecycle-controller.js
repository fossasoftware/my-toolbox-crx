export function createBoardItemLifecycleController({
  createId,
  getActiveItemToolbarId,
  getBoardItems,
  getBoardLinks,
  getBoardZoom,
  getDefaultTextColor,
  getDefaultTextSize,
  getItemMenuTargetId,
  getItemOffset,
  getLinkSource,
  getSelectedItemIds,
  getStage,
  getViewPan,
  getItemToolbars,
  hideItemToolbar,
  focusItemBody,
  itemDefaults,
  itemOffsetLimit,
  itemOffsetStep,
  linkHasEndpoint,
  linkTypeItem,
  pushHistorySnapshot,
  renderItems,
  scheduleSave,
  setActiveItemToolbarId,
  setBoardItems,
  setBoardLinks,
  setItemOffset,
  setTool,
  toolSelect,
  updateEmptyState,
  updateItemSelectionStyles,
  clearLinkSelection,
  closeItemMenu,
}) {
  function getNextItemPosition(defaults) {
    const stage = getStage();
    if (!stage) {
      return { x: 0, y: 0 };
    }

    const rect = stage.getBoundingClientRect();
    const width = defaults.width;
    const height = defaults.height;
    const zoom = getBoardZoom();
    const pan = getViewPan();
    const centerX = (rect.width / 2 - pan.x) / zoom - width / 2;
    const centerY = (rect.height / 2 - pan.y) / zoom - height / 2;
    const currentOffset = getItemOffset();
    const offset =
      Number.isFinite(zoom) && zoom > 0 ? currentOffset / zoom : currentOffset;

    setItemOffset((currentOffset + itemOffsetStep) % itemOffsetLimit);
    return {
      x: centerX + offset,
      y: centerY + offset,
    };
  }

  function addItem(type) {
    if (!getStage()) return;

    const defaults = itemDefaults[type] || itemDefaults.note;
    const position = getNextItemPosition(defaults);
    const item = {
      id: createId(type),
      type,
      x: position.x,
      y: position.y,
      width: defaults.width,
      height: defaults.height,
      content: "",
    };
    item.textColor = getDefaultTextColor();
    item.textSize = getDefaultTextSize();

    getBoardItems().push(item);
    setTool(toolSelect);
    renderItems();
    scheduleSave();
    updateEmptyState();
    focusItemBody(item.id);
    pushHistorySnapshot();
  }

  function removeItem(id) {
    if (getActiveItemToolbarId() === id) {
      hideItemToolbar();
      setActiveItemToolbarId(null);
    }

    if (getItemMenuTargetId() === id) {
      closeItemMenu();
    }

    const linkSource = getLinkSource();
    if (linkSource?.type === linkTypeItem && linkSource.id === id) {
      clearLinkSelection();
    }

    const selectedItemIds = getSelectedItemIds();
    if (selectedItemIds.has(id)) {
      selectedItemIds.delete(id);
      updateItemSelectionStyles();
    }

    setBoardItems(getBoardItems().filter((item) => item.id !== id));

    const itemToolbars = getItemToolbars();
    if (itemToolbars.has(id)) {
      const toolbar = itemToolbars.get(id);
      if (toolbar) {
        toolbar.remove();
      }
      itemToolbars.delete(id);
    }

    setBoardLinks(
      getBoardLinks().filter((link) => !linkHasEndpoint(link, linkTypeItem, id))
    );

    renderItems();
    scheduleSave();
    updateEmptyState();
    pushHistorySnapshot();
  }

  return {
    addItem,
    getNextItemPosition,
    removeItem,
  };
}
