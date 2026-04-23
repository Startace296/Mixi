export function normalizeSearchText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

export function tokenizeSearchText(value) {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(" ") : [];
}

export function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previousRow[0];
    previousRow[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const saved = previousRow[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      previousRow[j] = Math.min(
        previousRow[j] + 1,
        previousRow[j - 1] + 1,
        diagonal + cost,
      );
      diagonal = saved;
    }
  }

  return previousRow[right.length];
}

function getInitials(tokens) {
  return tokens.map((token) => token[0]).join("");
}

export function getSearchScore(value, query) {
  const normalizedValue = normalizeSearchText(value);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return Number.POSITIVE_INFINITY;
  if (!normalizedValue) return Number.POSITIVE_INFINITY;

  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.includes(normalizedQuery)) return 1;

  const compactValue = compactSearchText(value);
  const compactQuery = compactSearchText(query);

  if (compactValue === compactQuery) return 0;
  if (compactValue.includes(compactQuery)) return 1;

  const valueTokens = tokenizeSearchText(value);
  const queryTokens = tokenizeSearchText(query);

  const tokenMatches = queryTokens
    .map((queryToken) =>
      valueTokens.some((valueToken) =>
        valueToken.startsWith(queryToken) || levenshteinDistance(valueToken, queryToken) <= 1,
      ),
    )
    .filter(Boolean).length;

  if (queryTokens.length > 1) {
    if (tokenMatches === queryTokens.length) return 2;
    if (tokenMatches >= Math.ceil(queryTokens.length / 2)) return 3;
    return Number.POSITIVE_INFINITY;
  }

  if (valueTokens.length > 1) {
    const initials = getInitials(valueTokens);
    if (initials.startsWith(compactQuery) || compactQuery.startsWith(initials)) {
      return 2;
    }
  }

  if (tokenMatches > 0) {
    return 3;
  }

  const compactDistance = levenshteinDistance(compactValue, compactQuery);
  const allowedCompactDistance =
    normalizedQuery.length <= 4 ? 1 : normalizedQuery.length <= 8 ? 2 : 2;

  if (compactDistance <= allowedCompactDistance) {
    return 4 + compactDistance;
  }

  return Number.POSITIVE_INFINITY;
}
