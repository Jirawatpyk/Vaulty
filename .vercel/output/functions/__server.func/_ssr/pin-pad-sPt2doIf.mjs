import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Delete, g as Fingerprint } from "../_libs/lucide-react.mjs";
import { n as useT } from "./router-B-6yma10.mjs";
import { n as cn } from "./button-DOf-6jIN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pin-pad-sPt2doIf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEYS = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"",
	"0",
	"del"
];
function PinPad({ value, onChange, disabled, shake, length = 6 }) {
	const t = useT();
	function press(key) {
		if (disabled) return;
		if (key === "del") {
			onChange(value.slice(0, -1));
			return;
		}
		if (!key || value.length >= length) return;
		onChange(value + key);
	}
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (disabled) return;
			const target = e.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
			if (e.key >= "0" && e.key <= "9") {
				e.preventDefault();
				press(e.key);
			} else if (e.key === "Backspace") {
				e.preventDefault();
				press("del");
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		disabled,
		value,
		length,
		onChange
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-6",
		role: "group",
		"aria-label": t("enterPin"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("flex gap-2.5", shake && "shake"),
			role: "status",
			"aria-live": "polite",
			"aria-atomic": "true",
			"aria-label": `${t("pinProgress")} ${value.length} / ${length}`,
			children: Array.from({ length }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full transition-[background-color,transform] duration-150 ease-out", i < value.length ? "scale-110 bg-primary" : "bg-border") }, i))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid w-full max-w-xs grid-cols-3 gap-2",
			children: KEYS.map((key, i) => {
				if (key === "") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": true,
					className: "flex size-16 items-center justify-center text-muted-foreground/50 sm:size-[4.5rem]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fingerprint, {
						className: "size-5",
						strokeWidth: 1.25
					})
				}, "blank");
				const isDel = key === "del";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled,
					onClick: () => press(key),
					"aria-label": isDel ? t("pinDelete") : `${t("pinDigit")} ${key}`,
					className: cn("flex size-16 items-center justify-center rounded-lg text-xl font-medium text-foreground transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] sm:size-[4.5rem]", "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"),
					children: isDel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Delete, {
						className: "size-5",
						strokeWidth: 1.5
					}) : key
				}, `${key}-${i}`);
			})
		})]
	});
}
//#endregion
export { PinPad as t };
