import { loadHtmlIntoContainer } from "../../core/html-loader.js";

export function initializeSettingsTab() {
  return loadHtmlIntoContainer(
    "settingsTabContainer",
    "features/settings/settings.html",
    "Settings"
  );
}
