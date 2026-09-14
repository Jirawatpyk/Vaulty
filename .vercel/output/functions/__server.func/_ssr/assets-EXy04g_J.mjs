import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Trash2, s as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as relativeTime, E as ASSET_CATEGORIES, n as useT, p as categoryLabel, r as useVaultStore, x as formatThb } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
import { t as Input } from "./validate-Cap0kltn.mjs";
import { r as PageHeader, t as EmptyState } from "./chrome-Cf0Rry2c.mjs";
import { n as ConfirmDialog, t as Badge } from "./confirm-dialog-D7IXAJDP.mjs";
import { t as AssetDialog } from "./editors-BtzJByaH.mjs";
import { t as categoryIcon } from "./icons-B81F3MoD.mjs";
import { t as SecretField } from "./secret-field-KKTWKbJ8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assets-EXy04g_J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AssetsPage() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [q, setQ] = (0, import_react.useState)("");
	const [cat, setCat] = (0, import_react.useState)("all");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [reveal, setReveal] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(null);
	const [shown, setShown] = (0, import_react.useState)(40);
	const list = (0, import_react.useMemo)(() => {
		const query = q.trim().toLowerCase();
		return vault.assets.filter((a) => {
			if (cat !== "all" && a.category !== cat) return false;
			if (!query) return true;
			return `${a.name} ${a.institution} ${a.location}`.toLowerCase().includes(query);
		});
	}, [
		vault.assets,
		cat,
		q
	]);
	const visible = list.slice(0, shown);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: t("assets"),
			description: `${vault.assets.length} ${t("itemCount")}`,
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), t("addAsset")]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "sm:max-w-xs",
				placeholder: t("search"),
				"aria-label": t("search"),
				value: q,
				onChange: (e) => {
					setQ(e.target.value);
					setShown(40);
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: cat === "all",
					onClick: () => {
						setCat("all");
						setShown(40);
					},
					children: t("allCategories")
				}), ASSET_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: cat === c,
					onClick: () => {
						setCat(c);
						setShown(40);
					},
					children: categoryLabel[lang][c]
				}, c))]
			})]
		}),
		list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: vault.assets.length === 0 ? t("emptyAssets") : t("noResults"),
			hint: vault.assets.length === 0 ? t("emptyAssetsHint") : t("noResultsHint"),
			action: vault.assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: t("addAsset")
			}) : null
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-3",
			children: visible.map((asset) => {
				const Icon = categoryIcon[asset.category];
				const heirs = vault.beneficiaries.filter((b) => asset.beneficiaryIds.includes(b.id));
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-xl bg-card p-4 hairline sm:p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								strokeWidth: 1.5
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: asset.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground",
										children: [asset.institution, asset.identifier ? ` · ${asset.identifier}` : ""]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-xl tabular-nums",
										children: formatThb(asset.valueThb, lang)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: categoryLabel[lang][asset.category] }),
										asset.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											children: asset.location
										}) : null,
										heirs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "warn",
											children: t("unassigned")
										}) : heirs.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											children: h.name
										}, h.id))
									]
								}),
								asset.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted-foreground",
									children: asset.notes
								}) : null,
								reveal === asset.id && asset.secret ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 rounded-md bg-secondary p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, { value: asset.secret })
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => {
												setEditing(asset);
												setOpen(true);
											},
											children: t("edit")
										}),
										asset.secret ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setReveal((id) => id === asset.id ? null : asset.id),
											children: reveal === asset.id ? t("hide") : t("reveal")
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setPending(asset),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), t("delete")]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "ml-auto self-center text-xs text-muted-foreground",
											children: [
												t("lastUpdated"),
												" ",
												relativeTime(asset.updatedAt, lang)
											]
										})
									]
								})
							]
						})]
					})
				}, asset.id);
			})
		}),
		list.length > 0 && shown < list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				onClick: () => setShown((n) => n + 40),
				children: [
					t("showMore"),
					" · ",
					list.length - shown
				]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetDialog, {
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
					assets: v.assets.filter((a) => a.id !== pending.id)
				}), lang === "th" ? `ลบทรัพย์สิน: ${pending.name}` : `Deleted asset: ${pending.name}`);
				toast(t("deleted"));
				setPending(null);
			}
		})
	] });
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: active ? "h-9 shrink-0 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground" : "h-9 shrink-0 rounded-full bg-secondary px-3 text-xs font-medium text-muted-foreground",
		children
	});
}
//#endregion
export { AssetsPage as component };
