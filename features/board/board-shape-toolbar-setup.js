export function setStrokeWidthPreview(shapeStrokeWidthButton, size) {
  if (!shapeStrokeWidthButton) return;
  const numeric = Number(size);
  if (!Number.isFinite(numeric)) return;
  const preview = Math.min(8, Math.max(1, Math.round(numeric)));
  shapeStrokeWidthButton.style.setProperty("--stroke-preview", `${preview}px`);
}

export function createBoardShapeToolbarSetup({
  documentRef,
  getText,
  refs,
  shapeFillPresets = [],
  shapeStrokeColorPresets = [],
  shapeStrokePresets = [],
  applyShapeFillChoice,
  applyShapeStrokeColorChoice,
  applyShapeStrokeWidthChoice,
  getSingleSelectedShape,
  startShapeTextEditing,
  startLinkFromToolbar,
  makeLinkEndpoint,
  linkTypeShape,
  deleteSelectedShape,
  commitShapeTextEditing,
  updateShapeTextFromEditor,
  cancelShapeTextEditing,
}) {
  const {
    shapeControls,
    shapeCard,
    shapePalette,
    shapeToolbar,
    shapeFillButton,
    shapeFillMenu,
    shapeStrokeButton,
    shapeStrokeMenu,
    shapeStrokeWidthButton,
    shapeStrokeWidthMenu,
    shapeLinkButton,
    shapeTextButton,
    shapeDeleteButton,
    shapeEditor,
  } = refs;

  function syncShapePaletteVisibility() {
    if (!shapePalette || !shapeCard) return;
    const isOpen =
      (shapeFillMenu && shapeFillMenu.classList.contains("is-open")) ||
      (shapeStrokeMenu && shapeStrokeMenu.classList.contains("is-open")) ||
      (shapeStrokeWidthMenu && shapeStrokeWidthMenu.classList.contains("is-open"));
    shapePalette.classList.toggle("is-open", isOpen);
    shapePalette.setAttribute("aria-hidden", isOpen ? "false" : "true");
    shapeCard.classList.toggle("is-expanded", isOpen);
  }

  function setShapeColorMenuState({
    button,
    menu,
    isOpen,
    scheduleShapeToolbarUpdate,
    syncShapeToolbarDuringTransition,
  }) {
    if (!button || !menu) return;
    menu.classList.toggle("is-open", isOpen);
    menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    button.classList.toggle("is-open", isOpen);
    syncShapePaletteVisibility();
    scheduleShapeToolbarUpdate?.();
    syncShapeToolbarDuringTransition?.();
  }

  function closeShapeColorMenus({
    scheduleShapeToolbarUpdate,
    syncShapeToolbarDuringTransition,
  }) {
    setShapeColorMenuState({
      button: shapeFillButton,
      menu: shapeFillMenu,
      isOpen: false,
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
    });
    setShapeColorMenuState({
      button: shapeStrokeButton,
      menu: shapeStrokeMenu,
      isOpen: false,
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
    });
    setShapeColorMenuState({
      button: shapeStrokeWidthButton,
      menu: shapeStrokeWidthMenu,
      isOpen: false,
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
    });
  }

  function setupShapeColorPicker({
    button,
    menu,
    presets,
    stroke = false,
    label,
    onSelect,
    scheduleShapeToolbarUpdate,
    syncShapeToolbarDuringTransition,
  }) {
    if (!button || !menu || !Array.isArray(presets)) return;
    button.setAttribute("aria-label", label || "");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    if (menu.id) {
      button.setAttribute("aria-controls", menu.id);
    }
    menu.setAttribute("aria-hidden", "true");
    menu.innerHTML = "";

    presets.forEach((preset) => {
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className = `board-shape-color-option${stroke ? " is-stroke" : " is-fill"}`;
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", "false");
      option.setAttribute("data-color", preset.value);
      option.setAttribute("aria-label", getText(preset.label));
      const dot = documentRef.createElement("span");
      dot.className = "board-shape-color-dot";
      const colorValue = preset.value || "#ffffff";
      dot.style.setProperty("--shape-color", colorValue);
      if (!preset.value) {
        dot.classList.add("is-none");
      }
      option.appendChild(dot);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onSelect === "function") {
          onSelect(preset.value);
        }
        closeShapeColorMenus({
          scheduleShapeToolbarUpdate,
          syncShapeToolbarDuringTransition,
        });
      });
      menu.appendChild(option);
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) return;
      const isOpen = menu.classList.contains("is-open");
      closeShapeColorMenus({
        scheduleShapeToolbarUpdate,
        syncShapeToolbarDuringTransition,
      });
      setShapeColorMenuState({
        button,
        menu,
        isOpen: !isOpen,
        scheduleShapeToolbarUpdate,
        syncShapeToolbarDuringTransition,
      });
    });

    menu.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  function setupShapeSizePicker({
    button,
    menu,
    sizes,
    label,
    onSelect,
    scheduleShapeToolbarUpdate,
    syncShapeToolbarDuringTransition,
  }) {
    if (!button || !menu || !Array.isArray(sizes)) return;
    const buttonLabel = label || "";
    button.setAttribute("aria-label", buttonLabel);
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    if (menu.id) {
      button.setAttribute("aria-controls", menu.id);
    }
    menu.setAttribute("aria-hidden", "true");
    menu.innerHTML = "";

    sizes.forEach((size) => {
      const numeric = Number(size);
      if (!Number.isFinite(numeric)) return;
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className = "board-shape-size-option";
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", "false");
      option.setAttribute("data-size", String(numeric));
      option.setAttribute("aria-label", `${buttonLabel} ${numeric}`);
      const dot = documentRef.createElement("span");
      dot.className = "board-shape-size-dot";
      const preview = Math.min(8, Math.max(1, Math.round(numeric)));
      dot.style.setProperty("--stroke-preview", `${preview}px`);
      option.appendChild(dot);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onSelect === "function") {
          onSelect(numeric);
        }
        closeShapeColorMenus({
          scheduleShapeToolbarUpdate,
          syncShapeToolbarDuringTransition,
        });
      });
      menu.appendChild(option);
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) return;
      const isOpen = menu.classList.contains("is-open");
      closeShapeColorMenus({
        scheduleShapeToolbarUpdate,
        syncShapeToolbarDuringTransition,
      });
      setShapeColorMenuState({
        button,
        menu,
        isOpen: !isOpen,
        scheduleShapeToolbarUpdate,
        syncShapeToolbarDuringTransition,
      });
    });

    menu.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  return function initializeShapeToolbar({
    scheduleShapeToolbarUpdate,
    syncShapeToolbarDuringTransition,
  }) {
    if (shapeControls) {
      shapeControls.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      shapeControls.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    if (shapeToolbar) {
      shapeToolbar.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      shapeToolbar.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    if (shapeDeleteButton) {
      shapeDeleteButton.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
    }

    setupShapeColorPicker({
      button: shapeFillButton,
      menu: shapeFillMenu,
      presets: shapeFillPresets,
      stroke: false,
      label: getText("boardShapeFill"),
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
      onSelect: (value) => {
        applyShapeFillChoice(value);
      },
    });

    setupShapeColorPicker({
      button: shapeStrokeButton,
      menu: shapeStrokeMenu,
      presets: shapeStrokeColorPresets,
      stroke: true,
      label: getText("boardStrokeColor"),
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
      onSelect: (value) => {
        applyShapeStrokeColorChoice(value);
      },
    });

    setupShapeSizePicker({
      button: shapeStrokeWidthButton,
      menu: shapeStrokeWidthMenu,
      sizes: shapeStrokePresets,
      label: getText("boardStrokeSize"),
      scheduleShapeToolbarUpdate,
      syncShapeToolbarDuringTransition,
      onSelect: (value) => {
        applyShapeStrokeWidthChoice(value);
        setStrokeWidthPreview(shapeStrokeWidthButton, value);
      },
    });

    if (shapeTextButton) {
      shapeTextButton.textContent = "T";
      shapeTextButton.setAttribute("aria-label", getText("boardShapeText"));
      shapeTextButton.addEventListener("click", () => {
        const shape = getSingleSelectedShape();
        if (!shape) return;
        startShapeTextEditing(shape);
      });
    }

    if (shapeLinkButton) {
      shapeLinkButton.setAttribute("aria-label", getText("boardToolLink"));
      shapeLinkButton.addEventListener("click", (event) => {
        const shape = getSingleSelectedShape();
        if (!shape) return;
        event.preventDefault();
        event.stopPropagation();
        startLinkFromToolbar(makeLinkEndpoint(linkTypeShape, shape.id), event);
      });
    }

    if (shapeDeleteButton) {
      shapeDeleteButton.setAttribute("aria-label", getText("boardItemDelete"));
      shapeDeleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteSelectedShape();
      });
    }

    documentRef.addEventListener("pointerdown", (event) => {
      if (!shapeControls) return;
      if (shapeControls.contains(event.target)) return;
      closeShapeColorMenus({
        scheduleShapeToolbarUpdate,
        syncShapeToolbarDuringTransition,
      });
    });

    if (shapeEditor) {
      shapeEditor.setAttribute(
        "data-placeholder",
        getText("boardShapeTextPlaceholder")
      );
      shapeEditor.addEventListener("beforeinput", (event) => {
        if (
          event.inputType === "insertParagraph" ||
          event.inputType === "insertLineBreak"
        ) {
          event.preventDefault();
          commitShapeTextEditing();
        }
      });
      shapeEditor.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      shapeEditor.addEventListener("input", () => {
        updateShapeTextFromEditor();
      });
      shapeEditor.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelShapeTextEditing();
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          commitShapeTextEditing();
        }
      });
      shapeEditor.addEventListener("blur", () => {
        requestAnimationFrame(() => {
          if (shapeEditor && !shapeEditor.contains(documentRef.activeElement)) {
            commitShapeTextEditing();
          }
        });
      });
    }

    return {
      closeShapeColorMenus: () =>
        closeShapeColorMenus({
          scheduleShapeToolbarUpdate,
          syncShapeToolbarDuringTransition,
        }),
      setShapeColorMenuState: (button, menu, isOpen) =>
        setShapeColorMenuState({
          button,
          menu,
          isOpen,
          scheduleShapeToolbarUpdate,
          syncShapeToolbarDuringTransition,
        }),
      syncShapePaletteVisibility,
    };
  };
}
