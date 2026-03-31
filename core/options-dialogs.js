import { getText } from "./i18n.js";

export function showValidationErrorModal(messageKey, substitutions = null) {
  const modal = document.getElementById("validationErrorModal");
  const messageElement = document.getElementById("validationErrorMessage");

  if (modal && messageElement) {
    messageElement.textContent = getText(messageKey, substitutions);
    modal.classList.add("active");
    return;
  }

  console.error(
    "Validation error modal elements not found. Falling back to alert."
  );
  alert(getText(messageKey, substitutions));
}

export function showResetTableModal() {
  const resetModal = document.getElementById("confirmModal");
  if (resetModal) {
    resetModal.classList.add("active");
    return;
  }

  console.error("Could not find Reset Table Confirm Modal overlay");
}

export function showDefaultSettingsModal() {
  const defaultModal = document.getElementById("resetConfirmModal");
  if (defaultModal) {
    defaultModal.classList.add("active");
    return;
  }

  console.error("Could not find Default Settings Confirm Modal overlay");
}
