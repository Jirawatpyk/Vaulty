export type AccessTab = "handoff" | "backup" | "security";

const KEY = "vaulty.accessTab";

function asTab(raw: string | null | undefined): AccessTab | null {
  return raw === "handoff" || raw === "backup" || raw === "security" ? raw : null;
}

export function readAccessTab(): AccessTab {
  if (typeof window === "undefined") return "handoff";
  const fromQuery = asTab(new URLSearchParams(window.location.search).get("tab"));
  if (fromQuery) return fromQuery;
  try {
    return asTab(sessionStorage.getItem(KEY)) ?? "handoff";
  } catch {
    return "handoff";
  }
}

export function writeAccessTab(tab: AccessTab) {
  try {
    sessionStorage.setItem(KEY, tab);
  } catch {
    /* private mode */
  }
  if (typeof window === "undefined") return;
  if (!window.location.pathname.includes("/vault/access")) return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
