(function attachRowHighlighterLogic(global) {
  if (global.MyToolboxRowHighlighterLogic) {
    return;
  }

  function normalizeKeyword(keyword) {
    return typeof keyword === "string" ? keyword.trim().toLowerCase() : "";
  }

  function normalizeSearchText(text) {
    return typeof text === "string"
      ? text.replace(/\s+/g, " ").trim().toLowerCase()
      : "";
  }

  const MIN_PRIORITY = 0;
  const MAX_PRIORITY = 10;

  function normalizePriority(priority) {
    const numeric = Number(priority);
    return Number.isFinite(numeric) &&
      Number.isInteger(numeric) &&
      numeric >= MIN_PRIORITY &&
      numeric <= MAX_PRIORITY
      ? numeric
      : MIN_PRIORITY;
  }

  const WORD_CHARACTER_PATTERN = /[\p{L}\p{N}_]/u;

  function isWordCharacter(value) {
    return typeof value === "string" &&
      value.length > 0 &&
      WORD_CHARACTER_PATTERN.test(value);
  }

  function keywordMatchesNormalizedText(keyword, normalizedText) {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword || !normalizedText) {
      return false;
    }

    let matchIndex = normalizedText.indexOf(normalizedKeyword);
    while (matchIndex !== -1) {
      const before = normalizedText[matchIndex - 1] || "";
      const after = normalizedText[matchIndex + normalizedKeyword.length] || "";

      if (!isWordCharacter(before) && !isWordCharacter(after)) {
        return true;
      }

      matchIndex = normalizedText.indexOf(normalizedKeyword, matchIndex + 1);
    }

    return false;
  }

  function keywordMatchesText(keyword, text) {
    return keywordMatchesNormalizedText(keyword, normalizeSearchText(text));
  }

  function getKeywordVariants(item) {
    const aliases = Array.isArray(item?.aliases)
      ? item.aliases
      : Array.isArray(item?.keywordAliases)
        ? item.keywordAliases
        : [];
    return [item?.keyword, ...aliases]
      .map((value) => normalizeKeyword(value))
      .filter(Boolean);
  }

  function compileHighlightMatchers(settings) {
    return settings
      .filter((item) => item?.enabled !== false)
      .map((item) => ({
        color: item.color,
        keywords: [...new Set(getKeywordVariants(item))],
        priority: normalizePriority(item.priority),
      }))
      .filter((item) => item.keywords.length > 0 && typeof item.color === "string");
  }

  function findMatchedHighlight(matchers, text) {
    const normalizedText = normalizeSearchText(text);
    let matchedItem = null;
    for (const item of matchers) {
      const matches = item.keywords.some((keyword) =>
        keywordMatchesNormalizedText(keyword, normalizedText)
      );
      if (!matches) {
        continue;
      }
      if (!matchedItem || item.priority > matchedItem.priority) {
        matchedItem = item;
      }
    }
    return matchedItem;
  }

  global.MyToolboxRowHighlighterLogic = {
    compileHighlightMatchers,
    findMatchedHighlight,
    getKeywordVariants,
    keywordMatchesText,
    normalizeKeyword,
    normalizePriority,
    normalizeSearchText,
  };
})(globalThis);
