// Lightweight custom tooltip for the notepad toolbar/view/search icon buttons.
// The toolbar dock uses `overflow: hidden`, which would clip a pure-CSS
// `::after` tooltip, so a single shared element is appended to <body> and
// positioned with `position: fixed` to escape any ancestor clipping.

const TOOLTIP_SELECTOR =
  ".notepad-toolbar-dock .icon-button, .notepad-view-switch .icon-button, .notepad-search-toggle";

let tooltipInitialized = false;

export function initNotepadTooltip({ root } = {}) {
  if (!root || tooltipInitialized) {
    return;
  }
  tooltipInitialized = true;

  const tip = document.createElement("div");
  tip.className = "notepad-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);

  let activeTarget = null;

  const resolveTarget = (node) =>
    (node && typeof node.closest === "function"
      ? node.closest(TOOLTIP_SELECTOR)
      : null);

  const hide = () => {
    activeTarget = null;
    tip.classList.remove("is-visible");
    tip.setAttribute("aria-hidden", "true");
  };

  const show = (target) => {
    const label = target.getAttribute("aria-label");
    if (!label) {
      hide();
      return;
    }
    activeTarget = target;
    tip.textContent = label;
    tip.classList.add("is-visible");
    tip.setAttribute("aria-hidden", "false");

    const rect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    let top = rect.top - tipRect.height - 8;
    if (top < 8) {
      top = rect.bottom + 8;
    }
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  };

  root.addEventListener("pointerover", (event) => {
    const target = resolveTarget(event.target);
    if (target && target !== activeTarget) {
      show(target);
    }
  });
  root.addEventListener("pointerout", (event) => {
    const target = resolveTarget(event.target);
    if (target && !target.contains(event.relatedTarget)) {
      hide();
    }
  });
  root.addEventListener("focusin", (event) => {
    const target = resolveTarget(event.target);
    if (target) {
      show(target);
    } else {
      hide();
    }
  });
  root.addEventListener("focusout", hide);
  root.addEventListener("pointerdown", hide);
}
