export async function initializeNotepadTab() {
  const container = document.getElementById("notepadTabContainer");
  if (!container) {
    console.error("Notepad: Missing tab container.");
    return false;
  }
  try {
    const url = chrome.runtime.getURL("features/notepad/notepad.html");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error("Notepad: Failed to load tab markup.", error);
    return false;
  }
}
