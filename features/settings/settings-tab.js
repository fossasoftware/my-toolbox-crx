export async function initializeSettingsTab() {
  const container = document.getElementById("settingsTabContainer");
  if (!container) {
    console.error("Settings: Missing settings tab container.");
    return false;
  }
  try {
    const url = chrome.runtime.getURL("features/settings/settings.html");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error("Settings: Failed to load settings tab markup.", error);
    return false;
  }
}
