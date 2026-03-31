export function normalizeBookmarkUrl(value) {
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

export function formatBookmarkUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.host}${path}${parsed.search}`;
  } catch (error) {
    return value.replace(/^https?:\/\//, "");
  }
}

export function isIconUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "data:"].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

export function normalizeIconValue(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getIconKey(title, url) {
  return JSON.stringify([title, url]);
}

export function getIconGlyph(iconValue, title) {
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

export function normalizeIconMap(rawMap) {
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

export function buildIconMap(bookmarks) {
  const iconMap = {};
  bookmarks.forEach((bookmark) => {
    const iconValue = normalizeIconValue(bookmark.icon);
    if (!iconValue) return;
    iconMap[getIconKey(bookmark.title, bookmark.url)] = iconValue;
  });
  return iconMap;
}

export function attachIcons(bookmarks, iconMap) {
  return bookmarks.map((bookmark) => ({
    ...bookmark,
    icon: iconMap[getIconKey(bookmark.title, bookmark.url)] || "",
  }));
}

export function pruneIconMap(iconMap, bookmarks) {
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

export function normalizeBookmarks(rawBookmarks) {
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

export function serializeBookmarksForSync(bookmarks) {
  return bookmarks.map((bookmark) => ({
    title: bookmark.title,
    url: bookmark.url,
    pinned: Boolean(bookmark.pinned),
  }));
}

export function readFileAsDataUrl(file) {
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
