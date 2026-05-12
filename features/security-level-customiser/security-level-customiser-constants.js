(function attachSecurityLevelCustomiserConstants(global) {
  if (global.MyToolboxSecurityLevelCustomiserConstants) {
    return;
  }

  const SECURITY_LEVEL_CONTAINER_SELECTOR =
    "[data-testid='issue.views.issue-base.foundation.header.header-actions.security-level-icon']";
  const SECURITY_LEVEL_MENU_ITEM_SELECTOR =
    "[data-testid='issue-field.security-level.ui.security-level-view.menu-item.security-level-menu-item']";
  const SECURITY_LEVEL_BUTTON_SELECTOR =
    "button[data-testid='issue-field.security-level.ui.security-level-view.menu-item.button']";
  const SECURITY_LEVEL_DROPDOWN_SELECTOR =
    "[data-testid='issue-field.security-level.ui.security-level-view.dropdown--menu']";
  const SECURITY_LEVEL_OPTION_SELECTOR =
    "[data-testid^='issue-field.security-level.ui.security-level-view.dropdown-select--option']";
  const SECURITY_LEVEL_ITEM_SELECTOR =
    "[data-testid='issue-field.security-level.ui.security-level-view.dropdown.item-container']";
  const REMOVE_SECURITY_LEVEL_SELECTOR =
    "[data-testid='issue-field.security-level.ui.security-level-view.dropdown.remove-item.remove-security-level-item-container']";

  global.MyToolboxSecurityLevelCustomiserConstants = {
    BUTTON_CLASS: "my-toolbox-security-level-button",
    HAS_VALUE_CLASS: "my-toolbox-security-level-has-value",
    ISSUE_KEY_PATTERN: /\b[A-Z][A-Z0-9]+-\d+\b/,
    ANIMATION_ATTR: "data-my-toolbox-security-level-animation",
    LEGACY_VALUE_CLASS: "my-toolbox-security-level-value",
    LOADING_ATTR: "data-my-toolbox-security-level-loading",
    RAINBOW_ATTR: "data-my-toolbox-security-level-rainbow",
    REFRESH_MIN_INTERVAL_MS: 120,
    REMOVE_SECURITY_LEVEL_SELECTOR,
    SECURITY_LEVEL_BUTTON_SELECTOR,
    SECURITY_LEVEL_CONTAINER_SELECTOR,
    SECURITY_LEVEL_DROPDOWN_SELECTOR,
    SECURITY_LEVEL_ITEM_SELECTOR,
    SECURITY_LEVEL_MENU_ITEM_SELECTOR,
    SECURITY_LEVEL_OPTION_SELECTOR,
    STYLE_ID: "my-toolbox-security-level-customiser-style",
    VALUE_ATTR: "data-my-toolbox-security-level-value",
  };
})(globalThis);
