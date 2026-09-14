import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as Check, S as ChevronDown, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as ASSET_CATEGORIES, O as DOCUMENT_KINDS, T as clamp, h as relationshipLabel, k as RELATIONSHIPS, m as documentLabel, n as useT, p as categoryLabel, r as useVaultStore, w as uid } from "./router-B-6yma10.mjs";
import { n as cn, t as Button } from "./button-DOf-6jIN.mjs";
import { a as moneyValue, c as optionalEmail, d as requiredName, f as requiredRecipient, i as letterBody, l as optionalPhone, p as sharePercent, r as hasErrors, t as Input, u as optionalText } from "./validate-Cap0kltn.mjs";
import { n as Field } from "./chrome-Cf0Rry2c.mjs";
import { t as Textarea } from "./textarea-Ct09ymuE.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as SelectItemIndicator, c as SelectTrigger$1, i as SelectItem$1, l as SelectValue$1, n as SelectContent$1, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select$1, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/editors-BtzJByaH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		className: cn("fixed inset-0 z-50 bg-ink/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
		...props
	});
}
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-card p-6 text-card-foreground shadow-soft duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 hairline", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 rounded-sm text-muted-foreground transition-opacity hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "ปิด"
			})]
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-1.5 text-left", className),
		...props
	});
}
function DialogFooter({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("font-display text-xl font-medium tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
var Select = Select$1;
var SelectValue = SelectValue$1;
function SelectTrigger({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
		className: cn("flex h-11 w-full items-center justify-between rounded-md border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted-foreground" })
		})]
	});
}
function SelectContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, {
		className: cn("relative z-50 max-h-72 min-w-32 overflow-hidden rounded-md bg-popover text-popover-foreground hairline", className),
		position: "popper",
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: "p-1",
			children
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
		className: cn("relative flex w-full cursor-pointer items-center rounded-sm py-2 pr-8 pl-2 text-sm outline-none select-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute right-2 flex size-3.5 items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
	});
}
function validateAsset(draft) {
	return {
		name: requiredName(draft.name ?? ""),
		valueThb: moneyValue(draft.valueThb ?? 0),
		institution: optionalText(draft.institution ?? "", 120),
		identifier: optionalText(draft.identifier ?? "", 80),
		location: optionalText(draft.location ?? "", 120),
		notes: optionalText(draft.notes ?? "", 2e3),
		secret: optionalText(draft.secret ?? "", 500)
	};
}
function validateHeir(draft, otherShare) {
	const share = clamp(Number(draft.sharePercent) || 0, 0, 100);
	return {
		name: requiredName(draft.name ?? ""),
		sharePercent: sharePercent(draft.sharePercent ?? 0),
		email: optionalEmail(draft.email ?? ""),
		phone: optionalPhone(draft.phone ?? ""),
		notes: optionalText(draft.notes ?? "", 2e3),
		shareOver: otherShare + share > 100 ? "errShareOver" : null
	};
}
function blockingErrors(errors) {
	const { shareOver: _warn, ...rest } = errors;
	return rest;
}
function validateLetter(draft) {
	return {
		toBeneficiaryId: requiredRecipient(draft.toBeneficiaryId ?? ""),
		title: requiredName(draft.title ?? ""),
		body: letterBody(draft.body ?? "")
	};
}
function validateDocument(draft) {
	return {
		title: requiredName(draft.title ?? ""),
		notes: optionalText(draft.notes ?? "", 2e3),
		secret: optionalText(draft.secret ?? "", 500)
	};
}
function AssetDialog({ open, onOpenChange, initial }) {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [draft, setDraft] = (0, import_react.useState)({});
	const [errors, setErrors] = (0, import_react.useState)({});
	const [tried, setTried] = (0, import_react.useState)(false);
	function onOpen(v) {
		if (v) {
			setTried(false);
			setErrors({});
			setDraft(initial ?? {
				category: "banking",
				name: "",
				institution: "",
				identifier: "",
				valueThb: 0,
				location: "",
				notes: "",
				beneficiaryIds: [],
				secret: ""
			});
		}
		onOpenChange(v);
	}
	function update(next) {
		setDraft(next);
		if (tried) setErrors(validateAsset(next));
	}
	function save() {
		const next = validateAsset(draft);
		setTried(true);
		setErrors(next);
		if (hasErrors(next)) {
			toast(t("fixForm"));
			return;
		}
		const asset = {
			id: initial?.id ?? uid(),
			category: draft.category ?? "other",
			name: (draft.name ?? "").trim(),
			institution: (draft.institution ?? "").trim(),
			identifier: (draft.identifier ?? "").trim(),
			valueThb: clamp(Number(draft.valueThb) || 0, 0, 0xe8d4a51000),
			location: (draft.location ?? "").trim(),
			notes: draft.notes ?? "",
			beneficiaryIds: draft.beneficiaryIds ?? [],
			secret: draft.secret ?? "",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		patch((v) => ({
			...v,
			assets: initial ? v.assets.map((a) => a.id === asset.id ? asset : a) : [asset, ...v.assets]
		}), lang === "th" ? `บันทึกทรัพย์สิน: ${asset.name}` : `Saved asset: ${asset.name}`);
		toast(t("saved"));
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: onOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[90dvh] overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				noValidate: true,
				onSubmit: (e) => {
					e.preventDefault();
					save();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: initial ? t("editAsset") : t("addAsset") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: t("secretHint") })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("name"),
								required: true,
								error: errors.name ? t(errors.name) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.name ?? "",
									maxLength: 80,
									"aria-invalid": Boolean(errors.name),
									"aria-required": "true",
									onChange: (e) => update({
										...draft,
										name: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("category"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: draft.category ?? "banking",
										onValueChange: (v) => update({
											...draft,
											category: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ASSET_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c,
											children: categoryLabel[lang][c]
										}, c)) })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("value"),
									error: errors.valueThb ? t(errors.valueThb) : void 0,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: 0,
										step: "1",
										"aria-invalid": Boolean(errors.valueThb),
										value: draft.valueThb ?? 0,
										onChange: (e) => update({
											...draft,
											valueThb: Number(e.target.value)
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("institution"),
								error: errors.institution ? t(errors.institution) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.institution ?? "",
									maxLength: 120,
									"aria-invalid": Boolean(errors.institution),
									onChange: (e) => update({
										...draft,
										institution: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("identifier"),
									error: errors.identifier ? t(errors.identifier) : void 0,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.identifier ?? "",
										maxLength: 80,
										"aria-invalid": Boolean(errors.identifier),
										onChange: (e) => update({
											...draft,
											identifier: e.target.value
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("location"),
									error: errors.location ? t(errors.location) : void 0,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.location ?? "",
										maxLength: 120,
										"aria-invalid": Boolean(errors.location),
										onChange: (e) => update({
											...draft,
											location: e.target.value
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("assignedHeirs"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [(vault?.beneficiaries ?? []).map((b) => {
										const on = (draft.beneficiaryIds ?? []).includes(b.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												const cur = draft.beneficiaryIds ?? [];
												update({
													...draft,
													beneficiaryIds: on ? cur.filter((id) => id !== b.id) : [...cur, b.id]
												});
											},
											className: on ? "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" : "rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground",
											children: b.name
										}, b.id);
									}), (vault?.beneficiaries.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: t("emptyHeirs")
									}) : null]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("notes"),
								error: errors.notes ? t(errors.notes) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: draft.notes ?? "",
									maxLength: 2e3,
									"aria-invalid": Boolean(errors.notes),
									onChange: (e) => update({
										...draft,
										notes: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("secret"),
								error: errors.secret ? t(errors.secret) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.secret ?? "",
									maxLength: 500,
									"aria-invalid": Boolean(errors.secret),
									onChange: (e) => update({
										...draft,
										secret: e.target.value
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						onClick: () => onOpenChange(false),
						children: t("cancel")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						children: t("save")
					})] })
				]
			})
		})
	});
}
function HeirDialog({ open, onOpenChange, initial }) {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [draft, setDraft] = (0, import_react.useState)({});
	const [errors, setErrors] = (0, import_react.useState)({});
	const [tried, setTried] = (0, import_react.useState)(false);
	const otherShare = (vault?.beneficiaries ?? []).filter((b) => b.id !== initial?.id).reduce((sum, b) => sum + b.sharePercent, 0);
	function onOpen(v) {
		if (v) {
			setTried(false);
			setErrors({});
			setDraft(initial ?? {
				name: "",
				relationship: "child",
				sharePercent: 0,
				email: "",
				phone: "",
				notes: ""
			});
		}
		onOpenChange(v);
	}
	function update(next) {
		setDraft(next);
		if (tried) setErrors(validateHeir(next, otherShare));
	}
	function save() {
		const next = validateHeir(draft, otherShare);
		setTried(true);
		setErrors(next);
		if (hasErrors(blockingErrors(next))) {
			toast(t("fixForm"));
			return;
		}
		const heir = {
			id: initial?.id ?? uid(),
			name: (draft.name ?? "").trim(),
			relationship: draft.relationship ?? "other",
			sharePercent: clamp(Number(draft.sharePercent) || 0, 0, 100),
			email: (draft.email ?? "").trim(),
			phone: (draft.phone ?? "").trim(),
			notes: draft.notes ?? ""
		};
		patch((v) => ({
			...v,
			beneficiaries: initial ? v.beneficiaries.map((b) => b.id === heir.id ? heir : b) : [...v.beneficiaries, heir]
		}), lang === "th" ? `บันทึกทายาท: ${heir.name}` : `Saved heir: ${heir.name}`);
		toast(t("saved"));
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: onOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			noValidate: true,
			onSubmit: (e) => {
				e.preventDefault();
				save();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: initial ? t("editHeir") : t("addHeir") }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("name"),
							required: true,
							error: errors.name ? t(errors.name) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.name ?? "",
								maxLength: 80,
								"aria-invalid": Boolean(errors.name),
								"aria-required": "true",
								onChange: (e) => update({
									...draft,
									name: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("relationship"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: draft.relationship ?? "child",
									onValueChange: (v) => update({
										...draft,
										relationship: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: RELATIONSHIPS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: r,
										children: relationshipLabel[lang][r]
									}, r)) })]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: `${t("share")} %`,
								error: errors.sharePercent ? t(errors.sharePercent) : errors.shareOver ? t(errors.shareOver) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									max: 100,
									"aria-invalid": Boolean(errors.sharePercent || errors.shareOver),
									value: draft.sharePercent ?? 0,
									onChange: (e) => update({
										...draft,
										sharePercent: Number(e.target.value)
									})
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("email"),
								error: errors.email ? t(errors.email) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "email",
									inputMode: "email",
									autoComplete: "email",
									value: draft.email ?? "",
									maxLength: 120,
									"aria-invalid": Boolean(errors.email),
									onChange: (e) => update({
										...draft,
										email: e.target.value
									})
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("phone"),
								error: errors.phone ? t(errors.phone) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "tel",
									inputMode: "tel",
									autoComplete: "tel",
									value: draft.phone ?? "",
									maxLength: 20,
									"aria-invalid": Boolean(errors.phone),
									onChange: (e) => update({
										...draft,
										phone: e.target.value
									})
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("notes"),
							error: errors.notes ? t(errors.notes) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: draft.notes ?? "",
								maxLength: 2e3,
								"aria-invalid": Boolean(errors.notes),
								onChange: (e) => update({
									...draft,
									notes: e.target.value
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: () => onOpenChange(false),
					children: t("cancel")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: t("save")
				})] })
			]
		}) })
	});
}
function LetterDialog({ open, onOpenChange, initial }) {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const [draft, setDraft] = (0, import_react.useState)({});
	const [errors, setErrors] = (0, import_react.useState)({});
	const [tried, setTried] = (0, import_react.useState)(false);
	function onOpen(v) {
		if (v) {
			setTried(false);
			setErrors({});
			setDraft(initial ?? {
				toBeneficiaryId: vault?.beneficiaries[0]?.id ?? "",
				title: "",
				body: ""
			});
		}
		onOpenChange(v);
	}
	function update(next) {
		setDraft(next);
		if (tried) setErrors(validateLetter(next));
	}
	function save() {
		const next = validateLetter(draft);
		setTried(true);
		setErrors(next);
		if (hasErrors(next)) {
			toast(t("fixForm"));
			return;
		}
		const letter = {
			id: initial?.id ?? uid(),
			toBeneficiaryId: draft.toBeneficiaryId ?? "",
			title: (draft.title ?? "").trim(),
			body: draft.body ?? "",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		patch((v) => ({
			...v,
			letters: initial ? v.letters.map((l) => l.id === letter.id ? letter : l) : [letter, ...v.letters]
		}), lang === "th" ? `เขียนจดหมาย: ${letter.title}` : `Wrote letter: ${letter.title}`);
		toast(t("saved"));
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: onOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			noValidate: true,
			onSubmit: (e) => {
				e.preventDefault();
				save();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: t("addLetter") }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("to"),
							required: true,
							error: errors.toBeneficiaryId ? t(errors.toBeneficiaryId) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: draft.toBeneficiaryId ?? "",
								onValueChange: (v) => update({
									...draft,
									toBeneficiaryId: v
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-invalid": Boolean(errors.toBeneficiaryId),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: (vault?.beneficiaries ?? []).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: b.id,
									children: b.name
								}, b.id)) })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("letterTitle"),
							required: true,
							error: errors.title ? t(errors.title) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.title ?? "",
								maxLength: 80,
								"aria-invalid": Boolean(errors.title),
								"aria-required": "true",
								onChange: (e) => update({
									...draft,
									title: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("letterBody"),
							required: true,
							error: errors.body ? t(errors.body) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "min-h-40",
								value: draft.body ?? "",
								maxLength: 8e3,
								"aria-invalid": Boolean(errors.body),
								"aria-required": "true",
								onChange: (e) => update({
									...draft,
									body: e.target.value
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: () => onOpenChange(false),
					children: t("cancel")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: t("save")
				})] })
			]
		}) })
	});
}
function DocumentDialog({ open, onOpenChange, initial }) {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const patch = useVaultStore((s) => s.patch);
	const [draft, setDraft] = (0, import_react.useState)({});
	const [errors, setErrors] = (0, import_react.useState)({});
	const [tried, setTried] = (0, import_react.useState)(false);
	function onOpen(v) {
		if (v) {
			setTried(false);
			setErrors({});
			setDraft(initial ?? {
				title: "",
				kind: "other",
				notes: "",
				secret: ""
			});
		}
		onOpenChange(v);
	}
	function update(next) {
		setDraft(next);
		if (tried) setErrors(validateDocument(next));
	}
	function save() {
		const next = validateDocument(draft);
		setTried(true);
		setErrors(next);
		if (hasErrors(next)) {
			toast(t("fixForm"));
			return;
		}
		const doc = {
			id: initial?.id ?? uid(),
			title: (draft.title ?? "").trim(),
			kind: draft.kind ?? "other",
			notes: draft.notes ?? "",
			secret: draft.secret ?? ""
		};
		patch((v) => ({
			...v,
			documents: initial ? v.documents.map((d) => d.id === doc.id ? doc : d) : [doc, ...v.documents]
		}), lang === "th" ? `เก็บเอกสาร: ${doc.title}` : `Filed document: ${doc.title}`);
		toast(t("saved"));
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: onOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			noValidate: true,
			onSubmit: (e) => {
				e.preventDefault();
				save();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: t("addDocument") }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("name"),
							required: true,
							error: errors.title ? t(errors.title) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.title ?? "",
								maxLength: 80,
								"aria-invalid": Boolean(errors.title),
								"aria-required": "true",
								onChange: (e) => update({
									...draft,
									title: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("kind"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: draft.kind ?? "other",
								onValueChange: (v) => update({
									...draft,
									kind: v
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: DOCUMENT_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: k,
									children: documentLabel[lang][k]
								}, k)) })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("notes"),
							error: errors.notes ? t(errors.notes) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: draft.notes ?? "",
								maxLength: 2e3,
								"aria-invalid": Boolean(errors.notes),
								onChange: (e) => update({
									...draft,
									notes: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: t("secret"),
							error: errors.secret ? t(errors.secret) : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.secret ?? "",
								maxLength: 500,
								"aria-invalid": Boolean(errors.secret),
								onChange: (e) => update({
									...draft,
									secret: e.target.value
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: () => onOpenChange(false),
					children: t("cancel")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: t("save")
				})] })
			]
		}) })
	});
}
//#endregion
export { LetterDialog as i, DocumentDialog as n, HeirDialog as r, AssetDialog as t };
