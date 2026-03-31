export function createOptionsLanguageController({
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
}) {
  let currentLang = getDefaultLanguage();

  const syncLanguageButtons = () => {
    const langButtonsContainer = document.querySelector(".language-buttons");
    const langOptions = document.querySelectorAll(".lang-option");
    langOptions.forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === currentLang);
    });
    if (langButtonsContainer) {
      langButtonsContainer.classList.add("is-ready");
      langButtonsContainer.classList.toggle("show-uk", currentLang === "uk");
    }
  };

  const setLanguage = async (lang) => {
    currentLang = isSupportedLanguage(lang) ? lang : getDefaultLanguage();
    await loadMessages(currentLang);
    applyOptionsTranslations({
      getText,
      hasLoadedMessages,
      refreshTableEmptyStates,
      updateTableAddButtonWidths,
    });
    updateVersionText(getText);
    syncLanguageButtons();

    const result = await saveLanguagePreference(currentLang);
    if (!result.ok) {
      console.error("Error saving language preference:", result.error);
    }
  };

  const bind = (languageButtonsContainer) => {
    if (!languageButtonsContainer) {
      console.error("Missing Language Buttons container");
      return;
    }

    languageButtonsContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".lang-option");
      if (button && button.dataset.lang && button.dataset.lang !== currentLang) {
        setLanguage(button.dataset.lang);
      }
    });
  };

  return {
    bind,
    getCurrentLanguage() {
      return currentLang;
    },
    setLanguage,
  };
}
