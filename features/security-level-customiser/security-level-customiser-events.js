(function attachSecurityLevelCustomiserEvents(global) {
  if (global.MyToolboxSecurityLevelCustomiserEvents) {
    return;
  }

  const constants = global.MyToolboxSecurityLevelCustomiserConstants || {};
  const issueKeyUtils = global.MyToolboxSecurityLevelCustomiserIssueKey || {};
  const dom = global.MyToolboxSecurityLevelCustomiserDom || {};
  const {
    LOADING_ATTR,
    REMOVE_SECURITY_LEVEL_SELECTOR,
    SECURITY_LEVEL_BUTTON_SELECTOR,
    SECURITY_LEVEL_DROPDOWN_SELECTOR,
    SECURITY_LEVEL_ITEM_SELECTOR,
    SECURITY_LEVEL_MENU_ITEM_SELECTOR,
    SECURITY_LEVEL_OPTION_SELECTOR,
    VALUE_ATTR,
  } = constants;
  const { normalizeText = (text) => text || "" } = issueKeyUtils;
  const { isVisibleElement = () => false } = dom;

  function getSecurityLevelFromOption(option) {
    if (!option || option.querySelector(REMOVE_SECURITY_LEVEL_SELECTOR)) {
      return "";
    }

    const item = option.querySelector(SECURITY_LEVEL_ITEM_SELECTOR);
    return normalizeText(item?.textContent || option.textContent);
  }

  function getSecurityLevelButtonFromContainer(container) {
    return container
      ?.querySelectorAll?.(SECURITY_LEVEL_BUTTON_SELECTOR)
      ? [...container.querySelectorAll(SECURITY_LEVEL_BUTTON_SELECTOR)].find(
          (button) => isVisibleElement(button)
        )
      : null;
  }

  function getSecurityLevelMenuItemFromEvent(event) {
    const targetMatch = event.target?.closest?.(SECURITY_LEVEL_MENU_ITEM_SELECTOR);
    if (targetMatch) {
      return targetMatch;
    }

    return (
      document
        .elementsFromPoint?.(event.clientX, event.clientY)
        ?.map((element) =>
          element.matches?.(SECURITY_LEVEL_MENU_ITEM_SELECTOR)
            ? element
            : element.closest?.(SECURITY_LEVEL_MENU_ITEM_SELECTOR)
        )
        .find(Boolean) || null
    );
  }

  function getForwardedMouseEventCoordinates(button, sourceEvent) {
    if (
      Number.isFinite(sourceEvent.clientX) &&
      Number.isFinite(sourceEvent.clientY)
    ) {
      return {
        clientX: sourceEvent.clientX,
        clientY: sourceEvent.clientY,
      };
    }

    const rect = button.getBoundingClientRect();
    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };
  }

  function dispatchForwardedMouseEvent(button, type, sourceEvent) {
    const { clientX, clientY } = getForwardedMouseEventCoordinates(
      button,
      sourceEvent
    );
    button.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        button: 0,
        buttons: type === "mouseup" || type === "click" ? 0 : 1,
        cancelable: true,
        clientX,
        clientY,
        view: global,
      })
    );
  }

  function openSecurityLevelMenu(button, sourceEvent) {
    button.focus?.({ preventScroll: true });
    ["mousedown", "mouseup", "click"].forEach((type) => {
      dispatchForwardedMouseEvent(button, type, sourceEvent);
    });
  }

  function createSecurityLevelEventHandlers({
    fetchSecurityLevel,
    getCurrentIssueKey,
    isEnabled = () => true,
    scheduleSecurityLevelRefresh,
    setCachedSecurityLevel,
  }) {
    function handleSecurityLevelOptionClick(event) {
      if (!isEnabled()) {
        return;
      }

      const option = event.target?.closest?.(SECURITY_LEVEL_OPTION_SELECTOR);
      if (!option || !option.closest(SECURITY_LEVEL_DROPDOWN_SELECTOR)) {
        return;
      }

      const issueKey = getCurrentIssueKey();
      if (!issueKey) {
        return;
      }

      setCachedSecurityLevel(issueKey, getSecurityLevelFromOption(option));
      scheduleSecurityLevelRefresh();
      window.setTimeout(() => {
        fetchSecurityLevel(issueKey, { force: true });
      }, 900);
    }

    function handleSecurityLevelContainerClick(event) {
      if (!isEnabled()) {
        return;
      }

      const container = getSecurityLevelMenuItemFromEvent(event);
      if (
        !container?.hasAttribute(VALUE_ATTR) &&
        !container?.hasAttribute(LOADING_ATTR)
      ) {
        return;
      }

      if (
        event.target.closest?.(SECURITY_LEVEL_BUTTON_SELECTOR) ||
        event.target.closest?.(SECURITY_LEVEL_DROPDOWN_SELECTOR)
      ) {
        return;
      }

      const button = getSecurityLevelButtonFromContainer(container);
      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openSecurityLevelMenu(button, event);
    }

    function handleSecurityLevelContainerKeydown(event) {
      if (!isEnabled()) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const container = event.target?.closest?.(SECURITY_LEVEL_MENU_ITEM_SELECTOR);
      if (
        !container?.hasAttribute(VALUE_ATTR) &&
        !container?.hasAttribute(LOADING_ATTR)
      ) {
        return;
      }

      event.preventDefault();
      handleSecurityLevelContainerClick(event);
    }

    return {
      handleSecurityLevelContainerClick,
      handleSecurityLevelContainerKeydown,
      handleSecurityLevelOptionClick,
    };
  }

  global.MyToolboxSecurityLevelCustomiserEvents = {
    createSecurityLevelEventHandlers,
    getSecurityLevelButtonFromContainer,
    getSecurityLevelFromOption,
    getSecurityLevelMenuItemFromEvent,
    openSecurityLevelMenu,
  };
})(globalThis);
