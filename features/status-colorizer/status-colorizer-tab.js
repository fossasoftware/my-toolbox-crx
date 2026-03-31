import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeStatusColorizerTab() {
  return loadHtmlIntoContainer(
    "statusColorizerTabContainer",
    "features/status-colorizer/status-colorizer.html",
    "Status Colorizer"
  );
}
