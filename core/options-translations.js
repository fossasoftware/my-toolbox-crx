export function updateVersionText(getText) {
  const manifest = chrome.runtime.getManifest();
  const versionEl = document.getElementById("appVersion");
  if (versionEl && manifest && manifest.version) {
    versionEl.textContent = getText("versionText", manifest.version);
  }
}

export function applyOptionsTranslations({
  getText,
  hasLoadedMessages,
  refreshTableEmptyStates,
  updateTableAddButtonWidths,
}) {
  if (!hasLoadedMessages()) return;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translation = getText(key);
    if (element.hasAttribute("data-i18n-html")) {
      element.innerHTML = translation;
    } else if (element.placeholder !== undefined) {
      element.placeholder = translation;
    } else if (
      [
        "BUTTON",
        "OPTION",
        "LABEL",
        "H1",
        "H2",
        "H5",
        "P",
        "TH",
        "TITLE",
      ].includes(element.tagName)
    ) {
      element.textContent = translation;
    } else {
      element.textContent = translation;
    }
    if (key === "optionsTitle") {
      document.title = getText("appName") + " - " + translation;
    }
  });
  document
    .querySelectorAll('#statusTable tbody .status-name-input')
    .forEach((input) => {
      input.placeholder = getText("inputStatusPlaceholder");
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-input')
    .forEach((input) => {
      input.placeholder = getText("inputStatusAliasPlaceholder");
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-add')
    .forEach((button) => {
      const label = getText("statusAliasAddLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#statusTable tbody .status-alias-remove')
    .forEach((button) => {
      const label = getText("statusAliasRemoveLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#statusTable tbody .status-animation-select')
    .forEach((select) => {
      select.setAttribute("aria-label", getText("settingsTableAnimation"));
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-input')
    .forEach((input) => {
      input.placeholder = getText("inputKeywordPlaceholder");
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-input')
    .forEach((input) => {
      input.placeholder = getText("inputKeywordAliasPlaceholder");
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-add')
    .forEach((button) => {
      const label = getText("keywordAliasAddLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  document
    .querySelectorAll('#rowHighlightTable tbody .keyword-alias-remove')
    .forEach((button) => {
      const label = getText("keywordAliasRemoveLabel");
      button.title = label;
      button.setAttribute("aria-label", label);
    });
  const notepadArea = document.getElementById("notepadArea");
  if (notepadArea) {
    notepadArea.placeholder = getText("notepadPlaceholder");
  }

  const addRowBtn = document.getElementById("addRow");
  if (addRowBtn) {
    const label = getText("addRowButton");
    addRowBtn.setAttribute("aria-label", label);
    addRowBtn.removeAttribute("title");
  }
  const rowAddBtn = document.getElementById("rowHighlightAdd");
  if (rowAddBtn) {
    const label = getText("addKeywordButton");
    rowAddBtn.setAttribute("aria-label", label);
    rowAddBtn.removeAttribute("title");
  }
  const bookmarkAddButton = document.getElementById("bookmarkAddButton");
  if (bookmarkAddButton) {
    const label = getText("bookmarkAddLabel");
    bookmarkAddButton.setAttribute("aria-label", label);
    bookmarkAddButton.title = label;
  }
  document.querySelectorAll("[data-label-key]").forEach((element) => {
    const labelKey = element.dataset.labelKey;
    if (!labelKey) return;
    const label = getText(labelKey);
    element.setAttribute("aria-label", label);
    if (element.matches("button")) {
      if (element.closest("#notepadTab")) {
        element.removeAttribute("title");
      } else {
        element.title = label;
      }
    }
  });

  updateTableAddButtonWidths();
  refreshTableEmptyStates();
}
