import { ReactNode, useEffect, useState } from "react";

/**
 * Renders children only after the browser is idle (or after a short timeout),
 * keeping non-critical widgets out of the initial render and network burst.
 */
const DeferUntilIdle = ({ children, timeout = 2000 }: { children: ReactNode; timeout?: number }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (ric) {
      const id = ric(() => setReady(true), { timeout });
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, [timeout]);

  return <>{ready ? children : null}</>;
};

export default DeferUntilIdle;
