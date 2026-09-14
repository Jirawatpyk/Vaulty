import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/vault/chrome";
import { lsGet, lsSet } from "@/lib/vault/storage";
import { NUDGE_AT_KEY, isCheckInOverdue, overdueLineUrl, overdueMailto, overdueMessage, shouldBrowserNudge } from "@/lib/vault/nudge";
import { useT, useVaultStore } from "@/lib/vault/store";

export function NudgePanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const overdue = isCheckInOverdue(vault);
  const [notifyOn, setNotifyOn] = useState(
    () => typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  useEffect(() => {
    if (!overdue || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const last = Number(lsGet(NUDGE_AT_KEY) || 0) || null;
    if (!shouldBrowserNudge(true, last)) return;
    try {
      new Notification("Vaulty", { body: overdueMessage(vault, lang) });
      lsSet(NUDGE_AT_KEY, String(Date.now()));
    } catch {
      /* private mode / unsupported */
    }
  }, [overdue, vault, lang]);

  if (!overdue) return null;

  function openMail() {
    window.location.href = overdueMailto(vault, lang);
    toast(t("nudgeSent"));
  }

  async function openLine() {
    const url = overdueLineUrl(vault, lang);
    const text = overdueMessage(vault, lang);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Vaulty", text });
        toast(t("nudgeSent"));
        return;
      } catch {
        /* user cancelled or share failed — fall through */
      }
    }
    window.open(url, "_blank", "noopener");
    toast(t("nudgeSent"));
  }

  async function enableNotify() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifyOn(perm === "granted");
    if (perm === "granted") {
      new Notification("Vaulty", { body: overdueMessage(vault, lang) });
      lsSet(NUDGE_AT_KEY, String(Date.now()));
    }
  }

  return (
    <Panel id="nudge">
      <h2 className="font-display text-xl">{t("nudgeTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("nudgeLead")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button className="h-auto min-h-11 whitespace-normal py-2" onClick={openMail}>
          {t("nudgeMail")}
        </Button>
        <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={() => void openLine()}>
          {t("nudgeLine")}
        </Button>
      </div>
      {notifyOn ? (
        <p className="mt-3 text-xs text-muted-foreground">{t("nudgeNotifyOn")}</p>
      ) : (
        <Button variant="ghost" className="mt-3" onClick={() => void enableNotify()}>
          {t("nudgeNotify")}
        </Button>
      )}
    </Panel>
  );
}
