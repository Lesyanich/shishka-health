import { useCallback, useEffect, useRef, useState } from "react";

// Horizontal card rail with prev/next arrows — the same behaviour as the
// Manakish tier scroller. The arrows auto-hide at the ends and when everything
// already fits, so a short row looks like a normal row.
export function CardRail({ children }) {
  const ref = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, children]);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="shk-rail">
      <button
        type="button"
        className="shk-rail__arrow shk-rail__arrow--prev"
        aria-label="Show previous"
        hidden={atStart}
        onClick={() => scrollBy(-1)}
      >
        ‹
      </button>
      <div className="shk-rail__track" ref={ref} onScroll={update}>
        {children}
      </div>
      <button
        type="button"
        className="shk-rail__arrow shk-rail__arrow--next"
        aria-label="Show more"
        hidden={atEnd}
        onClick={() => scrollBy(1)}
      >
        ›
      </button>
    </div>
  );
}
