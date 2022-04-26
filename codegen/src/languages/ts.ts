import { getProperties } from "src/property";
import { removeBracketsOfScope } from "src/utilities";

export const scopeToTs: (scope: string, level?: number) => string = (
  scope,
  level = 0
) => {
  const properties = getProperties(removeBracketsOfScope(scope));
  const spaces = Array.from({ length: level })
    .map(() => "    ")
    .join("");
  const nextSpaces = Array.from({ length: level + 1 })
    .map(() => "    ")
    .join("");

  return `{
${nextSpaces}${properties
    .map(
      (prop) =>
        `${prop.name}${prop.isOptional ? "?" : ""}: ${
          prop.isValueAScope ? scopeToTs(prop.value, level + 1) : prop.value
        };`
    )
    .join(`\n${nextSpaces}`)}
${spaces}}`;
};
