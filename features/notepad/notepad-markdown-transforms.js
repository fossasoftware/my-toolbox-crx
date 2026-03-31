function getSelectionRange(area) {
  const start = area.selectionStart ?? 0;
  const end = area.selectionEnd ?? start;
  return { end, start, value: area.value };
}

function buildCommitPayload(nextValue, selectionStart, selectionEnd) {
  return {
    nextSelectionEnd: selectionEnd,
    nextSelectionStart: selectionStart,
    nextValue,
  };
}

export function wrapSelectionTransform(area, open, close = open) {
  const { start, end, value } = getSelectionRange(area);
  const selectedText = value.slice(start, end);
  const nextValue =
    value.slice(0, start) +
    open +
    selectedText +
    close +
    value.slice(end);
  const nextSelectionStart = start + open.length;
  const nextSelectionEnd = start + open.length + selectedText.length;
  return buildCommitPayload(nextValue, nextSelectionStart, nextSelectionEnd);
}

export function insertLinkTransform(area) {
  const { start, end, value } = getSelectionRange(area);
  const selectedText = value.slice(start, end);
  const hasSelection = start !== end;
  const linkMarkup = hasSelection ? `[${selectedText}]()` : "[]()";
  const nextValue = value.slice(0, start) + linkMarkup + value.slice(end);
  const cursorPosition = hasSelection ? start + selectedText.length + 3 : start + 1;
  return buildCommitPayload(nextValue, cursorPosition, cursorPosition);
}

export function insertCodeTransform(area) {
  const { start, end, value } = getSelectionRange(area);
  const selectedText = value.slice(start, end);

  if (selectedText.includes("\n")) {
    const open = "```\n";
    const close = "\n```";
    const nextValue =
      value.slice(0, start) +
      open +
      selectedText +
      close +
      value.slice(end);
    const nextSelectionStart = start + open.length;
    const nextSelectionEnd = nextSelectionStart + selectedText.length;
    return buildCommitPayload(nextValue, nextSelectionStart, nextSelectionEnd);
  }

  return wrapSelectionTransform(area, "`");
}

export function toggleLinePrefixTransform(area, prefix) {
  const { start, end, value } = getSelectionRange(area);
  const blockStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreakIndex = value.indexOf("\n", end);
  const blockEnd = nextBreakIndex === -1 ? value.length : nextBreakIndex;
  const block = value.slice(blockStart, blockEnd);

  if (start === end && block.length === 0) {
    const nextValue = value.slice(0, blockStart) + prefix + value.slice(blockEnd);
    const nextCursor = blockStart + prefix.length;
    return buildCommitPayload(nextValue, nextCursor, nextCursor);
  }

  const lines = block.split("\n");
  const nonEmptyLines = lines.filter((line) => line.length > 0);
  const shouldRemovePrefix =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => line.startsWith(prefix));

  const nextBlock = lines
    .map((line) => {
      if (!line) return line;
      if (shouldRemovePrefix && line.startsWith(prefix)) {
        return line.slice(prefix.length);
      }
      if (!shouldRemovePrefix && !line.startsWith(prefix)) {
        return `${prefix}${line}`;
      }
      return line;
    })
    .join("\n");

  const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
  const nextSelectionStart = blockStart;
  const nextSelectionEnd = blockStart + nextBlock.length;
  return buildCommitPayload(nextValue, nextSelectionStart, nextSelectionEnd);
}

export function toggleHeadingTransform(area, level) {
  const { start, end, value } = getSelectionRange(area);
  const blockStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreakIndex = value.indexOf("\n", end);
  const blockEnd = nextBreakIndex === -1 ? value.length : nextBreakIndex;
  const block = value.slice(blockStart, blockEnd);
  const headingPrefix = `${"#".repeat(level)} `;

  if (start === end && block.length === 0) {
    const nextValue =
      value.slice(0, blockStart) + headingPrefix + value.slice(blockEnd);
    const nextCursor = blockStart + headingPrefix.length;
    return buildCommitPayload(nextValue, nextCursor, nextCursor);
  }

  const lines = block.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const shouldRemoveHeading =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => line.trimStart().startsWith(headingPrefix));

  const nextBlock = lines
    .map((line) => {
      if (!line.trim()) {
        return line;
      }

      const match = line.match(/^(\s*)(?:#{1,6}\s+)?(.*)$/);
      const indent = match?.[1] ?? "";
      const content = match?.[2] ?? line.trimStart();

      return shouldRemoveHeading
        ? `${indent}${content}`
        : `${indent}${headingPrefix}${content}`;
    })
    .join("\n");

  const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
  const nextSelectionStart = blockStart;
  const nextSelectionEnd = blockStart + nextBlock.length;
  return buildCommitPayload(nextValue, nextSelectionStart, nextSelectionEnd);
}

export function toggleCheckboxListTransform(area) {
  const { start, end, value } = getSelectionRange(area);
  const blockStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreakIndex = value.indexOf("\n", end);
  const blockEnd = nextBreakIndex === -1 ? value.length : nextBreakIndex;
  const block = value.slice(blockStart, blockEnd);

  if (start === end && block.length === 0) {
    const prefix = "- [ ] ";
    const nextValue = value.slice(0, blockStart) + prefix + value.slice(blockEnd);
    const nextCursor = blockStart + prefix.length;
    return buildCommitPayload(nextValue, nextCursor, nextCursor);
  }

  const lines = block.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const checkboxPattern = /^\s*-\s\[(?: |x|X)\]\s/;
  const shouldRemoveCheckbox =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => checkboxPattern.test(line));

  const nextBlock = lines
    .map((line) => {
      if (!line.trim()) {
        return line;
      }

      const checkboxMatch = line.match(/^(\s*)-\s\[(?: |x|X)\]\s(.*)$/);
      if (shouldRemoveCheckbox) {
        if (checkboxMatch) {
          return `${checkboxMatch[1]}${checkboxMatch[2]}`;
        }
        return line;
      }

      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      const indent =
        checkboxMatch?.[1] ??
        bulletMatch?.[1] ??
        (line.match(/^(\s*)/)?.[1] ?? "");
      const content = checkboxMatch?.[2] ?? bulletMatch?.[2] ?? line.trim();

      return `${indent}- [ ] ${content}`;
    })
    .join("\n");

  const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
  const nextSelectionStart = blockStart;
  const nextSelectionEnd = blockStart + nextBlock.length;
  return buildCommitPayload(nextValue, nextSelectionStart, nextSelectionEnd);
}
