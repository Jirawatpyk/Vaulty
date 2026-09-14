import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, m as Outlet, v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Feather, c as Menu, d as Landmark, f as KeyRound, l as Lock, n as Users, o as ScrollText, t as X, u as LayoutGrid } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as initials, g as t, n as useT, r as useVaultStore, u as backupReason } from "./router-B-6yma10.mjs";
import { n as cn, t as Button } from "./button-DOf-6jIN.mjs";
import { a as DialogOverlay, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as Wordmark } from "./vault-mark-CMAoceXQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vault-CkNEnWA1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog;
function SheetOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
		className: cn("fixed inset-0 z-50 bg-ink/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
		...props
	});
}
function SheetContent({ className, children, side = "bottom", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("fixed z-50 flex flex-col gap-4 bg-card p-6 text-card-foreground hairline duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out", side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", side === "right" && "inset-y-0 right-0 h-full w-80 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 text-muted-foreground hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "ปิด"
			})]
		})]
	})] });
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
		className: cn("font-display text-xl", className),
		...props
	});
}
var CHANNEL = "vaulty.tab";
function createTabId() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return `tab_${Math.random().toString(36).slice(2, 10)}`;
}
function startTabGuard(onForeignClaim) {
	if (typeof window === "undefined") return () => void 0;
	const tabId = createTabId();
	let channel = null;
	try {
		channel = new BroadcastChannel(CHANNEL);
		channel.onmessage = (ev) => {
			const data = ev.data;
			if (!data || data.type !== "claim") return;
			if (data.tabId === tabId) return;
			onForeignClaim();
		};
		channel.postMessage({
			type: "claim",
			tabId
		});
		return () => {
			channel?.close();
		};
	} catch {
		const onStorage = (e) => {
			if (e.key === "vaulty.v1" && e.newValue && e.newValue !== e.oldValue) onForeignClaim();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}
}
var NAV = [
	{
		to: "/vault",
		icon: LayoutGrid,
		key: "overview",
		mobile: true
	},
	{
		to: "/vault/assets",
		icon: Landmark,
		key: "assets",
		mobile: true
	},
	{
		to: "/vault/heirs",
		icon: Users,
		key: "heirs",
		mobile: true
	},
	{
		to: "/vault/wishes",
		icon: Feather,
		key: "wishes",
		mobile: true
	},
	{
		to: "/vault/access",
		icon: KeyRound,
		key: "access"
	},
	{
		to: "/vault/docs",
		icon: ScrollText,
		key: "documents"
	}
];
function isActivePath(pathname, to) {
	if (to === "/vault") return pathname === "/vault" || pathname === "/vault/";
	return pathname.startsWith(to);
}
function VaultLayout() {
	const status = useVaultStore((s) => s.status);
	const vault = useVaultStore((s) => s.vault);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (status === "booting") return;
		if (status !== "unlocked") navigate({ to: "/" });
	}, [status, navigate]);
	if (status !== "unlocked" || !vault) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground",
		children: "Vaulty"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
function AppShell() {
	const t$1 = useT();
	const vault = useVaultStore((s) => s.vault);
	const isDemo = useVaultStore((s) => s.isDemo);
	const lock = useVaultStore((s) => s.lock);
	const lang = useVaultStore((s) => s.lang);
	const setLang = useVaultStore((s) => s.setLang);
	const minutes = useVaultStore((s) => s.autoLockMinutes);
	const persistError = useVaultStore((s) => s.error);
	const flush = useVaultStore((s) => s.flush);
	const backupDue = useVaultStore((s) => s.backupDue);
	const exportBlob = useVaultStore((s) => s.exportBlob);
	const yieldToPeer = useVaultStore((s) => s.yieldToPeer);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const [more, setMore] = (0, import_react.useState)(false);
	const left = useSessionGuard(minutes, (kind) => {
		lock(kind);
		toast(kind === "idle" || kind === "hide" ? t(lang, "idleLock") : t(lang, "locked"));
		navigate({ to: "/" });
	});
	(0, import_react.useEffect)(() => {
		return startTabGuard(() => {
			flush().finally(() => {
				yieldToPeer();
				toast(t(lang, "peerLock"));
				navigate({ to: "/" });
			});
		});
	}, [
		flush,
		yieldToPeer,
		lang,
		navigate
	]);
	function doLock() {
		lock("lock");
		toast(t$1("locked"));
		navigate({ to: "/" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#vault-main",
				className: "bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2",
				children: t$1("skipToContent")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, { className: "px-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-8 flex flex-1 flex-col gap-1",
						"aria-label": t$1("primaryNav"),
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							item,
							pathname
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-secondary p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-wide text-muted-foreground uppercase",
								children: t$1("occupancy")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 truncate text-sm font-medium",
								children: vault.profile.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: isDemo ? t$1("demoBadge") : t$1("realVault")
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						className: "mt-3 w-full justify-start",
						onClick: doLock,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}), t$1("lock")]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "md:pl-60",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm md:h-16 md:px-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-3 md:hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium",
									children: initials(vault.profile.fullName)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate font-display text-lg",
									children: t$1("appName")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "hidden text-sm text-muted-foreground md:block",
								"aria-live": "polite",
								children: [
									t$1("session"),
									" · ",
									t$1("sessionRemaining"),
									" ",
									formatMmSs(left)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => setLang(lang === "th" ? "en" : "th"),
										"aria-label": t$1("switchLang"),
										children: lang === "th" ? "EN" : "TH"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "hidden md:inline-flex",
										onClick: doLock,
										"aria-label": t$1("lock"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "md:hidden",
										onClick: () => setMore(true),
										"aria-label": t$1("more"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
									})
								]
							})
						]
					}),
					backupDue ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "status",
						className: "flex items-center justify-between gap-3 border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm md:px-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t(lang, backupReason() === "pin" ? "backupDuePin" : backupReason() === "stale" ? "backupDue" : "backupDueNever") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => {
								exportBlob().then((blob) => {
									if (!blob) return;
									const file = new Blob([blob], { type: "application/json" });
									const url = URL.createObjectURL(file);
									const a = document.createElement("a");
									a.href = url;
									a.download = "vaulty-sealed.json";
									a.click();
									URL.revokeObjectURL(url);
									toast(t$1("backupSaved"));
								});
							},
							children: t$1("backupNow")
						})]
					}) : null,
					persistError === "persist" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "alert",
						className: "flex items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive md:px-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t$1("persistFail") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => {
								flush();
							},
							children: t$1("retrySave")
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						id: "vault-main",
						tabIndex: -1,
						className: "px-4 py-6 pb-28 outline-none md:px-8 md:py-8 md:pb-12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden",
				"aria-label": t$1("mobileNav"),
				children: [NAV.filter((n) => n.mobile).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
					item,
					pathname,
					compact: true
				}, item.to)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setMore(true),
					className: "flex min-h-11 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
						className: "size-5",
						strokeWidth: 1.5
					}), t$1("more")]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: more,
				onOpenChange: setMore,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: t$1("moreTitle") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1",
					children: [
						NAV.filter((n) => !n.mobile).map((item) => {
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								onClick: () => setMore(false),
								className: "flex h-12 items-center gap-3 rounded-md px-2 text-sm hover:bg-secondary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), t$1(item.key)]
							}, item.to);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex h-12 items-center gap-3 rounded-md px-2 text-sm hover:bg-secondary",
							onClick: () => setLang(lang === "th" ? "en" : "th"),
							children: [
								t$1("language"),
								" · ",
								lang === "th" ? "English" : "ไทย"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex h-12 items-center gap-3 rounded-md px-2 text-sm hover:bg-secondary",
							onClick: () => {
								setMore(false);
								doLock();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), t$1("lock")]
						})
					]
				})] })
			})
		]
	});
}
function useSessionGuard(minutes, onExpire) {
	const [left, setLeft] = (0, import_react.useState)(minutes * 60);
	const deadline = (0, import_react.useRef)(Date.now() + minutes * 6e4);
	const warned = (0, import_react.useRef)(false);
	const hiddenAt = (0, import_react.useRef)(null);
	const onExpireRef = (0, import_react.useRef)(onExpire);
	onExpireRef.current = onExpire;
	const lang = useVaultStore((s) => s.lang);
	(0, import_react.useEffect)(() => {
		deadline.current = Date.now() + minutes * 6e4;
		warned.current = false;
		setLeft(minutes * 60);
		const bump = () => {
			deadline.current = Date.now() + minutes * 6e4;
			warned.current = false;
		};
		const tick = window.setInterval(() => {
			const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1e3));
			setLeft(s);
			if (s === 30 && !warned.current) {
				warned.current = true;
				toast(t(lang, "sessionWarn"));
			}
			if (s <= 0) onExpireRef.current("idle");
		}, 1e3);
		const onKey = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
				e.preventDefault();
				onExpireRef.current("lock");
				return;
			}
			bump();
		};
		const onVis = () => {
			if (document.hidden) {
				hiddenAt.current = Date.now();
				return;
			}
			if (hiddenAt.current && Date.now() - hiddenAt.current > 2e4) onExpireRef.current("hide");
			hiddenAt.current = null;
			bump();
		};
		window.addEventListener("pointerdown", bump);
		window.addEventListener("keydown", onKey);
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.clearInterval(tick);
			window.removeEventListener("pointerdown", bump);
			window.removeEventListener("keydown", onKey);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [minutes, lang]);
	return left;
}
function formatMmSs(total) {
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
function NavLink({ item, pathname, compact }) {
	const t = useT();
	const active = isActivePath(pathname, item.to);
	const Icon = item.icon;
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: item.to,
		"aria-current": active ? "page" : void 0,
		className: cn("flex min-h-11 flex-col items-center gap-1 py-2.5 text-[10px]", active ? "text-foreground" : "text-muted-foreground"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-5",
			strokeWidth: active ? 1.75 : 1.5
		}), t(item.key)]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: item.to,
		"aria-current": active ? "page" : void 0,
		className: cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4",
			strokeWidth: 1.5
		}), t(item.key)]
	});
}
var SplitComponent = VaultLayout;
//#endregion
export { SplitComponent as component };
