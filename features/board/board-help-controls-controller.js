export function createBoardHelpControlsController({
  assignHelpElements,
  closeHelpPanelRef,
  documentRef,
  getHelpControls,
  getHelpButton,
  getHelpPanel,
  getText,
  windowRef,
}) {
  let openingTimeout = 0;

  function clearOpeningTimeout() {
    if (openingTimeout) {
      windowRef.clearTimeout(openingTimeout);
      openingTimeout = 0;
    }
  }

  function setHelpPanelState(isOpen) {
    const helpControls = getHelpControls();
    const helpButton = getHelpButton();
    const helpPanel = getHelpPanel();
    if (!helpControls || !helpButton || !helpPanel) return;

    const next = Boolean(isOpen);
    if (next) {
      clearOpeningTimeout();
      helpControls.classList.add("is-opening");
      openingTimeout = windowRef.setTimeout(() => {
        openingTimeout = 0;
        getHelpControls()?.classList.remove("is-opening");
      }, 620);
    } else {
      clearOpeningTimeout();
      helpControls.classList.remove("is-opening");
    }
    helpPanel.classList.toggle("is-open", next);
    helpPanel.setAttribute("aria-hidden", next ? "false" : "true");
    helpButton.setAttribute("aria-expanded", next ? "true" : "false");
    helpControls.classList.toggle("is-expanded", next);
  }

  function closeHelpPanel() {
    setHelpPanelState(false);
  }

  function setupHelpControls() {
    const helpControls = documentRef.getElementById("boardHelpControls");
    const helpButton = documentRef.getElementById("boardHelpBtn");
    const helpPanel = documentRef.getElementById("boardHelpPanel");

    assignHelpElements({ helpButton, helpControls, helpPanel });
    if (!helpControls || !helpButton || !helpPanel) return;

    helpButton.setAttribute("aria-label", getText("boardHelpOpen"));

    helpButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = helpPanel.classList.contains("is-open");
      setHelpPanelState(!isOpen);
    });

    helpControls.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    helpControls.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    documentRef.addEventListener(
      "pointerdown",
      (event) => {
        const activeHelpControls = getHelpControls();
        if (!activeHelpControls) return;
        if (activeHelpControls.contains(event.target)) return;
        closeHelpPanelRef();
      },
      true
    );

    windowRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeHelpPanelRef();
      }
    });
  }

  return {
    closeHelpPanel,
    setHelpPanelState,
    setupHelpControls,
  };
}
