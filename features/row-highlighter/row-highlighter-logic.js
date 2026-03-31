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
      }))
      .filter((item) => item.keywords.length > 0 && typeof item.color === "string");
  }

  function findMatchedHighlight(matchers, text) {
    for (const item of matchers) {
      if (item.keywords.some((keyword) => text.includes(keyword))) {
        return item;
      }
    }
    return null;
  }

  global.MyToolboxRowHighlighterLogic = {
    compileHighlightMatchers,
    findMatchedHighlight,
    getKeywordVariants,
    normalizeKeyword,
    normalizeSearchText,
  };
})(globalThis);
