(function attachSecurityLevelCustomiserDom(global) {
  if (global.MyToolboxSecurityLevelCustomiserDom) {
    return;
  }

  const constants = global.MyToolboxSecurityLevelCustomiserConstants || {};
  const issueKeyUtils = global.MyToolboxSecurityLevelCustomiserIssueKey || {};
  const style = global.MyToolboxSecurityLevelCustomiserStyle || {};
  const {
    BUTTON_CLASS,
    HAS_VALUE_CLASS,
    ANIMATION_ATTR,
    LEGACY_VALUE_CLASS,
    LOADING_ATTR,
    RAINBOW_ATTR,
    SECURITY_LEVEL_BUTTON_SELECTOR,
    SECURITY_LEVEL_CONTAINER_SELECTOR,
    SECURITY_LEVEL_MENU_ITEM_SELECTOR,
    VALUE_ATTR,
  } = constants;
  const { normalizeText = (text) => text || "" } = issueKeyUtils;
  const { ensureSecurityLevelStyle = () => {} } = style;

  function collectSecurityLevelButtons() {
    const buttons = new Set(
      document.querySelectorAll(SECURITY_LEVEL_BUTTON_SELECTOR)
    );
    document
      .querySelectorAll(SECURITY_LEVEL_CONTAINER_SELECTOR)
      .forEach((container) => {
        const button = container.querySelector("button");
        if (button) {
          buttons.add(button);
        }
      });
    return [...buttons];
  }

  function collectSecurityLevelContainers() {
    return [
      ...document.querySelectorAll(SECURITY_LEVEL_MENU_ITEM_SELECTOR),
    ];
  }

  function getButtonContentContainer(button) {
    return button.querySelector(":scope > span") || button;
  }

  function getButtonSecurityContainer(button) {
    return (
      button.closest(SECURITY_LEVEL_MENU_ITEM_SELECTOR) ||
      button.closest(SECURITY_LEVEL_CONTAINER_SELECTOR) ||
      button.parentElement
    );
  }

  function cleanupButtonCustomisation(button) {
    const contentContainer = getButtonContentContainer(button);
    button.classList.remove(BUTTON_CLASS, HAS_VALUE_CLASS);
    button.querySelector(`.${LEGACY_VALUE_CLASS}`)?.remove();
    button.removeAttribute(VALUE_ATTR);
    contentContainer.removeAttribute(VALUE_ATTR);
    if (
      button.getAttribute("data-my-toolbox-security-level-aria") === "true"
    ) {
      button.removeAttribute("aria-label");
      button.removeAttribute("data-my-toolbox-security-level-aria");
    }
  }

  function applySecurityLevelPresentationSettings(
    securityContainer,
    preferences = {}
  ) {
    if (!securityContainer) {
      return;
    }

    const textSize = Number.isFinite(Number(preferences.textSize))
      ? Number(preferences.textSize)
      : 14;
    securityContainer.style.setProperty(
      "--my-toolbox-security-level-text-size",
      `${textSize}px`
    );
    securityContainer.setAttribute(
      RAINBOW_ATTR,
      preferences.rainbowBorderEnabled === false ? "false" : "true"
    );
    securityContainer.setAttribute(
      ANIMATION_ATTR,
      preferences.animationEnabled === false ? "false" : "true"
    );
  }

  function clearSecurityLevelPresentationSettings(securityContainer) {
    if (!securityContainer) {
      return;
    }

    securityContainer.style.removeProperty(
      "--my-toolbox-security-level-text-size"
    );
    securityContainer.removeAttribute(RAINBOW_ATTR);
    securityContainer.removeAttribute(ANIMATION_ATTR);
  }

  function setButtonSecurityLevelLabel(button, securityLevelName) {
    const contentContainer = getButtonContentContainer(button);
    let label = contentContainer.querySelector(`:scope > .${LEGACY_VALUE_CLASS}`);

    if (!label) {
      label = document.createElement("span");
      label.className = LEGACY_VALUE_CLASS;
      label.setAttribute("aria-hidden", "true");
      contentContainer.append(label);
    }

    if (label.textContent !== securityLevelName) {
      label.textContent = securityLevelName;
    }
  }

  function isVisibleElement(element) {
    if (!element?.getBoundingClientRect) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function cleanupLegacySecurityLevelArtifacts() {
    const legacySelector = [
      "#my-toolbox-security-level-label",
      ".my-toolbox-security-level-label",
    ].join(",");
    document
      .querySelectorAll(legacySelector)
      .forEach((element) => {
        element.remove();
      });

    document
      .querySelectorAll(".my-toolbox-security-level-menu-item")
      .forEach((element) => {
        element.classList.remove("my-toolbox-security-level-menu-item");
      });
    document
      .querySelectorAll(SECURITY_LEVEL_CONTAINER_SELECTOR)
      .forEach((container) => {
        container.removeAttribute(VALUE_ATTR);
        container.removeAttribute(LOADING_ATTR);
        clearSecurityLevelPresentationSettings(container);
      });
  }

  function hideSecurityLevelLabel() {
    collectSecurityLevelContainers().forEach((container) => {
      container.removeAttribute(VALUE_ATTR);
      container.removeAttribute(LOADING_ATTR);
      clearSecurityLevelPresentationSettings(container);
    });
  }

  function removeSecurityLevelValue(button) {
    cleanupButtonCustomisation(button);
    hideSecurityLevelLabel();
  }

  function setSecurityLevelContainerLoading(securityContainer, preferences) {
    ensureSecurityLevelStyle();
    applySecurityLevelPresentationSettings(securityContainer, preferences);
    if (!securityContainer.hasAttribute(LOADING_ATTR)) {
      securityContainer.setAttribute(LOADING_ATTR, "true");
    }
    securityContainer.removeAttribute(VALUE_ATTR);
  }

  function applySecurityLevelContainerValue(
    securityContainer,
    securityLevelName,
    preferences
  ) {
    const value = normalizeText(securityLevelName);
    if (!value || !securityContainer) {
      return;
    }

    ensureSecurityLevelStyle();
    applySecurityLevelPresentationSettings(securityContainer, preferences);
    if (securityContainer.getAttribute(VALUE_ATTR) !== value) {
      securityContainer.setAttribute(VALUE_ATTR, value);
    }
    securityContainer.removeAttribute(LOADING_ATTR);
  }

  function applySecurityLevelValue(button, securityLevelName, preferences) {
    const value = normalizeText(securityLevelName);
    if (!value) {
      removeSecurityLevelValue(button);
      return;
    }

    ensureSecurityLevelStyle();
    const securityContainer = getButtonSecurityContainer(button);
    if (!securityContainer) {
      return;
    }

    button.classList.add(BUTTON_CLASS, HAS_VALUE_CLASS);
    button.setAttribute(VALUE_ATTR, value);
    button.setAttribute("aria-label", `Security level: ${value}`);
    button.setAttribute("data-my-toolbox-security-level-aria", "true");
    setButtonSecurityLevelLabel(button, value);
    applySecurityLevelContainerValue(securityContainer, value, preferences);
  }

  function paintSecurityLevelButtons(
    issueKey,
    { getStoredSecurityLevel, hasRecentFetchFailure, preferences = {} }
  ) {
    const cached = issueKey ? getStoredSecurityLevel(issueKey) : null;
    const buttons = collectSecurityLevelButtons();
    const containers = collectSecurityLevelContainers();
    cleanupLegacySecurityLevelArtifacts();
    if (!issueKey) {
      buttons.forEach(cleanupButtonCustomisation);
      hideSecurityLevelLabel();
      return;
    }

    const targetButton =
      buttons.find((button) => isVisibleElement(button)) || buttons[0];
    const targetContainer =
      (targetButton && getButtonSecurityContainer(targetButton)) ||
      containers.find((container) => isVisibleElement(container)) ||
      containers[0];
    if (!targetContainer) {
      return;
    }

    if (!cached && hasRecentFetchFailure(issueKey)) {
      buttons.forEach(cleanupButtonCustomisation);
      hideSecurityLevelLabel();
      return;
    }

    if (!cached) {
      buttons.forEach(cleanupButtonCustomisation);
      setSecurityLevelContainerLoading(targetContainer, preferences);
      return;
    }

    if (!cached.name) {
      buttons.forEach(cleanupButtonCustomisation);
      hideSecurityLevelLabel();
      return;
    }

    if (targetButton) {
      buttons
        .filter((button) => button !== targetButton)
        .forEach(cleanupButtonCustomisation);
      applySecurityLevelValue(targetButton, cached.name, preferences);
      return;
    }

    applySecurityLevelContainerValue(targetContainer, cached.name, preferences);
  }

  function resetSecurityLevelCustomisation() {
    cleanupLegacySecurityLevelArtifacts();
    collectSecurityLevelButtons().forEach(cleanupButtonCustomisation);
    hideSecurityLevelLabel();
  }

  global.MyToolboxSecurityLevelCustomiserDom = {
    applySecurityLevelContainerValue,
    applySecurityLevelPresentationSettings,
    applySecurityLevelValue,
    clearSecurityLevelPresentationSettings,
    cleanupButtonCustomisation,
    cleanupLegacySecurityLevelArtifacts,
    collectSecurityLevelButtons,
    collectSecurityLevelContainers,
    getButtonSecurityContainer,
    hideSecurityLevelLabel,
    isVisibleElement,
    paintSecurityLevelButtons,
    removeSecurityLevelValue,
    resetSecurityLevelCustomisation,
    setButtonSecurityLevelLabel,
    setSecurityLevelContainerLoading,
  };
})(globalThis);
