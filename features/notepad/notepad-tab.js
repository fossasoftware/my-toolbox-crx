import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeNotepadTab() {
  return loadHtmlIntoContainer(
    "notepadTabContainer",
    "features/notepad/notepad.html",
    "Notepad"
  );
}
