function focusValidationError(input, showValidationErrorModal, messageKey) {
  showValidationErrorModal(messageKey);
  input?.focus();
}

async function resolveBookmarkIconValue({
  editingIconValue,
  iconFileInput,
  readFileAsDataUrl,
  showToast,
  showValidationErrorModal,
}) {
  const file = iconFileInput.files && iconFileInput.files[0];
  if (!file) {
    return editingIconValue || "";
  }

  if (file.type !== "image/png") {
    showValidationErrorModal("errorBookmarkIconFileInvalid");
    return null;
  }

  try {
    return await readFileAsDataUrl(file);
  } catch (error) {
    showToast("toastErrorGeneric");
    return null;
  }
}

function buildNextBookmarks({
  bookmarks,
  editingKey,
  getIconKey,
  iconValue,
  normalizedUrl,
  titleValue,
}) {
  if (!editingKey) {
    return [
      ...bookmarks,
      {
        title: titleValue,
        url: normalizedUrl,
        icon: iconValue,
        pinned: false,
      },
    ];
  }

  const index = bookmarks.findIndex(
    (bookmark) => getIconKey(bookmark.title, bookmark.url) === editingKey
  );
  const pinned = index >= 0 ? bookmarks[index].pinned : false;
  const updated = {
    title: titleValue,
    url: normalizedUrl,
    icon: iconValue,
    pinned,
  };
  const nextBookmarks = [...bookmarks];
  if (index >= 0) {
    nextBookmarks[index] = updated;
  } else {
    nextBookmarks.push(updated);
  }
  return nextBookmarks;
}

export function createBookmarksModalSubmitHandler({
  closeModal,
  commitBookmarks,
  getBookmarks,
  getEditingState,
  getIconKey,
  iconFileInput,
  nameInput,
  normalizeBookmarkUrl,
  readFileAsDataUrl,
  showToast,
  showValidationErrorModal,
  urlInput,
}) {
  return async function handleSubmit(event) {
    event.preventDefault();

    const titleValue = nameInput.value.trim();
    if (!titleValue) {
      focusValidationError(
        nameInput,
        showValidationErrorModal,
        "errorBookmarkNameEmpty"
      );
      return;
    }

    const rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      focusValidationError(
        urlInput,
        showValidationErrorModal,
        "errorBookmarkUrlEmpty"
      );
      return;
    }

    const normalizedUrl = normalizeBookmarkUrl(rawUrl);
    if (!normalizedUrl) {
      focusValidationError(
        urlInput,
        showValidationErrorModal,
        "errorBookmarkUrlInvalid"
      );
      return;
    }

    const { editingIconValue, editingKey } = getEditingState();
    const iconValue = await resolveBookmarkIconValue({
      editingIconValue,
      iconFileInput,
      readFileAsDataUrl,
      showToast,
      showValidationErrorModal,
    });

    if (iconValue === null) {
      return;
    }

    const nextBookmarks = buildNextBookmarks({
      bookmarks: getBookmarks(),
      editingKey,
      getIconKey,
      iconValue,
      normalizedUrl,
      titleValue,
    });

    await commitBookmarks(nextBookmarks);
    closeModal();
  };
}
