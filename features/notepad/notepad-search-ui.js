function restoreFocusAfterSearchJump(element, selectionStart, selectionEnd) {
  if (!element || typeof element.focus !== "function") {
    return;
  }

  element.focus({ preventScroll: true });
  if (
    typeof element.setSelectionRange === "function" &&
    typeof selectionStart === "number" &&
    typeof selectionEnd === "number"
  ) {
    element.setSelectionRange(selectionStart, selectionEnd);
  }
}

export function updateSearchControls({
  activeSearchMatchIndex,
  getSearchCount,
  getSearchNextButton,
  getSearchPrevButton,
  searchMatches,
  searchQuery,
}) {
  const searchCount = getSearchCount();
  const searchPrevButton = getSearchPrevButton();
  const searchNextButton = getSearchNextButton();
  const hasQuery = searchQuery.length > 0;
  const hasMatches = searchMatches.length > 0;

  if (searchCount) {
    searchCount.textContent = !hasQuery
      ? ""
      : hasMatches
        ? `${activeSearchMatchIndex + 1}/${searchMatches.length}`
        : "0/0";
  }

  [searchPrevButton, searchNextButton].forEach((button) => {
    if (!button) return;
    button.disabled = !hasMatches;
    button.setAttribute("aria-disabled", button.disabled ? "true" : "false");
  });
}

export function setSearchOpenUI({
  clearQueryOnClose = false,
  clearSearchState,
  focusInput = false,
  getSearchInput,
  getSearchPanel,
  getSearchShell,
  getSearchToggle,
  open,
  selectInput = false,
}) {
  const searchShell = getSearchShell();
  const searchPanel = getSearchPanel();
  const searchInput = getSearchInput();
  const searchToggle = getSearchToggle?.();
  const isSearchOpen = Boolean(open);

  if (searchShell) {
    searchShell.classList.toggle("is-open", isSearchOpen);
  }

  if (searchPanel) {
    searchPanel.setAttribute("aria-hidden", isSearchOpen ? "false" : "true");
  }

  if (searchToggle) {
    searchToggle.setAttribute("aria-expanded", isSearchOpen ? "true" : "false");
    searchToggle.classList.toggle("is-active", isSearchOpen);
  }

  if (!isSearchOpen) {
    if (clearQueryOnClose) {
      clearSearchState();
    }

    if (searchInput && document.activeElement === searchInput) {
      searchInput.blur();
    }
    return isSearchOpen;
  }

  if (focusInput && searchInput) {
    requestAnimationFrame(() => {
      searchInput.focus({ preventScroll: true });
      if (selectInput) {
        searchInput.select();
      }
    });
  }

  return isSearchOpen;
}

export function closeSearchPanelUI({
  clearQuery = false,
  getCurrentViewMode,
  getNotepadArea,
  restoreEditorFocus = false,
  setSearchOpen,
}) {
  setSearchOpen(false, { clearQueryOnClose: clearQuery });

  if (!restoreEditorFocus || getCurrentViewMode() === "preview") {
    return;
  }

  getNotepadArea()?.focus({ preventScroll: true });
}

export function revealSearchMatchInEditor(
  match,
  { getNotepadArea, keepInputFocus = false } = {}
) {
  const notepadArea = getNotepadArea();
  if (!notepadArea || !match) {
    return;
  }

  const previousFocusedElement = keepInputFocus ? document.activeElement : null;
  const previousSelectionStart =
    previousFocusedElement &&
    typeof previousFocusedElement.selectionStart === "number"
      ? previousFocusedElement.selectionStart
      : null;
  const previousSelectionEnd =
    previousFocusedElement &&
    typeof previousFocusedElement.selectionEnd === "number"
      ? previousFocusedElement.selectionEnd
      : null;

  notepadArea.focus({ preventScroll: true });
  notepadArea.setSelectionRange(match.start, match.end);

  const maxScrollTop = Math.max(notepadArea.scrollHeight - notepadArea.clientHeight, 0);
  const relativeOffset = match.start / Math.max(notepadArea.value.length, 1);
  notepadArea.scrollTop = maxScrollTop * relativeOffset;

  if (keepInputFocus && previousFocusedElement && previousFocusedElement !== notepadArea) {
    restoreFocusAfterSearchJump(
      previousFocusedElement,
      previousSelectionStart,
      previousSelectionEnd
    );
  }
}

export function scrollActivePreviewSearchMatchIntoView(getNotepadPreview) {
  const notepadPreview = getNotepadPreview();
  const activeMatch = notepadPreview?.querySelector(
    ".notepad-search-highlight.is-active"
  );
  if (!activeMatch) {
    return;
  }
  activeMatch.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth",
  });
}
