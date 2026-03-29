import { initializeStatusColorizer } from "../features/status-colorizer/status-colorizer.js";
import { initializeStatusColorizerTab } from "../features/status-colorizer/status-colorizer-tab.js";
import { initializeRowHighlighter } from "../features/row-highlighter/row-highlighter.js";
import { initializeRowHighlighterTab } from "../features/row-highlighter/row-highlighter-tab.js";
import { initializeNotepad } from "../features/notepad/notepad.js";
import { initializeNotepadTab } from "../features/notepad/notepad-tab.js";
import { initializeBoard } from "../features/board/board.js";
import { initializeBoardTab } from "../features/board/board-tab.js";
import { initializeSettingsTab } from "../features/settings/settings-tab.js";
import { initializeBookmarks } from "../features/bookmarks/bookmarks.js";
import { initializeBookmarksTab } from "../features/bookmarks/bookmarks-tab.js";
import {
  getDefaultLanguage,
  getText,
  hasLoadedMessages,
  isSupportedLanguage,
  loadMessages,
} from "../core/i18n.js";
import { loadDefaultStatusSettings } from "../core/extension-defaults.js";
import { createOptionsLanguageController } from "../core/options-language.js";
import {
  bindBackdropClose,
  bindModalCloseButton,
} from "../core/options-modals.js";
import {
  bindTabGroupToggles,
  setActiveTabLinkState,
  setSideMenuState,
} from "../core/options-navigation.js";
import {
  ACTIVE_OPTIONS_TAB_KEY,
  loadOptionsPreferences,
  saveActiveOptionsTabPreference,
  saveLanguagePreference,
  saveSideMenuOpenPreference,
} from "../core/options-preferences.js";
import { bindShareExtensionButton } from "../core/options-share.js";
import { createOptionsTabController } from "../core/options-tabs.js";
import {
  initializeTableEmptyStates,
  refreshTableEmptyStates,
  updateTableAddButtonWidths,
} from "../core/options-table-ui.js";
import {
  applyOptionsTranslations,
  updateVersionText,
} from "../core/options-translations.js";
import {
  setLoadedDefaultSettings,
  showToast,
} from "../core/options-ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const languageButtonsContainer = document.querySelector(".language-buttons");
  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const pageContainer = document.querySelector(".page-container");
  const validationErrorModal = document.getElementById("validationErrorModal");
  const validationErrorOkBtn = document.getElementById("validationErrorOkBtn");
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabGroups = document.querySelectorAll(".tab-group");

  const prefs = await loadOptionsPreferences(getDefaultLanguage);
  if (!prefs.ok) {
    console.error("Error loading options preferences:", prefs.error);
  }
  const { langPref, savedActiveTabId, sideMenuOpen } = prefs;

  const defaultActiveTabId = tabLinks[0]?.dataset.tab || "statusColorizerTab";
  const initialActiveTabId = setActiveTabLinkState(
    tabLinks,
    tabGroups,
    savedActiveTabId || defaultActiveTabId
  )
    ? savedActiveTabId || defaultActiveTabId
    : defaultActiveTabId;

  setSideMenuState(sideMenu, menuToggle, pageContainer, sideMenuOpen, {
    animate: false,
  });

  const languageController = createOptionsLanguageController({
    applyOptionsTranslations,
    getDefaultLanguage,
    getText,
    hasLoadedMessages,
    isSupportedLanguage,
    loadMessages,
    refreshTableEmptyStates,
    saveLanguagePreference,
    updateTableAddButtonWidths,
    updateVersionText,
  });
  await languageController.setLanguage(langPref);

  await Promise.all([
    initializeStatusColorizerTab(),
    initializeRowHighlighterTab(),
    initializeNotepadTab(),
    initializeBoardTab(),
    initializeBookmarksTab(),
    initializeSettingsTab(),
  ]);

  applyOptionsTranslations({
    getText,
    hasLoadedMessages,
    refreshTableEmptyStates,
    updateTableAddButtonWidths,
  });
  updateVersionText(getText);

  const confirmResetTableModal = document.getElementById("confirmModal");
  const cancelResetTableBtn = document.getElementById("cancelDelete");
  const confirmDefaultModal = document.getElementById("resetConfirmModal");
  const cancelDefaultBtn = document.getElementById("cancelReset");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const shareExtensionBtn = document.getElementById("shareExtensionBtn");

  try {
    const defaults = await loadDefaultStatusSettings();
    if (defaults.length === 0) {
      throw new Error("Default status settings were empty.");
    }
    setLoadedDefaultSettings(defaults);
  } catch (error) {
    console.error("CRITICAL: Failed to load default settings.", error);
    showToast("toastErrorLoading");
    setLoadedDefaultSettings([]);
  }

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", async () => {
      const nextOpen = !sideMenu.classList.contains("open");
      setSideMenuState(sideMenu, menuToggle, pageContainer, nextOpen);
      const result = await saveSideMenuOpenPreference(nextOpen);
      if (!result.ok) {
        console.error("Error saving side menu open preference:", result.error);
        showToast("toastErrorSaving");
      }
    });
  }

  languageController.bind(languageButtonsContainer);
  bindModalCloseButton(
    cancelResetTableBtn,
    confirmResetTableModal,
    "Missing Cancel Reset Table button or modal"
  );
  bindModalCloseButton(
    cancelDefaultBtn,
    confirmDefaultModal,
    "Missing Cancel Default button or modal"
  );
  bindModalCloseButton(
    validationErrorOkBtn,
    validationErrorModal,
    "Missing Validation Error OK button or modal"
  );
  bindShareExtensionButton({ button: shareExtensionBtn, getText, showToast });

  const tabController = createOptionsTabController({
    defaultActiveTabId,
    refreshTableEmptyStates,
    saveActiveOptionsTabPreference,
    showToast,
    tabGroups,
    tabLinks,
    tabPanes,
  });
  tabController.bind();
  await tabController.activateInitial(initialActiveTabId);

  bindTabGroupToggles(tabGroups);
  bindBackdropClose([
    confirmResetTableModal,
    confirmDefaultModal,
    validationErrorModal,
  ]);

  document.body.classList.remove("is-booting");


  initializeStatusColorizer();
  initializeRowHighlighter();
  initializeNotepad();
  initializeBoard();
  initializeBookmarks();
  initializeTableEmptyStates();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      refreshTableEmptyStates();
    });
  }

});
