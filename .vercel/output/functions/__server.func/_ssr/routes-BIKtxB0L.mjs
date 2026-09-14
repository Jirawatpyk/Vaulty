import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as DEMO_PIN, f as remainingMs, n as useT, r as useVaultStore } from "./router-B-6yma10.mjs";
import { t as Button } from "./button-DOf-6jIN.mjs";
import { d as requiredName, t as Input } from "./validate-Cap0kltn.mjs";
import { n as Field } from "./chrome-Cf0Rry2c.mjs";
import { t as PinPad } from "./pin-pad-sPt2doIf.mjs";
import { t as useFocusTrap } from "./focus-trap-D9I3LhYM.mjs";
import { t as VaultMark } from "./vault-mark-CMAoceXQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BIKtxB0L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Gate() {
	const t = useT();
	const navigate = useNavigate();
	const status = useVaultStore((s) => s.status);
	const busy = useVaultStore((s) => s.busy);
	const error = useVaultStore((s) => s.error);
	const isDemo = useVaultStore((s) => s.isDemo);
	const lang = useVaultStore((s) => s.lang);
	const setLang = useVaultStore((s) => s.setLang);
	const unlock = useVaultStore((s) => s.unlock);
	const create = useVaultStore((s) => s.create);
	const openDemo = useVaultStore((s) => s.openDemo);
	const wipe = useVaultStore((s) => s.wipe);
	const importBlob = useVaultStore((s) => s.importBlob);
	const lockoutUntil = useVaultStore((s) => s.lockoutUntil);
	const submitting = (0, import_react.useRef)(false);
	const fileRef = (0, import_react.useRef)(null);
	const wipeRef = (0, import_react.useRef)(null);
	const demoRef = (0, import_react.useRef)(null);
	const [mode, setMode] = (0, import_react.useState)("welcome");
	const [pin, setPin] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [nameTried, setNameTried] = (0, import_react.useState)(false);
	const [shake, setShake] = (0, import_react.useState)(false);
	const [mismatch, setMismatch] = (0, import_react.useState)(false);
	const [wipeAsk, setWipeAsk] = (0, import_react.useState)(false);
	const [demoAsk, setDemoAsk] = (0, import_react.useState)(false);
	const [cool, setCool] = (0, import_react.useState)(0);
	const [ready, setReady] = (0, import_react.useState)(false);
	useFocusTrap(wipeAsk, wipeRef, () => setWipeAsk(false));
	useFocusTrap(demoAsk, demoRef, () => setDemoAsk(false));
	(0, import_react.useEffect)(() => {
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (status === "unlocked") navigate({ to: "/vault" });
		else if (status === "locked") setMode("pin");
		else if (status === "empty") setMode("welcome");
	}, [status, navigate]);
	(0, import_react.useEffect)(() => {
		const tick = () => setCool(remainingMs({
			fails: 0,
			until: lockoutUntil
		}));
		tick();
		const id = window.setInterval(tick, 250);
		return () => window.clearInterval(id);
	}, [lockoutUntil]);
	const lockedOut = cool > 0;
	(0, import_react.useEffect)(() => {
		if (mode !== "pin" || pin.length !== 6 || submitting.current || lockedOut) return;
		submitting.current = true;
		unlock(pin).then((ok) => {
			submitting.current = false;
			if (ok) navigate({ to: "/vault" });
			else {
				setShake(true);
				setPin("");
				window.setTimeout(() => setShake(false), 400);
			}
		});
	}, [
		pin,
		mode,
		unlock,
		navigate,
		lockedOut
	]);
	(0, import_react.useEffect)(() => {
		if (mode !== "create-confirm" || confirm.length !== 6 || submitting.current) return;
		if (confirm !== pin) {
			setMismatch(true);
			setShake(true);
			setConfirm("");
			window.setTimeout(() => setShake(false), 400);
			return;
		}
		setMismatch(false);
		submitting.current = true;
		create(name, pin).then(() => {
			submitting.current = false;
			navigate({ to: "/vault" });
		});
	}, [
		confirm,
		mode,
		pin,
		name,
		create,
		navigate
	]);
	async function handleDemo() {
		if (submitting.current) return;
		if (status === "locked") {
			setDemoAsk(true);
			return;
		}
		submitting.current = true;
		try {
			await openDemo();
			navigate({ to: "/vault" });
		} finally {
			submitting.current = false;
		}
	}
	async function confirmDemo() {
		setDemoAsk(false);
		if (submitting.current) return;
		submitting.current = true;
		try {
			await openDemo();
			navigate({ to: "/vault" });
		} finally {
			submitting.current = false;
		}
	}
	function onImport(file) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const ok = importBlob(String(reader.result ?? ""));
			toast(ok ? t("importOk") : t("importFail"));
			if (ok) setMode("pin");
		};
		reader.readAsText(file);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh flex-col overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultMark, {
					className: "size-[min(80vw,32rem)]",
					title: t("vaultDoor")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-10 flex items-center justify-between px-5 py-5 md:px-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultMark, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl tracking-tight",
						children: "Vaulty"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => setLang(lang === "th" ? "en" : "th"),
					"aria-label": t("switchLang"),
					children: lang === "th" ? "EN" : "TH"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8",
				children: [
					mode === "welcome" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stagger-in flex flex-col items-center text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-[0.28em] text-muted-foreground uppercase",
								children: t("welcomeKicker")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display mt-4 text-4xl tracking-tight md:text-5xl",
								children: t("appName")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: t("tagline")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground",
								children: t("welcomeLead")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-sm text-xs text-muted-foreground",
								children: t("restoreFirst")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-sm text-xs text-muted-foreground",
								children: t("legalNotWill")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 flex w-full flex-col gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										onClick: () => setMode("create-name"),
										children: t("createVault")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: "outline",
										disabled: busy,
										onClick: () => void handleDemo(),
										children: busy ? t("decrypting") : t("openDemo")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: "ghost",
										onClick: () => fileRef.current?.click(),
										children: t("restoreVault")
									})
								]
							})
						]
					}) : null,
					mode === "create-name" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stagger-in",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-[0.28em] text-muted-foreground uppercase",
								children: t("createVault")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display mt-3 text-3xl",
								children: t("yourName")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: t("createLead")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								className: "mt-6",
								label: t("namePlaceholder"),
								required: true,
								error: nameTried && requiredName(name) ? t(requiredName(name)) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									autoFocus: true,
									autoComplete: "name",
									maxLength: 80,
									placeholder: t("namePlaceholder"),
									value: name,
									"aria-invalid": nameTried && Boolean(requiredName(name)),
									"aria-required": "true",
									onChange: (e) => setName(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									className: "flex-1",
									onClick: () => setMode("welcome"),
									children: t("back")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "flex-1",
									onClick: () => {
										setNameTried(true);
										if (requiredName(name)) return;
										setMode("create-pin");
									},
									children: t("continue")
								})]
							})
						]
					}) : null,
					mode === "create-pin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl",
								children: t("setPin")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 mb-6 text-sm text-muted-foreground",
								children: t("createLead")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinPad, {
								value: pin,
								onChange: (v) => {
									setPin(v);
									if (v.length === 6) setMode("create-confirm");
								},
								disabled: busy
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "mt-4",
								onClick: () => {
									setPin("");
									setMode("create-name");
								},
								children: t("back")
							})
						]
					}) : null,
					mode === "create-confirm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl",
								children: t("confirmPin")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 mb-2 text-sm text-destructive",
								role: "alert",
								children: mismatch ? t("pinMismatch") : "\xA0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinPad, {
								value: confirm,
								onChange: (v) => {
									setMismatch(false);
									setConfirm(v);
								},
								disabled: busy,
								shake
							}),
							busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-sm text-muted-foreground",
								children: t("creating")
							}) : null
						]
					}) : null,
					mode === "pin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-[0.28em] text-muted-foreground uppercase",
								children: t("existingVault")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display mt-3 text-3xl",
								children: t("enterPin")
							}),
							isDemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-xs tracking-[0.35em] text-muted-foreground",
								children: [
									t("demoHint"),
									" ",
									DEMO_PIN.split("").join(" ")
								]
							}) : error === "corrupt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-destructive",
								children: t("corruptVault")
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: t("sealed")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 h-5 text-sm text-destructive",
								role: "alert",
								children: lockedOut ? `${t("tryAgainIn")} ${Math.ceil(cool / 1e3)} ${t("seconds")}` : error === "pin" ? t("wrongPin") : error === "corrupt" ? t("corruptVault") : error === "persist" ? t("persistFail") : "\xA0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinPad, {
								value: pin,
								onChange: setPin,
								disabled: busy || lockedOut || error === "corrupt",
								shake
							}),
							busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-sm text-muted-foreground",
								"aria-live": "polite",
								children: t("decrypting")
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex flex-col items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => setWipeAsk(true),
										children: t("forgotPin")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "link",
										size: "sm",
										onClick: () => void handleDemo(),
										children: t("openDemo")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "link",
										size: "sm",
										onClick: () => fileRef.current?.click(),
										children: t("restoreVault")
									})
								]
							})
						]
					}) : null,
					ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
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
					}) : null,
					wipeAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: wipeRef,
						className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/70 p-4 md:items-center",
						role: "alertdialog",
						"aria-modal": "true",
						"aria-labelledby": "wipe-title",
						"aria-describedby": "wipe-body",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full max-w-md rounded-xl bg-card p-6 hairline",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: "wipe-title",
									className: "font-display text-xl",
									children: t("wipeConfirmTitle")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "wipe-body",
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
											setWipeAsk(false);
											setMode("welcome");
											setPin("");
											toast(t("deleted"));
										},
										children: t("wipe")
									})]
								})
							]
						})
					}) : null,
					demoAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: demoRef,
						className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/70 p-4 md:items-center",
						role: "alertdialog",
						"aria-modal": "true",
						"aria-labelledby": "demo-title",
						"aria-describedby": "demo-body",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full max-w-md rounded-xl bg-card p-6 hairline",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: "demo-title",
									className: "font-display text-xl",
									children: t("demoOverwriteTitle")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "demo-body",
									className: "mt-2 text-sm text-muted-foreground",
									children: t("demoOverwriteBody")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										className: "flex-1",
										onClick: () => setDemoAsk(false),
										children: t("cancel")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "flex-1",
										onClick: () => void confirmDemo(),
										children: t("replaceDemo")
									})]
								})
							]
						})
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "relative z-10 mx-auto grid w-full max-w-3xl grid-cols-1 gap-2 px-6 py-8 text-center text-[11px] tracking-wide text-muted-foreground uppercase md:grid-cols-3 md:py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("trustLocal") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("trustAes") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("trustLock") })
				]
			})
		]
	});
}
//#endregion
export { Gate as component };
