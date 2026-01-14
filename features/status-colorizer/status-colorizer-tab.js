export async function initializeStatusColorizerTab() {
  const container = document.getElementById("statusColorizerTabContainer");
  if (!container) {
    console.error("Status Colorizer: Missing tab container.");
    return false;
  }
  try {
    const url = chrome.runtime.getURL(
      "features/status-colorizer/status-colorizer.html"
    );
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error("Status Colorizer: Failed to load tab markup.", error);
    return false;
  }
}
