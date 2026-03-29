export function startItemRename({
  item,
  itemElements,
  getItemDisplayTitle,
  updateItemTitleElement,
  scheduleSave,
  scheduleHistoryCommit,
}) {
  if (!item?.id) return;

  const element = itemElements.get(item.id);
  if (!element || element.classList.contains("is-renaming")) return;

  const title = element.querySelector(".board-item-title");
  if (!title) return;

  const originalTitle = getItemDisplayTitle(item);
  element.classList.add("is-renaming");
  title.contentEditable = "true";
  title.classList.add("is-editing");
  title.spellcheck = false;
  title.textContent = originalTitle;

  const cleanup = () => {
    title.removeEventListener("blur", onBlur);
    title.removeEventListener("keydown", onKeydown);
    title.contentEditable = "false";
    title.classList.remove("is-editing");
    element.classList.remove("is-renaming");
  };

  const commit = () => {
    const nextTitle = title.textContent.trim();
    if (nextTitle) {
      item.title = nextTitle;
    } else {
      delete item.title;
    }
    updateItemTitleElement(item);
    scheduleSave();
    scheduleHistoryCommit();
  };

  const onBlur = () => {
    commit();
    cleanup();
  };

  const onKeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      title.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      title.textContent = originalTitle;
      cleanup();
      if (document.activeElement === title) {
        title.blur();
      }
    }
  };

  title.addEventListener("blur", onBlur);
  title.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => {
    title.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(title);
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

export function createBoardItemRenameController(deps) {
  return {
    startItemRename(item) {
      startItemRename({
        item,
        ...deps,
      });
    },
  };
}

export function openItemMenu({
  item,
  event,
  itemMenu,
  setMenuTargetId,
  syncItemMenuSelection,
  syncItemMenuTextOptions,
  positionItemMenu,
}) {
  if (!itemMenu || !item?.id || !event) return;

  setMenuTargetId(item.id);
  syncItemMenuSelection(item);
  syncItemMenuTextOptions(item);
  itemMenu.classList.add("is-open");
  itemMenu.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    positionItemMenu(event.clientX, event.clientY);
  });
}

export function closeItemMenu({ itemMenu, clearMenuTargetId }) {
  if (!itemMenu || !itemMenu.classList.contains("is-open")) return;

  itemMenu.classList.remove("is-open");
  itemMenu.setAttribute("aria-hidden", "true");
  clearMenuTargetId();
}

export function setupItemMenuController({
  documentRef,
  windowRef,
  itemMenu,
  itemControls,
  itemTypeColors,
  getMenuItem,
  applyItemColorChoice,
  applyItemTextColorChoice,
  applyItemTextSizeChoice,
  closeItemMenu,
  startItemRename,
  closeItemToolbarMenus,
}) {
  if (!itemMenu) {
    return {
      itemMenuColorButtons: [],
      itemMenuTextColorButtons: [],
      itemMenuTextSizeButtons: [],
    };
  }

  if (itemControls) {
    itemControls.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    itemControls.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  const itemMenuRenameButton = itemMenu.querySelector('[data-action="rename"]');
  const itemMenuColorButtons = Array.from(
    itemMenu.querySelectorAll("[data-color-key]")
  );
  const itemMenuTextColorButtons = Array.from(
    itemMenu.querySelectorAll("[data-text-color]")
  );
  const itemMenuTextSizeButtons = Array.from(
    itemMenu.querySelectorAll("[data-text-size]")
  );

  itemMenuColorButtons.forEach((button) => {
    const colorKey = button.dataset.colorKey;
    const color = itemTypeColors[colorKey];
    if (color) {
      button.style.setProperty("--swatch-color", color);
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = getMenuItem();
      if (!item) return;
      applyItemColorChoice(item, colorKey);
      closeItemMenu();
    });
  });

  itemMenuTextColorButtons.forEach((button) => {
    const color = button.dataset.textColor;
    if (color) {
      button.style.setProperty("--swatch-color", color);
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = getMenuItem();
      if (!item || !color) return;
      applyItemTextColorChoice(item, color);
      closeItemMenu();
    });
  });

  itemMenuTextSizeButtons.forEach((button) => {
    const sizeValue = Number(button.dataset.textSize);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = getMenuItem();
      if (!item || !Number.isFinite(sizeValue)) return;
      applyItemTextSizeChoice(item, sizeValue);
      closeItemMenu();
    });
  });

  if (itemMenuRenameButton) {
    itemMenuRenameButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = getMenuItem();
      if (!item) return;
      closeItemMenu();
      startItemRename(item);
    });
  }

  itemMenu.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  itemMenu.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  documentRef.addEventListener("pointerdown", (event) => {
    if (!itemMenu.classList.contains("is-open")) return;
    if (event.target.closest(".board-item-menu")) return;
    closeItemMenu();
  });

  documentRef.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".board-item-toolbar-card")) return;
    closeItemToolbarMenus();
  });

  windowRef.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeItemMenu();
      closeItemToolbarMenus();
    }
  });

  return {
    itemMenuColorButtons,
    itemMenuTextColorButtons,
    itemMenuTextSizeButtons,
  };
}
