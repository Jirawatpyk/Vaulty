import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as cn } from "./button-DOf-6jIN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vault-mark-CMAoceXQ.js
var import_jsx_runtime = require_jsx_runtime();
function VaultMark({ className, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: cn("text-primary", className),
		fill: "none",
		"aria-hidden": !title,
		role: title ? "img" : void 0,
		children: [
			title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: title }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "29",
				stroke: "currentColor",
				strokeWidth: "1.25",
				opacity: "0.45"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "22",
				stroke: "currentColor",
				strokeWidth: "1.25"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "13",
				stroke: "currentColor",
				strokeWidth: "1.25",
				opacity: "0.7"
			}),
			Array.from({ length: 8 }).map((_, i) => {
				const a = i * Math.PI / 4;
				const x = 32 + Math.cos(a) * 22;
				const y = 32 + Math.sin(a) * 22;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: x,
					cy: y,
					r: "2.1",
					fill: "currentColor"
				}, i);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "4.2",
				fill: "currentColor"
			})
		]
	});
}
function Wordmark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-2.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultMark, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xl tracking-tight text-foreground",
			children: "Vaulty"
		})]
	});
}
//#endregion
export { Wordmark as n, VaultMark as t };
