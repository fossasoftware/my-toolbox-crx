import { getText, showToast } from "../../options/options-main.js";

let notepadSaveTimeout;
const NOTEPAD_SAVE_DELAY = 750;

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

function saveNotepadContent() {
  const notepadArea = document.getElementById('notepadArea');
  const statusDiv = document.getElementById('notepadStatus');
  if (notepadArea && statusDiv) {
    const content = notepadArea.value;
    statusDiv.textContent = getText('notepadStatusSaving');
    chrome.storage.sync.set({ notepadContent: content }, () => {
      if (chrome.runtime.lastError) {
        console.error("Notepad: Error saving content:", chrome.runtime.lastError);
        statusDiv.textContent = getText('toastErrorSaving');
      } else {
        statusDiv.textContent = getText('notepadStatusSaved');
        setTimeout(() => {
          if (statusDiv.textContent === getText('notepadStatusSaved')) {
            statusDiv.textContent = '';
          }
        }, 2000);
      }
    });
  }
}

function debouncedSaveNotepad() {
  clearTimeout(notepadSaveTimeout);
  const statusDiv = document.getElementById('notepadStatus');
  if (statusDiv) statusDiv.textContent = getText('notepadStatusSaving');
  notepadSaveTimeout = setTimeout(saveNotepadContent, NOTEPAD_SAVE_DELAY);
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
    if (typeof window.marked === 'object' && typeof window.marked.parse === 'function'
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

  notepadArea.addEventListener('input', () => {
    renderMarkdownPreview();
    debouncedSaveNotepad();
  });

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