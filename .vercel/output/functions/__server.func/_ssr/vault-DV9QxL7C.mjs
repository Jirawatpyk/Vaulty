import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as relativeTime, _ as addDaysIso, a as completenessScore, c as valueByCategory, l as vaultTasks, n as useT, p as categoryLabel, r as useVaultStore, s as totalValue, v as formatCompactThb, x as formatThb } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
import { i as Panel, r as PageHeader } from "./chrome-Cf0Rry2c.mjs";
import { t as categoryIcon } from "./icons-B81F3MoD.mjs";
import { t as CHART_COLORS } from "./charts-BT4nkaiy.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as Pie, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vault-DV9QxL7C.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CompletenessRing({ value, label }) {
	const r = 34;
	const c = 2 * Math.PI * r;
	const clamped = Math.max(0, Math.min(100, value));
	const dash = clamped / 100 * c;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative size-28",
		role: "meter",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": clamped,
		"aria-label": label,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 80 80",
			className: "size-full -rotate-90",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "40",
				cy: "40",
				r,
				fill: "none",
				stroke: "currentColor",
				className: "text-border",
				strokeWidth: "4"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "40",
				cy: "40",
				r,
				fill: "none",
				stroke: "currentColor",
				className: "text-primary",
				strokeWidth: "4",
				strokeLinecap: "round",
				strokeDasharray: `${dash} ${c}`
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 flex flex-col items-center justify-center",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display text-2xl tabular-nums tracking-tight",
				children: clamped
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-wide text-muted-foreground",
				children: "%"
			})]
		})]
	});
}
function OverviewPage() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const checkIn = useVaultStore((s) => s.checkIn);
	const score = (0, import_react.useMemo)(() => completenessScore(vault), [vault]);
	const worth = (0, import_react.useMemo)(() => totalValue(vault), [vault]);
	const missing = (0, import_react.useMemo)(() => vaultTasks(vault), [vault]).filter((x) => !x.done);
	const mix = (0, import_react.useMemo)(() => valueByCategory(vault), [vault]);
	const next = addDaysIso(vault.access.lastCheckIn, vault.access.checkInDays);
	const overdue = new Date(next).getTime() < Date.now();
	const pieData = (0, import_react.useMemo)(() => mix.map((m) => ({
		name: categoryLabel[lang][m.category] ?? m.category,
		value: m.value
	})), [mix, lang]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: vault.profile.fullName || t("overview"),
			description: `${vault.profile.occupation || t("none")} · ${vault.profile.city || t("none")}`,
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: overdue ? "default" : "outline",
				onClick: checkIn,
				children: t("checkInNow")
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted-foreground uppercase",
						children: t("netWorth")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display mt-2 text-4xl tracking-tight tabular-nums",
						children: formatThb(worth, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-3 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t("assets"),
								value: String(vault.assets.length)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t("totalHeirs"),
								value: String(vault.beneficiaries.length)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t("totalDocs"),
								value: String(vault.documents.length)
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex items-center gap-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompletenessRing, {
					value: score,
					label: t("completeness")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-wide text-muted-foreground uppercase",
					children: t("completeness")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: missing.length === 0 ? t("markComplete") : `${missing.length} · ${t("pendingTasks")}`
				})] })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "lg:col-span-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("allocation")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/vault/assets",
						className: "text-xs text-muted-foreground hover:text-foreground",
						children: t("viewAll")
					})]
				}), pieData.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-10 text-center text-sm text-muted-foreground",
					children: t("emptyAssets")
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid items-center gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-52 min-w-0 overflow-hidden",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: pieData,
								dataKey: "value",
								nameKey: "name",
								innerRadius: 52,
								outerRadius: 74,
								paddingAngle: 2,
								stroke: "none",
								label: false,
								isAnimationActive: false,
								children: pieData.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								formatter: (v) => formatCompactThb(Number(v ?? 0), lang),
								contentStyle: {
									background: "var(--color-card)",
									border: "1px solid var(--color-border)",
									borderRadius: 8,
									color: "var(--color-foreground)"
								}
							})] })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: mix.slice(0, 5).map((m, i) => {
							const Icon = categoryIcon[m.category];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2 text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-2 rounded-full",
											style: { background: CHART_COLORS[i % CHART_COLORS.length] }
										}),
										Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }) : null,
										categoryLabel[lang][m.category]
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: formatCompactThb(m.value, lang)
								})]
							}, m.category);
						})
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: overdue ? t("checkInOverdue") : t("checkInOk")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: t("overdueHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs tracking-wide text-muted-foreground uppercase",
						children: t("lastCheckIn")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: relativeTime(vault.access.lastCheckIn, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs tracking-wide text-muted-foreground uppercase",
						children: t("nextCheckIn")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: relativeTime(next, lang)
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl",
				children: t("pendingTasks")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: missing.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-success",
					children: t("markComplete")
				}) : missing.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-warn" }), t(task.key)]
				}, task.key))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl",
				children: t("recentActivity")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-3",
				children: vault.activity.slice(0, 5).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-baseline justify-between gap-4 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-muted-foreground",
						children: relativeTime(a.at, lang)
					})]
				}, a.id))
			})] })]
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-secondary px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] tracking-wide text-muted-foreground uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { OverviewPage as component };
