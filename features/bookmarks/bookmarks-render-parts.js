import {
  formatBookmarkUrl,
  getIconGlyph,
  isIconUrl,
  normalizeIconValue,
} from "./bookmarks-storage.js";

const createIconElement = (className, extraClass = "") => {
  const icon = document.createElement("span");
  icon.className = `bookmark-action-icon ${className}${
    extraClass ? ` ${extraClass}` : ""
  }`;
  icon.setAttribute("aria-hidden", "true");
  return icon;
};

export function createBookmarkIcon(bookmark) {
  const iconWrap = document.createElement("span");
  iconWrap.className = "bookmark-icon";

  const iconValue = normalizeIconValue(bookmark.icon);
  if (!iconValue) {
    iconWrap.classList.add("is-empty");
  }
  const fallbackGlyph = getIconGlyph(
    isIconUrl(iconValue) ? "" : iconValue,
    bookmark.title
  );
  const fallback = document.createElement("span");
  fallback.className = "bookmark-icon-text";
  fallback.textContent = fallbackGlyph;
  iconWrap.appendChild(fallback);

  if (iconValue) {
    if (isIconUrl(iconValue)) {
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.loading = "lazy";
      img.src = iconValue;
      img.addEventListener("load", () => {
        iconWrap.classList.add("has-image");
      });
      img.addEventListener("error", () => {
        img.remove();
      });
      iconWrap.appendChild(img);
    } else {
      iconWrap.classList.add("has-text");
      fallback.textContent = getIconGlyph(iconValue, bookmark.title);
    }
  }

  return iconWrap;
}

export function createBookmarkText(bookmark) {
  const textWrap = document.createElement("span");
  textWrap.className = "bookmark-text";

  const title = document.createElement("span");
  title.className = "bookmark-title";
  title.textContent = bookmark.title;

  const url = document.createElement("span");
  url.className = "bookmark-url";
  url.textContent = formatBookmarkUrl(bookmark.url);

  textWrap.appendChild(title);
  textWrap.appendChild(url);

  return textWrap;
}

function createDeleteIconButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bookmark-delete-button";
  button.dataset.action = "delete";
  button.appendChild(createIconElement("bookmark-action-icon-delete"));
  return button;
}

function createEditIconButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "bookmark-item-action bookmark-item-action-icon bookmark-item-action-pin";
  button.dataset.action = "edit";
  button.appendChild(createIconElement("bookmark-action-icon-edit"));
  return button;
}

function createPinIconButton(isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bookmark-item-action bookmark-item-action-icon";
  if (isActive) {
    button.classList.add("is-active");
  }
  button.dataset.action = "toggle-pin";
  button.appendChild(
    createIconElement("bookmark-action-icon-pin", "bookmark-pin-icon")
  );
  return button;
}

export function createBookmarkDragHandle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bookmark-drag-handle";
  button.draggable = false;
  button.appendChild(createIconElement("bookmark-action-icon-drag"));
  return button;
}

export function createBookmarkCard(bookmark, index) {
  const item = document.createElement("li");
  item.className = "bookmark-item";
  item.dataset.bookmarkIndex = String(index);

  const card = document.createElement("div");
  card.className = "bookmark-card bookmark-card-with-delete";

  const link = document.createElement("a");
  link.className = "bookmark-link bookmark-link-with-delete";
  link.href = bookmark.url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";

  const info = document.createElement("div");
  info.className = "bookmark-info";
  info.appendChild(createBookmarkIcon(bookmark));
  info.appendChild(createBookmarkText(bookmark));

  link.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "bookmark-item-actions";

  actions.appendChild(createPinIconButton(bookmark.pinned));
  actions.appendChild(createEditIconButton());
  card.appendChild(createBookmarkDragHandle());

  card.appendChild(createDeleteIconButton());
  card.appendChild(link);
  card.appendChild(actions);
  item.appendChild(card);

  return item;
}

export function createPinnedItem(bookmark) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "bookmarks-pinned-link";
  link.href = bookmark.url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.setAttribute("aria-label", bookmark.title);

  const title = document.createElement("span");
  title.className = "bookmark-title";
  title.textContent = bookmark.title;

  link.appendChild(createBookmarkIcon(bookmark));
  link.appendChild(title);

  item.appendChild(link);
  return item;
}

export function createAddTile(getText) {
  const item = document.createElement("li");
  item.className = "bookmark-item bookmark-add-item";
  item.draggable = false;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "bookmark-add-tile";
  button.dataset.action = "add";

  const plus = document.createElement("span");
  plus.className = "bookmark-add-plus";
  plus.textContent = "+";

  const label = document.createElement("span");
  label.className = "bookmark-add-label";
  label.dataset.i18n = "bookmarkAddTileLabel";
  label.textContent = getText("bookmarkAddTileLabel");

  const ariaLabel = getText("bookmarkAddLabel");
  button.setAttribute("aria-label", ariaLabel);

  button.appendChild(plus);
  button.appendChild(label);
  item.appendChild(button);

  return item;
}
