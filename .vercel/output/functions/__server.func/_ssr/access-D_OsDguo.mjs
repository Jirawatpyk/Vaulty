import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as isEncryptedBlob, C as relativeTime, T as clamp, d as readSec, f as remainingMs, n as useT, r as useVaultStore, y as formatDate } from "./router-B-6yma10.mjs";
import { n as cn, t as Button } from "./button-DOf-6jIN.mjs";
import { d as requiredName, l as optionalPhone, n as checkInDays, o as optionalContact, s as optionalDob, t as Input, u as optionalText } from "./validate-Cap0kltn.mjs";
import { i as Panel, n as Field, r as PageHeader } from "./chrome-Cf0Rry2c.mjs";
import { t as PinPad } from "./pin-pad-sPt2doIf.mjs";
import { t as Textarea } from "./textarea-Ct09ymuE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/access-D_OsDguo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function evaluateHealth(input) {
	const cryptoOk = typeof crypto !== "undefined" && Boolean(crypto.subtle);
	let storageOk = false;
	try {
		if (typeof window !== "undefined") {
			window.localStorage.setItem("vaulty.ping", "1");
			window.localStorage.removeItem("vaulty.ping");
			storageOk = true;
		}
	} catch {
		storageOk = false;
	}
	const secure = typeof window === "undefined" ? true : window.isSecureContext;
	let blobOk = true;
	let version = null;
	const blobBytes = input.blobRaw?.length ?? 0;
	if (input.blobRaw) try {
		const parsed = JSON.parse(input.blobRaw);
		blobOk = isEncryptedBlob(parsed);
		version = isEncryptedBlob(parsed) ? parsed.v : null;
	} catch {
		blobOk = false;
	}
	const lockedOut = input.lockoutUntil > Date.now();
	return {
		controls: [
			{
				key: "healthCrypto",
				ok: cryptoOk
			},
			{
				key: "healthStorage",
				ok: storageOk
			},
			{
				key: "healthContext",
				ok: secure
			},
			{
				key: "healthBlob",
				ok: blobOk
			},
			{
				key: "healthLockout",
				ok: true,
				warn: lockedOut
			}
		],
		blobBytes,
		version,
		lastUnlock: input.lastUnlock,
		failedUnlocks: input.failedAttempts
	};
}
function formatBytes(n) {
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1048576).toFixed(1)} MB`;
}
var EVENT_KEY = {
	unlock: "eventUnlock",
	lock: "eventLock",
	fail: "eventFail",
	export: "eventExport",
	import: "eventImport",
	wipe: "eventWipe",
	pin: "eventPin",
	hide: "eventHide",
	checkin: "eventCheckin",
	idle: "eventIdle"
};
function TrustCenter() {
	const t = useT();
	const lang = useVaultStore((s) => s.lang);
	const vault = useVaultStore((s) => s.vault);
	const exportBlob = useVaultStore((s) => s.exportBlob);
	const importBlob = useVaultStore((s) => s.importBlob);
	const lockoutUntil = useVaultStore((s) => s.lockoutUntil);
	const failedAttempts = useVaultStore((s) => s.failedAttempts);
	const fileRef = (0, import_react.useRef)(null);
	const [tick] = (0, import_react.useState)(() => Date.now());
	const events = (0, import_react.useMemo)(() => readSec(), [
		tick,
		lockoutUntil,
		failedAttempts
	]);
	const lastUnlock = events.find((e) => e.kind === "unlock")?.at ?? null;
	const health = evaluateHealth({
		blobRaw: typeof window === "undefined" ? null : window.localStorage.getItem("vaulty.v1"),
		lockoutUntil,
		failedAttempts,
		lastUnlock
	});
	function download(name, body, type) {
		const file = new Blob([body], { type });
		const url = URL.createObjectURL(file);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	}
	function exportAudit() {
		const payload = {
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			locale: lang,
			completenessNote: "secrets omitted",
			activity: vault?.activity ?? [],
			security: events,
			controls: health.controls.map((c) => ({
				control: t(c.key),
				status: c.ok ? c.warn ? "watch" : "pass" : "fail"
			})),
			counts: vault ? {
				assets: vault.assets.length,
				heirs: vault.beneficiaries.length,
				documents: vault.documents.length,
				letters: vault.letters.length
			} : {}
		};
		download("vaulty-audit.json", JSON.stringify(payload, null, 2), "application/json");
		toast(t("auditSaved"));
	}
	function onImport(file) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const ok = importBlob(String(reader.result ?? ""));
			toast(ok ? t("importOk") : t("importFail"));
		};
		reader.readAsText(file);
	}
	const cooldown = remainingMs({
		fails: failedAttempts,
		until: lockoutUntil
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl",
			children: t("trustCenter")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: t("trustLead")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-5 divide-y divide-border",
			children: health.controls.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 py-2.5 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(c.key) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("text-[11px] tracking-[0.14em] uppercase", !c.ok ? "text-destructive" : c.warn ? "text-warn" : "text-success"),
					children: !c.ok ? t("fail") : c.warn ? t("warn") : t("pass")
				})]
			}, c.key))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-4 grid gap-3 text-sm sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: t("encryptionDetail") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: t("pbkdfDetail") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: `${t("vaultVersion")} ${health.version ?? "—"}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: `${t("blobSize")} ${formatBytes(health.blobBytes)}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: `${t("lastUnlock")} ${lastUnlock ? relativeTime(lastUnlock, lang) : t("none")}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, { label: `${t("failedUnlocks")} ${failedAttempts}` })
			]
		}),
		cooldown > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-warn",
			children: [
				t("lockedOut"),
				" · ",
				t("tryAgainIn"),
				" ",
				Math.ceil(cooldown / 1e3),
				" ",
				t("seconds")
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-xs text-muted-foreground",
			children: t("pinPolicy")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted-foreground",
			children: t("hideLockHint")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted-foreground",
			children: t("sessionAuthPin")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: t("secEvents")
			}), events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: t("noSecurityEvents")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1.5",
				children: events.slice(0, 8).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(EVENT_KEY[e.kind]) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground tabular-nums",
						children: formatDate(e.at, lang)
					})]
				}, e.at + e.kind))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: t("pdpaTitle")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: t("pdpaBody")
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: t("kbShortcuts")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: [
					t("shortcutHelp"),
					" — ",
					t("shortcutLock")
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-wrap gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => {
						exportBlob().then((blob) => {
							if (!blob) return;
							download("vaulty-sealed.json", blob, "application/json");
						});
					},
					children: t("exportVault")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: exportAudit,
					children: t("auditExport")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => fileRef.current?.click(),
					children: t("restoreVault")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: "application/json,.json",
					className: "sr-only",
					tabIndex: -1,
					"aria-hidden": "true",
					onChange: (e) => {
						onImport(e.target.files?.[0]);
						e.target.value = "";
					}
				})
			]
		})
	] });
}
function Spec({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted-foreground",
		children: label
	});
}
function AccessPage() {
	const t = useT();
	const vault = useVaultStore((s) => s.vault);
	const patch = useVaultStore((s) => s.patch);
	const changePin = useVaultStore((s) => s.changePin);
	const autoLock = useVaultStore((s) => s.autoLockMinutes);
	const setAutoLock = useVaultStore((s) => s.setAutoLockMinutes);
	const wipe = useVaultStore((s) => s.wipe);
	const [pin, setPin] = (0, import_react.useState)("");
	const [confirmPin, setConfirmPin] = (0, import_react.useState)("");
	const [wipeAsk, setWipeAsk] = (0, import_react.useState)(false);
	const [errors, setErrors] = (0, import_react.useState)({});
	const [nameDraft, setNameDraft] = (0, import_react.useState)(null);
	const pinLock = (0, import_react.useRef)(false);
	const lastDob = (0, import_react.useRef)(vault.profile.dateOfBirth);
	function setError(key, err) {
		setErrors((prev) => ({
			...prev,
			[key]: err
		}));
	}
	function saveAccess(key, value) {
		patch((v) => ({
			...v,
			access: {
				...v.access,
				[key]: value
			}
		}));
	}
	function saveProfile(key, value) {
		patch((v) => ({
			...v,
			profile: {
				...v.profile,
				[key]: value
			}
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: t("access"),
			description: t("overdueHint")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: t("releaseDisclaimer")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-6 text-xs text-muted-foreground",
			children: t("legalNotWill")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "mb-4 grid gap-4 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl sm:col-span-2",
					children: t("profile")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("name"),
					required: true,
					error: errors.fullName ? t(errors.fullName) : void 0,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: nameDraft ?? vault.profile.fullName,
						maxLength: 80,
						"aria-invalid": Boolean(errors.fullName),
						"aria-required": "true",
						onChange: (e) => {
							const value = e.target.value;
							setNameDraft(value);
							const err = requiredName(value);
							setError("fullName", err);
							if (!err) {
								saveProfile("fullName", value.trim());
								setNameDraft(null);
							}
						},
						onBlur: () => {
							const current = nameDraft ?? vault.profile.fullName;
							const err = requiredName(current);
							setError("fullName", err);
							if (!err) saveProfile("fullName", current.trim());
							setNameDraft(null);
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("occupation"),
					error: errors.occupation ? t(errors.occupation) : void 0,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: vault.profile.occupation,
						maxLength: 80,
						"aria-invalid": Boolean(errors.occupation),
						onChange: (e) => {
							const err = optionalText(e.target.value, 80);
							setError("occupation", err);
							if (!err) saveProfile("occupation", e.target.value);
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("city"),
					error: errors.city ? t(errors.city) : void 0,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: vault.profile.city,
						maxLength: 80,
						"aria-invalid": Boolean(errors.city),
						onChange: (e) => {
							const err = optionalText(e.target.value, 80);
							setError("city", err);
							if (!err) saveProfile("city", e.target.value);
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("born"),
					error: errors.dateOfBirth ? t(errors.dateOfBirth) : void 0,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "1968-03-14",
						value: vault.profile.dateOfBirth,
						maxLength: 10,
						"aria-invalid": Boolean(errors.dateOfBirth),
						onChange: (e) => saveProfile("dateOfBirth", e.target.value),
						onBlur: (e) => {
							const err = optionalDob(e.target.value);
							setError("dateOfBirth", err);
							if (err) saveProfile("dateOfBirth", lastDob.current);
							else lastDob.current = e.target.value.trim();
						}
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("executor")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("name"),
						error: errors.executorName ? t(errors.executorName) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: vault.access.executorName,
							maxLength: 80,
							"aria-invalid": Boolean(errors.executorName),
							onChange: (e) => {
								const err = optionalText(e.target.value, 80);
								setError("executorName", err);
								if (!err) saveAccess("executorName", e.target.value);
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("executorRole"),
						error: errors.executorRole ? t(errors.executorRole) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: vault.access.executorRole,
							maxLength: 80,
							"aria-invalid": Boolean(errors.executorRole),
							onChange: (e) => {
								const err = optionalText(e.target.value, 80);
								setError("executorRole", err);
								if (!err) saveAccess("executorRole", e.target.value);
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("executorContact"),
						error: errors.executorContact ? t(errors.executorContact) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: vault.access.executorContact,
							maxLength: 120,
							"aria-invalid": Boolean(errors.executorContact),
							onChange: (e) => saveAccess("executorContact", e.target.value),
							onBlur: (e) => setError("executorContact", optionalContact(e.target.value))
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("emergency")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("name"),
						error: errors.emergencyName ? t(errors.emergencyName) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: vault.access.emergencyName,
							maxLength: 80,
							"aria-invalid": Boolean(errors.emergencyName),
							onChange: (e) => {
								const err = optionalText(e.target.value, 80);
								setError("emergencyName", err);
								if (!err) saveAccess("emergencyName", e.target.value);
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: t("phone"),
						error: errors.emergencyContact ? t(errors.emergencyContact) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "tel",
							inputMode: "tel",
							value: vault.access.emergencyContact,
							maxLength: 20,
							"aria-invalid": Boolean(errors.emergencyContact),
							onChange: (e) => saveAccess("emergencyContact", e.target.value),
							onBlur: (e) => setError("emergencyContact", optionalPhone(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: `${t("checkInEvery")} (${t("days")})`,
						error: errors.checkInDays ? t(errors.checkInDays) : void 0,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 1,
							max: 365,
							value: vault.access.checkInDays,
							"aria-invalid": Boolean(errors.checkInDays),
							onChange: (e) => {
								const err = checkInDays(e.target.value);
								setError("checkInDays", err);
								if (!err) saveAccess("checkInDays", clamp(Number(e.target.value), 1, 365));
							}
						})
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("releaseNote"),
				error: errors.releaseNote ? t(errors.releaseNote) : void 0,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: vault.access.releaseNote,
					maxLength: 2e3,
					"aria-invalid": Boolean(errors.releaseNote),
					onChange: (e) => {
						const err = optionalText(e.target.value, 2e3);
						setError("releaseNote", err);
						if (!err) saveAccess("releaseNote", e.target.value);
					}
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: t("autoLock")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						autoLock,
						" ",
						t("minutes")
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 1,
					max: 30,
					value: autoLock,
					"aria-label": t("autoLock"),
					onChange: (e) => setAutoLock(Number(e.target.value)),
					className: "mt-4 w-full accent-primary"
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: t("changePin")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 mb-4 text-sm text-muted-foreground",
					children: confirmPin.length || pin.length === 6 ? t("confirmNewPin") : t("newPin")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinPad, {
					value: pin.length === 6 ? confirmPin : pin,
					onChange: (v) => {
						if (pin.length < 6) {
							setPin(v);
							return;
						}
						setConfirmPin(v);
						if (v.length === 6 && !pinLock.current) {
							if (v !== pin) {
								setConfirmPin("");
								toast(t("pinMismatch"));
								return;
							}
							pinLock.current = true;
							changePin(v).then(() => {
								setPin("");
								setConfirmPin("");
								pinLock.current = false;
								toast(t("pinChanged"));
								toast(t("backupDuePin"));
							});
						}
					}
				})
			] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustCenter, {})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			className: "mt-4 flex flex-wrap gap-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "destructive",
				onClick: () => setWipeAsk(true),
				children: t("wipe")
			})
		}),
		wipeAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/70 p-4 md:items-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md rounded-xl bg-card p-6 hairline",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("wipeConfirmTitle")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: t("wipeConfirmBody")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "flex-1",
							onClick: () => setWipeAsk(false),
							children: t("cancel")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							className: "flex-1",
							onClick: () => {
								wipe();
								window.location.assign("/");
							},
							children: t("wipe")
						})]
					})
				]
			})
		}) : null
	] });
}
//#endregion
export { AccessPage as component };
