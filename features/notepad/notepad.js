import { showToast } from "../../options/options-main.js";

let notepadSaveTimeout;
let autosaveEnabled = true;
let autosaveToggle;
let saveButton;
const NOTEPAD_SAVE_DELAY = 750;
const NOTEPAD_AUTOSAVE_KEY = "notepadAutosaveEnabled";

function setAutosaveState(enabled) {
  autosaveEnabled = enabled;
  if (autosaveToggle) {
    autosaveToggle.checked = enabled;
  }
  if (saveButton) {
    saveButton.disabled = enabled;
    saveButton.setAttribute("aria-disabled", enabled ? "true" : "false");
  }
  if (!enabled) {
    clearTimeout(notepadSaveTimeout);
  }
}

function loadAutosavePreference() {
  chrome.storage.sync.get(NOTEPAD_AUTOSAVE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Notepad: Error loading autosave preference:", chrome.runtime.lastError);
      showToast("toastErrorLoading");
      return;
    }
    const enabled = data[NOTEPAD_AUTOSAVE_KEY];
    setAutosaveState(enabled !== false);
  });
}

function saveAutosavePreference(enabled) {
  chrome.storage.sync.set({ [NOTEPAD_AUTOSAVE_KEY]: enabled }, () => {
    if (chrome.runtime.lastError) {
      console.error("Notepad: Error saving autosave preference:", chrome.runtime.lastError);
      showToast("toastErrorSaving");
    }
  });
}

function loadNotepadContent() {
  const notepadArea = document.getElementById('notepadArea');
  if (notepadArea) {
    chrome.storage.sync.get('notepadContent', (data) => {
      if (chrome.runtime.lastError) {
        console.error("Notepad: Error loading content:", chrome.runtime.lastError);
        showToast('toastErrorLoading');
      } else {
        notepadArea.value = data.notepadContent || '';
        renderMarkdownPreview();
      }
    });
  }
}

function saveNotepadContent({ showSuccessToast = true } = {}) {
  const notepadArea = document.getElementById('notepadArea');
  if (notepadArea) {
    const content = notepadArea.value;
    chrome.storage.sync.set({ notepadContent: content }, () => {
      if (chrome.runtime.lastError) {
        console.error('Notepad: Error saving content:', chrome.runtime.lastError);
        showToast('toastErrorSaving');
      } else if (showSuccessToast) {
        showToast('notepadStatusSaved');
      }
    });
  }
}

function debouncedSaveNotepad() {
  clearTimeout(notepadSaveTimeout);
  notepadSaveTimeout = setTimeout(() => {
    saveNotepadContent({ showSuccessToast: false });
  }, NOTEPAD_SAVE_DELAY);
}

function renderMarkdownPreview() {
  const notepadArea = document.getElementById('notepadArea');
  const notepadPreview = document.getElementById('notepadPreview');

  if (!notepadArea || !notepadPreview) {
    if (!notepadArea) console.error("Notepad: Element #notepadArea not found.");
    if (!notepadPreview) console.error("Notepad: Element #notepadPreview not found.");
    return;
  }

  const marked = window.marked;
  const DOMPurify = window.DOMPurify;

  if (typeof marked?.parse !== 'function' || typeof DOMPurify !== 'function') {
    console.error("Notepad: Libraries missing or not global");
    notepadPreview.textContent = "⚠️ Markdown support unavailable";
    return;
  }

  try {
    const markdownText = notepadArea.value;
    const rawHtml = marked.parse(markdownText, { breaks: true, gfm: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    notepadPreview.innerHTML = cleanHtml;
  } catch (error) {
    console.error("Markdown rendering error:", error);
    notepadPreview.textContent = "Error rendering preview.";
  }
}

function waitForMarkdownAndThenInit(retries = 40, delay = 200) {
  const check = () => {
    if ((typeof window.marked === 'object' || typeof window.marked === 'function')
      && typeof window.marked.parse === 'function'
      && typeof window.DOMPurify === 'function') {
      loadNotepadContent();
    } else if (retries-- <= 0) {
      console.error("[❌] Markdown libs did not become ready in time.");
    } else {
      setTimeout(check, delay);
    }
  };
  check();
}

export function initializeNotepad() {
  const notepadArea = document.getElementById('notepadArea');
  if (!notepadArea) {
    console.error("Notepad: Missing Notepad textarea");
    return;
  }

  autosaveToggle = document.getElementById('notepadAutosaveToggle');
  saveButton = document.getElementById('notepadSaveButton');

  if (autosaveToggle) {
    autosaveToggle.addEventListener('change', () => {
      const enabled = autosaveToggle.checked;
      setAutosaveState(enabled);
      saveAutosavePreference(enabled);
      if (enabled) {
        debouncedSaveNotepad();
      }
    });
  } else {
    console.error("Notepad: Missing autosave toggle");
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      saveNotepadContent();
    });
  } else {
    console.error("Notepad: Missing save button");
  }

  notepadArea.addEventListener('input', () => {
    renderMarkdownPreview();
    if (autosaveEnabled) {
      debouncedSaveNotepad();
    }
  });

  loadAutosavePreference();
  waitForMarkdownAndThenInit();
  bindSyncedScroll();
}

function syncScroll(source, target) {
  target.scrollTop = source.scrollTop;
}

function syncScrollByPercentage(source, target) {
  const percent = source.scrollTop / (source.scrollHeight - source.clientHeight);
  const targetScroll = percent * (target.scrollHeight - target.clientHeight);
  target.scrollTop = targetScroll;
}

function bindSyncedScroll() {
  const area = document.getElementById("notepadArea");
  const preview = document.getElementById("notepadPreview");
  if (!area || !preview) return;

  let isSyncing = false;

  area.addEventListener("scroll", () => {
    if (isSyncing) return;
    isSyncing = true;
    syncScrollByPercentage(area, preview);
    setTimeout(() => { isSyncing = false }, 10);
  });

  preview.addEventListener("scroll", () => {
    if (isSyncing) return;
    isSyncing = true;
    syncScrollByPercentage(preview, area);
    setTimeout(() => { isSyncing = false }, 10);
  });
}
