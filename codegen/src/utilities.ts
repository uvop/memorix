export const getIndicesOf: (str: string, searchStr: string) => number[] = (
  str,
  searchStr
) => {
  const searchStrLen = searchStr.length;
  if (searchStrLen === 0) {
    return [];
  }

  const indices: number[] = [];
  let startIndex = 0;
  let index = str.indexOf(searchStr, startIndex);
  while (index > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;

    index = str.indexOf(searchStr, startIndex);
  }
  return indices;
};

export const assertUnreachable: (x: never) => never = () => {
  throw new Error("Didn't expect to get here");
};
