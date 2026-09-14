import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/vault/download";
import { keyCardHtml } from "@/lib/vault/handoff";
import { useT, useVaultStore } from "@/lib/vault/store";
import { VaultMark } from "./vault-mark";

export function RecoveryGate() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const markCardSaved = useVaultStore((s) => s.markCardSaved);
  const recoveryReady = useVaultStore((s) => s.recoveryReady);
  const [exported, setExported] = useState(false);
  const [carded, setCarded] = useState(false);

  if (recoveryReady) return null;

  async function saveVault() {
    const raw = await exportBlob();
    if (!raw) return;
    downloadText("vaulty-sealed.json", raw, "application/json");
    setExported(true);
    toast(t("backupSaved"));
  }

  function saveCard() {
    downloadText("vaulty-key-card.html", keyCardHtml(vault, lang), "text/html;charset=utf-8");
    setCarded(true);
    toast(t("keyCardSaved"));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/80 p-4 md:items-center">
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 hairline"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
      >
        <VaultMark className="size-10" title={t("appName")} />
        <h2 id="recovery-title" className="font-display mt-4 text-2xl">
          {t("recoveryTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("recoveryLead")}</p>
        <ol className="mt-5 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span>{exported ? t("recoveryExported") : t("recoveryExport")}</span>
            <Button size="sm" variant={exported ? "outline" : "default"} onClick={() => void saveVault()}>
              {t("backupNow")}
            </Button>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>{carded ? t("recoveryCarded") : t("recoveryCard")}</span>
            <Button size="sm" variant={carded ? "outline" : "default"} onClick={saveCard}>
              {t("downloadKeyCard")}
            </Button>
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">{t("recoveryWarn")}</p>
        <Button className="mt-5 w-full" disabled={!exported || !carded} onClick={markCardSaved}>
          {t("recoveryConfirm")}
        </Button>
      </div>
    </div>
  );
}
