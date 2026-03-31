export async function createBookmarksSettingsController({
  documentRef,
  windowRef,
  pinnedListEl,
  iconSizeInput,
  iconSizeValue,
  pinnedIconSizeInput,
  pinnedIconSizeValue,
  pinnedTitleDisplayInput,
  loadBookmarkSettings,
  normalizeBookmarkSettings,
  applyBookmarkSettings,
  saveBookmarkSettings,
}) {
  const pinnedLabelsContainerId = "bookmarksPinnedLabels";
  let pinnedLabelsContainer = documentRef.getElementById(pinnedLabelsContainerId);
  if (!pinnedLabelsContainer) {
    pinnedLabelsContainer = documentRef.createElement("div");
    pinnedLabelsContainer.id = pinnedLabelsContainerId;
    pinnedLabelsContainer.className = "bookmarks-pinned-labels";
    documentRef.body.appendChild(pinnedLabelsContainer);
  }

  let pinnedLabelItems = [];
  let pinnedLabelLinks = [];
  let pinnedLabelsRaf = null;
  const pinnedLabelOffset = 8;
  let currentBookmarkSettings = await loadBookmarkSettings();

  const updateBookmarkSettingsControls = (settings) => {
    if (iconSizeInput) {
      iconSizeInput.value = String(settings.iconSize);
    }
    if (iconSizeValue) {
      iconSizeValue.textContent = `${settings.iconSize}px`;
    }
    if (pinnedIconSizeInput) {
      pinnedIconSizeInput.value = String(settings.pinnedIconSize);
    }
    if (pinnedIconSizeValue) {
      pinnedIconSizeValue.textContent = `${settings.pinnedIconSize}px`;
    }
    if (pinnedTitleDisplayInput) {
      pinnedTitleDisplayInput.value = settings.pinnedTitleDisplay;
    }
  };

  const updatePinnedLabelPositions = () => {
    pinnedLabelsRaf = null;
    if (!pinnedLabelItems.length || !pinnedLabelLinks.length) return;
    pinnedLabelLinks.forEach((link, index) => {
      const label = pinnedLabelItems[index];
      if (!label || !link.isConnected) return;
      const rect = link.getBoundingClientRect();
      label.style.left = `${rect.right + pinnedLabelOffset}px`;
      label.style.top = `${rect.top + rect.height / 2}px`;
    });
  };

  const schedulePinnedLabelUpdate = () => {
    if (pinnedLabelsRaf) return;
    pinnedLabelsRaf = requestAnimationFrame(updatePinnedLabelPositions);
  };

  const setPinnedLabelMode = (mode) => {
    if (!pinnedLabelsContainer) return;
    pinnedLabelItems.forEach((label) => label.classList.remove("is-visible"));
    if (mode === "hover") {
      schedulePinnedLabelUpdate();
    }
  };

  const renderPinnedLabels = (pinned) => {
    if (!pinnedLabelsContainer || !pinnedListEl) return;
    pinnedLabelsContainer.textContent = "";
    pinnedLabelItems = [];
    pinnedLabelLinks = Array.from(
      pinnedListEl.querySelectorAll(".bookmarks-pinned-link")
    );
    pinned.forEach((bookmark, index) => {
      const label = documentRef.createElement("div");
      label.className = "bookmarks-pinned-label";
      label.textContent = bookmark.title;
      pinnedLabelsContainer.appendChild(label);
      pinnedLabelItems.push(label);
      const link = pinnedLabelLinks[index];
      if (link) {
        link.addEventListener("mouseenter", () => {
          if (currentBookmarkSettings.pinnedTitleDisplay !== "hover") return;
          label.classList.add("is-visible");
          schedulePinnedLabelUpdate();
        });
        link.addEventListener("mouseleave", () => {
          label.classList.remove("is-visible");
        });
      }
    });
    setPinnedLabelMode(currentBookmarkSettings.pinnedTitleDisplay);
    schedulePinnedLabelUpdate();
  };

  const syncBookmarkSettings = (settings) => {
    currentBookmarkSettings = settings;
    applyBookmarkSettings(settings);
    updateBookmarkSettingsControls(settings);
    setPinnedLabelMode(settings.pinnedTitleDisplay);
    schedulePinnedLabelUpdate();
  };

  const getSettingsFromInputs = () =>
    normalizeBookmarkSettings({
      iconSize: iconSizeInput ? iconSizeInput.value : currentBookmarkSettings.iconSize,
      pinnedIconSize: pinnedIconSizeInput
        ? pinnedIconSizeInput.value
        : currentBookmarkSettings.pinnedIconSize,
      pinnedTitleDisplay: pinnedTitleDisplayInput
        ? pinnedTitleDisplayInput.value
        : currentBookmarkSettings.pinnedTitleDisplay,
    });

  const handleSettingsInput = () => {
    const nextSettings = getSettingsFromInputs();
    applyBookmarkSettings(nextSettings);
    updateBookmarkSettingsControls(nextSettings);
    schedulePinnedLabelUpdate();
  };

  const handleSettingsChange = async () => {
    const nextSettings = getSettingsFromInputs();
    syncBookmarkSettings(nextSettings);
    await saveBookmarkSettings(nextSettings);
  };

  syncBookmarkSettings(currentBookmarkSettings);

  if (iconSizeInput) {
    iconSizeInput.addEventListener("input", handleSettingsInput);
    iconSizeInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedIconSizeInput) {
    pinnedIconSizeInput.addEventListener("input", handleSettingsInput);
    pinnedIconSizeInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedTitleDisplayInput) {
    pinnedTitleDisplayInput.addEventListener("change", handleSettingsChange);
  }
  if (pinnedListEl) {
    pinnedListEl.addEventListener("scroll", schedulePinnedLabelUpdate);
  }
  windowRef.addEventListener("resize", schedulePinnedLabelUpdate);

  return {
    getCurrentSettings: () => currentBookmarkSettings,
    renderPinnedLabels,
    schedulePinnedLabelUpdate,
    syncBookmarkSettings,
  };
}
