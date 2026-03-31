import { getText } from "../../core/i18n.js";
import {
  createAliasRow,
  REMOVE_ICON_SVG,
} from "../shared/rule-alias-ui.js";

export function updateButtonVisibility() {
  const tbody = document.querySelector("#statusTable tbody");
  const saveBtn = document.getElementById("saveSettings");
  const resetBtn = document.getElementById("clearAll");
  const exportBtn = document.getElementById("exportSettingsBtn");
  if (!tbody || !saveBtn || !resetBtn) {
    console.error(
      "Status Colorizer: Cannot update button visibility - Elements not found."
    );
    return;
  }
  const rowCount = tbody.children.length;
  const hasRows = rowCount > 0;
  saveBtn.style.display = "";
  resetBtn.style.display = "";
  saveBtn.disabled = !hasRows;
  resetBtn.disabled = !hasRows;
  if (exportBtn) {
    exportBtn.style.display = "";
    exportBtn.disabled = !hasRows;
  } else {
    console.error(
      "Status Colorizer: Missing Export Settings button for state update."
    );
  }
}

export function addRow(
  statusName = "",
  backgroundColor = "#ffffff",
  textColor = "#000000",
  animationClass = "",
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  aliases = []
) {
  const tbody = document.querySelector("#statusTable tbody");
  if (!tbody) {
    console.error("Status Colorizer: Could not find table body");
    return;
  }
  const row = document.createElement("tr");
  row.classList.add("row-entering");

  const cellStatus = document.createElement("td");
  cellStatus.className = "status-name-cell";

  const statusGroup = document.createElement("div");
  statusGroup.className = "status-name-group";

  const statusPrimary = document.createElement("div");
  statusPrimary.className = "status-name-primary";

  const inputStatus = document.createElement("input");
  inputStatus.type = "text";
  inputStatus.value = statusName;
  inputStatus.placeholder = getText("inputStatusPlaceholder");
  inputStatus.className = "status-name-input";

  const addAliasBtn = document.createElement("button");
  const addAliasLabel = getText("statusAliasAddLabel");
  addAliasBtn.type = "button";
  addAliasBtn.className = "status-alias-add";
  addAliasBtn.textContent = "+";
  addAliasBtn.setAttribute("aria-label", addAliasLabel);
  addAliasBtn.title = addAliasLabel;

  const aliasContainer = document.createElement("div");
  aliasContainer.className = "status-aliases";

  const updateAliasSpacing = () => {
    statusGroup.classList.toggle(
      "has-aliases",
      aliasContainer.children.length > 0
    );
  };

  const appendAlias = (aliasValue = "", animate = false) => {
    const aliasRow = createAliasRow({
      aliasValue,
      animate,
      getText,
      inputClassName: "status-alias-input",
      onRemove: updateAliasSpacing,
      placeholderKey: "inputStatusAliasPlaceholder",
      removeButtonClassName: "status-alias-remove",
      removeLabelKey: "statusAliasRemoveLabel",
      rowClassName: "status-alias-row",
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
    const aliasInput = aliasRow.querySelector(".status-alias-input");
    if (aliasInput) {
      aliasInput.focus();
    }
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

  statusPrimary.appendChild(inputStatus);
  statusPrimary.appendChild(addAliasBtn);
  statusGroup.appendChild(statusPrimary);
  statusGroup.appendChild(aliasContainer);
  cellStatus.appendChild(statusGroup);
  row.appendChild(cellStatus);

  const cellBg = document.createElement("td");
  const inputBg = document.createElement("input");
  inputBg.type = "color";
  inputBg.value = backgroundColor;
  cellBg.appendChild(inputBg);
  row.appendChild(cellBg);

  const cellText = document.createElement("td");
  const inputText = document.createElement("input");
  inputText.type = "color";
  inputText.value = textColor;
  cellText.appendChild(inputText);
  row.appendChild(cellText);

  const cellAnim = document.createElement("td");
  const inputAnim = document.createElement("input");
  inputAnim.type = "checkbox";
  inputAnim.checked = animationClass === "ribbon";
  cellAnim.appendChild(inputAnim);
  row.appendChild(cellAnim);

  const cellPrimary = document.createElement("td");
  const inputPrimary = document.createElement("input");
  inputPrimary.type = "color";
  inputPrimary.value = primaryColor;
  inputPrimary.disabled = !inputAnim.checked;
  cellPrimary.appendChild(inputPrimary);
  row.appendChild(cellPrimary);

  const cellSecondary = document.createElement("td");
  const inputSecondary = document.createElement("input");
  inputSecondary.type = "color";
  inputSecondary.value = secondaryColor;
  inputSecondary.disabled = !inputAnim.checked;
  cellSecondary.appendChild(inputSecondary);
  row.appendChild(cellSecondary);

  const cellAction = document.createElement("td");
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", getText("settingsTableRemoveRow"));
  removeButton.innerHTML = REMOVE_ICON_SVG;
  removeButton.className = "button button-delete-row";

  const applyAnimationState = (enabled) => {
    inputPrimary.disabled = !enabled;
    inputSecondary.disabled = !enabled;
    inputBg.disabled = enabled;
    row.classList.toggle("animation-enabled", enabled);
  };
  applyAnimationState(inputAnim.checked);
  inputAnim.addEventListener("change", (event) => {
    applyAnimationState(event.target.checked);
  });
  removeButton.addEventListener("click", () => {
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
  cellAction.appendChild(removeButton);
  row.appendChild(cellAction);
  tbody.appendChild(row);
  updateButtonVisibility();
}

export function renderStatusSettings(settings) {
  const tbody = document.querySelector("#statusTable tbody");
  if (!tbody) {
    console.error("Status Colorizer Restore failed: tbody not found!");
    return;
  }

  tbody.innerHTML = "";
  if (Array.isArray(settings)) {
    settings.forEach((setting) => {
      const aliases = Array.isArray(setting.aliases)
        ? setting.aliases
        : Array.isArray(setting.statusAliases)
          ? setting.statusAliases
          : [];
      addRow(
        setting.statusName,
        setting.backgroundColor,
        setting.textColor || "#ffffff",
        setting.animationClass,
        setting.primaryColor || "#ffffff",
        setting.secondaryColor || "#ffffff",
        aliases
      );
    });
  } else {
    console.error(
      "Status Colorizer: Settings data is not an array, cannot add rows."
    );
  }
  updateButtonVisibility();
}
