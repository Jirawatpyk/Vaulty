import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/focus-trap-D9I3LhYM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
function useFocusTrap(active, rootRef, onEscape) {
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const root = rootRef.current;
		if (!root) return;
		const trapRoot = root;
		const nodes = () => [...trapRoot.querySelectorAll(FOCUSABLE)].filter((el) => {
			if (el.getAttribute("aria-hidden") === "true") return false;
			const style = window.getComputedStyle(el);
			return style.visibility !== "hidden" && style.display !== "none";
		});
		const prev = document.activeElement;
		window.setTimeout(() => nodes()[0]?.focus(), 0);
		function onKey(e) {
			if (e.key === "Escape") {
				e.preventDefault();
				onEscape?.();
				return;
			}
			if (e.key !== "Tab") return;
			const list = nodes();
			if (list.length === 0) return;
			const first = list[0];
			const last = list[list.length - 1];
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
	}, [
		active,
		rootRef,
		onEscape
	]);
}
//#endregion
export { useFocusTrap as t };
