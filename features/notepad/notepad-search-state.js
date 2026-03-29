export function buildSearchMatches(value, query) {
  if (!value || !query) {
    return [];
  }

  const normalizedValue = value.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = [];
  let fromIndex = 0;

  while (fromIndex < normalizedValue.length) {
    const matchIndex = normalizedValue.indexOf(normalizedQuery, fromIndex);
    if (matchIndex === -1) {
      break;
    }
    matches.push({
      start: matchIndex,
      end: matchIndex + query.length,
    });
    fromIndex = matchIndex + Math.max(query.length, 1);
  }

  return matches;
}

export function resolveActiveSearchMatchIndex({
  activeSearchMatchIndex,
  preserveActive = false,
  previousMatches = [],
  searchMatches = [],
  searchQuery = "",
}) {
  const previousMatchStart =
    preserveActive &&
    activeSearchMatchIndex >= 0 &&
    activeSearchMatchIndex < previousMatches.length
      ? previousMatches[activeSearchMatchIndex].start
      : null;

  if (!searchQuery || searchMatches.length === 0) {
    return -1;
  }

  if (previousMatchStart !== null) {
    const sameMatchIndex = searchMatches.findIndex(
      (match) => match.start === previousMatchStart
    );
    const fallbackIndex =
      sameMatchIndex !== -1
        ? sameMatchIndex
        : Math.min(activeSearchMatchIndex, searchMatches.length - 1);
    return fallbackIndex < 0 ? 0 : fallbackIndex;
  }

  return 0;
}

export function getNextSearchMatchIndex(
  activeSearchMatchIndex,
  direction,
  totalMatches
) {
  if (totalMatches <= 0) {
    return -1;
  }

  return activeSearchMatchIndex === -1
    ? 0
    : (activeSearchMatchIndex + direction + totalMatches) % totalMatches;
}
