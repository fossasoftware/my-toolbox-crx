import {
  createBookmarksDragDropLayout,
  isSortableBookmarkItem,
  resetDraggingStyles,
} from "./bookmarks-drag-drop-layout.js";

export function createBookmarksDragDropController({
  createPlaceholder,
  documentRef,
  getBookmarks,
  commitBookmarks,
  listEl,
  windowRef,
}) {
  let draggingItem = null;
  let placeholderItem = null;
  let dragPointerId = null;
  let dragStartLeft = 0;
  let dragStartTop = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragWidth = 0;
  let dragHeight = 0;
  const activeReflowAnimations = new Map();
  const dragDropLayout = createBookmarksDragDropLayout({
    activeReflowAnimations,
    getDraggingItem: () => draggingItem,
    getPlaceholderItem: () => placeholderItem,
    listEl,
  });

  const onPointerMove = (event) => {
    if (!draggingItem || dragPointerId !== event.pointerId) return;
    event.preventDefault();
    const x = event.clientX - dragOffsetX;
    const y = event.clientY - dragOffsetY;
    const translateX = x - dragStartLeft;
    const translateY = y - dragStartTop;
    draggingItem.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    const centerX = x + dragWidth / 2;
    const centerY = y + dragHeight / 2;
    dragDropLayout.updatePlaceholderPosition(centerX, centerY);
  };

  const onPointerUp = async (event) => {
    if (!draggingItem || dragPointerId !== event.pointerId) return;
    dragPointerId = null;
    windowRef.removeEventListener("pointermove", onPointerMove);
    windowRef.removeEventListener("pointerup", onPointerUp);
    windowRef.removeEventListener("pointercancel", onPointerUp);
    documentRef.body.style.userSelect = "";
    listEl.classList.remove("is-dragging");

    draggingItem.classList.remove("is-dragging");
    if (placeholderItem && placeholderItem.parentNode) {
      placeholderItem.replaceWith(draggingItem);
    }
    resetDraggingStyles(draggingItem);
    placeholderItem = null;
    draggingItem = null;

    const items = Array.from(listEl.querySelectorAll(".bookmark-item")).filter(
      (item) => isSortableBookmarkItem(item)
    );
    const orderIndices = items.map((item) =>
      Number.parseInt(item.dataset.bookmarkIndex || "", 10)
    );
    const bookmarks = getBookmarks();
    if (
      orderIndices.length !== bookmarks.length ||
      orderIndices.some((index) => !Number.isFinite(index))
    ) {
      return;
    }
    const currentOrder = bookmarks.map((_, index) => index).join("|");
    const nextOrder = orderIndices.join("|");
    if (currentOrder !== nextOrder) {
      const nextBookmarks = orderIndices.map((index) => bookmarks[index]);
      await commitBookmarks(nextBookmarks, null);
    }
  };

  const handlePointerDown = (event) => {
    const handle = event.target.closest(".bookmark-drag-handle");
    if (!handle) return;
    if (event.button !== undefined && event.button !== 0) return;
    const item = handle.closest(".bookmark-item");
    if (!isSortableBookmarkItem(item)) return;
    event.preventDefault();
    draggingItem = item;
    draggingItem.classList.add("is-dragging");
    placeholderItem = createPlaceholder();
    draggingItem.after(placeholderItem);
    const rect = item.getBoundingClientRect();
    dragStartLeft = rect.left;
    dragStartTop = rect.top;
    dragWidth = rect.width;
    dragHeight = rect.height;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    draggingItem.style.width = `${dragWidth}px`;
    draggingItem.style.height = `${dragHeight}px`;
    draggingItem.style.position = "fixed";
    draggingItem.style.left = `${rect.left}px`;
    draggingItem.style.top = `${rect.top}px`;
    draggingItem.style.zIndex = "1000";
    draggingItem.style.pointerEvents = "none";
    draggingItem.style.transform = "translate3d(0, 0, 0)";
    dragPointerId = event.pointerId;
    documentRef.body.style.userSelect = "none";
    listEl.classList.add("is-dragging");
    windowRef.addEventListener("pointermove", onPointerMove);
    windowRef.addEventListener("pointerup", onPointerUp);
    windowRef.addEventListener("pointercancel", onPointerUp);
  };

  return {
    bind() {
      listEl.addEventListener("pointerdown", handlePointerDown);
    },
  };
}
