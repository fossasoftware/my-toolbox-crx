export function createBoardToolbarPopupController({
  getBoardToolbarDock,
  getBoardToolbarPanel,
  getEraserCard,
  getEraserPanel,
  getEraserToggle,
  getNotesMenu,
  getNotesToggle,
  getPenCard,
  getPenPanel,
  getPenToggle,
  getShapesMenu,
  getShapesToggle,
  updateShapeMenuActive,
}) {
  let toolbarSwitchRaf = 0;
  let toolbarSwitchTimeout = 0;
  let toolbarCollapseTimeout = 0;

  function getPanels() {
    return [getPenPanel(), getEraserPanel(), getShapesMenu(), getNotesMenu()];
  }

  function getOpenToolbarPopupPanel(excludePanel = null) {
    const panels = getPanels();
    for (let i = 0; i < panels.length; i += 1) {
      const panel = panels[i];
      if (!panel || panel === excludePanel) continue;
      if (panel.classList.contains("is-open")) {
        return panel;
      }
    }
    return null;
  }

  function setToolbarPopupTransitionsDisabled(disabled) {
    getPanels().forEach((panel) => {
      if (!panel) return;
      if (disabled) {
        panel.style.transition = "none";
      } else {
        panel.style.removeProperty("transition");
      }
    });
  }

  function resetToolbarSwitchAnimationState() {
    if (toolbarSwitchRaf) {
      cancelAnimationFrame(toolbarSwitchRaf);
      toolbarSwitchRaf = 0;
    }
    if (toolbarSwitchTimeout) {
      window.clearTimeout(toolbarSwitchTimeout);
      toolbarSwitchTimeout = 0;
    }
    const boardToolbarPanel = getBoardToolbarPanel();
    if (!boardToolbarPanel) return;
    boardToolbarPanel.style.removeProperty("height");
    boardToolbarPanel.classList.remove("is-switching");
  }

  function clearToolbarCollapseState() {
    if (toolbarCollapseTimeout) {
      window.clearTimeout(toolbarCollapseTimeout);
      toolbarCollapseTimeout = 0;
    }
    const boardToolbarDock = getBoardToolbarDock();
    boardToolbarDock?.classList.remove("is-opening");
    boardToolbarDock?.classList.remove("is-collapsing");
  }

  function syncToolbarPopupState() {
    const boardToolbarDock = getBoardToolbarDock();
    if (!boardToolbarDock) return;
    const penPanel = getPenPanel();
    const eraserPanel = getEraserPanel();
    const shapesMenu = getShapesMenu();
    const notesMenu = getNotesMenu();
    const isOpen =
      (penPanel && penPanel.classList.contains("is-open")) ||
      (eraserPanel && eraserPanel.classList.contains("is-open")) ||
      (shapesMenu && shapesMenu.classList.contains("is-open")) ||
      (notesMenu && notesMenu.classList.contains("is-open"));
    if (isOpen) {
      const shouldAnimateOpen =
        !boardToolbarDock.classList.contains("is-expanded") &&
        !boardToolbarDock.classList.contains("is-opening");
      clearToolbarCollapseState();
      if (shouldAnimateOpen) {
        boardToolbarDock.classList.add("is-opening");
        void boardToolbarDock.offsetWidth;
      }
      boardToolbarDock.classList.add("is-expanded");
      if (shouldAnimateOpen) {
        toolbarCollapseTimeout = window.setTimeout(() => {
          toolbarCollapseTimeout = 0;
          getBoardToolbarDock()?.classList.remove("is-opening");
        }, 240);
      }
    } else {
      const shouldAnimateCollapse =
        boardToolbarDock.classList.contains("is-expanded") ||
        boardToolbarDock.classList.contains("is-collapsing");
      boardToolbarDock.classList.remove("is-expanded");
      if (shouldAnimateCollapse) {
        clearToolbarCollapseState();
        boardToolbarDock.classList.add("is-collapsing");
        toolbarCollapseTimeout = window.setTimeout(() => {
          toolbarCollapseTimeout = 0;
          getBoardToolbarDock()?.classList.remove("is-collapsing");
        }, 240);
      }
    }
    const boardToolbarPanel = getBoardToolbarPanel();
    if (boardToolbarPanel) {
      boardToolbarPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
    if (!isOpen) {
      resetToolbarSwitchAnimationState();
    }
  }

  function withToolbarPopupSwitch(updateFn) {
    if (typeof updateFn !== "function") return;
    const boardToolbarPanel = getBoardToolbarPanel();
    if (!boardToolbarPanel) {
      updateFn();
      return;
    }
    const currentPanel = getOpenToolbarPopupPanel();
    const startHeight = Math.round(
      currentPanel
        ? currentPanel.getBoundingClientRect().height
        : boardToolbarPanel.getBoundingClientRect().height
    );
    resetToolbarSwitchAnimationState();
    boardToolbarPanel.classList.add("is-switching");
    boardToolbarPanel.style.height = `${Math.max(0, startHeight)}px`;
    setToolbarPopupTransitionsDisabled(true);
    void boardToolbarPanel.offsetWidth;
    updateFn();
    void boardToolbarPanel.offsetWidth;
    boardToolbarPanel.style.height = "9999px";
    const nextPanel = getOpenToolbarPopupPanel();
    const endHeight = Math.round(
      nextPanel ? nextPanel.getBoundingClientRect().height : 0
    );
    boardToolbarPanel.style.height = `${Math.max(0, startHeight)}px`;
    toolbarSwitchRaf = requestAnimationFrame(() => {
      toolbarSwitchRaf = 0;
      const panel = getBoardToolbarPanel();
      if (!panel) return;
      panel.style.height = `${Math.max(0, endHeight)}px`;
      toolbarSwitchTimeout = window.setTimeout(() => {
        toolbarSwitchTimeout = 0;
        resetToolbarSwitchAnimationState();
      }, 220);
    });
  }

  function setToolbarPopupElementState({ toggle, panel, card }, isOpen) {
    if (!toggle || !panel) return;
    panel.classList.toggle("is-open", isOpen);
    panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.classList.toggle("is-open", isOpen);
    if (card) {
      card.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  }

  function setPenPanelState(isOpen) {
    const penToggle = getPenToggle();
    const penPanel = getPenPanel();
    if (!penToggle || !penPanel) return;
    const shouldUseSwitchMode =
      isOpen && Boolean(getOpenToolbarPopupPanel(penPanel));
    const applyState = () => {
      if (isOpen) {
        setToolbarPopupElementState(
          {
            toggle: getEraserToggle(),
            panel: getEraserPanel(),
            card: getEraserCard(),
          },
          false
        );
        setToolbarPopupElementState(
          { toggle: getShapesToggle(), panel: getShapesMenu() },
          false
        );
        setToolbarPopupElementState(
          { toggle: getNotesToggle(), panel: getNotesMenu() },
          false
        );
      }
      setToolbarPopupElementState(
        { toggle: penToggle, panel: penPanel, card: getPenCard() },
        isOpen
      );
      syncToolbarPopupState();
    };
    if (shouldUseSwitchMode) {
      withToolbarPopupSwitch(applyState);
      return;
    }
    applyState();
  }

  function closePenPanel() {
    setPenPanelState(false);
  }

  function setEraserPanelState(isOpen) {
    const eraserToggle = getEraserToggle();
    const eraserPanel = getEraserPanel();
    if (!eraserToggle || !eraserPanel) return;
    const shouldUseSwitchMode =
      isOpen && Boolean(getOpenToolbarPopupPanel(eraserPanel));
    const applyState = () => {
      if (isOpen) {
        setToolbarPopupElementState(
          { toggle: getPenToggle(), panel: getPenPanel(), card: getPenCard() },
          false
        );
        setToolbarPopupElementState(
          { toggle: getShapesToggle(), panel: getShapesMenu() },
          false
        );
        setToolbarPopupElementState(
          { toggle: getNotesToggle(), panel: getNotesMenu() },
          false
        );
      }
      setToolbarPopupElementState(
        { toggle: eraserToggle, panel: eraserPanel, card: getEraserCard() },
        isOpen
      );
      syncToolbarPopupState();
    };
    if (shouldUseSwitchMode) {
      withToolbarPopupSwitch(applyState);
      return;
    }
    applyState();
  }

  function closeEraserPanel() {
    setEraserPanelState(false);
  }

  function setShapesMenuState(isOpen) {
    const shapesMenu = getShapesMenu();
    const shapesToggle = getShapesToggle();
    if (!shapesMenu || !shapesToggle) return;
    const shouldUseSwitchMode =
      isOpen && Boolean(getOpenToolbarPopupPanel(shapesMenu));
    const applyState = () => {
      if (isOpen) {
        setToolbarPopupElementState(
          { toggle: getNotesToggle(), panel: getNotesMenu() },
          false
        );
        setToolbarPopupElementState(
          { toggle: getPenToggle(), panel: getPenPanel(), card: getPenCard() },
          false
        );
        setToolbarPopupElementState(
          {
            toggle: getEraserToggle(),
            panel: getEraserPanel(),
            card: getEraserCard(),
          },
          false
        );
        if (typeof updateShapeMenuActive === "function") {
          updateShapeMenuActive();
        }
      }
      setToolbarPopupElementState(
        { toggle: shapesToggle, panel: shapesMenu },
        isOpen
      );
      syncToolbarPopupState();
    };
    if (shouldUseSwitchMode) {
      withToolbarPopupSwitch(applyState);
      return;
    }
    applyState();
  }

  function toggleShapesMenu() {
    const shapesMenu = getShapesMenu();
    const shapesToggle = getShapesToggle();
    if (!shapesMenu || !shapesToggle) return;
    setShapesMenuState(!shapesMenu.classList.contains("is-open"));
  }

  function closeShapesMenu() {
    setShapesMenuState(false);
  }

  function setNotesMenuState(isOpen) {
    const notesMenu = getNotesMenu();
    const notesToggle = getNotesToggle();
    if (!notesMenu || !notesToggle) return;
    const shouldUseSwitchMode =
      isOpen && Boolean(getOpenToolbarPopupPanel(notesMenu));
    const applyState = () => {
      if (isOpen) {
        setToolbarPopupElementState(
          { toggle: getShapesToggle(), panel: getShapesMenu() },
          false
        );
        setToolbarPopupElementState(
          { toggle: getPenToggle(), panel: getPenPanel(), card: getPenCard() },
          false
        );
        setToolbarPopupElementState(
          {
            toggle: getEraserToggle(),
            panel: getEraserPanel(),
            card: getEraserCard(),
          },
          false
        );
      }
      setToolbarPopupElementState(
        { toggle: notesToggle, panel: notesMenu },
        isOpen
      );
      syncToolbarPopupState();
    };
    if (shouldUseSwitchMode) {
      withToolbarPopupSwitch(applyState);
      return;
    }
    applyState();
  }

  function toggleNotesMenu() {
    const notesMenu = getNotesMenu();
    const notesToggle = getNotesToggle();
    if (!notesMenu || !notesToggle) return;
    setNotesMenuState(!notesMenu.classList.contains("is-open"));
  }

  function closeNotesMenu() {
    setNotesMenuState(false);
  }

  return {
    closeEraserPanel,
    closeNotesMenu,
    closePenPanel,
    closeShapesMenu,
    setEraserPanelState,
    setNotesMenuState,
    setPenPanelState,
    setShapesMenuState,
    syncToolbarPopupState,
    toggleNotesMenu,
    toggleShapesMenu,
  };
}
