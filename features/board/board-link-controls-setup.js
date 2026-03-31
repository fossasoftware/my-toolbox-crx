const SVG_NS = "http://www.w3.org/2000/svg";

export function setupBoardLinkControls({
  documentRef,
  windowRef,
  getText,
  linkControls,
  linkCard,
  linkPalette,
  linkToolbar,
  linkColorButton,
  linkColorMenu,
  linkStyleButton,
  linkStyleMenu,
  linkTextButton,
  linkDeleteButton,
  linkEditor,
  getSelectedLinkId,
  getSelectedLink,
  shapeStrokeColorPresets = [],
  linkStylePresets = [],
  linkStyleDashed,
  linkStyleDotted,
  linkStyleDashDot,
  applyLinkColorChoice,
  applyLinkStyleChoice,
  clearLinkPopup,
  startLinkTextEditing,
  removeLink,
  commitLinkTextEditing,
  updateLinkTextFromEditor,
  cancelLinkTextEditing,
  updateLinkControlsPosition,
  syncLinkControlsDuringTransition,
}) {
  const linkColorOptions = [];
  const linkStyleOptions = [];

  function syncLinkPaletteVisibility() {
    if (!linkPalette || !linkCard) return;
    const isOpen =
      (linkColorMenu && linkColorMenu.classList.contains("is-open")) ||
      (linkStyleMenu && linkStyleMenu.classList.contains("is-open"));
    linkPalette.classList.toggle("is-open", isOpen);
    linkPalette.setAttribute("aria-hidden", isOpen ? "false" : "true");
    linkCard.classList.toggle("is-expanded", isOpen);
  }

  function setLinkMenuState(button, menu, isOpen) {
    if (!button || !menu) return;
    menu.classList.toggle("is-open", isOpen);
    menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    button.classList.toggle("is-open", isOpen);
    syncLinkPaletteVisibility();
    updateLinkControlsPosition();
    syncLinkControlsDuringTransition();
  }

  function closeLinkMenus() {
    setLinkMenuState(linkColorButton, linkColorMenu, false);
    setLinkMenuState(linkStyleButton, linkStyleMenu, false);
  }

  function setupLinkColorPicker() {
    if (
      !linkColorButton ||
      !linkColorMenu ||
      !Array.isArray(shapeStrokeColorPresets)
    ) {
      return;
    }
    linkColorButton.setAttribute("aria-label", getText("boardLinkColor"));
    linkColorButton.setAttribute("aria-haspopup", "true");
    linkColorButton.setAttribute("aria-expanded", "false");
    if (linkColorMenu.id) {
      linkColorButton.setAttribute("aria-controls", linkColorMenu.id);
    }
    linkColorMenu.setAttribute("aria-hidden", "true");
    linkColorMenu.innerHTML = "";
    linkColorOptions.length = 0;

    shapeStrokeColorPresets.forEach((preset) => {
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className =
        "board-shape-color-option is-stroke board-link-color-option";
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", "false");
      option.setAttribute("data-color", preset.value);
      option.setAttribute("aria-label", getText(preset.label));
      const dot = documentRef.createElement("span");
      dot.className = "board-shape-color-dot";
      dot.style.setProperty("--shape-color", preset.value || "#0d181c");
      option.appendChild(dot);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyLinkColorChoice(preset.value);
        closeLinkMenus();
      });
      linkColorMenu.appendChild(option);
      linkColorOptions.push(option);
    });

    linkColorButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = linkColorMenu.classList.contains("is-open");
      closeLinkMenus();
      setLinkMenuState(linkColorButton, linkColorMenu, !isOpen);
    });

    linkColorMenu.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  function setupLinkStyleMenu() {
    if (
      !linkStyleButton ||
      !linkStyleMenu ||
      !Array.isArray(linkStylePresets)
    ) {
      return;
    }
    linkStyleButton.setAttribute("aria-label", getText("boardLinkStyle"));
    linkStyleButton.setAttribute("aria-haspopup", "true");
    linkStyleButton.setAttribute("aria-expanded", "false");
    if (linkStyleMenu.id) {
      linkStyleButton.setAttribute("aria-controls", linkStyleMenu.id);
    }
    linkStyleMenu.setAttribute("aria-hidden", "true");
    linkStyleMenu.innerHTML = "";
    linkStyleOptions.length = 0;

    linkStylePresets.forEach((preset) => {
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className = "board-shape-color-option board-link-style-option";
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", "false");
      option.setAttribute("data-link-style", preset.value);
      option.setAttribute("aria-label", getText(preset.label));

      const dot = documentRef.createElement("span");
      dot.className = "board-link-style-dot";
      const icon = documentRef.createElementNS(SVG_NS, "svg");
      icon.setAttribute("viewBox", "0 0 14 14");
      icon.setAttribute("aria-hidden", "true");
      const ring = documentRef.createElementNS(SVG_NS, "circle");
      ring.setAttribute("cx", "7");
      ring.setAttribute("cy", "7");
      ring.setAttribute("r", "6");
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "currentColor");
      ring.setAttribute("stroke-width", "2");
      ring.setAttribute("stroke-linecap", "round");
      ring.setAttribute("stroke-linejoin", "round");
      if (preset.value === linkStyleDashed) {
        ring.setAttribute("stroke-dasharray", "8 4");
        dot.classList.add("is-dashed");
      } else if (preset.value === linkStyleDotted) {
        ring.setAttribute("stroke-dasharray", "1 6");
        dot.classList.add("is-dotted");
      } else if (preset.value === linkStyleDashDot) {
        ring.setAttribute("stroke-dasharray", "8 4 2 4");
        dot.classList.add("is-dash-dot");
      }
      icon.appendChild(ring);
      dot.appendChild(icon);
      option.appendChild(dot);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyLinkStyleChoice(preset.value);
        closeLinkMenus();
      });
      linkStyleMenu.appendChild(option);
      linkStyleOptions.push(option);
    });

    linkStyleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = linkStyleMenu.classList.contains("is-open");
      closeLinkMenus();
      setLinkMenuState(linkStyleButton, linkStyleMenu, !isOpen);
    });

    linkStyleMenu.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  if (linkControls) {
    linkControls.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    linkControls.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  if (linkToolbar) {
    linkToolbar.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    linkToolbar.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  setupLinkColorPicker();
  setupLinkStyleMenu();

  if (linkTextButton) {
    linkTextButton.setAttribute("aria-label", getText("boardLinkText"));
    linkTextButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLinkMenus();
      const link = getSelectedLink();
      if (!link) return;
      startLinkTextEditing(link);
    });
  }

  if (linkDeleteButton) {
    linkDeleteButton.setAttribute("aria-label", getText("boardLinkDelete"));
    linkDeleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const selectedLinkId = getSelectedLinkId();
      if (!selectedLinkId) return;
      removeLink(selectedLinkId);
      clearLinkPopup();
    });
  }

  documentRef.addEventListener("pointerdown", (event) => {
    if (!getSelectedLinkId()) return;
    if (event.target.closest(".board-link-controls")) return;
    if (event.target.closest(".board-link")) return;
    clearLinkPopup();
  });

  windowRef.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearLinkPopup();
    }
  });

  if (linkEditor) {
    linkEditor.setAttribute("data-placeholder", getText("boardLinkTextPlaceholder"));
    linkEditor.addEventListener("beforeinput", (event) => {
      if (
        event.inputType === "insertParagraph" ||
        event.inputType === "insertLineBreak"
      ) {
        event.preventDefault();
        commitLinkTextEditing();
      }
    });
    linkEditor.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    linkEditor.addEventListener("input", () => {
      updateLinkTextFromEditor();
    });
    linkEditor.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelLinkTextEditing();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitLinkTextEditing();
      }
    });
    linkEditor.addEventListener("blur", () => {
      requestAnimationFrame(() => {
        if (linkEditor && !linkEditor.contains(documentRef.activeElement)) {
          commitLinkTextEditing();
        }
      });
    });
  }

  return {
    closeLinkMenus,
    linkColorOptions,
    linkStyleOptions,
  };
}
