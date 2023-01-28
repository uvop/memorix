import { getScopeEndIndex, removeBracketsOfScope } from "./utilities";

export enum ValueTypes {
  string,
  simple,
  object,
  array,
}

type BaseValueType = {
  isOptional: boolean;
};

export type SimpleValueType = BaseValueType & {
  type: ValueTypes.simple;
  name: string;
};
export type ArrayValueType = BaseValueType & {
  type: ValueTypes.array;
  value: ValueType;
};
export type ObjectValueType = BaseValueType & {
  type: ValueTypes.object;
  properties: PropertyType[];
};
export type StringValueType = {
  type: ValueTypes.string;
  content: string;
};

export type ValueType =
  | SimpleValueType
  | ArrayValueType
  | ObjectValueType
  | StringValueType;

export type PropertyType = {
  name: string;
  value: ValueType;
};

export const getValueFromString: (
  content: string,
  propertiesToKeepString?: string[]
) => ValueType = (content, propertiesToKeepString = []) => {
  const isOptional = content[content.length - 1] === "?";
  const contentWithoutOptional = isOptional
    ? content.substring(0, content.length - 1)
    : content;

  if (content.indexOf("[") === 0) {
    const arrayContent = removeBracketsOfScope(contentWithoutOptional).trim();
    return {
      type: ValueTypes.array,
      value: getValueFromString(arrayContent),
      isOptional,
    };
  }
  if (content.indexOf("{") === 0) {
    const scopeContents = removeBracketsOfScope(contentWithoutOptional);
    const properties: Array<{
      name: string;
      value: ValueType;
    }> = [];

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
        properties.push({
          name,
          value: getValueFromString(stringValue),
        });
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

        properties.push({
          name,
          value:
            propertiesToKeepString.indexOf(name) === -1
              ? getValueFromString(scope)
              : {
                  type: ValueTypes.string,
                  content: scope,
                },
        });

        index += bracketIndex + bracketEndIndex + 1;
      }
    }

    return {
      type: ValueTypes.object,
      isOptional,
      properties,
    };
  }
  return {
    type: ValueTypes.simple,
    isOptional,
    name: contentWithoutOptional.trim(),
  };
};
