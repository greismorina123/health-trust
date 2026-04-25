import { useEffect, useState } from "react";

/** Counts up from 0 to `target` over `duration` ms. */
export const useCountUp = (target: number, duration = 800, trigger: unknown = target) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return value;
};
