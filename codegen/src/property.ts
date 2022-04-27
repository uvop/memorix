import { removeBracketsOfScope } from "./utilities";

export type PropertyType = {
  name: string;
  value: string | PropertyType[];
  isOptional: boolean;
};

export const getProperties: (content: string) => PropertyType[] = (content) => {
  const properties: PropertyType[] = [];
  let index = 0;

  while (index < content.length) {
    const contentFromIndex = content.substring(index);
    const nameEndIndex = contentFromIndex.indexOf(":");
    if (nameEndIndex === -1) {
      break;
    }
    const name = contentFromIndex.substring(0, nameEndIndex).trim();
    index += nameEndIndex + 1;

    const contentAfterName = contentFromIndex.substring(nameEndIndex + 1);
    const newLineIndex = contentAfterName.indexOf("\n");
    const endOfLineIndex =
      newLineIndex === -1 ? contentAfterName.length - 1 : newLineIndex + 1;
    const scopeIndex = contentAfterName.indexOf("{");

    if (scopeIndex !== -1 && scopeIndex < endOfLineIndex) {
      let unclosedBracketCount = 1;
      let scopeEndIndex = scopeIndex + 1;
      while (unclosedBracketCount !== 0) {
        const partForBracketSearch = contentAfterName.substring(scopeEndIndex);
        const nextBracketOpen = partForBracketSearch.indexOf("{");
        const nextBracketClose = partForBracketSearch.indexOf("}");
        if (nextBracketOpen === -1 || nextBracketClose < nextBracketOpen) {
          unclosedBracketCount -= 1;
          scopeEndIndex += nextBracketClose + 1;
        } else {
          unclosedBracketCount += 1;
          scopeEndIndex += nextBracketOpen + 1;
        }
      }

      const scope = contentAfterName
        .substring(scopeIndex, scopeIndex + scopeEndIndex - 1)
        .trim();

      const contentAfterScopeEnd = contentAfterName.substring(
        scopeIndex + scopeEndIndex - 1
      );
      const newLineAfterScopeEndIndex = contentAfterScopeEnd.indexOf("\n");
      const endOfLineAfterScopeEndIndex =
        newLineAfterScopeEndIndex === -1
          ? contentAfterScopeEnd.length - 1
          : newLineAfterScopeEndIndex + 1;
      const optionalAfterScopeEndIndex = contentAfterScopeEnd.indexOf("?");

      const isOptional =
        optionalAfterScopeEndIndex !== -1 &&
        optionalAfterScopeEndIndex <= endOfLineAfterScopeEndIndex;

      properties.push({
        name,
        value: getProperties(removeBracketsOfScope(scope)),
        isOptional,
      });
      index += scopeIndex + scopeEndIndex + 1;
    } else {
      const optionalIndex = contentAfterName.indexOf("?");
      const isOptional =
        optionalIndex !== -1 && optionalIndex <= endOfLineIndex;
      const value = contentAfterName
        .substring(0, isOptional ? optionalIndex : endOfLineIndex + 1)
        .trim();

      properties.push({
        name,
        value,
        isOptional,
      });
      index += endOfLineIndex + 1;
    }
  }

  return properties;
};
