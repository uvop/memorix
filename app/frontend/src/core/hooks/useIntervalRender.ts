import { useEffect, useState } from "react";

export const useIntervalRender = (interval: number) => {
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTick((tick) => !tick);
    }, interval);
    return () => clearTimeout(timeoutId);
  }, [tick, interval]);
};
