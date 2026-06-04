import {
  buildSearchMatches,
  getNextSearchMatchIndex,
  resolveActiveSearchMatchIndex,
} from "./notepad-search-state.js";
import {
  closeSearchPanelUI,
  revealSearchMatchInEditor,
  scrollActivePreviewSearchMatchIntoView,
  setSearchOpenUI,
  updateSearchControls as updateSearchControlsUI,
} from "./notepad-search-ui.js";

export function createNotepadSearchController({
  getCurrentViewMode,
  getNotepadArea,
  getNotepadPreview,
  getSearchCloseButton,
  getSearchCount,
  getSearchInput,
  getSearchNextButton,
  getSearchPanel,
  getSearchPrevButton,
  getSearchShell,
  getSearchToggle,
  renderMarkdownPreview,
}) {
  let isSearchOpen = false;
  let searchQuery = "";
  let searchMatches = [];
  let activeSearchMatchIndex = -1;

  function hasSearchQuery() {
    return Boolean(searchQuery);
  }

  function getSearchQuery() {
    return searchQuery;
  }

  function getActiveSearchMatchIndex() {
    return activeSearchMatchIndex;
  }

  function isSearchPanelOpen() {
    return isSearchOpen;
  }

  function updateSearchControls() {
    updateSearchControlsUI({
      activeSearchMatchIndex,
      getSearchCount,
      getSearchNextButton,
      getSearchPrevButton,
      searchMatches,
      searchQuery,
    });
  }

  function clearSearchState() {
    const hadActiveSearch =
      Boolean(searchQuery) ||
      searchMatches.length > 0 ||
      activeSearchMatchIndex !== -1;
    const searchInput = getSearchInput();

    searchQuery = "";
    searchMatches = [];
    activeSearchMatchIndex = -1;

    if (searchInput) {
      searchInput.value = "";
    }

    updateSearchControls();
    if (hadActiveSearch) {
      renderMarkdownPreview();
    }
  }

  function setSearchOpen(
    open,
    { focusInput = false, selectInput = false, clearQueryOnClose = false } = {}
  ) {
    isSearchOpen = setSearchOpenUI({
      clearQueryOnClose,
      clearSearchState,
      focusInput,
      getSearchInput,
      getSearchPanel,
      getSearchShell,
      getSearchToggle,
      open,
      selectInput,
    });
  }

  function closeSearchPanel({ clearQuery = false, restoreEditorFocus = false } = {}) {
    closeSearchPanelUI({
      clearQuery,
      getCurrentViewMode,
      getNotepadArea,
      restoreEditorFocus,
      setSearchOpen,
    });
  }

  function revealActiveSearchMatch(options = {}) {
    if (activeSearchMatchIndex < 0 || activeSearchMatchIndex >= searchMatches.length) {
      return;
    }

    const activeMatch = searchMatches[activeSearchMatchIndex];
    if (getCurrentViewMode() === "preview") {
      requestAnimationFrame(() => {
        scrollActivePreviewSearchMatchIntoView(getNotepadPreview);
      });
      return;
    }

    revealSearchMatchInEditor(activeMatch, {
      getNotepadArea,
      ...options,
    });
  }

  function refreshSearchState({
    preserveActive = false,
    reveal = false,
    keepInputFocus = false,
  } = {}) {
    const notepadArea = getNotepadArea();
    const previousMatches = searchMatches;

    searchMatches = buildSearchMatches(notepadArea?.value || "", searchQuery);
    activeSearchMatchIndex = resolveActiveSearchMatchIndex({
      activeSearchMatchIndex,
      preserveActive,
      previousMatches,
      searchMatches,
      searchQuery,
    });

    updateSearchControls();
    renderMarkdownPreview();

    if (reveal && activeSearchMatchIndex !== -1) {
      revealActiveSearchMatch({ keepInputFocus });
    }
  }

  function stepSearchMatch(direction, { keepInputFocus = false } = {}) {
    if (searchMatches.length === 0) {
      return;
    }

    activeSearchMatchIndex = getNextSearchMatchIndex(
      activeSearchMatchIndex,
      direction,
      searchMatches.length
    );
    updateSearchControls();
    renderMarkdownPreview();
    revealActiveSearchMatch({ keepInputFocus });
  }

  function focusSearchInput() {
    if (!getSearchInput()) {
      return;
    }
    setSearchOpen(true, { focusInput: true, selectInput: true });
  }

  function handleInputChange(value) {
    searchQuery = value || "";
    refreshSearchState();
  }

  function handleInputKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      stepSearchMatch(event.shiftKey ? -1 : 1, {
        keepInputFocus: true,
      });
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (getSearchInput()?.value) {
        clearSearchState();
      } else {
        closeSearchPanel({
          clearQuery: true,
          restoreEditorFocus: true,
        });
      }
    }
  }

  function handlePrevClick() {
    stepSearchMatch(-1, { keepInputFocus: document.activeElement === getSearchInput() });
  }

  function handleNextClick() {
    stepSearchMatch(1, { keepInputFocus: document.activeElement === getSearchInput() });
  }

  function handleCloseClick() {
    closeSearchPanel({
      clearQuery: true,
      restoreEditorFocus: getCurrentViewMode() !== "preview",
    });
  }

  function handleGlobalKeydown(event) {
    const isModifierPressed = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (isModifierPressed && !event.altKey && key === "f") {
      event.preventDefault();
      focusSearchInput();
      return;
    }

    if (!searchQuery) {
      return;
    }

    if (isModifierPressed && !event.altKey && key === "g") {
      event.preventDefault();
      stepSearchMatch(event.shiftKey ? -1 : 1, {
        keepInputFocus: document.activeElement === getSearchInput(),
      });
      return;
    }

    if (event.key === "F3") {
      event.preventDefault();
      stepSearchMatch(event.shiftKey ? -1 : 1, {
        keepInputFocus: document.activeElement === getSearchInput(),
      });
    }
  }

  function handleGlobalMousedown(event) {
    const searchShell = getSearchShell();
    const hasSearchValue = Boolean(getSearchInput()?.value || searchQuery);
    if (!isSearchOpen || hasSearchValue) {
      return;
    }

    if (searchShell?.contains(event.target)) {
      return;
    }

    closeSearchPanel({ clearQuery: true });
  }

  return {
    clearSearchState,
    closeSearchPanel,
    focusSearchInput,
    getActiveSearchMatchIndex,
    getSearchQuery,
    handleCloseClick,
    handleGlobalKeydown,
    handleGlobalMousedown,
    handleInputChange,
    handleInputKeydown,
    handleNextClick,
    handlePrevClick,
    hasSearchQuery,
    isSearchPanelOpen,
    refreshSearchState,
    setSearchOpen,
    stepSearchMatch,
    updateSearchControls,
  };
}
