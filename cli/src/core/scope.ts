type ScopeType = {
  name: string;
  scope: string;
};

export const getScopes: (content: string) => ScopeType[] = (content) => {
  const namespaces: ScopeType[] = [];
  let index = 0;

  while (index < content.length) {
    const contentFromIndex = content.substring(index);
    const scopeIndex = contentFromIndex.indexOf("{");
    if (scopeIndex === -1) {
      break;
    }
    const name = contentFromIndex.substring(0, scopeIndex).trim();

    let unclosedBracketCount = 1;
    let scopeEndIndex = scopeIndex + 1;
    while (unclosedBracketCount !== 0) {
      const contentForSearch = contentFromIndex.substring(scopeEndIndex);
      const nextBracketOpen = contentForSearch.indexOf("{");
      const nextBracketClose = contentForSearch.indexOf("}");
      if (nextBracketOpen === -1 || nextBracketClose < nextBracketOpen) {
        unclosedBracketCount -= 1;
        scopeEndIndex += nextBracketClose + 1;
      } else {
        unclosedBracketCount += 1;
        scopeEndIndex += nextBracketOpen + 1;
      }
    }

    const scope = contentFromIndex.substring(scopeIndex, scopeEndIndex);
    index += scopeEndIndex;
    namespaces.push({
      name,
      scope,
    });
  }

  return namespaces;
};
