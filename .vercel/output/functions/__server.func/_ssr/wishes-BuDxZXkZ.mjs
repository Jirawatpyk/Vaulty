import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Trash2, s as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useT, r as useVaultStore } from "./router-B-6yma10.mjs";
import { n as cn, t as Button } from "./button-DOf-6jIN.mjs";
import { i as Panel, n as Field, r as PageHeader, t as EmptyState } from "./chrome-Cf0Rry2c.mjs";
import { t as Textarea } from "./textarea-Ct09ymuE.mjs";
import { i as LetterDialog } from "./editors-BtzJByaH.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wishes-BuDxZXkZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-foreground shadow-none transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground" })
	});
}
function WishesPage() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [reading, setReading] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: t("wishes"),
			description: t("packetWishes")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("funeral"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: vault.wishes.funeral,
							maxLength: 4e3,
							onChange: (e) => patch((v) => ({
								...v,
								wishes: {
									...v.wishes,
									funeral: e.target.value
								}
							}))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("restingPlace"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "min-h-20",
							maxLength: 4e3,
							value: vault.wishes.restingPlace,
							onChange: (e) => patch((v) => ({
								...v,
								wishes: {
									...v.wishes,
									restingPlace: e.target.value
								}
							}))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-md bg-secondary px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: t("organDonation")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: vault.wishes.organDonation,
							onCheckedChange: (c) => patch((v) => ({
								...v,
								wishes: {
									...v.wishes,
									organDonation: c
								}
							}))
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "grid gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("digitalAfterlife"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: vault.wishes.digitalAfterlife,
						maxLength: 4e3,
						onChange: (e) => patch((v) => ({
							...v,
							wishes: {
								...v.wishes,
								digitalAfterlife: e.target.value
							}
						}))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("otherWishes"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: vault.wishes.other,
						maxLength: 4e3,
						onChange: (e) => patch((v) => ({
							...v,
							wishes: {
								...v.wishes,
								other: e.target.value
							}
						}))
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: t("letters")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), t("addLetter")]
			})]
		}),
		vault.letters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: t("emptyLetters"),
				hint: t("emptyLettersHint")
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-3",
			children: vault.letters.map((letter) => {
				const to = vault.beneficiaries.find((b) => b.id === letter.toBeneficiaryId);
				const openLetter = reading === letter.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-card p-5 hairline",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl",
							children: letter.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								t("to"),
								" ",
								to?.name ?? t("none")
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "paper",
								onClick: () => setReading(openLetter ? null : letter.id),
								children: openLetter ? t("hide") : t("openLetter")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => {
									patch((v) => ({
										...v,
										letters: v.letters.filter((l) => l.id !== letter.id)
									}), lang === "th" ? `ลบจดหมาย: ${letter.title}` : `Deleted letter: ${letter.title}`);
									toast(t("deleted"));
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
							})]
						})]
					}), openLetter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "paper-grain mt-4 rounded-lg p-5 text-paper-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-wrap text-sm leading-relaxed",
							children: letter.body
						})
					}) : null]
				}, letter.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LetterDialog, {
			open,
			onOpenChange: setOpen
		})
	] });
}
//#endregion
export { WishesPage as component };
