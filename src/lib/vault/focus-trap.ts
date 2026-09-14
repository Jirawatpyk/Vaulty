import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    const trapRoot: HTMLElement = root;
    const nodes = () =>
      [...trapRoot.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
        if (el.getAttribute("aria-hidden") === "true") return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
      });

    const prev = document.activeElement as HTMLElement | null;
    window.setTimeout(() => nodes()[0]?.focus(), 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = nodes();
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !current || !trapRoot.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [active, rootRef, onEscape]);
}
