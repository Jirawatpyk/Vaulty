import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Trash2, o as ScrollText, s as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { m as documentLabel, n as useT, r as useVaultStore } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
import { r as PageHeader, t as EmptyState } from "./chrome-Cf0Rry2c.mjs";
import { n as ConfirmDialog, t as Badge } from "./confirm-dialog-D7IXAJDP.mjs";
import { n as DocumentDialog } from "./editors-BtzJByaH.mjs";
import { t as SecretField } from "./secret-field-KKTWKbJ8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/docs-BSlA_eny.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DocsPage() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: t("documents"),
			description: `${vault.documents.length} ${t("itemCount")}`,
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), t("addDocument")]
			})
		}),
		vault.documents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t("emptyDocs"),
			hint: t("taskDoc"),
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: t("addDocument")
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-3",
			children: vault.documents.map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-xl bg-card p-5 hairline",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, {
							className: "size-4",
							strokeWidth: 1.5
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: doc.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: documentLabel[lang][doc.kind] })]
							}),
							doc.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: doc.notes
							}) : null,
							doc.secret ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 rounded-md bg-secondary p-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, { value: doc.secret })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										setEditing(doc);
										setOpen(true);
									},
									children: t("edit")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setPending(doc),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), t("delete")]
								})]
							})
						]
					})]
				})
			}, doc.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentDialog, {
			open,
			onOpenChange: setOpen,
			initial: editing
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDialog, {
			open: Boolean(pending),
			title: t("deleteConfirmTitle"),
			body: t("deleteConfirmBody"),
			onCancel: () => setPending(null),
			onConfirm: () => {
				if (!pending) return;
				patch((v) => ({
					...v,
					documents: v.documents.filter((d) => d.id !== pending.id)
				}), lang === "th" ? `ลบเอกสาร: ${pending.title}` : `Deleted document: ${pending.title}`);
				toast(t("deleted"));
				setPending(null);
			}
		})
	] });
}
//#endregion
export { DocsPage as component };
