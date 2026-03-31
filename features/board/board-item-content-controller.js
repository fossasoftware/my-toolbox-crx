import {
  colorsMatch,
  mixRgb,
  parseHexColor,
  rgbToString,
} from "./board-color-utils.js";

export function createBoardItemContentController({
  getDefaultTextColor,
  getDefaultTextSize,
  getText,
  itemElements,
  itemTypeColors,
}) {
  function getItemTitle(type) {
    switch (type) {
      case "task":
        return getText("boardItemTaskTitle");
      case "process":
        return getText("boardItemProcessTitle");
      case "decision":
        return getText("boardItemDecisionTitle");
      case "text":
        return getText("boardItemTextTitle");
      case "note":
      default:
        return getText("boardItemNoteTitle");
    }
  }

  function getItemDisplayTitle(item) {
    if (!item) return "";
    const customTitle =
      typeof item.title === "string" ? item.title.trim() : "";
    if (customTitle) return customTitle;
    return getItemTitle(item.type);
  }

  function isItemBodyEmpty(body) {
    if (!body) return true;
    const text = (body.textContent || "").replace(/\u200B/g, "").trim();
    return text.length === 0;
  }

  function applyTextStylesToBody(item, body) {
    if (!item || !body) return;

    const hasCustomColor = Boolean(item.textColor);
    const hasCustomSize = Number.isFinite(Number(item.textSize));
    const useDefaults = item.type === "text";
    const color = hasCustomColor
      ? item.textColor
      : useDefaults
        ? getDefaultTextColor()
        : null;
    if (color) {
      body.style.color = color;
    } else {
      body.style.removeProperty("color");
    }

    const size = hasCustomSize
      ? Number(item.textSize)
      : useDefaults
        ? Number(getDefaultTextSize())
        : null;
    if (Number.isFinite(size)) {
      body.style.fontSize = `${size}px`;
    } else {
      body.style.removeProperty("font-size");
    }

  }

  function hasRichTextFormatting(body) {
    if (!body) return false;
    return Boolean(
      body.querySelector(
        "span[style], b, strong, i, em, u, s, strike, font"
      )
    );
  }

  function focusItemBody(id) {
    if (!id) return;
    requestAnimationFrame(() => {
      const element = itemElements.get(id);
      if (!element) return;
      const body = element.querySelector(".board-item-body");
      if (!body) return;
      body.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.selectAllChildren(body);
        selection.collapseToEnd();
      }
    });
  }

  function updateItemTitleElement(item) {
    if (!item) return;
    const element = itemElements.get(item.id);
    if (!element) return;
    const title = element.querySelector(".board-item-title");
    if (title) {
      title.textContent = getItemDisplayTitle(item);
    }
  }

  function findColorKeyByColor(color) {
    const entries = Object.entries(itemTypeColors || {});
    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i];
      if (colorsMatch(value, color)) {
        return key;
      }
    }
    return null;
  }

  function getItemColorKey(item) {
    if (!item) return "text";
    if (item.color) {
      const match = findColorKeyByColor(item.color);
      if (match) return match;
    }
    const type = item.type;
    if (type && itemTypeColors[type]) {
      return type;
    }
    return "text";
  }

  function applyItemColorStyles(item, element, header) {
    if (!item || !element) return;
    const color = item.color;
    if (!color) {
      element.style.removeProperty("background-color");
      element.style.removeProperty("border-color");
      if (header) {
        header.style.removeProperty("background-color");
      }
      return;
    }

    element.style.backgroundColor = color;
    const rgb = parseHexColor(color);
    if (rgb) {
      const border = mixRgb(rgb, { r: 0, g: 0, b: 0 }, 0.18);
      element.style.borderColor = rgbToString(border);
      if (header) {
        header.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;
      }
    } else {
      element.style.borderColor = color;
      if (header) {
        header.style.removeProperty("background-color");
      }
    }
  }

  function normalizeInlineTextDecorations(body) {
    if (!body) return;
    const candidates = Array.from(body.querySelectorAll("span, u, s, strike"));
    candidates.forEach((parent) => {
      if (!parent || parent.childNodes.length !== 1) return;
      const child = parent.firstElementChild;
      if (!child || !(child instanceof HTMLElement)) return;
      let decoration = "";
      if (parent.tagName === "U") {
        decoration = "underline";
      } else if (parent.tagName === "S" || parent.tagName === "STRIKE") {
        decoration = "line-through";
      } else {
        decoration =
          parent.style.textDecoration ||
          parent.style.textDecorationLine ||
          "";
      }
      if (!decoration || decoration === "none") return;
      if (!child.style.textDecoration && !child.style.textDecorationLine) {
        child.style.textDecoration = decoration;
      }
      if (parent.tagName === "SPAN") {
        parent.style.removeProperty("text-decoration");
        parent.style.removeProperty("text-decoration-line");
        if (!parent.getAttribute("style")) {
          parent.replaceWith(child);
        }
      } else {
        parent.replaceWith(child);
      }
    });
  }

  function getItemTextColor(item) {
    return item?.textColor || getDefaultTextColor();
  }

  function getItemTextSize(item) {
    const sizeValue = Number(item?.textSize);
    if (Number.isFinite(sizeValue)) return sizeValue;
    return Number(getDefaultTextSize());
  }

  function updateItemTextStyles(item) {
    if (!item) return;
    const element = itemElements.get(item.id);
    if (!element) return;
    const body = element.querySelector(".board-item-body");
    applyTextStylesToBody(item, body);
  }

  return {
    applyItemColorStyles,
    applyTextStylesToBody,
    focusItemBody,
    getItemColorKey,
    getItemDisplayTitle,
    getItemTextColor,
    getItemTextSize,
    getItemTitle,
    hasRichTextFormatting,
    isItemBodyEmpty,
    normalizeInlineTextDecorations,
    updateItemTextStyles,
    updateItemTitleElement,
  };
}
