export function sanitizeRuleAliases(primaryName, aliases, normalizeName) {
  const normalizedPrimary = normalizeName(primaryName);
  const aliasSet = new Set();
  const cleaned = [];

  for (const alias of aliases) {
    if (typeof alias !== "string") {
      continue;
    }
    const trimmed = alias.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = normalizeName(trimmed);
    if (
      !normalized ||
      normalized === normalizedPrimary ||
      aliasSet.has(normalized)
    ) {
      continue;
    }
    aliasSet.add(normalized);
    cleaned.push(trimmed);
  }

  return cleaned;
}

export function mergeNamedRuleEntry(target, source, config) {
  if (!target || !source) return;

  const {
    aliasField = "aliases",
    mergeFields = [],
    normalizeName,
    primaryField,
  } = config;

  const aliasCandidates = [];
  if (Array.isArray(target[aliasField])) {
    aliasCandidates.push(...target[aliasField]);
  }
  if (typeof source[primaryField] === "string") {
    aliasCandidates.push(source[primaryField]);
  }
  if (Array.isArray(source[aliasField])) {
    aliasCandidates.push(...source[aliasField]);
  }

  const cleaned = sanitizeRuleAliases(
    target[primaryField],
    aliasCandidates,
    normalizeName
  );
  target[aliasField] = cleaned.length > 0 ? cleaned : undefined;

  for (const field of mergeFields) {
    if (target[field] === undefined && source[field] !== undefined) {
      target[field] = source[field];
    }
  }
}

export function mergeImportedNamedEntries(entries, config) {
  const {
    aliasField = "aliases",
    mergeEntry,
    normalizeName,
    primaryField,
  } = config;

  const merged = [];
  const indexByName = new Map();

  const getEntryNames = (entry) => [entry[primaryField], ...(entry[aliasField] || [])];
  const updateIndexMap = (entry, index) => {
    getEntryNames(entry).forEach((name) => {
      const normalized = normalizeName(name);
      if (normalized) {
        indexByName.set(normalized, index);
      }
    });
  };

  for (const entry of entries) {
    const normalizedNames = new Set(
      getEntryNames(entry).map((name) => normalizeName(name)).filter(Boolean)
    );
    const indices = new Set();
    normalizedNames.forEach((name) => {
      const index = indexByName.get(name);
      if (index !== undefined) {
        indices.add(index);
      }
    });

    if (indices.size === 0) {
      const newIndex = merged.length;
      merged.push(entry);
      updateIndexMap(entry, newIndex);
      continue;
    }

    const [targetIndex] = indices;
    const target = merged[targetIndex];
    for (const index of indices) {
      if (index === targetIndex) continue;
      mergeEntry(target, merged[index]);
      merged[index] = null;
    }
    mergeEntry(target, entry);
    updateIndexMap(target, targetIndex);
  }

  return merged.filter(Boolean);
}
