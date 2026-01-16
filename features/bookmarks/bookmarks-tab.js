export async function initializeBookmarksTab() {
  const container = document.getElementById("bookmarksTabContainer");
  if (!container) {
    console.error("Bookmarks: Missing tab container.");
    return false;
  }
  try {
    const url = chrome.runtime.getURL("features/bookmarks/bookmarks.html");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error("Bookmarks: Failed to load tab markup.", error);
    return false;
  }
}
