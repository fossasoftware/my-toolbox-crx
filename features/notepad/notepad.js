import { getText, showToast } from "../../options/options-main.js";
import { storageGet, storageSet } from "../../utils/storage.js";

let notepadSaveTimeout;
const NOTEPAD_SAVE_DELAY = 750;

async function loadNotepadContent() {
  const notepadArea = document.getElementById('notepadArea');
  if (notepadArea) {
    const data = await storageGet('notepadContent');
    if (data !== null) {
      notepadArea.value = data || '';
      renderMarkdownPreview();
    }
  }
}

async function saveNotepadContent() {
  const notepadArea = document.getElementById('notepadArea');
  const statusDiv = document.getElementById('notepadStatus');
  if (notepadArea && statusDiv) {
    const content = notepadArea.value;
    statusDiv.textContent = getText('notepadStatusSaving');
    const ok = await storageSet({ notepadContent: content });
    if (ok) {
      statusDiv.textContent = getText('notepadStatusSaved');
      setTimeout(() => {
        if (statusDiv.textContent === getText('notepadStatusSaved')) {
          statusDiv.textContent = '';
        }
      }, 2000);
    } else {
      statusDiv.textContent = getText('toastErrorSaving');
    }
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
    showToast('toastErrorGeneric');
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
    showToast('toastErrorGeneric');
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
      showToast('toastErrorGeneric');
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
    showToast('toastErrorGeneric');
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