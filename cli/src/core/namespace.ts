type NamespaceType = {
  name: string;
  scope: string;
};

export const getNamespaces: (content: string) => NamespaceType[] = (
  content
) => {
  const namespaces: NamespaceType[] = [];
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
