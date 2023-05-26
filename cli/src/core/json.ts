import { getScopeEndIndex, removeBracketsOfScope } from "./utilities";

export const getJsonFromString: (content: string) => any = (content) => {
  if (content.indexOf("[") === 0) {
    const arrayContent = removeBracketsOfScope(content).trim();
    const arr = [] as string[];

    let index = 0;
    while (index < content.length) {
      const contentFromIndex = arrayContent.substring(index);

      if (contentFromIndex.trim().length === 0) {
        break;
      }

      const nextItemIndex = contentFromIndex.indexOf("\n");

      if (nextItemIndex === -1) {
        arr.push(getJsonFromString(contentFromIndex));
        break;
      }

      const arrayIndex = arrayContent.indexOf("[");
      const scopeIndex = arrayContent.indexOf("{");

      if (scopeIndex !== -1 || arrayIndex !== -1) {
        const isObjectScope =
          arrayIndex === -1 || (scopeIndex !== -1 && scopeIndex < arrayIndex);

        const bracketIndex = isObjectScope ? scopeIndex : arrayIndex;
        const brackets = {
          opening: isObjectScope ? "{" : "[",
          closing: isObjectScope ? "}" : "]",
        };

        const bracketEndIndex = getScopeEndIndex(contentFromIndex, brackets);

        const scope = contentFromIndex
          .substring(bracketIndex, bracketIndex + bracketEndIndex + 1)
          .trim();

        arr.push(getJsonFromString(scope));
        index += bracketIndex + bracketEndIndex + 1;
      } else {
        const currentItem = contentFromIndex.substring(0, nextItemIndex).trim();
        if (currentItem.length !== 0) {
          arr.push(getJsonFromString(currentItem));
        }
        index += nextItemIndex + 1;
      }
    }

    return arr;
  }
  if (content.indexOf("{") === 0) {
    const scopeContents = removeBracketsOfScope(content);
    const obj = {};

    let index = 0;
    while (index < content.length) {
      const contentFromIndex = scopeContents.substring(index);
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
      const arrayIndex = contentAfterName.indexOf("[");

      if (
        (scopeIndex === -1 || endOfLineIndex < scopeIndex) &&
        (arrayIndex === -1 || endOfLineIndex < arrayIndex)
      ) {
        const stringValue = contentAfterName
          .substring(0, endOfLineIndex + 1)
          .trim();
        obj[name] = getJsonFromString(stringValue);
        index += endOfLineIndex + 1;
      } else {
        const isObjectScope =
          arrayIndex === -1 || (scopeIndex !== -1 && scopeIndex < arrayIndex);

        const bracketIndex = isObjectScope ? scopeIndex : arrayIndex;
        const brackets = {
          opening: isObjectScope ? "{" : "[",
          closing: isObjectScope ? "}" : "]",
        };

        const bracketEndIndex = getScopeEndIndex(contentAfterName, brackets);

        const scope = contentAfterName
          .substring(bracketIndex, bracketIndex + bracketEndIndex)
          .trim();

        obj[name] = getJsonFromString(scope);
        index += bracketIndex + bracketEndIndex + 1;
      }
    }

    return obj;
  }
  const trimmedContent = content.trim();
  if (trimmedContent === "null") {
    return undefined;
  }
  return JSON.parse(trimmedContent);
};
