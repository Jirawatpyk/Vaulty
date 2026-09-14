import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as cn } from "./button-DOf-6jIN.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground shadow-none transition-[box-shadow,border-color] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25", className),
		...props
	});
}
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,18}$/;
var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function hasErrors(errors) {
	return Object.values(errors).some((key) => Boolean(key));
}
function requiredName(value, max = 80) {
	const s = value.trim();
	if (!s) return "errRequired";
	if (s.length < 2) return "errNameShort";
	if (s.length > max) return "errTooLong";
	return null;
}
function optionalText(value, max) {
	if (value.length > max) return "errTooLong";
	return null;
}
function optionalEmail(value) {
	const s = value.trim();
	if (!s) return null;
	if (s.length > 120 || !EMAIL_RE.test(s)) return "errEmail";
	return null;
}
function optionalPhone(value) {
	const s = value.trim();
	if (!s) return null;
	const digits = s.replace(/\D/g, "");
	if (digits.length < 8 || digits.length > 15 || !PHONE_RE.test(s)) return "errPhone";
	return null;
}
function optionalContact(value) {
	const s = value.trim();
	if (!s) return null;
	if (s.includes("@")) return optionalEmail(s);
	if (/\d/.test(s)) return optionalPhone(s);
	if (s.length < 4) return "errContact";
	if (s.length > 120) return "errTooLong";
	return null;
}
function optionalDob(value, now = /* @__PURE__ */ new Date()) {
	const s = value.trim();
	if (!s) return null;
	if (!ISO_DATE_RE.test(s)) return "errDate";
	const [year, month, day] = s.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "errDate";
	if (year < 1900) return "errDate";
	if (date > new Date(now.getFullYear(), now.getMonth(), now.getDate())) return "errDateFuture";
	return null;
}
function moneyValue(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return "errNumber";
	if (n < 0) return "errNegative";
	if (n > 0xe8d4a51000) return "errTooBig";
	return null;
}
function sharePercent(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return "errNumber";
	if (n < 0 || n > 100) return "errShare";
	return null;
}
function checkInDays(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || !Number.isInteger(n)) return "errNumber";
	if (n < 1 || n > 365) return "errDays";
	return null;
}
function letterBody(value) {
	const s = value.trim();
	if (!s) return "errRequired";
	if (s.length < 10) return "errLetterShort";
	if (value.length > 8e3) return "errTooLong";
	return null;
}
function requiredRecipient(value) {
	return value.trim() ? null : "errRecipient";
}
//#endregion
export { moneyValue as a, optionalEmail as c, requiredName as d, requiredRecipient as f, letterBody as i, optionalPhone as l, checkInDays as n, optionalContact as o, sharePercent as p, hasErrors as r, optionalDob as s, Input as t, optionalText as u };
