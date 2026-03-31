import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeRowHighlighterTab() {
  return loadHtmlIntoContainer(
    "rowHighlighterTabContainer",
    "features/row-highlighter/row-highlighter.html",
    "Row Highlighter"
  );
}
