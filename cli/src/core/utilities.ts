export const camelCase = (str: string) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match) => {
    if (+match === 0) return "";
    return match.toUpperCase();
  });
};

export const removeBracketsOfScope = (scope: string) =>
  scope.substring(1, scope.length - 1);

export const assertUnreachable: (x: never) => never = () => {
  throw new Error("Didn't expect to get here");
};

export const getScopeEndIndex: (
  content: string,
  brackets: { opening: string; closing: string }
) => number = (content, { opening, closing }) => {
  const scopeIndex = content.indexOf(opening);
  let unclosedBracketCount = 1;
  let scopeEndIndex = scopeIndex;
  while (unclosedBracketCount !== 0) {
    const partForBracketSearch = content.substring(scopeEndIndex + 1);
    const nextBracketOpen = partForBracketSearch.indexOf(opening);
    const nextBracketClose = partForBracketSearch.indexOf(closing);
    if (nextBracketOpen === -1 || nextBracketClose < nextBracketOpen) {
      unclosedBracketCount -= 1;
      scopeEndIndex += nextBracketClose + 1;
    } else {
      unclosedBracketCount += 1;
      scopeEndIndex += nextBracketOpen + 1;
    }
  }

  const afterScopeEnd = content.substring(scopeEndIndex + 1);

  const optionalIndex = afterScopeEnd.indexOf("?");
  const newlineIndex = afterScopeEnd.indexOf("\n");

  return (
    scopeEndIndex +
    (optionalIndex !== -1 &&
    (newlineIndex === -1 || optionalIndex < newlineIndex)
      ? optionalIndex + 1
      : 0)
  );
};

const tab = "  ";
export const getTabs = (num: number) =>
  Array.from({ length: num })
    .map(() => tab)
    .join("");

export const indexOfSmallest = (numArr: number[]) => {
  let lowest = 0;
  for (let i = 1; i < numArr.length; i += 1) {
    if (numArr[i] < numArr[lowest]) lowest = i;
  }
  return lowest;
};
