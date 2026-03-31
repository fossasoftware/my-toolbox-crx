import {
  createAddTile,
  createBookmarkCard,
  createBookmarkDragHandle,
  createBookmarkIcon,
  createBookmarkText,
  createPinnedItem,
} from "./bookmarks-render-parts.js";

export function renderBookmarks(listEl, bookmarks, getText) {
  listEl.textContent = "";
  const fragment = document.createDocumentFragment();
  bookmarks.forEach((bookmark, index) => {
    fragment.appendChild(createBookmarkCard(bookmark, index));
  });
  fragment.appendChild(createAddTile(getText));
  listEl.appendChild(fragment);
}

export function renderPinnedBookmarks(listEl, emptyEl, bookmarks, onRender) {
  listEl.textContent = "";
  const pinned = bookmarks.filter((bookmark) => bookmark.pinned);
  const fragment = document.createDocumentFragment();
  pinned.forEach((bookmark) => {
    fragment.appendChild(createPinnedItem(bookmark));
  });
  listEl.appendChild(fragment);
  emptyEl.classList.toggle("is-hidden", pinned.length > 0);
  const container = listEl.closest(".bookmarks-pinned");
  if (container) {
    container.classList.toggle("is-empty", pinned.length === 0);
  }
  if (onRender) {
    onRender(pinned);
  }
}

export function createBookmarkDragPlaceholder() {
  const placeholder = document.createElement("li");
  placeholder.className = "bookmark-item bookmark-placeholder";
  const card = document.createElement("div");
  card.className = "bookmark-card";
  card.style.visibility = "hidden";
  placeholder.appendChild(card);
  return placeholder;
}

export {
  createAddTile,
  createBookmarkCard,
  createBookmarkDragHandle,
  createBookmarkIcon,
  createBookmarkText,
  createPinnedItem,
};
