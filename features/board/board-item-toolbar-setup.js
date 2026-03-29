export function syncItemPaletteVisibility(card, palette) {
  if (!card || !palette) return;
  const isOpen = Boolean(
    card.querySelector(".board-item-color-menu.is-open") ||
      card.querySelector(".board-item-size-menu.is-open")
  );
  palette.classList.toggle("is-open", isOpen);
  palette.setAttribute("aria-hidden", isOpen ? "false" : "true");
  card.classList.toggle("is-expanded", isOpen);
}

export function setItemMenuState({
  button,
  menu,
  card,
  palette,
  isOpen,
  scheduleItemToolbarUpdate,
  syncItemToolbarDuringTransition,
}) {
  if (!button || !menu) return;
  menu.classList.toggle("is-open", isOpen);
  menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  button.classList.toggle("is-open", isOpen);
  syncItemPaletteVisibility(card, palette);
  scheduleItemToolbarUpdate();
  syncItemToolbarDuringTransition();
}

export function setupItemColorPicker({
  documentRef,
  getText,
  button,
  menu,
  card,
  palette,
  presets,
  label,
  onSelect,
  closeItemToolbarMenus,
  scheduleItemToolbarUpdate,
  syncItemToolbarDuringTransition,
}) {
  if (!button || !menu || !Array.isArray(presets)) return;
  button.setAttribute("aria-label", label || "");
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  if (menu.id) {
    button.setAttribute("aria-controls", menu.id);
  }
  menu.setAttribute("aria-hidden", "true");
  menu.innerHTML = "";

  presets.forEach((preset) => {
    const option = documentRef.createElement("button");
    option.type = "button";
    option.className = "board-shape-color-option is-fill";
    option.setAttribute("role", "menuitemradio");
    option.setAttribute("aria-checked", "false");
    option.setAttribute("data-color", preset.value);
    option.setAttribute("aria-label", getText(preset.label));
    const dot = documentRef.createElement("span");
    dot.className = "board-shape-color-dot";
    const colorValue = preset.value || "#ffffff";
    dot.style.setProperty("--shape-color", colorValue);
    if (!preset.value) {
      dot.classList.add("is-none");
    }
    option.appendChild(dot);
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onSelect === "function") {
        onSelect(preset.value);
      }
      closeItemToolbarMenus();
    });
    menu.appendChild(option);
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = menu.classList.contains("is-open");
    closeItemToolbarMenus();
    setItemMenuState({
      button,
      menu,
      card,
      palette,
      isOpen: !isOpen,
      scheduleItemToolbarUpdate,
      syncItemToolbarDuringTransition,
    });
  });

  menu.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
}

export function setItemTextSizePreview(button, size) {
  if (!button) return;
  const swatch = button.querySelector(".board-item-size-swatch");
  if (!swatch) return;
  const numeric = Number(size);
  if (!Number.isFinite(numeric)) {
    swatch.textContent = "";
    return;
  }
  swatch.textContent = String(Math.round(numeric));
}

export function setupItemSizePicker({
  documentRef,
  button,
  menu,
  card,
  palette,
  sizes,
  label,
  onSelect,
  closeItemToolbarMenus,
  scheduleItemToolbarUpdate,
  syncItemToolbarDuringTransition,
}) {
  if (!button || !menu || !Array.isArray(sizes)) return;
  const buttonLabel = label || "";
  button.setAttribute("aria-label", buttonLabel);
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  if (menu.id) {
    button.setAttribute("aria-controls", menu.id);
  }
  menu.setAttribute("aria-hidden", "true");
  menu.innerHTML = "";

  sizes.forEach((size) => {
    const numeric = Number(size);
    if (!Number.isFinite(numeric)) return;
    const option = documentRef.createElement("button");
    option.type = "button";
    option.className = "board-shape-size-option board-item-size-option";
    option.setAttribute("role", "menuitemradio");
    option.setAttribute("aria-checked", "false");
    option.setAttribute("data-size", String(numeric));
    option.setAttribute("aria-label", `${buttonLabel} ${numeric}`);
    const labelElement = documentRef.createElement("span");
    labelElement.className = "board-item-size-text";
    labelElement.textContent = String(Math.round(numeric));
    option.appendChild(labelElement);
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onSelect === "function") {
        onSelect(numeric);
      }
      closeItemToolbarMenus();
    });
    menu.appendChild(option);
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = menu.classList.contains("is-open");
    closeItemToolbarMenus();
    setItemMenuState({
      button,
      menu,
      card,
      palette,
      isOpen: !isOpen,
      scheduleItemToolbarUpdate,
      syncItemToolbarDuringTransition,
    });
  });

  menu.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
}
