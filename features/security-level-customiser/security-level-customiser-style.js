(function attachSecurityLevelCustomiserStyle(global) {
  if (global.MyToolboxSecurityLevelCustomiserStyle) {
    return;
  }

  const constants = global.MyToolboxSecurityLevelCustomiserConstants || {};
  const {
    ANIMATION_ATTR,
    LEGACY_VALUE_CLASS,
    LOADING_ATTR,
    RAINBOW_ATTR,
    SECURITY_LEVEL_BUTTON_SELECTOR,
    SECURITY_LEVEL_MENU_ITEM_SELECTOR,
    STYLE_ID,
    VALUE_ATTR,
  } = constants;

  function buildSecurityLevelCss() {
    return `
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  background: var(--ds-surface, #FFFFFF);
  cursor: pointer;
  overflow: hidden;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  background: var(--ds-surface, #FFFFFF);
  cursor: pointer;
  overflow: hidden;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}]:hover,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]:hover {
  background: var(--ds-surface, #FFFFFF);
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}]:active,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]:active {
  background: var(--ds-surface, #FFFFFF);
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${ANIMATION_ATTR}="false"]:hover,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${ANIMATION_ATTR}="false"]:hover,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="false"]:hover,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="false"]:hover {
  background: var(--ds-background-neutral-subtle-hovered, rgba(9, 30, 66, 0.08));
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${ANIMATION_ATTR}="false"]:active,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${ANIMATION_ATTR}="false"]:active,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="false"]:active,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="false"]:active {
  background: var(--ds-background-neutral-subtle-pressed, rgba(9, 30, 66, 0.14));
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}]:focus-within,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]:focus-within {
  outline: 2px solid var(--ds-border-focused, #388BFF);
  outline-offset: 2px;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}]::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  padding: 1px;
  border-radius: inherit;
  background: var(--ds-border, #DFE1E6);
  background-size: 220% 100%;
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="true"]::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="true"]::before {
  background: linear-gradient(90deg, #FF5630, #FFAB00, #36B37E, #00B8D9, #6554C0, #FF5630);
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${ANIMATION_ATTR}="true"]::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${ANIMATION_ATTR}="true"]::before {
  transition:
    filter 120ms ease,
    opacity 120ms ease,
    padding 120ms ease;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:hover::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:hover::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:focus-within::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:focus-within::before {
  padding: 2px;
  background: linear-gradient(90deg, #FF1744, #FFEA00, #00E676, #00E5FF, #7C4DFF, #FF2D95, #FF1744);
  background-size: 260% 100%;
  filter: saturate(1.7) brightness(1.18) drop-shadow(0 0 4px rgba(255, 86, 48, 0.36)) drop-shadow(0 0 6px rgba(0, 184, 217, 0.28));
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:active::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}][${RAINBOW_ATTR}="true"][${ANIMATION_ATTR}="true"]:active::before {
  padding: 2px;
  filter: saturate(1.9) brightness(1.08) drop-shadow(0 0 3px rgba(255, 86, 48, 0.32)) drop-shadow(0 0 5px rgba(0, 184, 217, 0.24));
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR},
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} {
  position: relative !important;
  z-index: 1 !important;
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-radius: 3px 0 0 3px !important;
  box-shadow: none !important;
  flex: 0 0 auto !important;
  max-width: none !important;
  outline: none !important;
  overflow: visible !important;
  padding-inline: 0 !important;
  width: auto !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span {
  align-items: center !important;
  display: inline-flex !important;
  max-width: none !important;
  min-width: max-content !important;
  overflow: visible !important;
  padding-inline: 8px !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span > span:not([aria-hidden="true"]):not(.${LEGACY_VALUE_CLASS}) {
  display: none !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span > span[aria-hidden="true"]:first-child,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span > span[aria-hidden="true"]:first-child {
  align-items: center !important;
  align-self: center !important;
  display: inline-flex !important;
  flex: 0 0 auto !important;
  margin-inline-start: 0 !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span > span[aria-hidden="true"]:first-child svg,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} > span > span[aria-hidden="true"]:first-child svg {
  display: block !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR}::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR}::after,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR}::before,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR}::after {
  content: none !important;
  display: none !important;
  border: 0 !important;
  box-shadow: none !important;
  background: none !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} *,
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} * {
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}]:hover ${SECURITY_LEVEL_BUTTON_SELECTOR},
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]:hover ${SECURITY_LEVEL_BUTTON_SELECTOR},
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}]:active ${SECURITY_LEVEL_BUTTON_SELECTOR},
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]:active ${SECURITY_LEVEL_BUTTON_SELECTOR} {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
}
${SECURITY_LEVEL_BUTTON_SELECTOR} .${LEGACY_VALUE_CLASS} {
  display: none;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${VALUE_ATTR}] ${SECURITY_LEVEL_BUTTON_SELECTOR} .${LEGACY_VALUE_CLASS} {
  display: inline-flex;
  align-items: center;
  align-self: center;
  line-height: calc(var(--my-toolbox-security-level-text-size, 14px) + 6px);
  height: calc(var(--my-toolbox-security-level-text-size, 14px) + 6px);
  min-width: max-content;
  margin-inline-start: 8px;
  padding-inline: 0;
  color: var(--ds-text, #292a2e);
  cursor: pointer;
  font: var(--ds-font-body, normal 400 0.875rem / 1.25rem "Atlassian Sans", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif);
  font-size: var(--my-toolbox-security-level-text-size, 14px);
  pointer-events: none;
  transform: translateY(1px);
  white-space: nowrap;
}
${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]::after {
  content: "";
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-self: center;
  width: 148px;
  height: 16px;
  margin-inline: 0 8px;
  border-radius: 3px;
  background:
    linear-gradient(
      90deg,
      rgba(9, 30, 66, 0.08) 0%,
      rgba(9, 30, 66, 0.14) 42%,
      rgba(9, 30, 66, 0.08) 84%
    );
  background-size: 220% 100%;
  animation: my-toolbox-security-level-loading 1.1s linear infinite;
}
@keyframes my-toolbox-security-level-loading {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${SECURITY_LEVEL_MENU_ITEM_SELECTOR}[${LOADING_ATTR}]::after {
    animation: none;
  }
}
`;
  }

  function ensureSecurityLevelStyle() {
    const css = buildSecurityLevelCss();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
    }
    style.id = STYLE_ID;
    if (style.textContent !== css) {
      style.textContent = css;
    }
    if (!style.parentElement) {
      (document.head || document.documentElement).append(style);
    }
  }

  global.MyToolboxSecurityLevelCustomiserStyle = {
    buildSecurityLevelCss,
    ensureSecurityLevelStyle,
  };
})(globalThis);
