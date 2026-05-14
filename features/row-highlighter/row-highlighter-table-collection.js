import { showValidationErrorModal } from "../../core/options-ui.js";

const MIN_PRIORITY = 0;
const MAX_PRIORITY = 10;

export function normalizeKeyword(keyword) {
  return typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
}

function parsePriority(priority) {
  const text = typeof priority === "string" ? priority.trim() : String(priority);
  if (!text) {
    return 0;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) &&
    Number.isInteger(numeric) &&
    numeric >= MIN_PRIORITY &&
    numeric <= MAX_PRIORITY
    ? numeric
    : null;
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
    const priorityInput = row.cells[2]?.querySelector(".keyword-priority-input");
    const enabledInput = row.cells[3]?.querySelector('input[type="checkbox"]');
    if (!keywordInput || !colorInput || !priorityInput || !enabledInput) {
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

    const priority = parsePriority(priorityInput.value);
    if (priority === null) {
      showValidationErrorModal("errorInvalidPriority", [
        String(idx + 1),
        priorityInput.value,
      ]);
      priorityInput.focus();
      return null;
    }

    settings.push({
      keyword,
      color,
      priority,
      enabled: enabledInput.checked,
      aliases: aliases.length > 0 ? aliases : undefined,
    });
  }

  return settings;
}
