import { getText } from "../../core/i18n.js";
import {
  createAliasRow,
  REMOVE_ICON_SVG,
} from "../shared/rule-alias-ui.js";

const MIN_PRIORITY = 0;
const MAX_PRIORITY = 10;

export function updateButtonVisibility() {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  const saveBtn = document.getElementById("rowHighlightSave");
  const resetBtn = document.getElementById("rowHighlightReset");
  const exportBtn = document.getElementById("rowHighlightExport");
  const hasRows = tbody && tbody.children.length > 0;
  if (saveBtn) {
    saveBtn.style.display = "";
    saveBtn.disabled = !hasRows;
  }
  if (resetBtn) {
    resetBtn.style.display = "";
    resetBtn.disabled = !hasRows;
  }
  if (exportBtn) {
    exportBtn.style.display = "";
    exportBtn.disabled = !hasRows;
  }
}

export function addRow(
  keyword = "",
  color = "#ffffff",
  enabled = true,
  aliases = [],
  priority = 0
) {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (!tbody) return;
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  const cellKeyword = document.createElement("td");
  cellKeyword.className = "keyword-cell";

  const keywordGroup = document.createElement("div");
  keywordGroup.className = "keyword-group";

  const keywordPrimary = document.createElement("div");
  keywordPrimary.className = "keyword-primary";

  const inputKeyword = document.createElement("input");
  inputKeyword.type = "text";
  inputKeyword.value = keyword;
  inputKeyword.placeholder = getText("inputKeywordPlaceholder");
  inputKeyword.className = "keyword-input";

  const addAliasBtn = document.createElement("button");
  const addAliasLabel = getText("keywordAliasAddLabel");
  addAliasBtn.type = "button";
  addAliasBtn.className = "keyword-alias-add";
  addAliasBtn.textContent = "+";
  addAliasBtn.setAttribute("aria-label", addAliasLabel);
  addAliasBtn.title = addAliasLabel;

  const aliasContainer = document.createElement("div");
  aliasContainer.className = "keyword-aliases";

  const updateAliasSpacing = () => {
    keywordGroup.classList.toggle(
      "has-aliases",
      aliasContainer.children.length > 0
    );
  };

  const appendAlias = (aliasValue = "", animate = false) => {
    const aliasRow = createAliasRow({
      aliasValue,
      animate,
      getText,
      inputClassName: "keyword-alias-input",
      onRemove: updateAliasSpacing,
      placeholderKey: "inputKeywordAliasPlaceholder",
      removeButtonClassName: "keyword-alias-remove",
      removeLabelKey: "keywordAliasRemoveLabel",
      rowClassName: "keyword-alias-row",
    });
    aliasContainer.appendChild(aliasRow);
    updateAliasSpacing();
    if (animate) {
      requestAnimationFrame(() => {
        aliasRow.classList.remove("is-entering");
      });
    }
    return aliasRow;
  };

  addAliasBtn.addEventListener("click", () => {
    const aliasRow = appendAlias("", true);
    const aliasInput = aliasRow.querySelector(".keyword-alias-input");
    if (aliasInput) aliasInput.focus();
  });

  if (Array.isArray(aliases)) {
    aliases.forEach((alias) => {
      if (typeof alias !== "string") return;
      const trimmedAlias = alias.trim();
      if (!trimmedAlias) return;
      appendAlias(trimmedAlias);
    });
  }
  updateAliasSpacing();

  keywordPrimary.appendChild(inputKeyword);
  keywordPrimary.appendChild(addAliasBtn);
  keywordGroup.appendChild(keywordPrimary);
  keywordGroup.appendChild(aliasContainer);
  cellKeyword.appendChild(keywordGroup);
  row.appendChild(cellKeyword);

  const cellColor = document.createElement("td");
  const inputColor = document.createElement("input");
  inputColor.type = "color";
  inputColor.value = color;
  cellColor.appendChild(inputColor);
  row.appendChild(cellColor);

  const cellPriority = document.createElement("td");
  const inputPriority = document.createElement("select");
  const normalizedPriority = Number(priority);
  inputPriority.className = "keyword-priority-input";
  inputPriority.setAttribute("aria-label", getText("settingsTablePriority"));
  for (
    let priorityValue = MIN_PRIORITY;
    priorityValue <= MAX_PRIORITY;
    priorityValue += 1
  ) {
    const option = document.createElement("option");
    option.value = String(priorityValue);
    option.textContent = String(priorityValue);
    inputPriority.appendChild(option);
  }
  inputPriority.value = Number.isInteger(normalizedPriority) &&
    normalizedPriority >= MIN_PRIORITY &&
    normalizedPriority <= MAX_PRIORITY
    ? String(normalizedPriority)
    : String(MIN_PRIORITY);
  cellPriority.appendChild(inputPriority);
  row.appendChild(cellPriority);

  const cellEnabled = document.createElement("td");
  const inputEnabled = document.createElement("input");
  inputEnabled.type = "checkbox";
  inputEnabled.checked = enabled;
  cellEnabled.appendChild(inputEnabled);
  row.appendChild(cellEnabled);

  const cellAction = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "button button-delete-row";
  deleteBtn.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  deleteBtn.innerHTML = REMOVE_ICON_SVG;
  deleteBtn.addEventListener("click", () => {
    row.classList.add("row-leaving");
    row.addEventListener(
      "animationend",
      () => {
        row.remove();
        updateButtonVisibility();
      },
      { once: true }
    );
  });
  cellAction.appendChild(deleteBtn);
  row.appendChild(cellAction);

  tbody.appendChild(row);
  updateButtonVisibility();
}

export function renderHighlightSettings(settings) {
  const tbody = document.querySelector("#rowHighlightTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const items = Array.isArray(settings) ? settings : [];
  items.forEach((item) => {
    const aliases = Array.isArray(item.aliases)
      ? item.aliases
      : Array.isArray(item.keywordAliases)
        ? item.keywordAliases
        : [];
    addRow(
      item.keyword,
      item.color,
      item.hasOwnProperty("enabled") ? item.enabled : true,
      aliases,
      item.hasOwnProperty("priority") ? item.priority : 0
    );
  });
  updateButtonVisibility();
}
