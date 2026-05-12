(function attachSecurityLevelCustomiserIssueKey(global) {
  if (global.MyToolboxSecurityLevelCustomiserIssueKey) {
    return;
  }

  const constants = global.MyToolboxSecurityLevelCustomiserConstants || {};
  const { ISSUE_KEY_PATTERN } = constants;

  function normalizeText(text) {
    return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
  }

  function normalizeIssueKey(value) {
    try {
      const decodedValue =
        typeof value === "string" ? decodeURIComponent(value) : "";
      return decodedValue.match(ISSUE_KEY_PATTERN)?.[0] || "";
    } catch (error) {
      return typeof value === "string"
        ? value.match(ISSUE_KEY_PATTERN)?.[0] || ""
        : "";
    }
  }

  function getIssueKeyFromUrl() {
    const url = new URL(global.location.href);
    const searchParamNames = [
      "selectedIssue",
      "issueKey",
      "issue",
      "focusedIssue",
    ];

    for (const name of searchParamNames) {
      const issueKey = normalizeIssueKey(url.searchParams.get(name) || "");
      if (issueKey) {
        return issueKey;
      }
    }

    return normalizeIssueKey(url.pathname);
  }

  function getIssueKeyFromDocument() {
    const metaIssueKey = document.querySelector("meta[name='ajs-issue-key']");
    const metaValue = normalizeIssueKey(metaIssueKey?.getAttribute("content"));
    if (metaValue) {
      return metaValue;
    }

    const currentIssueLink = [
      "a[href*='/browse/']",
      "[data-testid*='issue-key']",
      "[data-testid*='issue.views.issue-base'] a",
    ]
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .find((element) => {
        const issueKey = normalizeIssueKey(
          `${element.textContent || ""} ${element.getAttribute?.("href") || ""}`
        );
        return Boolean(issueKey);
      });

    if (!currentIssueLink) {
      return "";
    }

    return normalizeIssueKey(
      `${currentIssueLink.textContent || ""} ${
        currentIssueLink.getAttribute?.("href") || ""
      }`
    );
  }

  function getCurrentIssueKey() {
    try {
      return getIssueKeyFromUrl() || getIssueKeyFromDocument();
    } catch (error) {
      console.debug("Security Level Customiser: issue key lookup failed", error);
      return "";
    }
  }

  function getRefreshTimestamp() {
    return typeof performance !== "undefined" &&
      typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  global.MyToolboxSecurityLevelCustomiserIssueKey = {
    getCurrentIssueKey,
    getIssueKeyFromDocument,
    getIssueKeyFromUrl,
    getRefreshTimestamp,
    normalizeIssueKey,
    normalizeText,
  };
})(globalThis);
