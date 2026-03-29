import { setActiveTabLinkState } from "./options-navigation.js";

export function createOptionsTabController({
  defaultActiveTabId,
  refreshTableEmptyStates,
  saveActiveOptionsTabPreference,
  showToast,
  tabGroups,
  tabLinks,
  tabPanes,
}) {
  const activateTab = async (targetTabId, options = {}) => {
    const { persist = true } = options;
    const targetPane = document.getElementById(targetTabId);

    if (!targetPane || !setActiveTabLinkState(tabLinks, tabGroups, targetTabId)) {
      console.error(`Tab pane with ID ${targetTabId} not found!`);
      return false;
    }

    tabPanes.forEach((pane) => pane.classList.remove("active"));
    targetPane.classList.add("active");

    requestAnimationFrame(() => {
      refreshTableEmptyStates(targetPane);
    });

    if (persist) {
      const result = await saveActiveOptionsTabPreference(targetTabId);
      if (!result.ok) {
        console.error("Error saving active options tab preference:", result.error);
        showToast("toastErrorSaving");
      }
    }

    return true;
  };

  const bind = () => {
    tabLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateTab(link.dataset.tab);
      });
    });
  };

  const activateInitial = async (initialActiveTabId) => {
    if (!(await activateTab(initialActiveTabId, { persist: false }))) {
      await activateTab(defaultActiveTabId, { persist: false });
    }
  };

  return {
    activateInitial,
    activateTab,
    bind,
  };
}
