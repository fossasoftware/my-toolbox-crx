export async function initializeRowHighlighterTab() {
  const container = document.getElementById("rowHighlighterTabContainer");
  if (!container) {
    console.error("Row Highlighter: Missing tab container.");
    return false;
  }
  try {
    const url = chrome.runtime.getURL(
      "features/row-highlighter/row-highlighter.html"
    );
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error("Row Highlighter: Failed to load tab markup.", error);
    return false;
  }
}
