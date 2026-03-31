export function isSortableBookmarkItem(item) {
  return (
    item &&
    item.classList.contains("bookmark-item") &&
    !item.classList.contains("bookmark-add-item") &&
    !item.classList.contains("bookmark-placeholder")
  );
}

export function resetDraggingStyles(item) {
  item.style.position = "";
  item.style.left = "";
  item.style.top = "";
  item.style.width = "";
  item.style.height = "";
  item.style.zIndex = "";
  item.style.pointerEvents = "";
  item.style.transform = "";
}

export function createBookmarksDragDropLayout({
  activeReflowAnimations,
  getDraggingItem,
  getPlaceholderItem,
  listEl,
}) {
  const capturePositions = () => {
    const draggingItem = getDraggingItem();
    const placeholderItem = getPlaceholderItem();
    const items = Array.from(listEl.querySelectorAll(".bookmark-item"))
      .filter((item) => isSortableBookmarkItem(item))
      .filter((item) => item !== draggingItem && item !== placeholderItem);
    const positions = new Map();
    items.forEach((item) => {
      positions.set(item, item.getBoundingClientRect());
    });
    return { items, positions };
  };

  const animateReflow = (items, positions) => {
    items.forEach((item) => {
      const prev = positions.get(item);
      if (!prev) return;
      const next = item.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (!dx && !dy) return;
      const existing = activeReflowAnimations.get(item);
      if (existing) {
        existing.cancel();
      }
      const animation = item.animate(
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 250, easing: "ease-in-out" }
      );
      activeReflowAnimations.set(item, animation);
      animation.addEventListener("finish", () => {
        activeReflowAnimations.delete(item);
      });
      animation.addEventListener("cancel", () => {
        activeReflowAnimations.delete(item);
      });
    });
  };

  const movePlaceholder = (moveFn) => {
    const { items, positions } = capturePositions();
    moveFn();
    requestAnimationFrame(() => {
      animateReflow(items, positions);
    });
  };

  const movePlaceholderToEnd = () => {
    const placeholderItem = getPlaceholderItem();
    if (!placeholderItem) return;
    const addTile = listEl.querySelector(".bookmark-add-item");
    if (addTile) {
      if (placeholderItem.nextElementSibling === addTile) {
        return;
      }
      movePlaceholder(() => {
        listEl.insertBefore(placeholderItem, addTile);
      });
      return;
    }
    if (placeholderItem.parentNode === listEl && !placeholderItem.nextSibling) {
      return;
    }
    movePlaceholder(() => {
      listEl.appendChild(placeholderItem);
    });
  };

  const insertPlaceholderBefore = (referenceNode) => {
    const placeholderItem = getPlaceholderItem();
    if (!placeholderItem || referenceNode === placeholderItem) return;
    if (placeholderItem.nextElementSibling === referenceNode) return;
    movePlaceholder(() => {
      listEl.insertBefore(placeholderItem, referenceNode);
    });
  };

  const updatePlaceholderPosition = (centerX, centerY) => {
    const draggingItem = getDraggingItem();
    const placeholderItem = getPlaceholderItem();
    if (!placeholderItem) return;

    const items = Array.from(listEl.querySelectorAll(".bookmark-item"))
      .filter((item) => isSortableBookmarkItem(item))
      .filter((item) => item !== draggingItem && item !== placeholderItem)
      .map((item) => ({ item, rect: item.getBoundingClientRect() }))
      .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);

    if (!items.length) {
      movePlaceholderToEnd();
      return;
    }

    const rowTolerance = Math.max(6, items[0].rect.height * 0.25);
    const rows = [];
    items.forEach((entry) => {
      let row = rows.find(
        (candidate) => Math.abs(candidate.top - entry.rect.top) <= rowTolerance
      );
      if (!row) {
        row = { top: entry.rect.top, items: [] };
        rows.push(row);
      }
      row.items.push(entry);
    });

    rows.forEach((row) => {
      row.items.sort((a, b) => a.rect.left - b.rect.left);
      row.top = Math.min(...row.items.map((entry) => entry.rect.top));
      row.bottom = Math.max(...row.items.map((entry) => entry.rect.bottom));
      row.centerY = (row.top + row.bottom) / 2;
    });
    rows.sort((a, b) => a.top - b.top);

    let targetRow =
      rows.find((row) => centerY >= row.top && centerY <= row.bottom) || null;
    if (!targetRow) {
      if (centerY < rows[0].top) {
        targetRow = rows[0];
      } else if (centerY > rows[rows.length - 1].bottom) {
        targetRow = rows[rows.length - 1];
      } else {
        targetRow = rows.reduce((closest, row) => {
          if (!closest) return row;
          const distance = Math.abs(centerY - row.centerY);
          const closestDistance = Math.abs(centerY - closest.centerY);
          return distance < closestDistance ? row : closest;
        }, null);
      }
    }

    let referenceNode = null;
    if (targetRow) {
      for (const entry of targetRow.items) {
        const midX = entry.rect.left + entry.rect.width / 2;
        if (centerX < midX) {
          referenceNode = entry.item;
          break;
        }
      }
      if (!referenceNode) {
        const lastItem =
          targetRow.items[targetRow.items.length - 1]?.item || null;
        referenceNode = lastItem ? lastItem.nextElementSibling : null;
      }
    }

    if (!referenceNode) {
      movePlaceholderToEnd();
      return;
    }

    insertPlaceholderBefore(referenceNode);
  };

  return {
    updatePlaceholderPosition,
  };
}
