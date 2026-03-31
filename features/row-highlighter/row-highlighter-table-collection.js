import { showValidationErrorModal } from "../../core/options-ui.js";

export function normalizeKeyword(keyword) {
  return typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
}

export function collectHighlightSettings() {
  const rows = document.querySelectorAll("#rowHighlightTable tbody tr");
  const settings = [];
  const uniqueKeywords = new Set();
  const colorRegex = /^#[0-9a-f]{6}$/i;
  let rowIndex = 0;

  for (const row of rows) {
    const idx = rowIndex++;
    const keywordInput = row.cells[0]?.querySelector(".keyword-input");
    const aliasInputs =
      row.cells[0]?.querySelectorAll(".keyword-alias-input") || [];
    const colorInput = row.cells[1]?.querySelector('input[type="color"]');
    const enabledInput = row.cells[2]?.querySelector('input[type="checkbox"]');
    if (!keywordInput || !colorInput || !enabledInput) {
      showValidationErrorModal("errorInternalRow", String(idx + 1));
      return null;
    }

    const keyword = keywordInput.value.trim();
    const color = colorInput.value;
    if (!keyword) {
      showValidationErrorModal("errorKeywordEmpty", String(idx + 1));
      keywordInput.focus();
      return null;
    }

    const normalizedKeyword = normalizeKeyword(keyword);
    if (uniqueKeywords.has(normalizedKeyword)) {
      showValidationErrorModal("errorDuplicateKeyword", [
        String(idx + 1),
        keyword,
      ]);
      keywordInput.focus();
      return null;
    }
    uniqueKeywords.add(normalizedKeyword);

    const aliases = [];
    for (const aliasInput of aliasInputs) {
      const alias = aliasInput.value.trim();
      if (!alias) {
        continue;
      }
      const normalizedAlias = normalizeKeyword(alias);
      if (uniqueKeywords.has(normalizedAlias)) {
        showValidationErrorModal("errorDuplicateKeyword", [
          String(idx + 1),
          aliasInput.value,
        ]);
        aliasInput.focus();
        return null;
      }
      uniqueKeywords.add(normalizedAlias);
      aliases.push(alias);
    }

    if (!colorRegex.test(color)) {
      showValidationErrorModal("errorInvalidColor", [String(idx + 1), color]);
      colorInput.focus();
      return null;
    }

    settings.push({
      keyword,
      color,
      enabled: enabledInput.checked,
      aliases: aliases.length > 0 ? aliases : undefined,
    });
  }

  return settings;
}
