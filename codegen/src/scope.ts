type PropertyType = {
  name: string;
  value: string;
  isOptional: boolean;
  isValueAScope: boolean;
};

export const getPropertiesOfScope: (scope: string) => PropertyType[] = (
  scope
) => {
  const scopeWithoutBraces = scope.substring(1, scope.length - 1).trim();

  const properties: PropertyType[] = [];
  let index = 0;

  while (index < scopeWithoutBraces.length) {
    const partOfScope = scopeWithoutBraces.substring(index);
    const nameEndIndex = partOfScope.indexOf(":");
    const name = partOfScope.substring(0, nameEndIndex).trim();
    index += nameEndIndex + 1;

    const partOfScopeForValue = partOfScope.substring(nameEndIndex + 1);
    const newLineIndex = partOfScopeForValue.indexOf("\n");
    const endOfLineIndex =
      newLineIndex === -1 ? partOfScopeForValue.length - 1 : newLineIndex + 1;
    const newScopeIndex = partOfScopeForValue.indexOf("{");

    if (newScopeIndex !== -1 && newScopeIndex < endOfLineIndex) {
      let unclosedBracketCount = 1;
      let newScopeIndexEnd = newScopeIndex + 1;
      while (unclosedBracketCount !== 0) {
        const partForBracketSearch =
          partOfScopeForValue.substring(newScopeIndexEnd);
        const nextBracketOpen = partForBracketSearch.indexOf("{");
        const nextBracketClose = partForBracketSearch.indexOf("}");
        if (nextBracketOpen === -1 || nextBracketClose < nextBracketOpen) {
          unclosedBracketCount -= 1;
          newScopeIndexEnd += nextBracketClose + 1;
        } else {
          unclosedBracketCount += 1;
          newScopeIndexEnd += nextBracketOpen + 1;
        }
      }

      const value = partOfScopeForValue
        .substring(newScopeIndex, newScopeIndex + newScopeIndexEnd - 1)
        .trim();

      const partOfAfterScopeEnd = partOfScopeForValue.substring(
        newScopeIndex + newScopeIndexEnd - 1
      );
      const newLineAfterScopeEndIndex = partOfAfterScopeEnd.indexOf("\n");
      const endOfLineAfterScopeEndIndex =
        newLineAfterScopeEndIndex === -1
          ? partOfAfterScopeEnd.length - 1
          : newLineAfterScopeEndIndex + 1;
      const optionalAfterScopeEndIndex = partOfAfterScopeEnd.indexOf("?");

      const isOptional =
        optionalAfterScopeEndIndex !== -1 &&
        optionalAfterScopeEndIndex <= endOfLineAfterScopeEndIndex;

      properties.push({
        name,
        value,
        isOptional,
        isValueAScope: true,
      });
      index += newScopeIndex + newScopeIndexEnd + 1;
    } else {
      const optionalIndex = partOfScopeForValue.indexOf("?");
      const isOptional =
        optionalIndex !== -1 && optionalIndex <= endOfLineIndex;
      const value = partOfScopeForValue
        .substring(0, isOptional ? optionalIndex : endOfLineIndex + 1)
        .trim();

      properties.push({
        name,
        value,
        isOptional,
        isValueAScope: false,
      });
      index += endOfLineIndex + 1;
    }
  }

  return properties;
};
