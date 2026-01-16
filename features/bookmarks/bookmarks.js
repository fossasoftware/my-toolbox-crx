import {
  getText,
  showToast,
  showValidationErrorModal,
} from "../../options/options-main.js";

const BOOKMARKS_KEY = "bookmarks";
const BOOKMARK_ICONS_KEY = "bookmarkIcons";
const BOOKMARK_SETTINGS_KEY = "bookmarkSettings";
const BOOKMARK_SETTINGS_DEFAULTS = {
  iconSize: 48,
  pinnedIconSize: 32,
  pinnedTitleDisplay: "hidden",
};
const BOOKMARK_ICON_SIZE_LIMITS = { min: 36, max: 50 };
const BOOKMARK_PINNED_ICON_SIZE_LIMITS = { min: 16, max: 40 };
const BOOKMARK_PINNED_TITLE_DISPLAY_OPTIONS = new Set([
  "hidden",
  "hover",
]);
const removeIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const editIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"/></svg>';
const pinIconSvg =
  '<svg class="bookmark-pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2026 Fonticons, Inc.--><path d="M160 96C160 78.3 174.3 64 192 64L448 64C465.7 64 480 78.3 480 96C480 113.7 465.7 128 448 128L418.5 128L428.8 262.1C465.9 283.3 494.6 318.5 507 361.8L510.8 375.2C513.6 384.9 511.6 395.2 505.6 403.3C499.6 411.4 490 416 480 416L160 416C150 416 140.5 411.3 134.5 403.3C128.5 395.3 126.5 384.9 129.3 375.2L133 361.8C145.4 318.5 174 283.3 211.2 262.1L221.5 128L192 128C174.3 128 160 113.7 160 96zM288 464L352 464L352 576C352 593.7 337.7 608 320 608C302.3 608 288 593.7 288 576L288 464z"/></svg>';

let bookmarksCache = [];
let bookmarkIconsCache = {};
let editingKey = "";
let editingIconValue = "";
let pendingUndo = null;
const UNDO_TOAST_DURATION = 5000;
const clampNumber = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const normalizeBookmarkSettings = (rawSettings = {}) => {
  const iconSize = clampNumber(
    Number.parseInt(rawSettings.iconSize, 10) ||
      BOOKMARK_SETTINGS_DEFAULTS.iconSize,
    BOOKMARK_ICON_SIZE_LIMITS.min,
    BOOKMARK_ICON_SIZE_LIMITS.max
  );
  const pinnedIconSize = clampNumber(
    Number.parseInt(rawSettings.pinnedIconSize, 10) ||
      BOOKMARK_SETTINGS_DEFAULTS.pinnedIconSize,
    BOOKMARK_PINNED_ICON_SIZE_LIMITS.min,
    BOOKMARK_PINNED_ICON_SIZE_LIMITS.max
  );
  let pinnedTitleDisplay = rawSettings.pinnedTitleDisplay;
  if (pinnedTitleDisplay === "always") {
    pinnedTitleDisplay = "hover";
  }
  pinnedTitleDisplay = BOOKMARK_PINNED_TITLE_DISPLAY_OPTIONS.has(
    pinnedTitleDisplay
  )
    ? pinnedTitleDisplay
    : BOOKMARK_SETTINGS_DEFAULTS.pinnedTitleDisplay;
  return { iconSize, pinnedIconSize, pinnedTitleDisplay };
};

const applyBookmarkSettings = (settings) => {
  const root = document.documentElement;
  root.style.setProperty("--bookmark-icon-size", `${settings.iconSize}px`);
  root.style.setProperty(
    "--bookmark-pinned-icon-size",
    `${settings.pinnedIconSize}px`
  );
};

const loadBookmarkSettings = () =>
  new Promise((resolve) => {
    chrome.storage.sync.get(BOOKMARK_SETTINGS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error loading settings",
          chrome.runtime.lastError
        );
        resolve({ ...BOOKMARK_SETTINGS_DEFAULTS });
        return;
      }
      resolve(
        normalizeBookmarkSettings(stored[BOOKMARK_SETTINGS_KEY] || {})
      );
    });
  });

const saveBookmarkSettings = (settings) =>
  new Promise((resolve) => {
    chrome.storage.sync.set({ [BOOKMARK_SETTINGS_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error saving settings",
          chrome.runtime.lastError
        );
        resolve(false);
        return;
      }
      resolve(true);
    });
  });

function normalizeBookmarkUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

function formatBookmarkUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.host}${path}${parsed.search}`;
  } catch (error) {
    return value.replace(/^https?:\/\//, "");
  }
}

function isIconUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "data:"].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

function normalizeIconValue(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getIconKey(title, url) {
  return JSON.stringify([title, url]);
}

function getIconGlyph(iconValue, title) {
  const iconText = typeof iconValue === "string" ? iconValue.trim() : "";
  if (iconText) {
    return Array.from(iconText)[0];
  }
  const titleText = typeof title === "string" ? title.trim() : "";
  if (titleText) {
    return Array.from(titleText)[0].toUpperCase();
  }
  return "?";
}

function normalizeIconMap(rawMap) {
  if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
    return {};
  }
  const normalized = {};
  Object.entries(rawMap).forEach(([key, value]) => {
    const iconValue = normalizeIconValue(value);
    if (!iconValue) return;
    normalized[key] = iconValue;
  });
  return normalized;
}

function buildIconMap(bookmarks) {
  const iconMap = {};
  bookmarks.forEach((bookmark) => {
    const iconValue = normalizeIconValue(bookmark.icon);
    if (!iconValue) return;
    iconMap[getIconKey(bookmark.title, bookmark.url)] = iconValue;
  });
  return iconMap;
}

function attachIcons(bookmarks, iconMap) {
  return bookmarks.map((bookmark) => ({
    ...bookmark,
    icon: iconMap[getIconKey(bookmark.title, bookmark.url)] || "",
  }));
}

function pruneIconMap(iconMap, bookmarks) {
  const allowedKeys = new Set(
    bookmarks.map((bookmark) => getIconKey(bookmark.title, bookmark.url))
  );
  const cleaned = {};
  let changed = false;
  Object.entries(iconMap).forEach(([key, value]) => {
    if (!allowedKeys.has(key) || !value) {
      changed = true;
      return;
    }
    cleaned[key] = value;
  });
  return { icons: cleaned, changed };
}

function normalizeBookmarks(rawBookmarks) {
  if (!Array.isArray(rawBookmarks)) {
    return { bookmarks: [], needsSave: false, legacyIcons: {} };
  }

  const bookmarks = [];
  const legacyIcons = {};
  let needsSave = false;

  rawBookmarks.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      needsSave = true;
      return;
    }

    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    const urlRaw = typeof entry.url === "string" ? entry.url.trim() : "";

    if (!title || !urlRaw) {
      needsSave = true;
      return;
    }

    const normalizedUrl = normalizeBookmarkUrl(urlRaw);
    if (!normalizedUrl) {
      needsSave = true;
      return;
    }

    const pinned = Boolean(entry.pinned);
    if (entry.pinned !== pinned || normalizedUrl !== urlRaw) {
      needsSave = true;
    }

    if ("icon" in entry || "id" in entry) {
      needsSave = true;
    }

    if (typeof entry.icon === "string" && entry.icon.trim()) {
      legacyIcons[getIconKey(title, normalizedUrl)] = entry.icon.trim();
    }

    bookmarks.push({
      title,
      url: normalizedUrl,
      pinned,
    });
  });

  return { bookmarks, needsSave, legacyIcons };
}

function serializeBookmarksForSync(bookmarks) {
  return bookmarks.map((bookmark) => ({
    title: bookmark.title,
    url: bookmark.url,
    pinned: Boolean(bookmark.pinned),
  }));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Invalid file data"));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error("File read error"));
    };
    reader.readAsDataURL(file);
  });
}

function saveBookmarksSync(bookmarks) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [BOOKMARKS_KEY]: bookmarks }, () => {
      if (chrome.runtime.lastError) {
        console.error("Bookmarks: Error saving data", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

function saveBookmarkIcons(iconMap) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [BOOKMARK_ICONS_KEY]: iconMap }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error saving icon data",
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

function loadBookmarksSync() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(BOOKMARKS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error("Bookmarks: Error loading data", chrome.runtime.lastError);
        resolve([]);
        return;
      }
      resolve(stored[BOOKMARKS_KEY]);
    });
  });
}

function loadBookmarkIcons() {
  return new Promise((resolve) => {
    chrome.storage.local.get(BOOKMARK_ICONS_KEY, (stored) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Bookmarks: Error loading icon data",
          chrome.runtime.lastError
        );
        resolve({});
        return;
      }
      resolve(stored[BOOKMARK_ICONS_KEY]);
    });
  });
}

function createBookmarkIcon(bookmark) {
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

function createBookmarkText(bookmark) {
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
  button.innerHTML = removeIconSvg;
  return button;
}

function createEditIconButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "bookmark-item-action bookmark-item-action-icon bookmark-item-action-pin";
  button.dataset.action = "edit";
  button.innerHTML = editIconSvg;
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
  button.innerHTML = pinIconSvg;
  return button;
}

function createBookmarkCard(bookmark, index) {
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
  card.appendChild(createDragHandle());

  card.appendChild(createDeleteIconButton());
  card.appendChild(link);
  card.appendChild(actions);
  item.appendChild(card);

  return item;
}

function createDragHandle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bookmark-drag-handle";
  button.draggable = false;
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="5" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle></svg>';
  return button;
}

function createPinnedItem(bookmark) {
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

function createAddTile() {
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

function renderBookmarks(listEl, bookmarks) {
  listEl.textContent = "";
  const fragment = document.createDocumentFragment();
  bookmarks.forEach((bookmark, index) => {
    fragment.appendChild(createBookmarkCard(bookmark, index));
  });
  fragment.appendChild(createAddTile());
  listEl.appendChild(fragment);
}

function renderPinnedBookmarks(listEl, emptyEl, bookmarks, onRender) {
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

export async function initializeBookmarks() {
  const listEl = document.getElementById("bookmarksList");
  const pinnedListEl = document.getElementById("bookmarksPinnedList");
  const pinnedEmptyEl = document.getElementById("bookmarksPinnedEmpty");
  const modal = document.getElementById("bookmarkModal");
  const form = document.getElementById("bookmarkForm");
  const nameInput = document.getElementById("bookmarkName");
  const urlInput = document.getElementById("bookmarkUrl");
  const iconFileInput = document.getElementById("bookmarkIconFile");
  const iconFileName = document.getElementById("bookmarkIconFileName");
  const cancelBtn = document.getElementById("bookmarkCancel");
  const modalTitle = document.getElementById("bookmarkModalTitle");
  const saveButton = document.getElementById("bookmarkSave");
  const iconSizeInput = document.getElementById("bookmarkIconSize");
  const iconSizeValue = document.getElementById("bookmarkIconSizeValue");
  const pinnedIconSizeInput = document.getElementById("bookmarkPinnedIconSize");
  const pinnedIconSizeValue = document.getElementById(
    "bookmarkPinnedIconSizeValue"
  );
  const pinnedTitleDisplayInput = document.getElementById(
    "bookmarkPinnedTitleDisplay"
  );
  const pinnedLabelsContainerId = "bookmarksPinnedLabels";
  let pinnedLabelsContainer = document.getElementById(pinnedLabelsContainerId);
  if (!pinnedLabelsContainer) {
    pinnedLabelsContainer = document.createElement("div");
    pinnedLabelsContainer.id = pinnedLabelsContainerId;
    pinnedLabelsContainer.className = "bookmarks-pinned-labels";
    document.body.appendChild(pinnedLabelsContainer);
  }
  let pinnedLabelItems = [];
  let pinnedLabelLinks = [];
  let pinnedLabelsRaf = null;
  const pinnedLabelOffset = 8;
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

  if (
    !listEl ||
    !modal ||
    !form ||
    !nameInput ||
    !urlInput ||
    !iconFileInput ||
    !iconFileName
  ) {
    console.error("Bookmarks: Missing required elements.");
    return false;
  }
  const fileInputWrap = iconFileInput.closest(".bookmark-file-input");
  let fileDialogFocusHandler = null;
  let currentBookmarkSettings = await loadBookmarkSettings();

  const updateBookmarkSettingsControls = (settings) => {
    if (iconSizeInput) {
      iconSizeInput.value = String(settings.iconSize);
    }
    if (iconSizeValue) {
      iconSizeValue.textContent = `${settings.iconSize}px`;
    }
    if (pinnedIconSizeInput) {
      pinnedIconSizeInput.value = String(settings.pinnedIconSize);
    }
    if (pinnedIconSizeValue) {
      pinnedIconSizeValue.textContent = `${settings.pinnedIconSize}px`;
    }
    if (pinnedTitleDisplayInput) {
      pinnedTitleDisplayInput.value = settings.pinnedTitleDisplay;
    }
  };

  const updatePinnedLabelPositions = () => {
    pinnedLabelsRaf = null;
    if (!pinnedLabelItems.length || !pinnedLabelLinks.length) return;
    pinnedLabelLinks.forEach((link, index) => {
      const label = pinnedLabelItems[index];
      if (!label || !link.isConnected) return;
      const rect = link.getBoundingClientRect();
      label.style.left = `${rect.right + pinnedLabelOffset}px`;
      label.style.top = `${rect.top + rect.height / 2}px`;
    });
  };

  const schedulePinnedLabelUpdate = () => {
    if (pinnedLabelsRaf) return;
    pinnedLabelsRaf = requestAnimationFrame(updatePinnedLabelPositions);
  };

  const setPinnedLabelMode = (mode) => {
    if (!pinnedLabelsContainer) return;
    pinnedLabelItems.forEach((label) => label.classList.remove("is-visible"));
    if (mode === "hover") {
      schedulePinnedLabelUpdate();
    }
  };

  const renderPinnedLabels = (pinned) => {
    if (!pinnedLabelsContainer || !pinnedListEl) return;
    pinnedLabelsContainer.textContent = "";
    pinnedLabelItems = [];
    pinnedLabelLinks = Array.from(
      pinnedListEl.querySelectorAll(".bookmarks-pinned-link")
    );
    pinned.forEach((bookmark, index) => {
      const label = document.createElement("div");
      label.className = "bookmarks-pinned-label";
      label.textContent = bookmark.title;
      pinnedLabelsContainer.appendChild(label);
      pinnedLabelItems.push(label);
      const link = pinnedLabelLinks[index];
      if (link) {
        link.addEventListener("mouseenter", () => {
          if (currentBookmarkSettings.pinnedTitleDisplay !== "hover") return;
          label.classList.add("is-visible");
          schedulePinnedLabelUpdate();
        });
        link.addEventListener("mouseleave", () => {
          label.classList.remove("is-visible");
        });
      }
    });
    setPinnedLabelMode(currentBookmarkSettings.pinnedTitleDisplay);
    schedulePinnedLabelUpdate();
  };

  const syncBookmarkSettings = (settings) => {
    currentBookmarkSettings = settings;
    applyBookmarkSettings(settings);
    updateBookmarkSettingsControls(settings);
    setPinnedLabelMode(settings.pinnedTitleDisplay);
    schedulePinnedLabelUpdate();
  };

  const getSettingsFromInputs = () =>
    normalizeBookmarkSettings({
      iconSize: iconSizeInput
        ? iconSizeInput.value
        : currentBookmarkSettings.iconSize,
      pinnedIconSize: pinnedIconSizeInput
        ? pinnedIconSizeInput.value
        : currentBookmarkSettings.pinnedIconSize,
      pinnedTitleDisplay: pinnedTitleDisplayInput
        ? pinnedTitleDisplayInput.value
        : currentBookmarkSettings.pinnedTitleDisplay,
    });

  syncBookmarkSettings(currentBookmarkSettings);

  const handleSettingsInput = () => {
    const nextSettings = getSettingsFromInputs();
    applyBookmarkSettings(nextSettings);
    updateBookmarkSettingsControls(nextSettings);
    schedulePinnedLabelUpdate();
  };

  const handleSettingsChange = async () => {
    const nextSettings = getSettingsFromInputs();
    syncBookmarkSettings(nextSettings);
    await saveBookmarkSettings(nextSettings);
  };

  if (iconSizeInput) {
    iconSizeInput.addEventListener("input", handleSettingsInput);
    iconSizeInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedIconSizeInput) {
    pinnedIconSizeInput.addEventListener("input", handleSettingsInput);
    pinnedIconSizeInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedTitleDisplayInput) {
    pinnedTitleDisplayInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedListEl) {
    pinnedListEl.addEventListener("scroll", schedulePinnedLabelUpdate);
  }
  window.addEventListener("resize", schedulePinnedLabelUpdate);

  const setModalMode = (mode) => {
    const isEdit = mode === "edit";
    if (modalTitle) {
      const titleKey = isEdit ? "bookmarkEditTitle" : "bookmarkModalTitle";
      modalTitle.dataset.i18n = titleKey;
      modalTitle.textContent = getText(titleKey);
    }
    if (saveButton) {
      const buttonKey = isEdit ? "bookmarkUpdateButton" : "bookmarkSaveButton";
      saveButton.dataset.i18n = buttonKey;
      saveButton.textContent = getText(buttonKey);
    }
  };

  const setFileNameLabel = (labelKey) => {
    if (!iconFileName) return;
    iconFileName.dataset.i18n = labelKey;
    iconFileName.textContent = getText(labelKey);
  };

  const setFileNameValue = (value) => {
    if (!iconFileName) return;
    iconFileName.removeAttribute("data-i18n");
    iconFileName.textContent = value;
  };

  const resetModal = () => {
    form.reset();
    if (iconFileInput) {
      iconFileInput.value = "";
    }
    setFileNameLabel("bookmarkIconFilePlaceholder");
    editingKey = "";
    editingIconValue = "";
    setModalMode("create");
  };

  const closeModal = () => {
    modal.classList.remove("active");
    resetModal();
  };

  const openModalForCreate = () => {
    resetModal();
    modal.classList.add("active");
    nameInput.focus();
  };

  const openModalForEdit = (bookmark) => {
    resetModal();
    editingKey = getIconKey(bookmark.title, bookmark.url);
    editingIconValue = normalizeIconValue(bookmark.icon);
    setModalMode("edit");
    nameInput.value = bookmark.title;
    urlInput.value = bookmark.url;
    if (editingIconValue) {
      setFileNameLabel("bookmarkIconFileCurrent");
    }
    modal.classList.add("active");
    nameInput.focus();
  };

  const renderAll = (bookmarks) => {
    renderBookmarks(listEl, bookmarks);
    if (pinnedListEl && pinnedEmptyEl) {
      renderPinnedBookmarks(
        pinnedListEl,
        pinnedEmptyEl,
        bookmarks,
        renderPinnedLabels
      );
    }
  };

  const isSortableItem = (item) =>
    item &&
    item.classList.contains("bookmark-item") &&
    !item.classList.contains("bookmark-add-item") &&
    !item.classList.contains("bookmark-placeholder");

  const createDragPlaceholder = () => {
    const placeholder = document.createElement("li");
    placeholder.className = "bookmark-item bookmark-placeholder";
    const card = document.createElement("div");
    card.className = "bookmark-card";
    card.style.visibility = "hidden";
    placeholder.appendChild(card);
    return placeholder;
  };

  const resetDraggingStyles = (item) => {
    item.style.position = "";
    item.style.left = "";
    item.style.top = "";
    item.style.width = "";
    item.style.height = "";
    item.style.zIndex = "";
    item.style.pointerEvents = "";
    item.style.transform = "";
  };

  const movePlaceholderToEnd = () => {
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

  const capturePositions = () => {
    const items = Array.from(listEl.querySelectorAll(".bookmark-item"))
      .filter((item) => isSortableItem(item))
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

  const insertPlaceholderBefore = (referenceNode) => {
    if (!placeholderItem || referenceNode === placeholderItem) return;
    if (placeholderItem.nextElementSibling === referenceNode) return;
    movePlaceholder(() => {
      listEl.insertBefore(placeholderItem, referenceNode);
    });
  };

  const updatePlaceholderPosition = (centerX, centerY) => {
    if (!placeholderItem) return;
    const items = Array.from(listEl.querySelectorAll(".bookmark-item"))
      .filter((item) => isSortableItem(item))
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


  const loadBookmarksFromStorage = async () => {
    const [syncData, localIcons] = await Promise.all([
      loadBookmarksSync(),
      loadBookmarkIcons(),
    ]);
    const { bookmarks, needsSave, legacyIcons } = normalizeBookmarks(syncData);

    let iconMap = normalizeIconMap(localIcons);
    let iconChanged = false;
    Object.entries(legacyIcons).forEach(([key, value]) => {
      if (!iconMap[key]) {
        iconMap[key] = value;
        iconChanged = true;
      }
    });

    const pruned = pruneIconMap(iconMap, bookmarks);
    iconMap = pruned.icons;
    if (pruned.changed) {
      iconChanged = true;
    }

    bookmarkIconsCache = iconMap;
    bookmarksCache = attachIcons(bookmarks, bookmarkIconsCache);
    renderAll(bookmarksCache);

    if (needsSave) {
      saveBookmarksSync(serializeBookmarksForSync(bookmarksCache)).catch(
        (error) => {
          console.error("Bookmarks: Failed to normalize data", error);
        }
      );
    }

    if (iconChanged) {
      saveBookmarkIcons(bookmarkIconsCache).catch((error) => {
        console.error("Bookmarks: Failed to migrate icons", error);
      });
    }
  };

  const commitBookmarks = async (
    nextBookmarks,
    toastKey = "toastSaved",
    toastOptions = null
  ) => {
    const iconMap = buildIconMap(nextBookmarks);
    const syncPayload = serializeBookmarksForSync(nextBookmarks);

    bookmarkIconsCache = iconMap;
    bookmarksCache = attachIcons(nextBookmarks, bookmarkIconsCache);
    renderAll(bookmarksCache);

    try {
      await Promise.all([
        saveBookmarksSync(syncPayload),
        saveBookmarkIcons(bookmarkIconsCache),
      ]);
      if (toastKey) {
        showToast(toastKey, null, toastOptions);
      }
      return true;
    } catch (error) {
      showToast("toastErrorSaving");
      await loadBookmarksFromStorage();
      return false;
    }
  };

  const clearPendingUndo = () => {
    pendingUndo = null;
  };

  const scheduleUndo = (bookmark, index) => {
    clearPendingUndo();
    pendingUndo = { bookmark, index };
    showToast("toastBookmarkDeleted", null, {
      duration: UNDO_TOAST_DURATION,
      pauseOnHover: true,
      actionLabelKey: "toastUndoAction",
      onHide: clearPendingUndo,
      onAction: async () => {
        if (!pendingUndo) return;
        const { bookmark: undoBookmark, index: undoIndex } = pendingUndo;
        clearPendingUndo();
        const nextBookmarks = [...bookmarksCache];
        const insertIndex = Math.min(
          Math.max(undoIndex, 0),
          nextBookmarks.length
        );
        nextBookmarks.splice(insertIndex, 0, undoBookmark);
        await commitBookmarks(nextBookmarks, "toastBookmarkRestored");
      },
    });
  };

  const addButton = document.getElementById("bookmarkAddButton");
  if (addButton) {
    addButton.addEventListener("click", openModalForCreate);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (iconFileInput) {
    const setFileDialogActive = () => {
      if (!fileInputWrap) return;
      fileInputWrap.classList.add("is-active");
      if (fileDialogFocusHandler) {
        window.removeEventListener("focus", fileDialogFocusHandler);
      }
      fileDialogFocusHandler = () => {
        fileInputWrap.classList.remove("is-active");
        window.removeEventListener("focus", fileDialogFocusHandler);
        fileDialogFocusHandler = null;
      };
      window.addEventListener("focus", fileDialogFocusHandler);
    };
    const clearFileDialogActive = () => {
      if (fileInputWrap) {
        fileInputWrap.classList.remove("is-active");
      }
      if (fileDialogFocusHandler) {
        window.removeEventListener("focus", fileDialogFocusHandler);
        fileDialogFocusHandler = null;
      }
    };
    iconFileInput.addEventListener("click", setFileDialogActive);
    iconFileInput.addEventListener("change", () => {
      clearFileDialogActive();
      if (iconFileInput.files && iconFileInput.files.length > 0) {
        setFileNameValue(iconFileInput.files[0].name);
      } else {
        setFileNameLabel("bookmarkIconFilePlaceholder");
      }
    });
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titleValue = nameInput.value.trim();
    if (!titleValue) {
      showValidationErrorModal("errorBookmarkNameEmpty");
      nameInput.focus();
      return;
    }

    const rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      showValidationErrorModal("errorBookmarkUrlEmpty");
      urlInput.focus();
      return;
    }

    const normalizedUrl = normalizeBookmarkUrl(rawUrl);
    if (!normalizedUrl) {
      showValidationErrorModal("errorBookmarkUrlInvalid");
      urlInput.focus();
      return;
    }

    const file = iconFileInput?.files && iconFileInput.files[0];
    let iconValue = "";

    if (file) {
      if (file.type !== "image/png") {
        showValidationErrorModal("errorBookmarkIconFileInvalid");
        return;
      }
      try {
        iconValue = await readFileAsDataUrl(file);
      } catch (error) {
        showToast("toastErrorGeneric");
        return;
      }
    } else if (editingIconValue) {
      iconValue = editingIconValue;
    }

    if (editingKey) {
      const index = bookmarksCache.findIndex(
        (bookmark) => getIconKey(bookmark.title, bookmark.url) === editingKey
      );
      const pinned = index >= 0 ? bookmarksCache[index].pinned : false;
      const updated = {
        title: titleValue,
        url: normalizedUrl,
        icon: iconValue,
        pinned,
      };
      const nextBookmarks = [...bookmarksCache];
      if (index >= 0) {
        nextBookmarks[index] = updated;
      } else {
        nextBookmarks.push(updated);
      }
      await commitBookmarks(nextBookmarks);
      closeModal();
      return;
    }

    const newBookmark = {
      title: titleValue,
      url: normalizedUrl,
      icon: iconValue,
      pinned: false,
    };

    await commitBookmarks([...bookmarksCache, newBookmark]);
    closeModal();
  });

  listEl.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    event.preventDefault();
    const action = actionButton.dataset.action;
    if (action === "add") {
      openModalForCreate();
      return;
    }
    const item = actionButton.closest(".bookmark-item");
    if (!item) return;
    const index = Number.parseInt(item.dataset.bookmarkIndex || "", 10);
    if (!Number.isFinite(index) || !bookmarksCache[index]) return;

    if (action === "toggle-pin") {
      const nextBookmarks = [...bookmarksCache];
      nextBookmarks[index] = {
        ...nextBookmarks[index],
        pinned: !nextBookmarks[index].pinned,
      };
      await commitBookmarks(nextBookmarks);
      return;
    }

    if (action === "edit") {
      openModalForEdit(bookmarksCache[index]);
      return;
    }

    if (action === "delete") {
      const removed = bookmarksCache[index];
      const nextBookmarks = [...bookmarksCache];
      nextBookmarks.splice(index, 1);
      const saved = await commitBookmarks(nextBookmarks, null);
      if (saved) {
        scheduleUndo(removed, index);
      }
    }
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
    updatePlaceholderPosition(centerX, centerY);
  };

  const onPointerUp = async (event) => {
    if (!draggingItem || dragPointerId !== event.pointerId) return;
    dragPointerId = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    document.body.style.userSelect = "";
    listEl.classList.remove("is-dragging");

    draggingItem.classList.remove("is-dragging");
    if (placeholderItem && placeholderItem.parentNode) {
      placeholderItem.replaceWith(draggingItem);
    }
    resetDraggingStyles(draggingItem);
    placeholderItem = null;
    draggingItem = null;

    const items = Array.from(
      listEl.querySelectorAll(".bookmark-item")
    ).filter((item) => isSortableItem(item));
    const orderIndices = items.map((item) =>
      Number.parseInt(item.dataset.bookmarkIndex || "", 10)
    );
    if (
      orderIndices.length !== bookmarksCache.length ||
      orderIndices.some((index) => !Number.isFinite(index))
    ) {
      return;
    }
    const currentOrder = bookmarksCache
      .map((_, index) => index)
      .join("|");
    const nextOrder = orderIndices.join("|");
    if (currentOrder !== nextOrder) {
      const nextBookmarks = orderIndices.map((index) => bookmarksCache[index]);
      await commitBookmarks(nextBookmarks, null);
    }
  };

  listEl.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".bookmark-drag-handle");
    if (!handle) return;
    if (event.button !== undefined && event.button !== 0) return;
    const item = handle.closest(".bookmark-item");
    if (!isSortableItem(item)) return;
    event.preventDefault();
    draggingItem = item;
    draggingItem.classList.add("is-dragging");
    placeholderItem = createDragPlaceholder();
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
    document.body.style.userSelect = "none";
    listEl.classList.add("is-dragging");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[BOOKMARK_SETTINGS_KEY]) {
      syncBookmarkSettings(
        normalizeBookmarkSettings(changes[BOOKMARK_SETTINGS_KEY].newValue || {})
      );
    }
    if (areaName === "sync" && changes[BOOKMARKS_KEY]) {
      const { bookmarks, needsSave, legacyIcons } = normalizeBookmarks(
        changes[BOOKMARKS_KEY].newValue
      );

      let iconMap = { ...bookmarkIconsCache };
      let iconChanged = false;
      Object.entries(legacyIcons).forEach(([key, value]) => {
        if (!iconMap[key]) {
          iconMap[key] = value;
          iconChanged = true;
        }
      });

      const pruned = pruneIconMap(iconMap, bookmarks);
      iconMap = pruned.icons;
      if (pruned.changed) {
        iconChanged = true;
      }

      bookmarkIconsCache = iconMap;
      bookmarksCache = attachIcons(bookmarks, bookmarkIconsCache);
      renderAll(bookmarksCache);

      if (needsSave) {
        saveBookmarksSync(serializeBookmarksForSync(bookmarksCache)).catch(
          (error) => {
            console.error(
              "Bookmarks: Failed to normalize sync update",
              error
            );
          }
        );
      }

      if (iconChanged) {
        saveBookmarkIcons(bookmarkIconsCache).catch((error) => {
          console.error("Bookmarks: Failed to update icons", error);
        });
      }
    }

    if (areaName === "local" && changes[BOOKMARK_ICONS_KEY]) {
      const iconMap = normalizeIconMap(changes[BOOKMARK_ICONS_KEY].newValue);
      const pruned = pruneIconMap(iconMap, bookmarksCache);
      bookmarkIconsCache = pruned.icons;
      bookmarksCache = attachIcons(bookmarksCache, bookmarkIconsCache);
      renderAll(bookmarksCache);
      if (pruned.changed) {
        saveBookmarkIcons(bookmarkIconsCache).catch((error) => {
          console.error("Bookmarks: Failed to prune icons", error);
        });
      }
    }
  });

  await loadBookmarksFromStorage();

  return true;
}
