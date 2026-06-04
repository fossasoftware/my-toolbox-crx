export function createBoardMainToolbarController({
  addItem,
  assignElements,
  closeNotesMenu,
  closeShapesMenu,
  documentRef,
  getCurrentTool,
  getItemTitle,
  getNotesMenu,
  getNotesToggle,
  getShapesMenu,
  getShapesToggle,
  getText,
  itemTypeColors,
  setTool,
  shapeToolLabels,
  shapeTools,
  syncToolbarPopupState,
  toggleNotesMenu,
  toggleShapesMenu,
  windowRef,
}) {
  function updateShapeMenuActive() {
    const currentTool = getCurrentTool();
    const shapeItems = documentRef.querySelectorAll(".board-shape-grid-button");
    shapeItems.forEach((item) => {
      const isActive = item.dataset.tool === currentTool;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const shapesToggle = getShapesToggle();
    if (shapesToggle) {
      const isShape = shapeTools.has(currentTool);
      shapesToggle.classList.toggle("active", isShape);
      shapesToggle.setAttribute("aria-pressed", isShape ? "true" : "false");
    }
  }

  function setupToolbar() {
    const boardToolbarDock = documentRef.getElementById("boardToolbarDock");
    const boardToolbarPanel = documentRef.getElementById("boardToolbarPanel");
    const shapesToggle = documentRef.getElementById("boardShapesToggle");
    const shapesMenu = documentRef.getElementById("boardShapesMenu");
    const notesToggle = documentRef.getElementById("boardNotesToggle");
    const notesMenu = documentRef.getElementById("boardNotesMenu");

    assignElements({
      boardToolbarDock,
      boardToolbarPanel,
      notesMenu,
      notesToggle,
      shapesMenu,
      shapesToggle,
    });

    const toolButtons = documentRef.querySelectorAll(".board-tool-button");
    toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tool = button.dataset.tool;
        if (tool) {
          setTool(tool);
        }
      });
    });

    if (shapesMenu) {
      const shapeButtons = shapesMenu.querySelectorAll(".board-shape-grid-button");
      shapeButtons.forEach((button) => {
        const tool = button.dataset.tool;
        if (tool && shapeToolLabels[tool]) {
          const shapeLabel = getText(shapeToolLabels[tool]);
          button.setAttribute("aria-label", shapeLabel);
          button.title = shapeLabel;
        }
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (tool) {
            setTool(tool);
          }
          closeShapesMenu();
        });
      });
    }

    if (shapesToggle && shapesMenu) {
      shapesToggle.setAttribute("aria-label", getText("boardToolShapes"));
      shapesToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleShapesMenu();
      });
      shapesMenu.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      shapesMenu.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      documentRef.addEventListener("pointerdown", (event) => {
        const menu = getShapesMenu();
        const toggle = getShapesToggle();
        if (!menu || !toggle) return;
        if (menu.contains(event.target) || toggle.contains(event.target)) {
          return;
        }
        closeShapesMenu();
      });
      windowRef.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeShapesMenu();
        }
      });
    }

    if (notesMenu) {
      const noteButtons = notesMenu.querySelectorAll(".board-note-option");
      noteButtons.forEach((button) => {
        const colorKey = button.dataset.colorKey;
        const action = button.dataset.action;
        if (colorKey && itemTypeColors[colorKey]) {
          button.style.setProperty("--note-color", itemTypeColors[colorKey]);
        }
        if (action) {
          const noteLabel = getItemTitle(action);
          button.setAttribute("aria-label", noteLabel);
          button.title = noteLabel;
        }
      });
    }

    if (notesToggle && notesMenu) {
      notesToggle.setAttribute("aria-label", getText("boardActionText"));
      notesToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleNotesMenu();
      });
      notesMenu.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      notesMenu.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = event.target.closest(".board-note-option");
        if (!target) return;
        const action = target.dataset.action;
        if (!action) return;
        addItem(action);
        closeNotesMenu();
      });
      documentRef.addEventListener("pointerdown", (event) => {
        const menu = getNotesMenu();
        const toggle = getNotesToggle();
        if (!menu || !toggle) return;
        if (menu.contains(event.target) || toggle.contains(event.target)) {
          return;
        }
        closeNotesMenu();
      });
      windowRef.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeNotesMenu();
        }
      });
    }

    syncToolbarPopupState();
  }

  return {
    setupToolbar,
    updateShapeMenuActive,
  };
}
