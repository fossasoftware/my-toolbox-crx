// Lightweight custom tooltip for the board toolbar icon buttons — mirrors
// the notepad tooltip. A single shared element is appended to <body> and
// positioned with `position: fixed` so it escapes the frame's `overflow`.

const TOOLTIP_SELECTOR = ".board-toolbar .button.button-secondary";

let tooltipInitialized = false;

function resolveLabel(target) {
  const aria = target.getAttribute("aria-label");
  if (aria && aria.trim()) return aria.trim();
  const label = target.querySelector(".btn-label");
  if (label && label.textContent.trim()) return label.textContent.trim();
  const title = target.getAttribute("title");
  return title && title.trim() ? title.trim() : "";
}

export function initBoardTooltip({ root } = {}) {
  if (!root || tooltipInitialized) {
    return;
  }
  tooltipInitialized = true;

  const tip = document.createElement("div");
  tip.className = "board-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);

  let activeTarget = null;

  const resolveTarget = (node) =>
    node && typeof node.closest === "function"
      ? node.closest(TOOLTIP_SELECTOR)
      : null;

  const hide = () => {
    activeTarget = null;
    tip.classList.remove("is-visible");
    tip.setAttribute("aria-hidden", "true");
  };

  const show = (target) => {
    const label = resolveLabel(target);
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
    // Default ABOVE the icon, centered; flip below only if it would clip the top.
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
