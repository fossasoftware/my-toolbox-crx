export function updateTableAddButtonWidths() {
  const buttons = document.querySelectorAll(".table-add-button");
  if (buttons.length === 0) return;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  buttons.forEach((button) => {
    const label = button.querySelector(".btn-label");
    if (!label) return;
    const icon = button.querySelector("svg, img");
    const buttonStyles = getComputedStyle(button);
    const padding =
      parseFloat(buttonStyles.getPropertyValue("--table-add-padding")) || 10;
    const gap =
      parseFloat(buttonStyles.getPropertyValue("--table-add-gap")) || 6;
    const iconWidth = icon
      ? parseFloat(getComputedStyle(icon).width) || 0
      : 0;

    const labelStyles = getComputedStyle(label);
    context.font = `${labelStyles.fontStyle} ${labelStyles.fontWeight} ${labelStyles.fontSize} ${labelStyles.fontFamily}`;
    const text = (label.textContent || "").trim();
    const labelWidth = text ? context.measureText(text).width : 0;
    const effectiveGap = iconWidth > 0 && labelWidth > 0 ? gap : 0;
    const expandedWidth = Math.ceil(
      labelWidth + iconWidth + effectiveGap + padding * 2
    );
    if (expandedWidth > 0) {
      button.style.setProperty(
        "--table-add-expanded-width",
        `${expandedWidth}px`
      );
    }
  });
}

export function updateTableEmptyState(table) {
  const wrapper = table.closest(".table-with-add");
  if (!wrapper) return;
  const tbody = table.tBodies[0];
  const hasRows = tbody ? tbody.children.length > 0 : false;
  wrapper.classList.toggle("is-empty", !hasRows);
  const thead = table.querySelector("thead");
  if (thead) {
    wrapper.style.setProperty(
      "--table-add-header-height",
      `${thead.getBoundingClientRect().height}px`
    );
  }
}

export function refreshTableEmptyStates(container = document) {
  const tables = container.querySelectorAll(".table-with-add table");
  if (tables.length === 0) return;
  tables.forEach((table) => updateTableEmptyState(table));
}

export function initializeTableEmptyStates() {
  const tables = document.querySelectorAll(".table-with-add table");
  if (tables.length === 0) return;

  tables.forEach((table) => {
    const tbody = table.tBodies[0];
    updateTableEmptyState(table);
    if (!tbody) return;
    const observer = new MutationObserver(() => updateTableEmptyState(table));
    observer.observe(tbody, { childList: true });
  });

  window.addEventListener("resize", () => {
    refreshTableEmptyStates();
  });
}
