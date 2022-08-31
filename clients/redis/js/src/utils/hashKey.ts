import { isPlainObject } from "lodash";

export const hashKey = (object: any) => {
  return JSON.stringify(object, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce(
            (result, key) => ({
              [key]: val[key],
              ...result,
            }),
            {}
          )
      : val
  );
};
