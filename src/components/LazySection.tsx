import { ReactNode, useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Space reserved before the section mounts — prevents layout shift. */
  minHeight?: number;
  /** How far ahead of the viewport to start mounting. */
  rootMargin?: string;
  className?: string;
}

/**
 * Defers mounting (and therefore data fetching + image requests) of a
 * below-the-fold section until it is about to scroll into view.
 */
const LazySection = ({
  children,
  minHeight = 320,
  rootMargin = "400px 0px",
  className,
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
};

export default LazySection;
