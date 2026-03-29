export function setSideMenuState(
  sideMenu,
  menuToggle,
  pageContainer,
  isOpen,
  options = {}
) {
  if (!sideMenu || !menuToggle) return;
  const { animate = true } = options;

  sideMenu.classList.remove("animating-open", "animating-close");

  if (!animate) {
    sideMenu.classList.toggle("open", isOpen);
    menuToggle.classList.toggle("active", isOpen);
    if (pageContainer) {
      pageContainer.classList.toggle("shifted", isOpen);
    }
    return;
  }

  if (isOpen) {
    sideMenu.classList.add("open", "animating-open");
    menuToggle.classList.add("active");
    if (pageContainer) {
      pageContainer.classList.add("shifted");
    }
    sideMenu.addEventListener(
      "animationend",
      () => sideMenu.classList.remove("animating-open"),
      { once: true }
    );
    return;
  }

  if (!sideMenu.classList.contains("open")) {
    menuToggle.classList.remove("active");
    if (pageContainer) {
      pageContainer.classList.remove("shifted");
    }
    return;
  }

  sideMenu.classList.add("animating-close");
  menuToggle.classList.remove("active");
  if (pageContainer) {
    pageContainer.classList.remove("shifted");
  }
  sideMenu.addEventListener(
    "animationend",
    () => {
      sideMenu.classList.remove("animating-close");
      sideMenu.classList.remove("open");
    },
    { once: true }
  );
}

export function setActiveTabLinkState(tabLinks, tabGroups, targetTabId) {
  const targetLink = Array.from(tabLinks).find(
    (link) => link.dataset.tab === targetTabId
  );
  if (!targetLink) {
    return false;
  }

  tabLinks.forEach((link) => link.classList.remove("active"));
  targetLink.classList.add("active");

  const linkGroup = targetLink.closest(".tab-group");
  if (linkGroup) {
    linkGroup.classList.add("is-open");
    const toggle = linkGroup.querySelector(".tab-group-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
  }

  return true;
}

export function bindTabGroupToggles(tabGroups) {
  tabGroups.forEach((group) => {
    const toggle = group.querySelector(".tab-group-toggle");
    if (!toggle) return;
    const hasActive = group.querySelector(".tab-link.active");
    if (hasActive) {
      group.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    } else {
      toggle.setAttribute(
        "aria-expanded",
        group.classList.contains("is-open") ? "true" : "false"
      );
    }
    toggle.addEventListener("click", () => {
      const isOpen = group.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}
