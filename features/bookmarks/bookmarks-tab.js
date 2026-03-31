import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeBookmarksTab() {
  return loadHtmlIntoContainer(
    "bookmarksTabContainer",
    "features/bookmarks/bookmarks.html",
    "Bookmarks"
  );
}
