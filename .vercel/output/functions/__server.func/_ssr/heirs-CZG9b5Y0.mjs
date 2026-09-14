import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Trash2, s as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as initials, b as formatPercent, h as relationshipLabel, i as assignedValuesByHeir, n as useT, o as heirValue, r as useVaultStore, s as totalValue, x as formatThb } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
import { i as Panel, r as PageHeader, t as EmptyState } from "./chrome-Cf0Rry2c.mjs";
import { n as ConfirmDialog, t as Badge } from "./confirm-dialog-D7IXAJDP.mjs";
import { r as HeirDialog } from "./editors-BtzJByaH.mjs";
import { t as VaultMark } from "./vault-mark-CMAoceXQ.mjs";
import { t as CHART_COLORS } from "./charts-BT4nkaiy.mjs";
import { i as ResponsiveContainer, n as Pie, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/heirs-CZG9b5Y0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HeirPacket({ heir, onClose }) {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const assigned = vault.assets.filter((a) => a.beneficiaryIds.includes(heir.id));
	const letters = vault.letters.filter((l) => l.toBeneficiaryId === heir.id);
	const value = heirValue(vault, heir.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 overflow-y-auto bg-ink/80 p-4 md:p-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "print-sheet paper-grain mx-auto max-w-2xl rounded-xl p-6 text-paper-foreground shadow-soft md:p-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-start justify-between gap-4 border-b border-paper-foreground/10 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-paper-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultMark, { className: "size-6 text-paper-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs tracking-[0.2em] uppercase",
								children: "Vaulty"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-4 text-3xl tracking-tight",
							children: t("packetTitle")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-paper-muted",
							children: t("packetLead")
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-print flex flex-col items-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "text-paper-foreground hover:bg-paper-foreground/5",
							onClick: onClose,
							children: t("closePreview")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "text-paper-foreground hover:bg-paper-foreground/5",
							onClick: () => window.print(),
							children: t("printPacket")
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-paper-muted uppercase",
							children: t("to")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: heir.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-paper-muted",
							children: [
								heir.sharePercent,
								"% · ",
								formatThb(value || heir.sharePercent / 100 * totalValue(vault), lang)
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs tracking-wide text-paper-muted uppercase",
						children: t("packetAssets")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 divide-y divide-paper-foreground/10",
						children: assigned.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "py-3 text-sm text-paper-muted",
							children: t("packetEmpty")
						}) : assigned.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: a.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm tabular-nums",
								children: formatThb(a.valueThb, lang)
							})]
						}, a.id))
					})]
				}),
				letters.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs tracking-wide text-paper-muted uppercase",
						children: t("packetLetters")
					}), letters.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 border border-paper-foreground/10 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg",
							children: l.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 whitespace-pre-wrap text-sm leading-relaxed",
							children: l.body
						})]
					}, l.id))]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs tracking-wide text-paper-muted uppercase",
						children: t("packetWishes")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed",
						children: vault.wishes.funeral || t("none")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 border-t border-paper-foreground/10 pt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs tracking-wide text-paper-muted uppercase",
							children: t("packetExecutor")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: vault.access.executorName || t("none")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-paper-muted",
							children: vault.access.executorContact
						})
					]
				})
			]
		})
	});
}
function HeirsPage() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [packet, setPacket] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(null);
	const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
	const estate = totalValue(vault);
	const values = assignedValuesByHeir(vault);
	const pie = vault.beneficiaries.map((b) => ({
		name: b.name,
		value: b.sharePercent
	}));
	if (share < 100) pie.push({
		name: t("remainder"),
		value: 100 - share
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: t("heirs"),
			description: t("shareWarn"),
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), t("addHeir")]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "mb-5 flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-wide text-muted-foreground uppercase",
				children: t("shareTotal")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl tabular-nums",
				children: formatPercent(share)
			})] }), pie.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-28 w-28",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PieChart, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
						data: pie,
						dataKey: "value",
						innerRadius: 28,
						outerRadius: 46,
						paddingAngle: 2,
						stroke: "none",
						label: false,
						isAnimationActive: false,
						children: pie.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i))
					}) })
				})
			}) : null]
		}),
		vault.beneficiaries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t("emptyHeirs"),
			hint: t("emptyHeirsHint"),
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					setEditing(null);
					setOpen(true);
				},
				children: t("addHeir")
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-3 md:grid-cols-2",
			children: vault.beneficiaries.map((heir) => {
				const value = values.get(heir.id) || heir.sharePercent / 100 * estate;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-card p-5 hairline",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex size-11 items-center justify-center rounded-full bg-secondary font-display text-sm",
									children: initials(heir.name)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: heir.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: relationshipLabel[lang][heir.relationship]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "solid",
									children: formatPercent(heir.sharePercent)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs tracking-wide text-muted-foreground uppercase",
							children: t("assignedValue")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl tabular-nums",
							children: formatThb(value, lang)
						}),
						heir.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: heir.notes
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										setEditing(heir);
										setOpen(true);
									},
									children: t("edit")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "paper",
									onClick: () => setPacket(heir),
									children: t("previewPacket")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setPending(heir),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), t("delete")]
								})
							]
						})
					]
				}, heir.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeirDialog, {
			open,
			onOpenChange: setOpen,
			initial: editing
		}),
		packet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeirPacket, {
			heir: packet,
			onClose: () => setPacket(null)
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDialog, {
			open: Boolean(pending),
			title: t("deleteConfirmTitle"),
			body: t("deleteConfirmBody"),
			onCancel: () => setPending(null),
			onConfirm: () => {
				if (!pending) return;
				patch((v) => ({
					...v,
					beneficiaries: v.beneficiaries.filter((b) => b.id !== pending.id),
					assets: v.assets.map((a) => ({
						...a,
						beneficiaryIds: a.beneficiaryIds.filter((id) => id !== pending.id)
					}))
				}), lang === "th" ? `ลบทายาท: ${pending.name}` : `Deleted heir: ${pending.name}`);
				toast(t("deleted"));
				setPending(null);
			}
		})
	] });
}
//#endregion
export { HeirsPage as component };
