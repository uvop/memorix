export const removeBracketsOfScope = (scope: string) =>
  scope.substring(1, scope.length - 1);

export const assertUnreachable: (x: never) => never = () => {
  throw new Error("Didn't expect to get here");
};
