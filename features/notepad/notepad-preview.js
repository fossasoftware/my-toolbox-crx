export function applyPreviewSearchHighlights(
  container,
  { activeSearchMatchIndex = -1, searchQuery = "" } = {}
) {
  if (!container || !searchQuery) {
    return;
  }

  const normalizedQuery = searchQuery.toLocaleLowerCase();
  if (!normalizedQuery) {
    return;
  }

  const textNodes = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parentTag = node.parentElement?.tagName;
        if (parentTag === "MARK") {
          return NodeFilter.FILTER_REJECT;
        }

        return node.nodeValue.toLocaleLowerCase().includes(normalizedQuery)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  let matchOrdinal = 0;
  textNodes.forEach((node) => {
    const textValue = node.nodeValue || "";
    const normalizedValue = textValue.toLocaleLowerCase();
    let lastIndex = 0;
    let matchIndex = normalizedValue.indexOf(normalizedQuery);

    if (matchIndex === -1) {
      return;
    }

    const fragment = document.createDocumentFragment();
    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        fragment.append(textValue.slice(lastIndex, matchIndex));
      }

      const highlight = document.createElement("mark");
      highlight.className = "notepad-search-highlight";
      if (matchOrdinal === activeSearchMatchIndex) {
        highlight.classList.add("is-active");
      }
      highlight.textContent = textValue.slice(
        matchIndex,
        matchIndex + searchQuery.length
      );
      fragment.append(highlight);
      matchOrdinal += 1;

      lastIndex = matchIndex + searchQuery.length;
      matchIndex = normalizedValue.indexOf(normalizedQuery, lastIndex);
    }

    if (lastIndex < textValue.length) {
      fragment.append(textValue.slice(lastIndex));
    }

    node.parentNode?.replaceChild(fragment, node);
  });
}

export function renderNotepadPreview(
  area,
  preview,
  { activeSearchMatchIndex = -1, searchQuery = "" } = {}
) {
  if (!area || !preview) {
    if (!area) console.error("Notepad: Element #notepadArea not found.");
    if (!preview) console.error("Notepad: Element #notepadPreview not found.");
    return;
  }

  const marked = window.marked;
  const DOMPurify = window.DOMPurify;

  if (typeof marked?.parse !== "function" || typeof DOMPurify !== "function") {
    console.error("Notepad: Libraries missing or not global");
    preview.textContent = "⚠️ Markdown support unavailable";
    return;
  }

  try {
    const rawHtml = marked.parse(area.value, { breaks: true, gfm: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    preview.innerHTML = cleanHtml;
    applyPreviewSearchHighlights(preview, {
      activeSearchMatchIndex,
      searchQuery,
    });
  } catch (error) {
    console.error("Markdown rendering error:", error);
    preview.textContent = "Error rendering preview.";
  }
}

export function waitForMarkdownLibraries(
  onReady,
  { delay = 200, retries = 40 } = {}
) {
  const check = () => {
    if (
      (typeof window.marked === "object" || typeof window.marked === "function") &&
      typeof window.marked.parse === "function" &&
      typeof window.DOMPurify === "function"
    ) {
      onReady?.();
    } else if (retries-- <= 0) {
      console.error("[❌] Markdown libs did not become ready in time.");
    } else {
      setTimeout(check, delay);
    }
  };
  check();
}

export function syncScrollByPercentage(source, target) {
  const percent = source.scrollTop / (source.scrollHeight - source.clientHeight);
  const targetScroll = percent * (target.scrollHeight - target.clientHeight);
  target.scrollTop = targetScroll;
}

export function bindSyncedNotepadScroll(area, preview) {
  if (!area || !preview) return;

  let isSyncing = false;

  area.addEventListener("scroll", () => {
    if (isSyncing) return;
    isSyncing = true;
    syncScrollByPercentage(area, preview);
    setTimeout(() => {
      isSyncing = false;
    }, 10);
  });

  preview.addEventListener("scroll", () => {
    if (isSyncing) return;
    isSyncing = true;
    syncScrollByPercentage(preview, area);
    setTimeout(() => {
      isSyncing = false;
    }, 10);
  });
}
