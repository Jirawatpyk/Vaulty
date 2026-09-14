import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/vault/chrome";
import { downloadText } from "@/lib/vault/download";
import { crossDeviceGuideHtml, formatFingerprint, sealedFingerprint } from "@/lib/vault/cross-device";
import { lastExportAt } from "@/lib/vault/backup";
import { lsGet, lsSet } from "@/lib/vault/storage";
import { useT, useVaultStore } from "@/lib/vault/store";

const FP_KEY = "vaulty.backupFp";

export function BackupPanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const [fp, setFp] = useState(() => lsGet(FP_KEY) ?? "");

  async function saveSealed() {
    const raw = await exportBlob();
    if (!raw) return;
    downloadText("vaulty-sealed.json", raw, "application/json");
    const next = await sealedFingerprint(raw);
    lsSet(FP_KEY, next);
    setFp(next);
    toast(t("backupSaved"));
  }

  async function saveGuide() {
    let hex = fp;
    if (!hex) {
      const raw = await exportBlob();
      if (!raw) return;
      hex = await sealedFingerprint(raw);
      lsSet(FP_KEY, hex);
      setFp(hex);
    }
    downloadText("vaulty-restore-guide.html", crossDeviceGuideHtml(lang, hex, vault.profile.fullName), "text/html;charset=utf-8");
    toast(t("crossGuideSaved"));
  }

  async function copyFp() {
    if (!fp) return;
    await navigator.clipboard.writeText(formatFingerprint(fp));
    toast(t("crossCopied"));
  }

  const last = lastExportAt();

  return (
    <Panel className="mb-6" id="file-backup">
      <h2 className="font-display text-xl">{t("crossTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("crossLead")}</p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>{t("crossStep1")}</li>
        <li>{t("crossStep2")}</li>
        <li>{t("crossStep3")}</li>
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">{t("crossLegal")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button className="h-auto min-h-11 whitespace-normal py-2" onClick={() => void saveSealed()}>
          {t("crossSave")}
        </Button>
        <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={() => void saveGuide()}>
          {t("crossGuide")}
        </Button>
      </div>
      {fp ? (
        <p className="mt-4 text-sm">
          <span className="text-muted-foreground">{t("crossFp")} · </span>
          <button type="button" className="font-mono tracking-wide underline-offset-2 hover:underline" onClick={() => void copyFp()}>
            {formatFingerprint(fp)}
          </button>
        </p>
      ) : last ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("backupDue")}</p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("backupDueNever")}</p>
      )}
    </Panel>
  );
}
