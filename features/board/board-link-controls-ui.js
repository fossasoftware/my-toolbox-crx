import { LINK_STYLE_SOLID } from "./board-config.js";

export function setLinkStyleButtonPreview(linkStyleButton, style) {
  if (!linkStyleButton) return;

  linkStyleButton.classList.remove("is-dashed", "is-dotted", "is-dash-dot");
  delete linkStyleButton.dataset.linkStyle;
}

export function syncLinkControlsState({
  link,
  linkStyleButton,
  linkColorButton,
  linkColorMenu,
  linkStyleOptions = [],
  linkColorOptions = [],
  getDefaultColor,
  setShapeColorButtonSwatch,
  syncShapeColorMenu,
}) {
  if (!link) {
    if (linkStyleButton) {
      setLinkStyleButtonPreview(linkStyleButton, LINK_STYLE_SOLID);
    }
    if (linkColorButton) {
      setShapeColorButtonSwatch(linkColorButton, getDefaultColor());
    }
    linkStyleOptions.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-checked", "false");
    });
    linkColorOptions.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-checked", "false");
    });
    return;
  }

  const style = link.style || LINK_STYLE_SOLID;
  const fallbackColor = getDefaultColor();
  const linkColor = link.color || fallbackColor;

  if (linkStyleButton) {
    setLinkStyleButtonPreview(linkStyleButton, style);
  }
  if (linkColorButton) {
    setShapeColorButtonSwatch(linkColorButton, linkColor);
  }
  if (linkColorMenu) {
    syncShapeColorMenu(linkColorMenu, linkColor);
  }
  linkStyleOptions.forEach((button) => {
    const isActive = button.dataset.linkStyle === style;
    button.classList.toggle("is-selected", isActive);
    button.setAttribute("aria-checked", isActive ? "true" : "false");
  });
}

export function showLinkControls(linkControls) {
  if (!linkControls) return;
  linkControls.classList.add("is-visible");
  linkControls.setAttribute("aria-hidden", "false");
}

export function hideLinkControls(linkControls) {
  if (!linkControls) return;
  linkControls.classList.remove("is-visible");
  linkControls.setAttribute("aria-hidden", "true");
}
