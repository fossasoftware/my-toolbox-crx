import { createBookmarksModalState } from "./bookmarks-modal-state.js";
import { createBookmarksModalSubmitHandler } from "./bookmarks-modal-submit.js";

export function createBookmarksModalController({
  cancelBtn,
  commitBookmarks,
  form,
  getBookmarks,
  getIconKey,
  getText,
  iconFileInput,
  iconFileName,
  modal,
  modalTitle,
  nameInput,
  normalizeBookmarkUrl,
  normalizeIconValue,
  readFileAsDataUrl,
  saveButton,
  showToast,
  showValidationErrorModal,
  urlInput,
  windowRef,
}) {
  const modalState = createBookmarksModalState({
    form,
    getIconKey,
    getText,
    iconFileInput,
    iconFileName,
    modal,
    modalTitle,
    nameInput,
    normalizeIconValue,
    saveButton,
    urlInput,
    windowRef,
  });
  const handleSubmit = createBookmarksModalSubmitHandler({
    closeModal: modalState.closeModal,
    commitBookmarks,
    getBookmarks,
    getEditingState: modalState.getEditingState,
    getIconKey,
    iconFileInput,
    nameInput,
    normalizeBookmarkUrl,
    readFileAsDataUrl,
    showToast,
    showValidationErrorModal,
    urlInput,
  });

  const bind = () => {
    if (cancelBtn) {
      cancelBtn.addEventListener("click", modalState.closeModal);
    }

    iconFileInput.addEventListener("click", modalState.setFileDialogActive);
    iconFileInput.addEventListener("change", modalState.syncFileNameFromInput);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modalState.closeModal();
      }
    });

    form.addEventListener("submit", handleSubmit);
  };

  return {
    bind,
    openForCreate: modalState.openForCreate,
    openForEdit: modalState.openForEdit,
  };
}
