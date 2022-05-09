import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

type UseBooleanType = (defaultValue?: boolean) => [
  boolean,
  {
    set: Dispatch<SetStateAction<boolean>>;
    on: () => void;
    off: () => void;
    toggle: () => void;
  }
];

export const useBoolean: UseBooleanType = (defaultValue) => {
  const [value, setValue] = useState(!!defaultValue);

  const allSets = useRef({
    set: setValue,
    on: useCallback(() => setValue(true), []),
    off: useCallback(() => setValue(false), []),
    toggle: useCallback(() => setValue((x) => !x), []),
  });

  return [value, allSets.current];
};
