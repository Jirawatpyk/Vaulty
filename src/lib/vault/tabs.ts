const CHANNEL = "vaulty.tab";

export type TabMsg = { type: "claim"; tabId: string };

let pageTabId: string | null = null;
let postClaim: (() => void) | null = null;

export function createTabId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tab_${Math.random().toString(36).slice(2, 10)}`;
}

function pageId(): string {
  if (!pageTabId) pageTabId = createTabId();
  return pageTabId;
}

export function claimThisTab(): void {
  postClaim?.();
}

export function startTabGuard(onForeignClaim: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const tabId = pageId();
  let channel: BroadcastChannel | null = null;
  let armed = false;
  const arm = window.setTimeout(() => {
    armed = true;
  }, 400);

  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (ev: MessageEvent<TabMsg>) => {
      const data = ev.data;
      if (!data || data.type !== "claim") return;
      if (data.tabId === tabId) return;
      if (!armed) return;
      onForeignClaim();
    };
    channel.postMessage({ type: "claim", tabId } satisfies TabMsg);
    postClaim = () => {
      try {
        channel?.postMessage({ type: "claim", tabId } satisfies TabMsg);
      } catch {
        /* closed */
      }
    };
    return () => {
      window.clearTimeout(arm);
      postClaim = null;
      channel?.close();
    };
  } catch {
    window.clearTimeout(arm);
    const onStorage = (e: StorageEvent) => {
      if (!armed) return;
      if (e.key === "vaulty.v1" && e.newValue && e.newValue !== e.oldValue) onForeignClaim();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("storage", onStorage);
    };
  }
}
