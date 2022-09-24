export const hashKey = (object: any) => {
  return JSON.stringify(object, (_, val) =>
    typeof val === "object" && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce(
            (result, key) => ({
              ...result,
              [key]: val[key],
            }),
            {}
          )
      : val
  );
};
