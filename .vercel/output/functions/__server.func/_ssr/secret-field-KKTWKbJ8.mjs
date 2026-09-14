import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { v as Eye, x as Copy, y as EyeOff } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useT } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/secret-field-KKTWKbJ8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SecretField({ value }) {
	const t = useT();
	const [open, setOpen] = (0, import_react.useState)(false);
	if (!value) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: t("none")
	});
	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			toast(t("secretCopied"));
			window.setTimeout(() => {
				navigator.clipboard.writeText("").catch(() => void 0);
			}, 3e4);
		} catch {
			toast(t("secretCopied"));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-sm leading-relaxed break-all text-foreground",
			children: open ? value : "•".repeat(Math.min(22, Math.max(8, value.length)))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex shrink-0 gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: () => void copy(),
				"aria-label": t("copySecret"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), t("copySecret")]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: () => setOpen((v) => !v),
				children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), open ? t("hide") : t("reveal")]
			})]
		})]
	});
}
//#endregion
export { SecretField as t };
