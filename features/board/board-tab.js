import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeBoardTab() {
  return loadHtmlIntoContainer("boardTabContainer", "features/board/board.html", "Board");
}
