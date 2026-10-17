import { useEffect, useRef } from "react";

/*
  The modal contract from design-system/MASTER.md, in one place: focus moves in
  on open and is restored to the trigger on close, Tab is trapped, Escape closes,
  and the page behind does not scroll.

  DishDialog carries its own inline copy of this. It is not migrated here in this
  PR on purpose — it is the dish sheet the CEO is reviewing, and refactoring it
  to share a hook is a change with no visible effect and some risk. FilterPanel
  had NONE of this, which is why it is the first user.

  `onClose` is held in a ref, not listed as a dependency: callers pass an inline
  arrow, so a dependency on it would re-run the effect on every parent render and
  yank focus back to the dialog while the guest is typing in it.
*/

// `:not(:disabled)` matters. A disabled button can never be document.activeElement,
// so if the LAST focusable in the dialog is disabled the "wrap to first" branch
// never fires and Tab walks straight out of the modal into the page behind it.
const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function useModal(open, nodeRef, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = nodeRef.current;
    // preventScroll: the dialog is focused so the keyboard has somewhere to
    // start, not so the page jumps.
    node?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = node.querySelectorAll(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // From the dialog frame itself (focused on open) a Shift+Tab has nowhere
      // earlier to go either, so it wraps like the first item would.
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
    // nodeRef is a stable ref object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
