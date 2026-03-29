import {
  clearLinkItemHighlight as clearLinkItemHighlightUi,
  updateLinkItemHighlight as updateLinkItemHighlightUi,
} from "./board-link-highlight-ui.js";

export function createBoardLinkHighlightController({
  getBoardItems,
  getItemElements,
  getItemSelectionLayer,
}) {
  let sourceSelection = null;
  let hoverSelection = null;

  function getSelectionElement(kind) {
    return kind === "source" ? sourceSelection : hoverSelection;
  }

  function setSelectionElement(kind, element) {
    if (kind === "source") {
      sourceSelection = element;
    } else {
      hoverSelection = element;
    }
  }

  function clearLinkItemHighlight(kind) {
    setSelectionElement(
      kind,
      clearLinkItemHighlightUi(getSelectionElement(kind))
    );
  }

  function updateLinkItemHighlight(kind, id) {
    setSelectionElement(
      kind,
      updateLinkItemHighlightUi({
        id,
        kind,
        items: getBoardItems(),
        itemElements: getItemElements(),
        itemSelectionLayer: getItemSelectionLayer(),
        selectionElement: getSelectionElement(kind),
      })
    );
  }

  return {
    clearLinkItemHighlight,
    updateLinkItemHighlight,
  };
}
