export function createBookmarksModalState({
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
}) {
  let editingKey = "";
  let editingIconValue = "";
  let fileDialogFocusHandler = null;
  const fileInputWrap = iconFileInput.closest(".bookmark-file-input");

  const setModalMode = (mode) => {
    const isEdit = mode === "edit";
    if (modalTitle) {
      const titleKey = isEdit ? "bookmarkEditTitle" : "bookmarkModalTitle";
      modalTitle.dataset.i18n = titleKey;
      modalTitle.textContent = getText(titleKey);
    }
    if (saveButton) {
      const buttonKey = isEdit ? "bookmarkUpdateButton" : "bookmarkSaveButton";
      saveButton.dataset.i18n = buttonKey;
      saveButton.textContent = getText(buttonKey);
    }
  };

  const setFileNameLabel = (labelKey) => {
    if (!iconFileName) return;
    iconFileName.dataset.i18n = labelKey;
    iconFileName.textContent = getText(labelKey);
  };

  const setFileNameValue = (value) => {
    if (!iconFileName) return;
    iconFileName.removeAttribute("data-i18n");
    iconFileName.textContent = value;
  };

  const resetModal = () => {
    form.reset();
    iconFileInput.value = "";
    setFileNameLabel("bookmarkIconFilePlaceholder");
    editingKey = "";
    editingIconValue = "";
    setModalMode("create");
  };

  const closeModal = () => {
    modal.classList.remove("active");
    resetModal();
  };

  const openForCreate = () => {
    resetModal();
    modal.classList.add("active");
    nameInput.focus();
  };

  const openForEdit = (bookmark) => {
    resetModal();
    editingKey = getIconKey(bookmark.title, bookmark.url);
    editingIconValue = normalizeIconValue(bookmark.icon);
    setModalMode("edit");
    nameInput.value = bookmark.title;
    urlInput.value = bookmark.url;
    if (editingIconValue) {
      setFileNameLabel("bookmarkIconFileCurrent");
    }
    modal.classList.add("active");
    nameInput.focus();
  };

  const setFileDialogActive = () => {
    if (!fileInputWrap) return;
    fileInputWrap.classList.add("is-active");
    if (fileDialogFocusHandler) {
      windowRef.removeEventListener("focus", fileDialogFocusHandler);
    }
    fileDialogFocusHandler = () => {
      fileInputWrap.classList.remove("is-active");
      windowRef.removeEventListener("focus", fileDialogFocusHandler);
      fileDialogFocusHandler = null;
    };
    windowRef.addEventListener("focus", fileDialogFocusHandler);
  };

  const clearFileDialogActive = () => {
    if (fileInputWrap) {
      fileInputWrap.classList.remove("is-active");
    }
    if (fileDialogFocusHandler) {
      windowRef.removeEventListener("focus", fileDialogFocusHandler);
      fileDialogFocusHandler = null;
    }
  };

  const syncFileNameFromInput = () => {
    clearFileDialogActive();
    if (iconFileInput.files && iconFileInput.files.length > 0) {
      setFileNameValue(iconFileInput.files[0].name);
    } else {
      setFileNameLabel("bookmarkIconFilePlaceholder");
    }
  };

  const getEditingState = () => ({
    editingIconValue,
    editingKey,
  });

  return {
    clearFileDialogActive,
    closeModal,
    getEditingState,
    openForCreate,
    openForEdit,
    resetModal,
    setFileDialogActive,
    syncFileNameFromInput,
  };
}
