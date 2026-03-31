export const REMOVE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

export function animateAliasRemoval(aliasRow, onRemove) {
  if (!aliasRow) return;
  aliasRow.classList.add("is-leaving");
  let removed = false;
  const finalize = () => {
    if (removed) return;
    removed = true;
    aliasRow.remove();
    if (typeof onRemove === "function") {
      onRemove();
    }
  };
  aliasRow.addEventListener("transitionend", finalize, { once: true });
  setTimeout(finalize, 200);
}

export function createAliasRow({
  aliasValue = "",
  animate = false,
  getText,
  inputClassName,
  onRemove = null,
  placeholderKey,
  removeButtonClassName,
  removeLabelKey,
  rowClassName,
}) {
  const aliasRow = document.createElement("div");
  aliasRow.className = rowClassName;
  if (animate) {
    aliasRow.classList.add("is-entering");
  }

  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.value = aliasValue;
  aliasInput.placeholder = getText(placeholderKey);
  aliasInput.className = inputClassName;
  aliasRow.appendChild(aliasInput);

  const removeAliasBtn = document.createElement("button");
  const removeAliasLabel = getText(removeLabelKey);
  removeAliasBtn.type = "button";
  removeAliasBtn.className = removeButtonClassName;
  removeAliasBtn.setAttribute("aria-label", removeAliasLabel);
  removeAliasBtn.title = removeAliasLabel;
  removeAliasBtn.innerHTML = REMOVE_ICON_SVG;
  removeAliasBtn.addEventListener("click", () => {
    animateAliasRemoval(aliasRow, onRemove);
  });
  aliasRow.appendChild(removeAliasBtn);

  return aliasRow;
}
