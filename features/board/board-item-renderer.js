export function createBoardItemRenderer({
  applyItemColorStyles,
  applyItemTextColorChoice,
  applyItemTextSizeChoice,
  applyTextStylesToBody,
  closeItemToolbarMenus,
  documentRef,
  getActiveItemToolbarId,
  getCurrentTool,
  getDefaultTextColor,
  getDefaultTextSize,
  getItemControls,
  getItemDisplayTitle,
  getItemElements,
  getItemMenu,
  getItemToolbars,
  getItems,
  getItemsContainer,
  getResizeObserver,
  getSelectedItemIds,
  getSelectedShapeIds,
  getText,
  handleLinkSelection,
  hasRichTextFormatting,
  hideItemToolbar,
  isLinkingModeActive,
  itemDefaults,
  linkTypeItem,
  makeLinkEndpoint,
  normalizeInlineTextDecorations,
  openItemMenu,
  redrawCanvas,
  removeItem,
  resizeObserverCtor,
  scheduleHistoryCommit,
  scheduleItemToolbarUpdate,
  scheduleLinkUpdate,
  scheduleSave,
  setActiveItemToolbarId,
  setResizeObserver,
  setupItemColorPicker,
  setupItemSizePicker,
  showItemToolbar,
  startLinkFromToolbar,
  startDrag,
  startItemResize,
  syncItemSelectionElement,
  syncItemToolbar,
  syncItemToolbarDuringTransition,
  textColorPresets,
  textSizePresets,
  toggleItemSelection,
  toolSelect,
  updateItemSelectionStyles,
  updateLinks,
}) {
  function normalizeItem(item) {
    const defaults = itemDefaults[item.type] || itemDefaults.note;
    if (!Number.isFinite(item.width)) {
      item.width = defaults.width;
    }
    if (!Number.isFinite(item.height)) {
      item.height = defaults.height;
    }
    if (!Number.isFinite(item.uiScale) || item.uiScale <= 0) {
      item.uiScale = 1;
    }
    if (!item.textColor) {
      item.textColor = getDefaultTextColor();
    }
    if (!Number.isFinite(Number(item.textSize))) {
      item.textSize = getDefaultTextSize();
    }
  }

  function ensureResizeObserver() {
    let resizeObserver = getResizeObserver();
    if (!resizeObserver) {
      resizeObserver = new resizeObserverCtor((entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.id;
          if (!id) return;
          const item = getItems().find((candidate) => candidate.id === id);
          if (!item) return;
          const width = Math.round(entry.target.offsetWidth);
          const height = Math.round(entry.target.offsetHeight);
          if (item.width !== width || item.height !== height) {
            item.width = width;
            item.height = height;
            scheduleSave();
            scheduleLinkUpdate();
            scheduleHistoryCommit();
            if (getSelectedItemIds().has(id)) {
              syncItemSelectionElement(id);
            }
          }
        });
      });
      setResizeObserver(resizeObserver);
      return resizeObserver;
    }
    resizeObserver.disconnect();
    return resizeObserver;
  }

  function buildItemToolbar(item) {
    const card = documentRef.createElement("div");
    card.className = "board-item-toolbar-card board-shape-card";
    card.setAttribute("aria-hidden", "false");
    card.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    card.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const palette = documentRef.createElement("div");
    palette.className = "board-item-toolbar-palette board-shape-palette";
    palette.setAttribute("aria-hidden", "true");

    const colorMenu = documentRef.createElement("div");
    colorMenu.className = "board-item-color-menu board-shape-color-menu";
    colorMenu.setAttribute("role", "menu");
    colorMenu.id = `boardItemColorMenu-${item.id}`;

    const sizeMenu = documentRef.createElement("div");
    sizeMenu.className =
      "board-item-size-menu board-shape-color-menu board-shape-size-menu";
    sizeMenu.setAttribute("role", "menu");
    sizeMenu.id = `boardItemSizeMenu-${item.id}`;

    palette.appendChild(colorMenu);
    palette.appendChild(sizeMenu);

    const toolbar = documentRef.createElement("div");
    toolbar.className = "board-item-toolbar board-shape-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", getText("boardItemMenuTextStyle"));

    const colorGroup = documentRef.createElement("div");
    colorGroup.className =
      "board-item-toolbar-group board-shape-toolbar-group";
    colorGroup.setAttribute("role", "group");
    colorGroup.setAttribute("aria-label", getText("boardTextColor"));
    const colorButton = documentRef.createElement("button");
    colorButton.type = "button";
    colorButton.className =
      "board-item-color-button board-shape-color-button is-fill";
    const colorSwatch = documentRef.createElement("span");
    colorSwatch.className = "board-shape-color-swatch";
    colorButton.appendChild(colorSwatch);
    colorGroup.appendChild(colorButton);

    const sizeGroup = documentRef.createElement("div");
    sizeGroup.className =
      "board-item-toolbar-group board-shape-toolbar-group";
    sizeGroup.setAttribute("role", "group");
    sizeGroup.setAttribute("aria-label", getText("boardTextSize"));
    const sizeButton = documentRef.createElement("button");
    sizeButton.type = "button";
    sizeButton.className =
      "board-item-size-button board-shape-color-button is-size";
    const sizeSwatch = documentRef.createElement("span");
    sizeSwatch.className = "board-item-size-swatch";
    sizeButton.appendChild(sizeSwatch);
    sizeGroup.appendChild(sizeButton);

    toolbar.appendChild(colorGroup);
    toolbar.appendChild(sizeGroup);

    const linkButton = documentRef.createElement("button");
    linkButton.type = "button";
    linkButton.className = "board-item-link-button board-shape-text-button";
    linkButton.setAttribute("aria-label", getText("boardToolLink"));
    const linkIcon = documentRef.createElement("img");
    linkIcon.src = "../img/icons/link.svg";
    linkIcon.alt = "";
    linkIcon.setAttribute("aria-hidden", "true");
    linkButton.appendChild(linkIcon);
    linkButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startLinkFromToolbar(makeLinkEndpoint(linkTypeItem, item.id), event);
    });
    toolbar.appendChild(linkButton);

    card.appendChild(palette);
    card.appendChild(toolbar);

    setupItemColorPicker({
      documentRef,
      getText,
      button: colorButton,
      menu: colorMenu,
      card,
      palette,
      presets: textColorPresets,
      label: getText("boardTextColor"),
      closeItemToolbarMenus,
      scheduleItemToolbarUpdate,
      syncItemToolbarDuringTransition,
      onSelect: (value) => {
        if (value) {
          applyItemTextColorChoice(item, value);
        }
      },
    });

    setupItemSizePicker({
      documentRef,
      button: sizeButton,
      menu: sizeMenu,
      card,
      palette,
      sizes: textSizePresets,
      label: getText("boardTextSize"),
      closeItemToolbarMenus,
      scheduleItemToolbarUpdate,
      syncItemToolbarDuringTransition,
      onSelect: (value) => {
        if (Number.isFinite(value)) {
          applyItemTextSizeChoice(item, value);
        }
      },
    });

    return card;
  }

  function buildItemElement(item) {
    const element = documentRef.createElement("div");
    element.className = `board-item board-item-${item.type || "note"}`;
    element.dataset.id = item.id;
    element.style.left = `${item.x}px`;
    element.style.top = `${item.y}px`;
    element.style.width = `${item.width}px`;
    element.style.height = `${item.height}px`;
    const uiScale =
      Number.isFinite(item.uiScale) && item.uiScale > 0 ? item.uiScale : 1;
    element.style.setProperty("--board-item-ui-scale", uiScale.toString());

    const header = documentRef.createElement("div");
    header.className = "board-item-header";

    const headerLeft = documentRef.createElement("div");
    headerLeft.className = "board-item-header-left";

    const title = documentRef.createElement("span");
    title.className = "board-item-title";
    title.textContent = getItemDisplayTitle(item);

    const actions = documentRef.createElement("div");
    actions.className = "board-item-actions";

    const deleteButton = documentRef.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "board-item-delete";
    deleteButton.setAttribute("aria-label", getText("boardItemDelete"));
    const deleteIcon = documentRef.createElement("img");
    deleteIcon.src = "../img/icons/delete.svg";
    deleteIcon.alt = "";
    deleteIcon.setAttribute("aria-hidden", "true");
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      removeItem(item.id);
    });

    actions.appendChild(deleteButton);
    headerLeft.appendChild(title);
    header.appendChild(headerLeft);
    header.appendChild(actions);

    const body = documentRef.createElement("div");
    body.className = "board-item-body";
    body.contentEditable = "true";
    body.spellcheck = true;
    if (item.richText) {
      body.innerHTML = item.content || "";
    } else {
      body.textContent = item.content || "";
    }
    body.setAttribute("data-placeholder", getText("boardItemPlaceholder"));
    applyTextStylesToBody(item, body);
    body.addEventListener("input", () => {
      const stored = getItems().find((entry) => entry.id === item.id);
      if (!stored) return;
      normalizeInlineTextDecorations(body);
      const hasRichText = stored.richText || hasRichTextFormatting(body);
      if (hasRichText) {
        stored.richText = true;
        stored.content = body.innerHTML;
      } else {
        stored.content = body.innerText.trimEnd();
      }
      scheduleSave();
      scheduleHistoryCommit();
      syncItemToolbar(item);
    });

    const resizeHandle = documentRef.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "board-item-resize-handle";
    resizeHandle.setAttribute("aria-label", getText("boardItemResize"));
    const resizeIcon = documentRef.createElement("img");
    resizeIcon.src = "../img/icons/resize.svg";
    resizeIcon.alt = "";
    resizeIcon.setAttribute("aria-hidden", "true");
    resizeHandle.appendChild(resizeIcon);
    resizeHandle.addEventListener("pointerdown", (event) => {
      startItemResize(event, item.id);
    });

    const setEditingState = (active) => {
      element.classList.toggle("is-editing", active);
      if (active) {
        showItemToolbar(item);
      } else if (getActiveItemToolbarId() === item.id) {
        hideItemToolbar();
      }
    };

    const refreshToolbar = () => {
      syncItemToolbar(item);
    };
    body.addEventListener("focus", refreshToolbar);
    body.addEventListener("mouseup", refreshToolbar);
    body.addEventListener("keyup", refreshToolbar);
    body.addEventListener("focus", () => setEditingState(true));
    body.addEventListener("input", () => setEditingState(true));
    element.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        const itemControls = getItemControls();
        const keepToolbar =
          activeElement &&
          itemControls &&
          itemControls.contains(activeElement) &&
          getActiveItemToolbarId() === item.id;
        if (!element.contains(activeElement) && !keepToolbar) {
          setEditingState(false);
        }
      });
    });

    header.addEventListener("pointerdown", (event) => {
      if (getCurrentTool() !== toolSelect) return;
      if (isLinkingModeActive()) return;
      if (event.target.closest(".board-item-delete")) return;
      if (event.target.closest(".board-item-toolbar")) return;
      if (element.classList.contains("is-renaming")) return;
      if (event.target.closest(".board-item-title.is-editing")) return;
      if (
        !event.shiftKey &&
        !getSelectedItemIds().has(item.id) &&
        (getSelectedItemIds().size || getSelectedShapeIds().size)
      ) {
        getSelectedItemIds().clear();
        getSelectedShapeIds().clear();
        updateItemSelectionStyles();
        redrawCanvas();
      }
      if (event.shiftKey) {
        toggleItemSelection(item);
        return;
      }
      startDrag(event, item.id);
    });

    element.addEventListener("contextmenu", (event) => {
      if (!getItemMenu()) return;
      event.preventDefault();
      event.stopPropagation();
      openItemMenu(item, event);
    });

    element.addEventListener("pointerdown", (event) => {
      if (!isLinkingModeActive()) return;
      if (event.target.closest(".board-item-delete")) return;
      event.preventDefault();
      event.stopPropagation();
      handleLinkSelection(makeLinkEndpoint(linkTypeItem, item.id), event);
    });

    const content = documentRef.createElement("div");
    content.className = "board-item-content";
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(resizeHandle);
    element.appendChild(content);

    applyItemColorStyles(item, element, header);
    return element;
  }

  function renderItems() {
    const itemsContainer = getItemsContainer();
    if (!itemsContainer) return;

    hideItemToolbar();
    setActiveItemToolbarId(null);
    itemsContainer.innerHTML = "";
    getItemElements().clear();
    getItemToolbars().forEach((toolbar) => toolbar.remove());
    getItemToolbars().clear();

    const resizeObserver = ensureResizeObserver();
    getItems().forEach((item) => {
      normalizeItem(item);
      const toolbar = buildItemToolbar(item);
      getItemToolbars().set(item.id, toolbar);
      const element = buildItemElement(item);
      itemsContainer.appendChild(element);
      getItemElements().set(item.id, element);
      syncItemToolbar(item);
      resizeObserver.observe(element);
    });

    updateLinks();
    updateItemSelectionStyles();
  }

  return {
    buildItemElement,
    buildItemToolbar,
    renderItems,
  };
}
