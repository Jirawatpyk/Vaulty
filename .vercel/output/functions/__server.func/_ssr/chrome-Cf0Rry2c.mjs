import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as cn } from "./button-DOf-6jIN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chrome-Cf0Rry2c.js
var import_jsx_runtime = require_jsx_runtime();
function PageHeader({ title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex flex-wrap items-end justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl tracking-tight text-foreground",
				children: title
			}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-xl text-sm text-muted-foreground",
				children: description
			}) : null]
		}), action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		}) : null]
	});
}
function EmptyState({ title, hint, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center rounded-xl bg-card px-6 py-16 text-center hairline",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xl text-foreground",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm text-muted-foreground",
				children: hint
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: action
			}) : null
		]
	});
}
function Field({ label, children, className, error, required }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex flex-col gap-1.5", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-medium tracking-wide text-muted-foreground",
				children: [label, required ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-destructive",
					children: [
						" ",
						"*",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: " required"
						})
					]
				}) : null]
			}),
			children,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				role: "alert",
				className: "text-xs text-destructive",
				children: error
			}) : null
		]
	});
}
function Panel({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: cn("rounded-xl bg-card p-5 hairline", className),
		children
	});
}
//#endregion
export { Panel as i, Field as n, PageHeader as r, EmptyState as t };
