(function attachSecurityLevelCustomiserStore(global) {
  if (global.MyToolboxSecurityLevelCustomiserStore) {
    return;
  }

  const logic = global.MyToolboxSecurityLevelCustomiserIssueKey || {};
  const { normalizeText = (text) => text || "" } = logic;
  const API_CACHE_TTL_MS = 30000;
  const FETCH_FAILURE_TTL_MS = 15000;
  const SESSION_CACHE_PREFIX = "my-toolbox-security-level:";
  const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

  function createSecurityLevelStore({ onUpdated } = {}) {
    let pendingFetchIssueKey = "";
    const failedSecurityLevelFetches = new Map();
    const securityLevelCache = new Map();

    function getSessionCacheKey(issueKey) {
      return `${SESSION_CACHE_PREFIX}${global.location.host}:${issueKey}`;
    }

    function loadSessionCachedSecurityLevel(issueKey) {
      try {
        const raw = global.sessionStorage?.getItem(getSessionCacheKey(issueKey));
        if (!raw) {
          return null;
        }

        const cached = JSON.parse(raw);
        if (
          !cached ||
          typeof cached.name !== "string" ||
          !Number.isFinite(cached.fetchedAt)
        ) {
          return null;
        }

        if (Date.now() - cached.fetchedAt > SESSION_CACHE_TTL_MS) {
          global.sessionStorage?.removeItem(getSessionCacheKey(issueKey));
          return null;
        }

        securityLevelCache.set(issueKey, cached);
        return cached;
      } catch (error) {
        return null;
      }
    }

    function saveSessionCachedSecurityLevel(issueKey, cached) {
      try {
        global.sessionStorage?.setItem(
          getSessionCacheKey(issueKey),
          JSON.stringify(cached)
        );
      } catch (error) {
        // Ignore storage quota or access errors; in-memory cache still works.
      }
    }

    function getStoredSecurityLevel(issueKey) {
      if (!issueKey) {
        return null;
      }

      return (
        securityLevelCache.get(issueKey) ||
        loadSessionCachedSecurityLevel(issueKey)
      );
    }

    function getFreshSecurityLevel(issueKey) {
      const cached = getStoredSecurityLevel(issueKey);
      if (!cached) {
        return null;
      }

      if (Date.now() - cached.fetchedAt > API_CACHE_TTL_MS) {
        return null;
      }

      return cached;
    }

    function setCachedSecurityLevel(issueKey, name) {
      if (!issueKey) {
        return;
      }

      const cached = {
        fetchedAt: Date.now(),
        name: normalizeText(name),
      };
      securityLevelCache.set(issueKey, cached);
      failedSecurityLevelFetches.delete(issueKey);
      saveSessionCachedSecurityLevel(issueKey, cached);
    }

    function hasRecentFetchFailure(issueKey) {
      const failedAt = failedSecurityLevelFetches.get(issueKey) || 0;
      return Boolean(
        failedAt && Date.now() - failedAt <= FETCH_FAILURE_TTL_MS
      );
    }

    function getSecurityLevelApiUrl(issueKey) {
      const url = new URL(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
        global.location.origin
      );
      url.searchParams.set("fields", "security");
      return url.toString();
    }

    async function fetchSecurityLevel(issueKey, { force = false } = {}) {
      if (!issueKey) {
        return;
      }

      if (
        !force &&
        (getFreshSecurityLevel(issueKey) || hasRecentFetchFailure(issueKey))
      ) {
        return;
      }

      if (pendingFetchIssueKey === issueKey) {
        return;
      }

      pendingFetchIssueKey = issueKey;
      failedSecurityLevelFetches.delete(issueKey);

      try {
        const response = await fetch(getSecurityLevelApiUrl(issueKey), {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        setCachedSecurityLevel(issueKey, payload?.fields?.security?.name || "");
        onUpdated?.();
      } catch (error) {
        failedSecurityLevelFetches.set(issueKey, Date.now());
        onUpdated?.();
        console.debug(
          "Security Level Customiser: failed to load issue security level",
          error
        );
      } finally {
        if (pendingFetchIssueKey === issueKey) {
          pendingFetchIssueKey = "";
        }
      }
    }

    return {
      fetchSecurityLevel,
      getStoredSecurityLevel,
      hasRecentFetchFailure,
      setCachedSecurityLevel,
    };
  }

  global.MyToolboxSecurityLevelCustomiserStore = {
    createSecurityLevelStore,
  };
})(globalThis);
