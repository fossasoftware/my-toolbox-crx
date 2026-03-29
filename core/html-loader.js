export async function loadHtmlIntoContainer(
  containerId,
  resourcePath,
  featureName
) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`${featureName}: Missing tab container.`);
    return false;
  }

  try {
    const response = await fetch(chrome.runtime.getURL(resourcePath));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    container.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error(`${featureName}: Failed to load tab markup.`, error);
    return false;
  }
}
