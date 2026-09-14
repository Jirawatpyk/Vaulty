import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useT } from "./router-B-6yma10.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Button } from "./button-DOf-6jIN.mjs";
import { t as useFocusTrap } from "./focus-trap-D9I3LhYM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/confirm-dialog-D7IXAJDP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-secondary text-muted-foreground",
		solid: "bg-primary text-primary-foreground",
		success: "bg-success/15 text-success",
		warn: "bg-warn/15 text-warn",
		outline: "hairline text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function ConfirmDialog({ open, title, body, confirmLabel, onCancel, onConfirm }) {
	const t = useT();
	const ref = (0, import_react.useRef)(null);
	useFocusTrap(open, ref, onCancel);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/70 p-4 md:items-center",
		role: "alertdialog",
		"aria-modal": "true",
		"aria-labelledby": "confirm-title",
		"aria-describedby": "confirm-body",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl bg-card p-6 hairline",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "confirm-title",
					className: "font-display text-xl",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					id: "confirm-body",
					className: "mt-2 text-sm text-muted-foreground",
					children: body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "flex-1",
						onClick: onCancel,
						children: t("cancel")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						className: "flex-1",
						onClick: onConfirm,
						children: confirmLabel ?? t("confirmDelete")
					})]
				})
			]
		})
	});
}
//#endregion
export { ConfirmDialog as n, Badge as t };
