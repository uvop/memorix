import { useEffect, useState } from "react";

export const useIntervalRender = (interval: number) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((t) => (t > 0 ? 0 : 1));
    }, interval);
    return () => clearInterval(intervalId);
  }, [interval]);
};
