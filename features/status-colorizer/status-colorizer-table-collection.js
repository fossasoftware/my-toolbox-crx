import { showValidationErrorModal } from "../../core/options-ui.js";

export function normalizeStatusName(statusName) {
  return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
}

export function collectStatusSettings() {
  const rows = document.querySelectorAll("#statusTable tbody tr");
  const settings = [];
  const uniqueStatusNames = new Set();
  const colorRegex = /^#[0-9a-f]{6}$/i;
  let rowIndex = 0;

  for (const row of rows) {
    const index = rowIndex++;
    const statusInput = row.cells[0]?.querySelector(".status-name-input");
    const aliasInputs =
      row.cells[0]?.querySelectorAll(".status-alias-input") || [];
    const bgInput = row.cells[1]?.querySelector('input[type="color"]');
    const textInput = row.cells[2]?.querySelector('input[type="color"]');
    const animCheckbox = row.cells[3]?.querySelector('input[type="checkbox"]');
    const primaryInput = row.cells[4]?.querySelector('input[type="color"]');
    const secondaryInput = row.cells[5]?.querySelector('input[type="color"]');

    if (
      !statusInput ||
      !bgInput ||
      !textInput ||
      !animCheckbox ||
      !primaryInput ||
      !secondaryInput
    ) {
      showValidationErrorModal("errorInternalRow", String(index + 1));
      return null;
    }

    const statusName = normalizeStatusName(statusInput.value);
    const backgroundColor = bgInput.value;
    const textColor = textInput.value;
    const animationEnabled = animCheckbox.checked;
    const primaryColor = primaryInput.value;
    const secondaryColor = secondaryInput.value;

    if (!statusName) {
      showValidationErrorModal("errorStatusEmpty", String(index + 1));
      statusInput.focus();
      return null;
    }
    if (uniqueStatusNames.has(statusName)) {
      showValidationErrorModal("errorDuplicateStatus", [
        String(index + 1),
        statusInput.value,
      ]);
      statusInput.focus();
      return null;
    }
    uniqueStatusNames.add(statusName);

    const aliases = [];
    for (const aliasInput of aliasInputs) {
      const aliasRaw = aliasInput.value.trim();
      if (!aliasRaw) {
        continue;
      }
      const normalizedAlias = normalizeStatusName(aliasRaw);
      if (uniqueStatusNames.has(normalizedAlias)) {
        showValidationErrorModal("errorDuplicateStatus", [
          String(index + 1),
          aliasInput.value,
        ]);
        aliasInput.focus();
        return null;
      }
      uniqueStatusNames.add(normalizedAlias);
      aliases.push(normalizedAlias);
    }

    if (!colorRegex.test(backgroundColor)) {
      showValidationErrorModal("errorInvalidBgColor", [
        String(index + 1),
        backgroundColor,
      ]);
      bgInput.focus();
      return null;
    }
    if (!colorRegex.test(textColor)) {
      showValidationErrorModal("errorInvalidTextColor", [
        String(index + 1),
        textColor,
      ]);
      textInput.focus();
      return null;
    }
    if (animationEnabled) {
      if (!colorRegex.test(primaryColor)) {
        showValidationErrorModal("errorInvalidPrimaryColor", [
          String(index + 1),
          primaryColor,
        ]);
        primaryInput.focus();
        return null;
      }
      if (!colorRegex.test(secondaryColor)) {
        showValidationErrorModal("errorInvalidSecondaryColor", [
          String(index + 1),
          secondaryColor,
        ]);
        secondaryInput.focus();
        return null;
      }
    }

    settings.push({
      statusName,
      backgroundColor,
      textColor,
      animationClass: animationEnabled ? "ribbon" : "",
      primaryColor: animationEnabled ? primaryColor : undefined,
      secondaryColor: animationEnabled ? secondaryColor : undefined,
      aliases: aliases.length > 0 ? aliases : undefined,
    });
  }

  return settings;
}
