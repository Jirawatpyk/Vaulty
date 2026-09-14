import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as createRootRoute, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B-6yma10.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-destructive",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 1.5
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted-foreground",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function bufToB64(buf) {
	const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	const chunk = 8192;
	const parts = [];
	for (let i = 0; i < bytes.length; i += chunk) {
		const end = Math.min(i + chunk, bytes.length);
		let s = "";
		for (let j = i; j < end; j++) s += String.fromCharCode(bytes[j]);
		parts.push(s);
	}
	return btoa(parts.join(""));
}
function b64ToBytes(b64) {
	try {
		const raw = atob(b64);
		const bytes = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
		return bytes;
	} catch {
		throw new Error("invalid encoding");
	}
}
function randomSalt() {
	return crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
}
async function deriveKey(pin, salt) {
	const material = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]);
	return crypto.subtle.deriveKey({
		name: "PBKDF2",
		salt,
		iterations: 1e5,
		hash: "SHA-256"
	}, material, {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
}
async function encryptJson(data, key) {
	const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const cipher = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, key, encoder.encode(JSON.stringify(data)));
	return {
		iv: bufToB64(iv),
		data: bufToB64(cipher)
	};
}
async function decryptJson(blob, key) {
	const plain = await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: b64ToBytes(blob.iv)
	}, key, b64ToBytes(blob.data));
	return JSON.parse(decoder.decode(plain));
}
async function sealVault(data, pin) {
	const salt = randomSalt();
	const { iv, data: cipher } = await encryptJson(data, await deriveKey(pin, salt));
	return {
		v: 1,
		salt: bufToB64(salt),
		iv,
		data: cipher
	};
}
async function openVault(blob, pin) {
	const key = await deriveKey(pin, b64ToBytes(blob.salt));
	return {
		data: await decryptJson(blob, key),
		key
	};
}
async function resealVault(data, key, saltB64) {
	const { iv, data: cipher } = await encryptJson(data, key);
	return {
		v: 1,
		salt: saltB64,
		iv,
		data: cipher
	};
}
function isEncryptedBlob(value) {
	if (!value || typeof value !== "object") return false;
	const o = value;
	return o.v === 1 && typeof o.salt === "string" && o.salt.length > 0 && typeof o.iv === "string" && o.iv.length > 0 && typeof o.data === "string" && o.data.length > 0;
}
var ASSET_CATEGORIES = [
	"property",
	"banking",
	"investment",
	"crypto",
	"insurance",
	"vehicle",
	"digital",
	"collectible",
	"other"
];
var RELATIONSHIPS = [
	"spouse",
	"child",
	"parent",
	"sibling",
	"grandchild",
	"friend",
	"charity",
	"other"
];
var DOCUMENT_KINDS = [
	"will",
	"deed",
	"policy",
	"id",
	"password",
	"other"
];
var DEMO_PIN = "258036";
function clamp(n, min, max) {
	if (!Number.isFinite(n)) return min;
	return Math.min(max, Math.max(min, n));
}
function asString(v, fallback = "") {
	return typeof v === "string" ? v : fallback;
}
function coerceVault(data) {
	if (!data || typeof data !== "object") return null;
	const v = data;
	const profile = v.profile && typeof v.profile === "object" ? v.profile : {};
	const wishes = v.wishes && typeof v.wishes === "object" ? v.wishes : {};
	const access = v.access && typeof v.access === "object" ? v.access : {};
	const fullName = asString(profile.fullName).trim();
	if (!fullName) return null;
	return {
		profile: {
			fullName,
			dateOfBirth: asString(profile.dateOfBirth),
			city: asString(profile.city),
			occupation: asString(profile.occupation)
		},
		assets: Array.isArray(v.assets) ? v.assets.map(coerceAsset).filter((x) => Boolean(x)) : [],
		beneficiaries: Array.isArray(v.beneficiaries) ? v.beneficiaries.map(coerceHeir).filter((x) => Boolean(x)) : [],
		letters: Array.isArray(v.letters) ? v.letters.map(coerceLetter).filter((x) => Boolean(x)) : [],
		documents: Array.isArray(v.documents) ? v.documents.map(coerceDoc).filter((x) => Boolean(x)) : [],
		wishes: {
			funeral: asString(wishes.funeral),
			restingPlace: asString(wishes.restingPlace),
			organDonation: Boolean(wishes.organDonation),
			digitalAfterlife: asString(wishes.digitalAfterlife),
			other: asString(wishes.other)
		},
		access: {
			executorName: asString(access.executorName),
			executorRole: asString(access.executorRole),
			executorContact: asString(access.executorContact),
			emergencyName: asString(access.emergencyName),
			emergencyContact: asString(access.emergencyContact),
			checkInDays: clamp(Number(access.checkInDays) || 30, 1, 365),
			lastCheckIn: asString(access.lastCheckIn) || (/* @__PURE__ */ new Date()).toISOString(),
			releaseNote: asString(access.releaseNote)
		},
		activity: Array.isArray(v.activity) ? v.activity.filter((item) => item && typeof item === "object").map((item) => {
			const a = item;
			return {
				id: asString(a.id) || "act",
				at: asString(a.at) || (/* @__PURE__ */ new Date()).toISOString(),
				text: asString(a.text)
			};
		}).slice(0, 40) : [],
		createdAt: asString(v.createdAt) || (/* @__PURE__ */ new Date()).toISOString()
	};
}
function coerceAsset(x) {
	if (!x || typeof x !== "object") return null;
	const a = x;
	const name = asString(a.name).trim();
	const id = asString(a.id);
	if (!name || !id) return null;
	return {
		id,
		category: ASSET_CATEGORIES.includes(a.category) ? a.category : "other",
		name,
		institution: asString(a.institution),
		identifier: asString(a.identifier),
		valueThb: clamp(Number(a.valueThb) || 0, 0, 0xe8d4a51000),
		location: asString(a.location),
		notes: asString(a.notes),
		beneficiaryIds: Array.isArray(a.beneficiaryIds) ? a.beneficiaryIds.map((id) => String(id)) : [],
		secret: asString(a.secret),
		updatedAt: asString(a.updatedAt) || (/* @__PURE__ */ new Date()).toISOString()
	};
}
function coerceHeir(x) {
	if (!x || typeof x !== "object") return null;
	const b = x;
	const name = asString(b.name).trim();
	const id = asString(b.id);
	if (!name || !id) return null;
	return {
		id,
		name,
		relationship: RELATIONSHIPS.includes(b.relationship) ? b.relationship : "other",
		sharePercent: clamp(Number(b.sharePercent) || 0, 0, 100),
		email: asString(b.email),
		phone: asString(b.phone),
		notes: asString(b.notes)
	};
}
function coerceLetter(x) {
	if (!x || typeof x !== "object") return null;
	const l = x;
	const id = asString(l.id);
	const body = asString(l.body);
	if (!id || !body.trim()) return null;
	return {
		id,
		toBeneficiaryId: asString(l.toBeneficiaryId),
		title: asString(l.title) || "Letter",
		body,
		updatedAt: asString(l.updatedAt) || (/* @__PURE__ */ new Date()).toISOString()
	};
}
function coerceDoc(x) {
	if (!x || typeof x !== "object") return null;
	const d = x;
	const id = asString(d.id);
	const title = asString(d.title).trim();
	if (!id || !title) return null;
	return {
		id,
		title,
		kind: DOCUMENT_KINDS.includes(d.kind) ? d.kind : "other",
		notes: asString(d.notes),
		secret: asString(d.secret)
	};
}
var thbFmt = {
	th: new Intl.NumberFormat("th-TH", {
		style: "currency",
		currency: "THB",
		maximumFractionDigits: 0
	}),
	en: new Intl.NumberFormat("en-TH", {
		style: "currency",
		currency: "THB",
		maximumFractionDigits: 0
	})
};
function formatThb(n, lang) {
	return (lang === "th" ? thbFmt.th : thbFmt.en).format(n);
}
function formatCompactThb(n, lang) {
	const abs = Math.abs(n);
	if (lang === "th") {
		if (abs >= 1e6) return `฿${trimNum(n / 1e6)} ล้าน`;
		if (abs >= 1e3) return `฿${trimNum(n / 1e3)} พัน`;
		return `฿${Math.round(n).toLocaleString("th-TH")}`;
	}
	if (abs >= 1e6) return `฿${trimNum(n / 1e6)}M`;
	if (abs >= 1e3) return `฿${trimNum(n / 1e3)}k`;
	return `฿${Math.round(n).toLocaleString("en-TH")}`;
}
function trimNum(n) {
	return (Math.round(n * 10) / 10).toLocaleString(void 0, { maximumFractionDigits: 1 });
}
function formatPercent(n) {
	return `${Math.round(n)}%`;
}
function initials(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "V";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
function relativeTime(iso, lang) {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "—";
	const delta = Date.now() - then;
	if (Math.floor(delta / 6e4) < 2) return lang === "th" ? "เมื่อสักครู่" : "Just now";
	const days = Math.floor(delta / 864e5);
	if (days <= 0) return lang === "th" ? "วันนี้" : "Today";
	if (days === 1) return lang === "th" ? "เมื่อวาน" : "Yesterday";
	return lang === "th" ? `${days} วันที่แล้ว` : `${days} days ago`;
}
function formatDate(iso, lang) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
function addDaysIso(iso, days) {
	const d = new Date(iso);
	d.setDate(d.getDate() + days);
	return d.toISOString();
}
function uid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return `id_${Math.random().toString(36).slice(2, 10)}`;
}
var dict = {
	th: {
		appName: "Vaulty",
		tagline: "คลังมรดกและทรัพย์สินดิจิทัลส่วนบุคคล",
		taglineShort: "Private Legacy Trust",
		welcomeLead: "จัดเก็บทรัพย์สิน กำหนดทายาท และฝากความประสงค์สุดท้ายไว้ในคลังที่เข้ารหัสบนเครื่องของคุณ — ไม่มีเซิร์ฟเวอร์กลาง",
		createVault: "สร้างคลังใหม่",
		openDemo: "เปิดคลังตัวอย่าง",
		unlock: "เปิดคลัง",
		enterPin: "กรอกรหัสผ่าน 6 หลัก",
		setPin: "ตั้งรหัสผ่าน 6 หลัก",
		confirmPin: "ยืนยันรหัสผ่าน",
		pinMismatch: "รหัสไม่ตรงกัน",
		wrongPin: "รหัสไม่ถูกต้อง",
		yourName: "ชื่อเจ้าของคลัง",
		namePlaceholder: "ชื่อ-นามสกุล",
		continue: "ดำเนินการต่อ",
		back: "ย้อนกลับ",
		demoHint: "คลังตัวอย่าง · รหัส",
		existingVault: "พบคลังบนเครื่องนี้",
		forgotPin: "ลืมรหัส — ลบคลังนี้",
		wipeConfirmTitle: "ลบคลังถาวร?",
		wipeConfirmBody: "ข้อมูลทั้งหมดบนเครื่องนี้จะถูกลบ และกู้คืนไม่ได้ ถ้าไม่มีรหัส คุณจะเข้าคลังเดิมไม่ได้",
		wipe: "ลบคลัง",
		cancel: "ยกเลิก",
		trustLocal: "เก็บในเครื่องคุณเท่านั้น",
		trustAes: "เข้ารหัส AES-256",
		trustLock: "ล็อกอัตโนมัติเมื่อไม่ใช้งาน",
		decrypting: "กำลังถอดรหัสคลัง…",
		overview: "ภาพรวม",
		assets: "ทรัพย์สิน",
		heirs: "ทายาท",
		wishes: "ความประสงค์",
		access: "แผนส่งมอบ",
		documents: "เอกสาร",
		more: "เพิ่มเติม",
		lock: "ล็อกคลัง",
		language: "ภาษา",
		session: "เซสชันปลอดภัย",
		lastCheckIn: "เช็คอินล่าสุด",
		checkInNow: "ยืนยันว่าฉันยังอยู่ที่นี่",
		checkInDone: "บันทึกการเช็คอินแล้ว",
		checkInOverdue: "เลยกำหนดเช็คอิน",
		checkInOk: "แผนส่งมอบยังไม่เปิด",
		netWorth: "มูลค่าทรัพย์สินรวม",
		completeness: "ความพร้อมของคลัง",
		allocation: "สัดส่วนทรัพย์สิน",
		heirShares: "สัดส่วนทายาท",
		pendingTasks: "สิ่งที่ยังขาด",
		recentActivity: "กิจกรรมล่าสุด",
		addAsset: "เพิ่มทรัพย์สิน",
		editAsset: "แก้ไขทรัพย์สิน",
		deleteAsset: "ลบทรัพย์สิน",
		addHeir: "เพิ่มทายาท",
		editHeir: "แก้ไขทายาท",
		deleteHeir: "ลบทายาท",
		addLetter: "เขียนจดหมาย",
		addDocument: "เพิ่มเอกสาร",
		save: "บันทึก",
		delete: "ลบ",
		name: "ชื่อ",
		category: "ประเภท",
		institution: "สถาบัน / ผู้ดูแล",
		identifier: "เลขที่อ้างอิง",
		value: "มูลค่า (บาท)",
		location: "ที่ตั้ง",
		notes: "บันทึก",
		secret: "ข้อมูลลับ",
		secretHint: "รหัสผ่าน วลีคีย์ หรือหมายเลขกรมธรรม์ — ซ่อนไว้จนกว่าจะเปิด",
		reveal: "แสดง",
		hide: "ซ่อน",
		assignedHeirs: "มอบให้",
		unassigned: "ยังไม่ระบุทายาท",
		relationship: "ความสัมพันธ์",
		share: "สัดส่วน",
		email: "อีเมล",
		phone: "โทรศัพท์",
		emptyAssets: "ยังไม่มีทรัพย์สินในคลัง",
		emptyAssetsHint: "เริ่มจากบัญชีธนาคาร ที่อยู่อาศัย หรือกรมธรรม์ที่คุณมีอยู่แล้ว",
		emptyHeirs: "ยังไม่มีทายาท",
		emptyHeirsHint: "ระบุผู้ที่คุณต้องการมอบทรัพย์สินและความประสงค์ให้",
		emptyLetters: "ยังไม่มีจดหมาย",
		emptyLettersHint: "ฝากข้อความถึงคนที่คุณรัก — จะถูกส่งเมื่อคลังถูกเปิดตามแผน",
		emptyDocs: "ยังไม่มีเอกสาร",
		funeral: "พิธีและการจัดการร่าง",
		restingPlace: "สถานที่",
		organDonation: "บริจาคอวัยวะ",
		yes: "ใช่",
		no: "ไม่",
		digitalAfterlife: "ชีวิตดิจิทัลหลังจากนี้",
		otherWishes: "ความประสงค์อื่น",
		letters: "จดหมายถึงคนที่รัก",
		to: "ถึง",
		letterTitle: "หัวข้อ",
		letterBody: "เนื้อหา",
		executor: "ผู้จัดการมรดก",
		executorRole: "บทบาท",
		executorContact: "ติดต่อ",
		emergency: "ผู้ติดต่อฉุกเฉิน",
		checkInEvery: "ช่วงเช็คอิน",
		days: "วัน",
		releaseNote: "คำชี้แจงเมื่อคลังถูกส่งมอบ",
		previewPacket: "ดูชุดเอกสารทายาท",
		packetTitle: "ชุดส่งมอบมรดก",
		packetLead: "เอกสารนี้คือสิ่งที่ทายาทจะได้รับเมื่อแผนส่งมอบทำงาน",
		closePreview: "ปิดตัวอย่าง",
		close: "ปิด",
		occupancy: "เจ้าของคลัง",
		occupation: "อาชีพ",
		city: "เมือง",
		born: "เกิด",
		allCategories: "ทุกประเภท",
		filter: "กรอง",
		search: "ค้นหา",
		noResults: "ไม่พบรายการ",
		noResultsHint: "ลองคำค้นอื่น หรือล้างตัวกรอง",
		shareTotal: "รวมสัดส่วน",
		shareWarn: "สัดส่วนทายาทควรรวมเป็น 100%",
		autoLock: "ล็อกอัตโนมัติ",
		minutes: "นาที",
		exportVault: "ส่งออกคลังเข้ารหัส",
		settings: "การตั้งค่า",
		profile: "เจ้าของคลัง",
		unlockDemo: "เข้าชมตัวอย่าง",
		creating: "กำลังสร้างคลัง…",
		saved: "บันทึกแล้ว",
		deleted: "ลบแล้ว",
		locked: "ล็อกคลังแล้ว",
		kind: "ชนิดเอกสาร",
		nextCheckIn: "เช็คอินครั้งถัดไป",
		overdueHint: "หากไม่เช็คอิน แอปจะเตือนบนเครื่องนี้เท่านั้น — Vaulty ไม่ส่งกุญแจหรือเอกสารให้ทายาทให้อัตโนมัติ",
		taskProfile: "กรอกข้อมูลเจ้าของคลัง",
		taskAsset: "เพิ่มทรัพย์สินอย่างน้อยหนึ่งรายการ",
		taskHeir: "ระบุทายาทอย่างน้อยหนึ่งคน",
		taskShare: "ปรับสัดส่วนทายาทให้ครบ 100%",
		taskExecutor: "ตั้งผู้จัดการมรดก",
		taskFuneral: "บันทึกความประสงค์เรื่องพิธี",
		taskLetter: "เขียนจดหมายอย่างน้อยหนึ่งฉบับ",
		taskDoc: "เก็บเอกสารสำคัญอย่างน้อยหนึ่งฉบับ",
		taskCheckIn: "ตั้งช่วงเช็คอิน",
		viewAll: "ดูทั้งหมด",
		itemCount: "รายการ",
		showMore: "แสดงเพิ่ม",
		people: "คน",
		coverage: "ทุนประกัน",
		none: "—",
		pinNext: "ถัดไป",
		createLead: "ตั้งชื่อคลังตามชื่อจริงของคุณ จากนั้นสร้างรหัสผ่าน 6 หลักที่จำได้เฉพาะคุณ",
		welcomeKicker: "Digital Legacy Vault",
		sealed: "เข้ารหัสและปิดผนึก",
		openLetter: "อ่านจดหมาย",
		assignedValue: "มูลค่าที่ได้รับ",
		remainder: "ส่วนที่ยังไม่ระบุ",
		vaultDoor: "ประตูคลัง",
		changePin: "เปลี่ยนรหัส",
		newPin: "รหัสใหม่",
		pinChanged: "เปลี่ยนรหัสแล้ว",
		backupDue: "ถึงเวลาส่งออกคลังสำรอง",
		backupDuePin: "เปลี่ยนรหัสแล้ว — ส่งออกไฟล์ใหม่เก็บไว้นอกเครื่องนี้",
		backupDueNever: "ยังไม่มีการส่งออกสำรองบนเครื่องนี้",
		backupNow: "ส่งออกตอนนี้",
		backupSaved: "บันทึกไฟล์สำรองแล้ว",
		printPacket: "พิมพ์แพ็กเก็ต",
		restoreFirst: "เครื่องใหม่? กู้จากไฟล์ที่เคยส่งออกก่อน",
		peerLock: "เปิดคลังที่แท็บอื่นแล้ว แท็บนี้ถูกล็อก",
		legalNotWill: "Vaulty ไม่ใช่พินัยกรรม และไม่ส่งมรดกให้ทายาทอัตโนมัติ",
		releaseDisclaimer: "แผนส่งมอบเป็นตัวเตือนในแอปนี้เท่านั้น ไม่มีการส่งอีเมลหรือกุญแจให้ผู้จัดการมรดก",
		currentPin: "รหัสปัจจุบัน",
		moreTitle: "คลังและการตั้งค่า",
		idleLock: "เซสชันหมดอายุ — กรุณาเปิดคลังอีกครั้ง",
		copyId: "คัดลอก",
		copied: "คัดลอกแล้ว",
		today: "วันนี้",
		yesterday: "เมื่อวาน",
		daysAgo: "วันที่แล้ว",
		justNow: "เมื่อสักครู่",
		edit: "แก้ไข",
		required: "จำเป็น",
		demoBadge: "ตัวอย่าง",
		realVault: "คลังส่วนตัว",
		footerLegal: "ข้อมูลทั้งหมดประมวลผลในเบราว์เซอร์ของคุณ ไม่ถูกส่งออกไปภายนอก",
		packetAssets: "ทรัพย์สินที่ได้รับ",
		packetLetters: "ข้อความส่วนตัว",
		packetWishes: "ความประสงค์ของเจ้าของคลัง",
		packetExecutor: "ติดต่อผู้จัดการมรดก",
		packetEmpty: "ยังไม่มีรายการสำหรับทายาทคนนี้",
		selectHeir: "เลือกทายาท",
		markComplete: "ครบแล้ว",
		incomplete: "ยังไม่ครบ",
		totalHeirs: "ทายาท",
		totalDocs: "เอกสาร",
		lastUpdated: "อัปเดตล่าสุด",
		digitalAccounts: "บัญชีดิจิทัล",
		physical: "ทรัพย์สินรูปธรรม",
		liquid: "สินทรัพย์สภาพคล่อง",
		skipToContent: "ข้ามไปยังเนื้อหา",
		switchLang: "สลับภาษา",
		primaryNav: "เมนูหลัก",
		mobileNav: "เมนูล่าง",
		pinProgress: "กรอกรหัสแล้ว",
		pinDigit: "ตัวเลข",
		pinDelete: "ลบตัวเลขล่าสุด",
		lockedOut: "คลังถูกล็อกชั่วคราว",
		tryAgainIn: "ลองใหม่ใน",
		importVault: "นำเข้าคลังเข้ารหัส",
		importOk: "นำเข้าแล้ว — กรอกรหัสเพื่อเปิด",
		importFail: "ไฟล์คลังไม่ถูกต้อง",
		trustCenter: "ศูนย์ความเชื่อถือ",
		trustLead: "การควบคุมความปลอดภัย เส้นทางตรวจสอบ และการปฏิบัติตามของคลังนี้",
		healthCrypto: "Web Crypto API",
		healthStorage: "ที่เก็บในเครื่อง",
		healthContext: "บริบทปลอดภัย",
		healthBlob: "ความสมบูรณ์ของคลัง",
		healthLockout: "นโยบายรหัสผ่าน",
		pass: "ผ่าน",
		fail: "ไม่ผ่าน",
		warn: "เฝ้าระวัง",
		encryptionDetail: "AES-256-GCM · คีย์ไม่ถูกส่งออกจากเครื่องนี้",
		pbkdfDetail: "PBKDF2-SHA-256 · 100,000 รอบ",
		pdpaTitle: "ความเป็นส่วนตัว (PDPA)",
		pdpaBody: "ข้อมูลมรดกถูกประมวลผลในเบราว์เซอร์ของคุณเท่านั้น ไม่มีเซิร์ฟเวอร์กลาง ไม่มีการส่งไปยังผู้ประมวลผลภายนอก และไม่มีคุกกี้ติดตาม",
		auditExport: "ส่งออกบันทึกตรวจสอบ",
		sessionRemaining: "เหลือ",
		sessionWarn: "เซสชันจะล็อกในอีก 30 วินาที",
		shortcutLock: "ล็อกคลังทันที",
		shortcutHelp: "Ctrl + Shift + L",
		copySecret: "คัดลอก",
		secretCopied: "คัดลอกแล้ว · จะล้างคลิปบอร์ดใน 30 วินาที",
		compliance: "การปฏิบัติตาม",
		lastUnlock: "เปิดคลังล่าสุด",
		failedUnlocks: "รหัสผิดสะสม",
		noSecurityEvents: "ยังไม่มีเหตุการณ์ความปลอดภัย",
		blobSize: "ขนาดคลัง",
		vaultVersion: "รุ่นคลัง",
		pinPolicy: "ล็อก 30 วินาทีหลังรหัสผิด 5 ครั้ง แล้วขยายเป็น 2 และ 15 นาที",
		restoreVault: "กู้คืนจากไฟล์",
		secEvents: "เหตุการณ์ความปลอดภัย",
		seconds: "วินาที",
		auditSaved: "ดาวน์โหลดบันทึกตรวจสอบแล้ว",
		hideLockHint: "หากสลับออกจากแท็บเกิน 20 วินาที คลังจะล็อกอัตโนมัติ",
		sessionAuthPin: "เปลี่ยนรหัสได้เฉพาะขณะเซสชันเปิดอยู่",
		a11yUnlocked: "เปิดคลังแล้ว",
		a11yLocked: "ล็อกคลังแล้ว",
		kbShortcuts: "ทางลัดแป้นพิมพ์",
		deleteConfirmTitle: "ลบรายการนี้?",
		deleteConfirmBody: "การลบไม่สามารถย้อนกลับได้ รายการจะหายจากคลังบนเครื่องนี้",
		confirmDelete: "ลบรายการ",
		eventUnlock: "เปิดคลัง",
		eventLock: "ล็อกคลัง",
		eventFail: "รหัสไม่ถูกต้อง",
		eventExport: "ส่งออกคลัง",
		eventImport: "นำเข้าคลัง",
		eventWipe: "ลบคลัง",
		eventPin: "เปลี่ยนรหัส",
		eventHide: "ล็อกเพราะสลับแท็บ",
		eventCheckin: "เช็คอิน",
		eventIdle: "ล็อกเพราะไม่ใช้งาน",
		demoOverwriteTitle: "แทนที่คลังบนเครื่องนี้?",
		demoOverwriteBody: "คลังตัวอย่างจะเขียนทับคลังที่เข้ารหัสอยู่ตอนนี้ กู้คืนไม่ได้ถ้ายังไม่ได้ส่งออก",
		replaceDemo: "เปิดคลังตัวอย่าง",
		corruptVault: "คลังบนเครื่องนี้เสียหาย",
		corruptVaultBody: "ไฟล์คลังอ่านไม่ได้ — ลบแล้วสร้างใหม่ หรือกู้คืนจากไฟล์ที่ส่งออกไว้",
		persistFail: "บันทึกคลังไม่สำเร็จ — เครื่องอาจเต็ม ข้อมูลล่าสุดยังอยู่ในหน้านี้",
		retrySave: "บันทึกอีกครั้ง",
		confirmNewPin: "ยืนยันรหัสใหม่",
		errRequired: "จำเป็นต้องกรอก",
		errNameShort: "อย่างน้อย 2 ตัวอักษร",
		errTooLong: "ยาวเกินที่กำหนด",
		errEmail: "รูปแบบอีเมลไม่ถูกต้อง",
		errPhone: "เบอร์โทรไม่ถูกต้อง",
		errContact: "ข้อมูลติดต่อสั้นเกินไป",
		errDate: "ใช้รูปแบบ YYYY-MM-DD",
		errDateFuture: "วันเกิดต้องไม่เป็นอนาคต",
		errNumber: "ต้องเป็นตัวเลข",
		errNegative: "ต้องไม่ติดลบ",
		errTooBig: "มูลค่าสูงเกินที่รับได้",
		errShare: "สัดส่วนต้องอยู่ระหว่าง 0–100",
		errShareOver: "รวมกับทายาทคนอื่นเกิน 100%",
		errDays: "ต้องอยู่ระหว่าง 1–365 วัน",
		errLetterShort: "เขียนอย่างน้อย 10 ตัวอักษร",
		errRecipient: "เลือกผู้รับจดหมาย",
		fixForm: "กรอกข้อมูลให้ครบก่อนบันทึก"
	},
	en: {
		appName: "Vaulty",
		tagline: "A private vault for your digital estate",
		taglineShort: "Private Legacy Trust",
		welcomeLead: "Inventory what you own, name who inherits it, and seal your last wishes in a vault that never leaves this device.",
		createVault: "Create a vault",
		openDemo: "Open sample vault",
		unlock: "Unlock",
		enterPin: "Enter your 6-digit passcode",
		setPin: "Choose a 6-digit passcode",
		confirmPin: "Confirm passcode",
		pinMismatch: "Passcodes do not match",
		wrongPin: "Incorrect passcode",
		yourName: "Vault owner",
		namePlaceholder: "Full name",
		continue: "Continue",
		back: "Back",
		demoHint: "Sample vault · passcode",
		existingVault: "A vault exists on this device",
		forgotPin: "Forgot passcode — erase vault",
		wipeConfirmTitle: "Erase this vault?",
		wipeConfirmBody: "Everything stored on this device will be destroyed. Without the passcode the existing vault cannot be recovered.",
		wipe: "Erase vault",
		cancel: "Cancel",
		trustLocal: "Stays on this device",
		trustAes: "AES-256 encryption",
		trustLock: "Locks when you step away",
		decrypting: "Decrypting vault…",
		overview: "Overview",
		assets: "Assets",
		heirs: "Heirs",
		wishes: "Wishes",
		access: "Release plan",
		documents: "Documents",
		more: "More",
		lock: "Lock vault",
		language: "Language",
		session: "Secure session",
		lastCheckIn: "Last check-in",
		checkInNow: "Confirm I am still here",
		checkInDone: "Check-in recorded",
		checkInOverdue: "Check-in overdue",
		checkInOk: "Release plan is idle",
		netWorth: "Estate value",
		completeness: "Vault readiness",
		allocation: "Asset mix",
		heirShares: "Heir shares",
		pendingTasks: "Still missing",
		recentActivity: "Recent activity",
		addAsset: "Add asset",
		editAsset: "Edit asset",
		deleteAsset: "Delete asset",
		addHeir: "Add heir",
		editHeir: "Edit heir",
		deleteHeir: "Delete heir",
		addLetter: "Write a letter",
		addDocument: "Add document",
		save: "Save",
		delete: "Delete",
		name: "Name",
		category: "Category",
		institution: "Institution",
		identifier: "Reference",
		value: "Value (THB)",
		location: "Location",
		notes: "Notes",
		secret: "Secret",
		secretHint: "Password, seed phrase, or policy number — hidden until revealed",
		reveal: "Reveal",
		hide: "Hide",
		assignedHeirs: "Bequeathed to",
		unassigned: "No heir assigned",
		relationship: "Relationship",
		share: "Share",
		email: "Email",
		phone: "Phone",
		emptyAssets: "No assets in the vault",
		emptyAssetsHint: "Start with a bank account, a home, or a policy you already hold.",
		emptyHeirs: "No heirs yet",
		emptyHeirsHint: "Name the people — or causes — who should receive what you leave.",
		emptyLetters: "No letters yet",
		emptyLettersHint: "Leave a message for someone you love. It is released with the vault.",
		emptyDocs: "No documents yet",
		funeral: "Funeral & remains",
		restingPlace: "Place",
		organDonation: "Organ donation",
		yes: "Yes",
		no: "No",
		digitalAfterlife: "Digital afterlife",
		otherWishes: "Other wishes",
		letters: "Letters",
		to: "To",
		letterTitle: "Title",
		letterBody: "Letter",
		executor: "Executor",
		executorRole: "Role",
		executorContact: "Contact",
		emergency: "Emergency contact",
		checkInEvery: "Check-in every",
		days: "days",
		releaseNote: "Note released with the vault",
		previewPacket: "Preview heir packet",
		packetTitle: "Legacy release packet",
		packetLead: "This is what an heir would receive when the release plan runs.",
		closePreview: "Close preview",
		close: "Close",
		occupancy: "Vault owner",
		occupation: "Occupation",
		city: "City",
		born: "Born",
		allCategories: "All categories",
		filter: "Filter",
		search: "Search",
		noResults: "Nothing matches",
		noResultsHint: "Try another search or clear the filter.",
		shareTotal: "Share total",
		shareWarn: "Heir shares should add up to 100%.",
		autoLock: "Auto-lock",
		minutes: "min",
		exportVault: "Export encrypted vault",
		settings: "Settings",
		profile: "Owner",
		unlockDemo: "View sample",
		creating: "Sealing vault…",
		saved: "Saved",
		deleted: "Deleted",
		locked: "Vault locked",
		kind: "Document type",
		nextCheckIn: "Next check-in",
		overdueHint: "A missed check-in only flags this device. Vaulty does not send keys or papers to heirs on its own.",
		taskProfile: "Complete owner profile",
		taskAsset: "Add at least one asset",
		taskHeir: "Name at least one heir",
		taskShare: "Balance heir shares to 100%",
		taskExecutor: "Appoint an executor",
		taskFuneral: "Record funeral wishes",
		taskLetter: "Write at least one letter",
		taskDoc: "File at least one document",
		taskCheckIn: "Set a check-in interval",
		viewAll: "View all",
		itemCount: "items",
		showMore: "Show more",
		people: "people",
		coverage: "Coverage",
		none: "—",
		pinNext: "Next",
		createLead: "Use your real name, then choose a 6-digit passcode only you will know.",
		welcomeKicker: "Digital Legacy Vault",
		sealed: "Encrypted and sealed",
		openLetter: "Read letter",
		assignedValue: "Inherited value",
		remainder: "Unassigned",
		vaultDoor: "Vault door",
		changePin: "Change passcode",
		newPin: "New passcode",
		pinChanged: "Passcode updated",
		backupDue: "Time to export a backup",
		backupDuePin: "Passcode changed — export a new copy off this device",
		backupDueNever: "No backup has been exported on this device yet",
		backupNow: "Export now",
		backupSaved: "Backup file saved",
		printPacket: "Print packet",
		restoreFirst: "New device? Restore from a file you exported first.",
		peerLock: "The vault opened in another tab, so this one locked.",
		legalNotWill: "Vaulty is not a will and does not deliver an estate by itself.",
		releaseDisclaimer: "The release plan is an on-device reminder only. No email or keys are sent to an executor.",
		currentPin: "Current passcode",
		moreTitle: "Vault & settings",
		idleLock: "Session expired — unlock the vault again",
		copyId: "Copy",
		copied: "Copied",
		today: "Today",
		yesterday: "Yesterday",
		daysAgo: "days ago",
		justNow: "Just now",
		edit: "Edit",
		required: "Required",
		demoBadge: "Sample",
		realVault: "Private vault",
		footerLegal: "Everything is processed in your browser. Nothing is sent away.",
		packetAssets: "Assets received",
		packetLetters: "Personal messages",
		packetWishes: "The owner’s wishes",
		packetExecutor: "Contact the executor",
		packetEmpty: "Nothing assigned to this heir yet",
		selectHeir: "Choose an heir",
		markComplete: "Complete",
		incomplete: "Incomplete",
		totalHeirs: "Heirs",
		totalDocs: "Documents",
		lastUpdated: "Updated",
		digitalAccounts: "Digital accounts",
		physical: "Physical assets",
		liquid: "Liquid assets",
		skipToContent: "Skip to content",
		switchLang: "Switch language",
		primaryNav: "Main menu",
		mobileNav: "Mobile menu",
		pinProgress: "Digits entered",
		pinDigit: "Digit",
		pinDelete: "Delete last digit",
		lockedOut: "Vault temporarily locked",
		tryAgainIn: "Try again in",
		importVault: "Import encrypted vault",
		importOk: "Imported — enter the passcode to unlock",
		importFail: "That file is not a valid vault",
		trustCenter: "Trust centre",
		trustLead: "Security controls, audit trail, and compliance posture for this vault.",
		healthCrypto: "Web Crypto API",
		healthStorage: "On-device storage",
		healthContext: "Secure context",
		healthBlob: "Vault integrity",
		healthLockout: "Passcode policy",
		pass: "Pass",
		fail: "Fail",
		warn: "Watch",
		encryptionDetail: "AES-256-GCM · the key never leaves this device",
		pbkdfDetail: "PBKDF2-SHA-256 · 100,000 iterations",
		pdpaTitle: "Privacy (PDPA)",
		pdpaBody: "Estate data is processed only in your browser. There is no central server, no third-party processor, and no tracking cookies.",
		auditExport: "Export audit log",
		sessionRemaining: "Left",
		sessionWarn: "The session will lock in 30 seconds",
		shortcutLock: "Lock the vault now",
		shortcutHelp: "Ctrl + Shift + L",
		copySecret: "Copy",
		secretCopied: "Copied · clipboard will clear in 30 seconds",
		compliance: "Compliance",
		lastUnlock: "Last unlock",
		failedUnlocks: "Failed attempts",
		noSecurityEvents: "No security events yet",
		blobSize: "Vault size",
		vaultVersion: "Vault version",
		pinPolicy: "Locks for 30 seconds after 5 failures, then 2 and 15 minutes",
		restoreVault: "Restore from file",
		secEvents: "Security events",
		seconds: "seconds",
		auditSaved: "Audit log downloaded",
		hideLockHint: "Leaving this tab for more than 20 seconds locks the vault.",
		sessionAuthPin: "The passcode can be changed only while a session is open.",
		a11yUnlocked: "Vault unlocked",
		a11yLocked: "Vault locked",
		kbShortcuts: "Keyboard shortcuts",
		deleteConfirmTitle: "Delete this item?",
		deleteConfirmBody: "This cannot be undone. The item will be removed from the vault on this device.",
		confirmDelete: "Delete item",
		eventUnlock: "Vault unlocked",
		eventLock: "Vault locked",
		eventFail: "Incorrect passcode",
		eventExport: "Vault exported",
		eventImport: "Vault imported",
		eventWipe: "Vault erased",
		eventPin: "Passcode changed",
		eventHide: "Locked after leaving tab",
		eventCheckin: "Check-in",
		eventIdle: "Locked after inactivity",
		demoOverwriteTitle: "Replace the vault on this device?",
		demoOverwriteBody: "The sample vault will overwrite the sealed vault already stored here. This cannot be undone unless you exported a copy.",
		replaceDemo: "Open sample vault",
		corruptVault: "The vault on this device is damaged",
		corruptVaultBody: "The sealed file cannot be read. Erase it and start again, or restore from an exported copy.",
		persistFail: "Could not save the vault — this device may be out of space. Latest edits are still on screen.",
		retrySave: "Try saving again",
		confirmNewPin: "Confirm new passcode",
		errRequired: "This field is required",
		errNameShort: "Enter at least 2 characters",
		errTooLong: "Too long for this field",
		errEmail: "Enter a valid email address",
		errPhone: "Enter a valid phone number",
		errContact: "Contact details are too short",
		errDate: "Use YYYY-MM-DD",
		errDateFuture: "Date of birth cannot be in the future",
		errNumber: "Enter a number",
		errNegative: "Value cannot be negative",
		errTooBig: "Value is larger than allowed",
		errShare: "Share must be between 0 and 100",
		errShareOver: "Combined shares exceed 100%",
		errDays: "Must be between 1 and 365 days",
		errLetterShort: "Write at least 10 characters",
		errRecipient: "Choose a recipient",
		fixForm: "Fix the highlighted fields before saving"
	}
};
function t(lang, key) {
	return dict[lang][key];
}
var categoryLabel = {
	th: {
		property: "อสังหาริมทรัพย์",
		banking: "บัญชีธนาคาร",
		investment: "การลงทุน",
		crypto: "สินทรัพย์ดิจิทัล",
		insurance: "ประกัน",
		vehicle: "ยานพาหนะ",
		digital: "บัญชีออนไลน์",
		collectible: "ของสะสม",
		other: "อื่น ๆ"
	},
	en: {
		property: "Property",
		banking: "Banking",
		investment: "Investments",
		crypto: "Crypto",
		insurance: "Insurance",
		vehicle: "Vehicles",
		digital: "Digital accounts",
		collectible: "Collectibles",
		other: "Other"
	}
};
var relationshipLabel = {
	th: {
		spouse: "คู่สมรส",
		child: "บุตร",
		parent: "บิดามารดา",
		sibling: "พี่น้อง",
		grandchild: "หลาน",
		friend: "เพื่อน",
		charity: "การกุศล",
		other: "อื่น ๆ"
	},
	en: {
		spouse: "Spouse",
		child: "Child",
		parent: "Parent",
		sibling: "Sibling",
		grandchild: "Grandchild",
		friend: "Friend",
		charity: "Charity",
		other: "Other"
	}
};
var documentLabel = {
	th: {
		will: "พินัยกรรม",
		deed: "โฉนด / กรรมสิทธิ์",
		policy: "กรมธรรม์",
		id: "เอกสารประจำตัว",
		password: "รหัสผ่าน",
		other: "อื่น ๆ"
	},
	en: {
		will: "Will",
		deed: "Title / deed",
		policy: "Policy",
		id: "Identity",
		password: "Credentials",
		other: "Other"
	}
};
var SEC_KINDS = /* @__PURE__ */ new Set([
	"unlock",
	"lock",
	"fail",
	"export",
	"import",
	"wipe",
	"pin",
	"hide",
	"checkin",
	"idle"
]);
function classifySealed(raw) {
	if (!raw) return "empty";
	try {
		return isEncryptedBlob(JSON.parse(raw)) ? "sealed" : "corrupt";
	} catch {
		return "corrupt";
	}
}
function parseLockout(raw) {
	if (!raw) return {
		fails: 0,
		until: 0
	};
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {
			fails: 0,
			until: 0
		};
		const o = parsed;
		return {
			fails: Math.min(50, Math.max(0, Math.floor(Number(o.fails)) || 0)),
			until: Math.max(0, Math.floor(Number(o.until)) || 0)
		};
	} catch {
		return {
			fails: 0,
			until: 0
		};
	}
}
function parseSecEvents(raw) {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const out = [];
		for (const item of parsed) {
			if (!item || typeof item !== "object") continue;
			const at = item.at;
			const kind = item.kind;
			if (typeof at !== "string" || typeof kind !== "string") continue;
			if (!SEC_KINDS.has(kind)) continue;
			out.push({
				at,
				kind
			});
			if (out.length >= 50) break;
		}
		return out;
	} catch {
		return [];
	}
}
function recoverAutoLock(raw) {
	const n = Number(raw || "5");
	if (!Number.isFinite(n) || n < 1) return 5;
	return Math.min(30, Math.round(n));
}
function shouldCommitPersist(writeGen, liveGen, hasSession) {
	return hasSession && writeGen === liveGen;
}
function canRestore(raw) {
	if (typeof raw !== "string" || raw.length === 0) return false;
	return classifySealed(raw) === "sealed";
}
var MAX_BLOB_CHARS = 15e5;
function lsGet(key) {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}
function lsSet(key, value) {
	if (typeof window === "undefined") return false;
	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}
function lsRemove(key) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(key);
	} catch {}
}
function tooLarge(raw) {
	return raw.length > MAX_BLOB_CHARS;
}
var LOCKOUT_KEY = "vaulty.lockout";
var SEC_KEY = "vaulty.sec";
function backoffMs(fails) {
	if (fails < 5) return 0;
	if (fails < 8) return 3e4;
	if (fails < 10) return 12e4;
	return 9e5;
}
function remainingMs(state, now = Date.now()) {
	return Math.max(0, (state.until || 0) - now);
}
function nextLockout(prev, now = Date.now()) {
	const fails = prev.fails + 1;
	const wait = backoffMs(fails);
	return {
		fails,
		until: wait ? now + wait : 0
	};
}
function readLockout() {
	return parseLockout(lsGet(LOCKOUT_KEY));
}
function writeLockout(state) {
	lsSet(LOCKOUT_KEY, JSON.stringify(state));
}
function recordFail(now = Date.now()) {
	const next = nextLockout(readLockout(), now);
	writeLockout(next);
	pushSec("fail");
	return next;
}
function resetLockout() {
	writeLockout({
		fails: 0,
		until: 0
	});
}
function readSec() {
	return parseSecEvents(lsGet(SEC_KEY));
}
function pushSec(kind) {
	const events = [{
		at: (/* @__PURE__ */ new Date()).toISOString(),
		kind
	}, ...readSec()].slice(0, 50);
	lsSet(SEC_KEY, JSON.stringify(events));
}
function clearSecurity() {
	lsRemove(LOCKOUT_KEY);
	lsRemove(SEC_KEY);
}
var EXPORT_AT_KEY = "vaulty.exportedAt";
var NEED_BACKUP_KEY = "vaulty.needBackup";
function markExported(now = Date.now()) {
	lsSet(EXPORT_AT_KEY, String(now));
	lsRemove(NEED_BACKUP_KEY);
}
function markBackupNeeded() {
	lsSet(NEED_BACKUP_KEY, "1");
}
function clearBackupMeta() {
	lsRemove(EXPORT_AT_KEY);
	lsRemove(NEED_BACKUP_KEY);
}
function lastExportAt() {
	const raw = lsGet(EXPORT_AT_KEY);
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : null;
}
function backupReason(now = Date.now()) {
	if (lsGet("vaulty.needBackup") === "1") return "pin";
	const last = lastExportAt();
	if (!last) return "never";
	if (now - last >= 6048e5) return "stale";
	return null;
}
function backupDue(now = Date.now()) {
	return backupReason(now) !== null;
}
function vaultTasks(vault) {
	const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
	return [
		{
			key: "taskProfile",
			done: Boolean(vault.profile.fullName && vault.profile.city && vault.profile.occupation),
			weight: 8
		},
		{
			key: "taskAsset",
			done: vault.assets.length > 0,
			weight: 16
		},
		{
			key: "taskHeir",
			done: vault.beneficiaries.length > 0,
			weight: 14
		},
		{
			key: "taskShare",
			done: vault.beneficiaries.length > 0 && Math.abs(share - 100) < .5,
			weight: 10
		},
		{
			key: "taskExecutor",
			done: Boolean(vault.access.executorName),
			weight: 12
		},
		{
			key: "taskFuneral",
			done: Boolean(vault.wishes.funeral),
			weight: 12
		},
		{
			key: "taskLetter",
			done: vault.letters.length > 0,
			weight: 10
		},
		{
			key: "taskDoc",
			done: vault.documents.length > 0,
			weight: 10
		},
		{
			key: "taskCheckIn",
			done: vault.access.checkInDays > 0,
			weight: 8
		}
	];
}
function completenessScore(vault) {
	const tasks = vaultTasks(vault);
	const total = tasks.reduce((s, t) => s + t.weight, 0);
	const got = tasks.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
	return Math.round(got / total * 100);
}
function totalValue(vault) {
	return vault.assets.reduce((s, a) => s + (Number.isFinite(a.valueThb) ? a.valueThb : 0), 0);
}
function valueByCategory(vault) {
	const map = /* @__PURE__ */ new Map();
	for (const a of vault.assets) map.set(a.category, (map.get(a.category) ?? 0) + a.valueThb);
	return [...map.entries()].map(([category, value]) => ({
		category,
		value
	})).sort((a, b) => b.value - a.value);
}
function assignedValuesByHeir(vault) {
	const estate = totalValue(vault);
	const assigned = /* @__PURE__ */ new Map();
	for (const asset of vault.assets) {
		if (asset.beneficiaryIds.length === 0) continue;
		const each = asset.valueThb / asset.beneficiaryIds.length;
		for (const id of asset.beneficiaryIds) assigned.set(id, (assigned.get(id) ?? 0) + each);
	}
	const out = /* @__PURE__ */ new Map();
	for (const heir of vault.beneficiaries) out.set(heir.id, assigned.has(heir.id) ? assigned.get(heir.id) ?? 0 : heir.sharePercent / 100 * estate);
	return out;
}
function heirValue(vault, heirId) {
	return assignedValuesByHeir(vault).get(heirId) ?? 0;
}
function daysAgo(n) {
	const d = /* @__PURE__ */ new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
}
function emptyVault(fullName, lang = "th") {
	return {
		profile: {
			fullName,
			dateOfBirth: "",
			city: "",
			occupation: ""
		},
		assets: [],
		beneficiaries: [],
		letters: [],
		documents: [],
		wishes: {
			funeral: "",
			restingPlace: "",
			organDonation: false,
			digitalAfterlife: "",
			other: ""
		},
		access: {
			executorName: "",
			executorRole: "",
			executorContact: "",
			emergencyName: "",
			emergencyContact: "",
			checkInDays: 30,
			lastCheckIn: (/* @__PURE__ */ new Date()).toISOString(),
			releaseNote: ""
		},
		activity: [{
			id: uid(),
			at: (/* @__PURE__ */ new Date()).toISOString(),
			text: lang === "th" ? `สร้างคลังสำหรับ ${fullName}` : `Vault created for ${fullName}`
		}],
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function createDemoVault(lang) {
	const ids = {
		spouse: uid(),
		daughter: uid(),
		son: uid(),
		charity: uid(),
		condo: uid(),
		land: uid(),
		kbank: uid(),
		scb: uid(),
		stocks: uid(),
		btc: uid(),
		aia: uid(),
		car: uid(),
		google: uid(),
		line: uid(),
		rolex: uid(),
		art: uid()
	};
	const th = {
		profile: {
			fullName: "สุทธิดา วรวัฒน์",
			dateOfBirth: "1968-03-14",
			city: "กรุงเทพมหานคร",
			occupation: "ผู้ประกอบการ"
		},
		assets: [
			{
				id: ids.condo,
				category: "property",
				name: "คอนโดมิเนียม เอกมัย 2 ห้องนอน",
				institution: "นิติบุคคลอาคารชุด The Reserve",
				identifier: "โฉนด เลขที่ 48291",
				valueThb: 125e5,
				location: "เอกมัย, กรุงเทพฯ",
				notes: "ห้อง 14B ชั้น 14 พื้นที่ 78 ตร.ม. ผ่อนชำระครบแล้ว",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(4)
			},
			{
				id: ids.land,
				category: "property",
				name: "ที่ดินสวนลำไย สันกำแพง",
				institution: "สำนักงานที่ดินเชียงใหม่",
				identifier: "โฉนด เลขที่ 11034",
				valueThb: 82e5,
				location: "สันกำแพง, เชียงใหม่ · 2 ไร่",
				notes: "ต้องการให้คงเป็นสวน ไม่ขายใน 10 ปีแรก",
				beneficiaryIds: [ids.son, ids.daughter],
				secret: "",
				updatedAt: daysAgo(18)
			},
			{
				id: ids.kbank,
				category: "banking",
				name: "บัญชีออมทรัพย์ กสิกรไทย",
				institution: "ธนาคารกสิกรไทย",
				identifier: "xxx-x-x8391",
				valueThb: 243e4,
				location: "สาขาทองหล่อ",
				notes: "บัญชีหลักสำหรับค่าใช้จ่ายครอบครัว",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(1)
			},
			{
				id: ids.scb,
				category: "investment",
				name: "พอร์ต SCB Private Banking",
				institution: "ไทยพาณิชย์",
				identifier: "PB-20411",
				valueThb: 68e5,
				location: "สาขาสยามพารากอน",
				notes: "กองทุนผสม หุ้นกู้ และตราสารหนี้",
				beneficiaryIds: [],
				secret: "",
				updatedAt: daysAgo(9)
			},
			{
				id: ids.stocks,
				category: "investment",
				name: "พอร์ตหุ้น SET",
				institution: "หลักทรัพย์บัวหลวง",
				identifier: "บัญชี 77821",
				valueThb: 312e4,
				location: "ออนไลน์",
				notes: "PTT, ADVANC, CPALL เป็นหลัก",
				beneficiaryIds: [],
				secret: "",
				updatedAt: daysAgo(3)
			},
			{
				id: ids.btc,
				category: "crypto",
				name: "กระเป๋า Bitcoin เย็น",
				institution: "Ledger (self-custody)",
				identifier: "bc1q…k4w9",
				valueThb: 29e5,
				location: "ตู้เซฟบ้าน · ลิ้นชักล่าง",
				notes: "ฮาร์ดแวร์วอลเล็ตสีดำ ติดป้าย ‘Garden’",
				beneficiaryIds: [ids.daughter],
				secret: "seed เก็บแยกในซองคราฟต์ที่บ้านเชียงใหม่ ไม่เก็บในคลังนี้",
				updatedAt: daysAgo(21)
			},
			{
				id: ids.aia,
				category: "insurance",
				name: "ประกันชีวิต AIA Unit Linked",
				institution: "AIA Thailand",
				identifier: "กรมธรรม์ UL-552019",
				valueThb: 12e5,
				location: "ตัวแทน: คุณมานี",
				notes: "ทุนประกัน 10,000,000 บาท ผู้รับผลประโยชน์ตามกรมธรรม์",
				beneficiaryIds: [
					ids.spouse,
					ids.daughter,
					ids.son
				],
				secret: "",
				updatedAt: daysAgo(40)
			},
			{
				id: ids.car,
				category: "vehicle",
				name: "Lexus RX 350h",
				institution: "กรมการขนส่งทางบก",
				identifier: "กท 3921",
				valueThb: 28e5,
				location: "จอดที่คอนโดเอกมัย",
				notes: "ต่อภาษีเดือนมีนาคม กุญแจสำรองที่บ้านแม่",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(12)
			},
			{
				id: ids.google,
				category: "digital",
				name: "บัญชี Google (ครอบครัว)",
				institution: "Google",
				identifier: "suttida.w@gmail.com",
				valueThb: 0,
				location: "ออนไลน์",
				notes: "เปิด Inactive Account Manager ส่งต่อให้ลูกสาว",
				beneficiaryIds: [ids.daughter],
				secret: "รหัสผ่านอยู่ที่ตัวจัดการรหัสของ Apple บนเครื่อง Mac",
				updatedAt: daysAgo(6)
			},
			{
				id: ids.line,
				category: "digital",
				name: "LINE / Facebook / Instagram",
				institution: "Meta / LINE",
				identifier: "sutthida.w",
				valueThb: 0,
				location: "ออนไลน์",
				notes: "ต้องการให้ปิด ไม่สร้างเพจอาลัย",
				beneficiaryIds: [ids.daughter],
				secret: "",
				updatedAt: daysAgo(6)
			},
			{
				id: ids.rolex,
				category: "collectible",
				name: "Rolex Datejust 36",
				institution: "Siam Paragon Boutique",
				identifier: "Serial 4D2…91",
				valueThb: 42e4,
				location: "ตู้เซฟบ้าน",
				notes: "ของขวัญวันแต่งงาน ปี 2538 — มอบให้ลูกชาย",
				beneficiaryIds: [ids.son],
				secret: "",
				updatedAt: daysAgo(90)
			},
			{
				id: ids.art,
				category: "collectible",
				name: "งานศิลปะร่วมสมัย 4 ชิ้น",
				institution: "คอลเลกชันส่วนตัว",
				identifier: "รายการในแฟ้มศิลปะ",
				valueThb: 85e4,
				location: "ผนังห้องนั่งเล่นคอนโด",
				notes: "รายการและใบรับรองอยู่ในแฟ้มสีครีม",
				beneficiaryIds: [ids.charity],
				secret: "",
				updatedAt: daysAgo(50)
			}
		],
		beneficiaries: [
			{
				id: ids.spouse,
				name: "วิชญ์ วรวัฒน์",
				relationship: "spouse",
				sharePercent: 40,
				email: "wich.w@example.com",
				phone: "081-234-1100",
				notes: "คู่ชีวิต 31 ปี ผู้ตัดสินใจเรื่องบ้าน"
			},
			{
				id: ids.daughter,
				name: "ณิชากร วรวัฒน์",
				relationship: "child",
				sharePercent: 30,
				email: "nicha.w@example.com",
				phone: "089-445-8821",
				notes: "อาศัยที่ลอนดอน ทำงานด้านออกแบบ"
			},
			{
				id: ids.son,
				name: "ภูริทัต วรวัฒน์",
				relationship: "child",
				sharePercent: 20,
				email: "phuri.w@example.com",
				phone: "086-901-3344",
				notes: "ดูแลสวนที่เชียงใหม่"
			},
			{
				id: ids.charity,
				name: "มูลนิธิรามาธิบดี",
				relationship: "charity",
				sharePercent: 10,
				email: "legacy@ra.mahidol.ac.th",
				phone: "02-201-1000",
				notes: "บริจาคเป็นทุนการแพทย์"
			}
		],
		letters: [
			{
				id: uid(),
				toBeneficiaryId: ids.spouse,
				title: "ถึงวิชญ์",
				body: "รัก\n\nถ้าได้อ่านจดหมายนี้ แสดงว่าฉันได้จากไปแล้ว แต่บ้านหลังนี้และเรื่องเล็ก ๆ ในลิ้นชักยังเป็นของเราทั้งคู่ ขอให้กินข้าวให้ครบมื้อ และอย่าเก็บคอนโดไว้คนเดียวถ้ามันเงียบเกินไป\n\nกุญแจตู้เซฟใบที่สองอยู่ในกล่องชาที่ครัวเชียงใหม่\n\nรักเสมอ\nดา",
				updatedAt: daysAgo(11)
			},
			{
				id: uid(),
				toBeneficiaryId: ids.daughter,
				title: "ถึงณิชา",
				body: "ลูกสาว\n\nอย่าเร่งกลับบ้านถ้างานที่ลอนดอนยังไม่จบ แม่สบายใจที่ลูกมีชีวิตของตัวเอง สวนที่เชียงใหม่ไม่ต้องรีบตัดสินใจ — ไปเดินตอนฝนเพิ่งหยุด แล้วค่อยคิด\n\nรหัสรูปเก่า ๆ อยู่ในอัลบั้มปี 2542 หน้าแรก\n\nภูมิใจในตัวลูกทุกวัน\nแม่",
				updatedAt: daysAgo(11)
			},
			{
				id: uid(),
				toBeneficiaryId: ids.son,
				title: "ถึงภูริ",
				body: "ลูกชาย\n\nนาฬิกาเรือนนั้นเป็นของปู่ก่อนที่จะเป็นของแม่ ใส่ได้ทุกวัน ไม่ต้องเก็บในกล่อง ต้นลำไยต้นที่สามจากประตู เป็นต้นที่แม่ปลูกวันลูกเกิด\n\nดูแลพี่สาวด้วย แม้ลูกจะพูดน้อยกว่าเธอ\n\nแม่",
				updatedAt: daysAgo(11)
			}
		],
		documents: [
			{
				id: uid(),
				title: "พินัยกรรม ฉบับลงนาม 12 ก.พ. 2568",
				kind: "will",
				notes: "ต้นฉบับอยู่ที่สำนักงานทนายอริยา สำเนาในตู้เซฟบ้าน",
				secret: ""
			},
			{
				id: uid(),
				title: "โฉนดคอนโดเอกมัย + ที่ดินสันกำแพง",
				kind: "deed",
				notes: "แฟ้มสีกรมท่า ชั้นสอง ลิ้นชักซ้าย",
				secret: ""
			},
			{
				id: uid(),
				title: "กรมธรรม์ AIA UL-552019",
				kind: "policy",
				notes: "ตัวแทนคุณมานี โทร 081-000-2299",
				secret: ""
			},
			{
				id: uid(),
				title: "รายการรหัสผ่านหลัก",
				kind: "password",
				notes: "ใช้เฉพาะเมื่อแผนส่งมอบทำงาน",
				secret: "Apple ID: suttida.w@icloud.com — กุญแจสำรองใน YubiKey ลิ้นชักทำงาน"
			}
		],
		wishes: {
			funeral: "ไม่ต้องการงานใหญ่ ตั้งศพบริเวณบ้านไม่เกินหนึ่งวัน แล้วถวายเพลิงที่วัดท่าทอง ดอกไม้สีขาวเท่านั้น ห้ามแถลงข่าว",
			restingPlace: "วัดท่าทอง กรุงเทพฯ · โปรยเถ้าบางส่วนที่สวนสันกำแพง",
			organDonation: true,
			digitalAfterlife: "ปิด Facebook และ Instagram ภายใน 30 วัน ไม่สร้างเพจอาลัย Google Photos ส่งมอบให้ณิชา LINE ให้วิชญ์เก็บประวัติแชทครอบครัวไว้หนึ่งปีแล้วลบ",
			other: "ไม่ต้องการให้ขายสวนใน 10 ปีแรก หากจำเป็นต้องขาย เงินส่วนนั้นเข้ากองทุนการศึกษาหลาน"
		},
		access: {
			executorName: "อริยา พงศ์ไพศาล",
			executorRole: "ทนายความ · สำนักงานกฎหมายพงศ์ไพศาล",
			executorContact: "02-678-4410 · ariya@pongsailaw.co.th",
			emergencyName: "วิชญ์ วรวัฒน์",
			emergencyContact: "081-234-1100",
			checkInDays: 30,
			lastCheckIn: daysAgo(6),
			releaseNote: "เมื่อคลังถูกส่งมอบ ให้เริ่มจากพินัยกรรมและรายชื่อทายาท จากนั้นเปิดจดหมายส่วนตัวก่อนย้ายทรัพย์สิน"
		},
		activity: [
			{
				id: uid(),
				at: daysAgo(1),
				text: "อัปเดตยอดบัญชีกสิกรไทย"
			},
			{
				id: uid(),
				at: daysAgo(4),
				text: "ตรวจโฉนดคอนโดเอกมัย"
			},
			{
				id: uid(),
				at: daysAgo(6),
				text: "เช็คอินตามแผนส่งมอบ"
			},
			{
				id: uid(),
				at: daysAgo(11),
				text: "เขียนจดหมายถึงครอบครัว"
			}
		],
		createdAt: daysAgo(120)
	};
	const en = {
		profile: {
			fullName: "Suttida Worawat",
			dateOfBirth: "1968-03-14",
			city: "Bangkok",
			occupation: "Entrepreneur"
		},
		assets: [
			{
				id: ids.condo,
				category: "property",
				name: "Ekkamai 2-bedroom condominium",
				institution: "The Reserve juristic person",
				identifier: "Title deed 48291",
				valueThb: 125e5,
				location: "Ekkamai, Bangkok",
				notes: "Unit 14B, 78 sqm, fully paid.",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(4)
			},
			{
				id: ids.land,
				category: "property",
				name: "Longan orchard, San Kamphaeng",
				institution: "Chiang Mai Land Office",
				identifier: "Title deed 11034",
				valueThb: 82e5,
				location: "San Kamphaeng, Chiang Mai · 2 rai",
				notes: "Keep as an orchard. Do not sell in the first 10 years.",
				beneficiaryIds: [ids.son, ids.daughter],
				secret: "",
				updatedAt: daysAgo(18)
			},
			{
				id: ids.kbank,
				category: "banking",
				name: "Kasikorn savings account",
				institution: "Kasikornbank",
				identifier: "xxx-x-x8391",
				valueThb: 243e4,
				location: "Thonglor branch",
				notes: "Primary household account.",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(1)
			},
			{
				id: ids.scb,
				category: "investment",
				name: "SCB Private Banking portfolio",
				institution: "Siam Commercial Bank",
				identifier: "PB-20411",
				valueThb: 68e5,
				location: "Siam Paragon branch",
				notes: "Mixed funds, bonds, and bills.",
				beneficiaryIds: [],
				secret: "",
				updatedAt: daysAgo(9)
			},
			{
				id: ids.stocks,
				category: "investment",
				name: "SET equity portfolio",
				institution: "Bualuang Securities",
				identifier: "Account 77821",
				valueThb: 312e4,
				location: "Online",
				notes: "Core holdings: PTT, ADVANC, CPALL.",
				beneficiaryIds: [],
				secret: "",
				updatedAt: daysAgo(3)
			},
			{
				id: ids.btc,
				category: "crypto",
				name: "Bitcoin cold wallet",
				institution: "Ledger (self-custody)",
				identifier: "bc1q…k4w9",
				valueThb: 29e5,
				location: "Home safe · lower drawer",
				notes: "Black hardware wallet labelled Garden.",
				beneficiaryIds: [ids.daughter],
				secret: "Seed is in a kraft envelope at the Chiang Mai house — not stored here.",
				updatedAt: daysAgo(21)
			},
			{
				id: ids.aia,
				category: "insurance",
				name: "AIA unit-linked life policy",
				institution: "AIA Thailand",
				identifier: "Policy UL-552019",
				valueThb: 12e5,
				location: "Agent: Manee",
				notes: "THB 10,000,000 sum assured. Beneficiaries per policy.",
				beneficiaryIds: [
					ids.spouse,
					ids.daughter,
					ids.son
				],
				secret: "",
				updatedAt: daysAgo(40)
			},
			{
				id: ids.car,
				category: "vehicle",
				name: "Lexus RX 350h",
				institution: "Department of Land Transport",
				identifier: "กท 3921",
				valueThb: 28e5,
				location: "Ekkamai condominium",
				notes: "Tax due in March. Spare key at mother’s house.",
				beneficiaryIds: [ids.spouse],
				secret: "",
				updatedAt: daysAgo(12)
			},
			{
				id: ids.google,
				category: "digital",
				name: "Family Google account",
				institution: "Google",
				identifier: "suttida.w@gmail.com",
				valueThb: 0,
				location: "Online",
				notes: "Inactive Account Manager forwards to daughter.",
				beneficiaryIds: [ids.daughter],
				secret: "Password lives in Apple Passwords on the Mac.",
				updatedAt: daysAgo(6)
			},
			{
				id: ids.line,
				category: "digital",
				name: "LINE / Facebook / Instagram",
				institution: "Meta / LINE",
				identifier: "sutthida.w",
				valueThb: 0,
				location: "Online",
				notes: "Close the accounts. Do not create a memorial page.",
				beneficiaryIds: [ids.daughter],
				secret: "",
				updatedAt: daysAgo(6)
			},
			{
				id: ids.rolex,
				category: "collectible",
				name: "Rolex Datejust 36",
				institution: "Siam Paragon Boutique",
				identifier: "Serial 4D2…91",
				valueThb: 42e4,
				location: "Home safe",
				notes: "Wedding gift, 1995 — leave to son.",
				beneficiaryIds: [ids.son],
				secret: "",
				updatedAt: daysAgo(90)
			},
			{
				id: ids.art,
				category: "collectible",
				name: "Four contemporary works",
				institution: "Private collection",
				identifier: "Listed in the art folio",
				valueThb: 85e4,
				location: "Condo living room",
				notes: "Certificates in the cream folio.",
				beneficiaryIds: [ids.charity],
				secret: "",
				updatedAt: daysAgo(50)
			}
		],
		beneficiaries: [
			{
				id: ids.spouse,
				name: "Witch Worawat",
				relationship: "spouse",
				sharePercent: 40,
				email: "wich.w@example.com",
				phone: "081-234-1100",
				notes: "Partner of 31 years. Decides on the home."
			},
			{
				id: ids.daughter,
				name: "Nichakorn Worawat",
				relationship: "child",
				sharePercent: 30,
				email: "nicha.w@example.com",
				phone: "089-445-8821",
				notes: "Lives in London. Works in design."
			},
			{
				id: ids.son,
				name: "Phurithat Worawat",
				relationship: "child",
				sharePercent: 20,
				email: "phuri.w@example.com",
				phone: "086-901-3344",
				notes: "Looks after the Chiang Mai orchard."
			},
			{
				id: ids.charity,
				name: "Ramathibodi Foundation",
				relationship: "charity",
				sharePercent: 10,
				email: "legacy@ra.mahidol.ac.th",
				phone: "02-201-1000",
				notes: "Gift as a medical fund."
			}
		],
		letters: [
			{
				id: uid(),
				toBeneficiaryId: ids.spouse,
				title: "For Witch",
				body: "My love,\n\nIf you are reading this I have gone. The apartment and the small things in the drawers are still ours. Eat proper meals. Do not keep the condo if it is too quiet.\n\nThe second safe key is in the tea tin at the Chiang Mai kitchen.\n\nAlways,\nDa",
				updatedAt: daysAgo(11)
			},
			{
				id: uid(),
				toBeneficiaryId: ids.daughter,
				title: "For Nicha",
				body: "My daughter,\n\nDo not rush home if London is unfinished. I am glad you have a life of your own. The orchard can wait — walk it just after rain, then decide.\n\nThe old photo password is on the first page of the 1999 album.\n\nProud of you every day.\nMae",
				updatedAt: daysAgo(11)
			},
			{
				id: uid(),
				toBeneficiaryId: ids.son,
				title: "For Phuri",
				body: "My son,\n\nThat watch was your grandfather’s before it was mine. Wear it. Do not keep it in a box. The third longan tree from the gate is the one I planted the day you were born.\n\nLook after your sister, even though you speak less than she does.\n\nMae",
				updatedAt: daysAgo(11)
			}
		],
		documents: [
			{
				id: uid(),
				title: "Will signed 12 Feb 2025",
				kind: "will",
				notes: "Original at Khun Ariya’s office. Copy in the home safe.",
				secret: ""
			},
			{
				id: uid(),
				title: "Ekkamai condo + San Kamphaeng titles",
				kind: "deed",
				notes: "Navy folio, second floor, left drawer.",
				secret: ""
			},
			{
				id: uid(),
				title: "AIA policy UL-552019",
				kind: "policy",
				notes: "Agent Manee, 081-000-2299",
				secret: ""
			},
			{
				id: uid(),
				title: "Primary credentials list",
				kind: "password",
				notes: "Reveal only when the release plan runs.",
				secret: "Apple ID: suttida.w@icloud.com — spare key is the YubiKey in the desk drawer."
			}
		],
		wishes: {
			funeral: "No large gathering. One day at home, then cremation at Wat That Thong. White flowers only. No press.",
			restingPlace: "Wat That Thong, Bangkok · a portion of ashes at the San Kamphaeng orchard",
			organDonation: true,
			digitalAfterlife: "Close Facebook and Instagram within 30 days. No memorial page. Google Photos to Nicha. LINE family history kept by Witch for one year, then deleted.",
			other: "Do not sell the orchard in the first 10 years. If it must be sold, that money funds the grandchildren’s education."
		},
		access: {
			executorName: "Ariya Pongpaisan",
			executorRole: "Counsel · Pongpaisan Law",
			executorContact: "02-678-4410 · ariya@pongsailaw.co.th",
			emergencyName: "Witch Worawat",
			emergencyContact: "081-234-1100",
			checkInDays: 30,
			lastCheckIn: daysAgo(6),
			releaseNote: "When the vault is released, start with the will and the heir list. Open the private letters before moving assets."
		},
		activity: [
			{
				id: uid(),
				at: daysAgo(1),
				text: "Updated Kasikorn savings balance"
			},
			{
				id: uid(),
				at: daysAgo(4),
				text: "Reviewed Ekkamai title deed"
			},
			{
				id: uid(),
				at: daysAgo(6),
				text: "Checked in on the release plan"
			},
			{
				id: uid(),
				at: daysAgo(11),
				text: "Wrote letters to the family"
			}
		],
		createdAt: daysAgo(120)
	};
	const vault = lang === "th" ? th : en;
	completenessScore(vault);
	return vault;
}
var VAULT_KEY = "vaulty.v1";
var LANG_KEY = "vaulty.lang";
var DEMO_KEY = "vaulty.demo";
var AUTOLOCK_KEY = "vaulty.autolock";
var sessionKey = null;
var sessionSalt = null;
var persistTimer = null;
var persistGen = 0;
var unlockSeq = 0;
function readLang() {
	return lsGet(LANG_KEY) === "en" ? "en" : "th";
}
function readBlob() {
	const raw = lsGet(VAULT_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (isEncryptedBlob(parsed)) return parsed;
	} catch {
		return null;
	}
	return null;
}
function writeBlob(blob) {
	const raw = JSON.stringify(blob);
	if (tooLarge(raw) || !lsSet(VAULT_KEY, raw)) throw new Error("quota");
}
async function persist(vault, gen) {
	if (!shouldCommitPersist(gen, persistGen, Boolean(sessionKey && sessionSalt))) return false;
	try {
		const blob = await resealVault(vault, sessionKey, sessionSalt);
		if (!shouldCommitPersist(gen, persistGen, Boolean(sessionKey))) return false;
		writeBlob(blob);
		if (useVaultStore.getState().error === "persist") useVaultStore.setState({ error: null });
		return true;
	} catch {
		if (!shouldCommitPersist(gen, persistGen, true)) return false;
		useVaultStore.setState({ error: "persist" });
		return false;
	}
}
function schedulePersist(vault) {
	persistGen += 1;
	const gen = persistGen;
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => {
		persistTimer = null;
		persist(vault, gen);
	}, 120);
}
async function flushPersist() {
	if (persistTimer) {
		clearTimeout(persistTimer);
		persistTimer = null;
	}
	const vault = useVaultStore.getState().vault;
	if (vault && sessionKey && sessionSalt) await persist(vault, persistGen);
}
function dropSession() {
	persistGen += 1;
	unlockSeq += 1;
	if (persistTimer) {
		clearTimeout(persistTimer);
		persistTimer = null;
	}
	sessionKey = null;
	sessionSalt = null;
}
function withActivity(vault, text) {
	if (!text) return vault;
	return {
		...vault,
		activity: [{
			id: uid(),
			at: (/* @__PURE__ */ new Date()).toISOString(),
			text
		}, ...vault.activity].slice(0, 40)
	};
}
var useVaultStore = create((set, get) => ({
	status: "empty",
	lang: "th",
	vault: null,
	isDemo: false,
	autoLockMinutes: 5,
	busy: false,
	error: null,
	lockoutUntil: 0,
	failedAttempts: 0,
	announce: "",
	backupDue: false,
	hydrate: () => {
		const lang = readLang();
		const auto = recoverAutoLock(lsGet(AUTOLOCK_KEY));
		const lo = readLockout();
		const health = classifySealed(lsGet(VAULT_KEY));
		set({
			lang,
			status: health === "empty" ? "empty" : "locked",
			isDemo: lsGet(DEMO_KEY) === "1",
			autoLockMinutes: auto,
			vault: null,
			lockoutUntil: lo.until,
			failedAttempts: lo.fails,
			error: health === "corrupt" ? "corrupt" : null,
			backupDue: backupDue()
		});
	},
	setLang: (lang) => {
		lsSet(LANG_KEY, lang);
		if (typeof document !== "undefined") document.documentElement.lang = lang;
		set({ lang });
	},
	unlock: async (pin) => {
		if (get().busy) return false;
		if (!/^\d{6}$/.test(pin)) {
			set({ error: "pin" });
			return false;
		}
		const blob = readBlob();
		if (!blob) {
			set({ error: "empty" });
			return false;
		}
		const lo = readLockout();
		if (remainingMs(lo) > 0) {
			set({
				error: "lockout",
				lockoutUntil: lo.until,
				failedAttempts: lo.fails,
				busy: false
			});
			return false;
		}
		const seq = ++unlockSeq;
		set({
			busy: true,
			error: null
		});
		try {
			const { data, key } = await openVault(blob, pin);
			if (seq !== unlockSeq) return false;
			const vault = coerceVault(data);
			if (!vault) {
				set({
					busy: false,
					error: "corrupt"
				});
				return false;
			}
			sessionKey = key;
			sessionSalt = blob.salt;
			resetLockout();
			pushSec("unlock");
			const lang = get().lang;
			set({
				status: "unlocked",
				vault,
				busy: false,
				error: null,
				lockoutUntil: 0,
				failedAttempts: 0,
				announce: t(lang, "a11yUnlocked")
			});
			get().patch((v) => v, lang === "th" ? "เปิดคลัง" : "Vault unlocked");
			return true;
		} catch {
			if (seq !== unlockSeq) return false;
			const next = recordFail();
			set({
				busy: false,
				error: remainingMs(next) > 0 ? "lockout" : "pin",
				lockoutUntil: next.until,
				failedAttempts: next.fails
			});
			return false;
		}
	},
	lock: (kind = "lock") => {
		const vault = get().vault;
		const key = sessionKey;
		const salt = sessionSalt;
		dropSession();
		if (vault && key && salt) resealVault(vault, key, salt).then(writeBlob).catch(() => void 0);
		pushSec(kind);
		set({
			status: "locked",
			vault: null,
			error: null,
			busy: false,
			announce: t(get().lang, "a11yLocked")
		});
	},
	create: async (name, pin) => {
		if (get().busy) return;
		if (!name.trim() || !/^\d{6}$/.test(pin)) return;
		set({
			busy: true,
			error: null
		});
		try {
			const vault = emptyVault(name.trim(), get().lang);
			const blob = await sealVault(vault, pin);
			writeBlob(blob);
			lsSet(DEMO_KEY, "0");
			const { key } = await openVault(blob, pin);
			sessionKey = key;
			sessionSalt = blob.salt;
			resetLockout();
			pushSec("unlock");
			set({
				status: "unlocked",
				vault,
				isDemo: false,
				busy: false,
				backupDue: true,
				announce: t(get().lang, "a11yUnlocked")
			});
		} catch {
			set({
				busy: false,
				error: "persist"
			});
		}
	},
	openDemo: async () => {
		if (get().busy) return;
		set({
			busy: true,
			error: null
		});
		try {
			const lang = get().lang;
			const vault = createDemoVault(lang);
			const blob = await sealVault(vault, DEMO_PIN);
			writeBlob(blob);
			lsSet(DEMO_KEY, "1");
			const { key } = await openVault(blob, DEMO_PIN);
			sessionKey = key;
			sessionSalt = blob.salt;
			resetLockout();
			pushSec("unlock");
			set({
				status: "unlocked",
				vault,
				isDemo: true,
				busy: false,
				backupDue: true,
				announce: t(lang, "a11yUnlocked")
			});
		} catch {
			set({
				busy: false,
				error: "persist"
			});
		}
	},
	wipe: () => {
		dropSession();
		lsRemove(VAULT_KEY);
		lsRemove(DEMO_KEY);
		clearSecurity();
		clearBackupMeta();
		set({
			status: "empty",
			vault: null,
			isDemo: false,
			error: null,
			lockoutUntil: 0,
			failedAttempts: 0,
			busy: false,
			backupDue: false
		});
	},
	patch: (fn, activity) => {
		const current = get().vault;
		if (!current || get().status !== "unlocked") return;
		const next = withActivity(fn(current), activity);
		set({ vault: next });
		schedulePersist(next);
	},
	checkIn: () => {
		const { lang } = get();
		pushSec("checkin");
		get().patch((v) => ({
			...v,
			access: {
				...v.access,
				lastCheckIn: (/* @__PURE__ */ new Date()).toISOString()
			}
		}), lang === "th" ? "เช็คอินตามแผนส่งมอบ" : "Checked in on the release plan");
	},
	changePin: async (nextPin) => {
		const vault = get().vault;
		if (!vault || get().busy || !/^\d{6}$/.test(nextPin)) return;
		await flushPersist();
		persistGen += 1;
		const blob = await sealVault(vault, nextPin);
		writeBlob(blob);
		const { key } = await openVault(blob, nextPin);
		sessionKey = key;
		sessionSalt = blob.salt;
		pushSec("pin");
		markBackupNeeded();
		set({ backupDue: true });
		get().patch((v) => v, get().lang === "th" ? "เปลี่ยนรหัสผ่าน" : "Passcode changed");
	},
	setAutoLockMinutes: (n) => {
		const v = Math.min(30, Math.max(1, Math.round(n)));
		lsSet(AUTOLOCK_KEY, String(v));
		set({ autoLockMinutes: v });
	},
	flush: () => flushPersist(),
	exportBlob: async () => {
		await flushPersist();
		pushSec("export");
		const payload = lsGet(VAULT_KEY) ?? await (async () => {
			const vault = get().vault;
			if (vault && sessionKey && sessionSalt) try {
				return JSON.stringify(await resealVault(vault, sessionKey, sessionSalt));
			} catch {
				return null;
			}
			return null;
		})();
		if (payload) {
			markExported();
			set({ backupDue: false });
		}
		return payload;
	},
	importBlob: (raw) => {
		if (typeof raw !== "string" || tooLarge(raw) || !canRestore(raw)) return false;
		try {
			const parsed = JSON.parse(raw);
			if (!isEncryptedBlob(parsed)) return false;
			dropSession();
			writeBlob(parsed);
			lsSet(DEMO_KEY, "0");
			resetLockout();
			pushSec("import");
			set({
				status: "locked",
				vault: null,
				isDemo: false,
				error: null,
				lockoutUntil: 0,
				failedAttempts: 0,
				busy: false
			});
			return true;
		} catch {
			return false;
		}
	},
	yieldToPeer: () => {
		if (get().status !== "unlocked") return;
		dropSession();
		set({
			status: "locked",
			vault: null,
			error: null,
			busy: false,
			announce: t(get().lang, "a11yLocked")
		});
	}
}));
function useT() {
	const lang = useVaultStore((s) => s.lang);
	return (key) => t(lang, key);
}
function VaultHydrator() {
	const hydrate = useVaultStore((s) => s.hydrate);
	const lang = useVaultStore((s) => s.lang);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = lang;
	}, [lang]);
	(0, import_react.useEffect)(() => {
		const flush = () => {
			useVaultStore.getState().flush();
		};
		window.addEventListener("pagehide", flush);
		window.addEventListener("beforeunload", flush);
		return () => {
			window.removeEventListener("pagehide", flush);
			window.removeEventListener("beforeunload", flush);
		};
	}, []);
	return null;
}
function LiveRegion() {
	const announce = useVaultStore((s) => s.announce);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sr-only",
		role: "status",
		"aria-live": "polite",
		"aria-atomic": "true",
		children: announce
	});
}
var styles_default = "/assets/styles-R0SzO7pC.css";
var APP_NAME = "Vaulty";
var Route$8 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "คลังมรดกและทรัพย์สินดิจิทัลส่วนบุคคล — Digital Legacy Vault"
			},
			{
				name: "theme-color",
				content: "#080c10"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+Thai:wght@400;500;600&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "th",
		className: "dark antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-background text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultHydrator, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveRegion, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "bottom-center",
					toastOptions: { className: "font-sans border-border bg-card text-foreground shadow-none hairline" }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$7 = () => import("./routes-BIKtxB0L.mjs");
var Route$7 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./vault-CkNEnWA1.mjs");
var Route$6 = createFileRoute("/vault")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./vault-DV9QxL7C.mjs");
var Route$5 = createFileRoute("/vault/")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./access-D_OsDguo.mjs");
var Route$4 = createFileRoute("/vault/access")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./assets-EXy04g_J.mjs");
var Route$3 = createFileRoute("/vault/assets")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./docs-BSlA_eny.mjs");
var Route$2 = createFileRoute("/vault/docs")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./heirs-CZG9b5Y0.mjs");
var Route$1 = createFileRoute("/vault/heirs")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./wishes-BuDxZXkZ.mjs");
var Route = createFileRoute("/vault/wishes")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$8
});
var VaultRoute = Route$6.update({
	id: "/vault",
	path: "/vault",
	getParentRoute: () => Route$8
});
var VaultIndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => VaultRoute
});
var VaultRouteChildren = {
	VaultAccessRoute: Route$4.update({
		id: "/access",
		path: "/access",
		getParentRoute: () => VaultRoute
	}),
	VaultAssetsRoute: Route$3.update({
		id: "/assets",
		path: "/assets",
		getParentRoute: () => VaultRoute
	}),
	VaultDocsRoute: Route$2.update({
		id: "/docs",
		path: "/docs",
		getParentRoute: () => VaultRoute
	}),
	VaultHeirsRoute: Route$1.update({
		id: "/heirs",
		path: "/heirs",
		getParentRoute: () => VaultRoute
	}),
	VaultWishesRoute: Route.update({
		id: "/wishes",
		path: "/wishes",
		getParentRoute: () => VaultRoute
	}),
	VaultIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	VaultRoute: VaultRoute._addFileChildren(VaultRouteChildren)
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { isEncryptedBlob as A, relativeTime as C, DEMO_PIN as D, ASSET_CATEGORIES as E, DOCUMENT_KINDS as O, initials as S, clamp as T, addDaysIso as _, completenessScore as a, formatPercent as b, valueByCategory as c, readSec as d, remainingMs as f, t as g, relationshipLabel as h, assignedValuesByHeir as i, RELATIONSHIPS as k, vaultTasks as l, documentLabel as m, useT as n, heirValue as o, categoryLabel as p, useVaultStore as r, totalValue as s, router_exports as t, backupReason as u, formatCompactThb as v, uid as w, formatThb as x, formatDate as y };
