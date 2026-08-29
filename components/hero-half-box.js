"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a bordered/gradient "box" behind its children that is only half as
 * tall as the children's full natural height — content is not resized or
 * repositioned, it simply extends past the bottom edge of the box.
 */
export function HeroHalfBox({ children }) {
  const contentRef = useRef(null);
  const [boxHeight, setBoxHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setBoxHeight(el.scrollHeight / 1.4);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative mx-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden rounded-xl bg-[var(--background)]"
        style={{ height: boxHeight }}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#bfdbfe] via-[#dbeafe]/60 to-transparent"
          style={{ height: boxHeight }}
        />
      </div>

      <div ref={contentRef} className="relative z-10">
        {children}
      </div>
    </div>
  );
}
