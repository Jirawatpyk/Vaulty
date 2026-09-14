import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/vault/confirm-dialog";
import { Panel } from "@/components/vault/chrome";
import { SignInGate } from "@/lib/auth/gates";
import { deleteCloudBackup, getCloudBackupMeta, pullCloudBackup, putCloudBackup } from "@/lib/vault/cloud-backup-fn";
import type { CloudBackupMeta } from "@/lib/vault/cloud-backup";
import { emptyCloudMeta } from "@/lib/vault/cloud-backup";
import { formatFingerprint } from "@/lib/vault/cross-device";
import { relativeTime } from "@/lib/vault/format";
import { useT, useVaultStore } from "@/lib/vault/store";
import { PurposeConsentBox } from "@/components/vault/consent-box";
import { useConsent } from "@/lib/vault/use-consent";

export function CloudBackupPanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const importBlob = useVaultStore((s) => s.importBlob);
  const [meta, setMeta] = useState<CloudBackupMeta>(emptyCloudMeta);
  const [busy, setBusy] = useState<"save" | "pull" | "delete" | null>(null);
  const [askDelete, setAskDelete] = useState(false);
  const [askOverwrite, setAskOverwrite] = useState(false);
  const [cloudOk, setCloudOk] = useState(false);
  const { live, grant } = useConsent();

  useEffect(() => {
    setCloudOk(live("cloud"));
  }, [live]);

  async function refresh() {
    try {
      setMeta(await getCloudBackupMeta());
    } catch {
      setMeta(emptyCloudMeta());
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function save() {
    if (!live("cloud") && !cloudOk) {
      toast(t("consentNeed"));
      return;
    }
    if (!live("cloud")) {
      await grant({ terms: true, privacy: true, account: true, cloud: true });
    }
    setBusy("save");
    try {
      const raw = await exportBlob();
      if (!raw) {
        toast(t("cloudFail"));
        return;
      }
      const next = await putCloudBackup({ data: { blob: raw, ownerLabel: vault.profile.fullName } });
      setMeta(next);
      toast(t("cloudSaved"));
    } catch (err) {
      toast(String(err).includes("consent") ? t("consentNeed") : t("cloudFail"));
    } finally {
      setBusy(null);
    }
  }

  async function restore(force = false) {
    if (!force) {
      setAskOverwrite(true);
      return;
    }
    setBusy("pull");
    try {
      const pulled = await pullCloudBackup();
      if (!pulled.blob) {
        toast(t("cloudNone"));
        return;
      }
      const ok = importBlob(pulled.blob);
      toast(ok ? t("cloudRestored") : t("cloudFail"));
    } catch {
      toast(t("cloudFail"));
    } finally {
      setBusy(null);
      setAskOverwrite(false);
    }
  }

  async function drop() {
    setBusy("delete");
    try {
      setMeta(await deleteCloudBackup());
      toast(t("cloudDeleted"));
    } catch {
      toast(t("cloudFail"));
    } finally {
      setBusy(null);
      setAskDelete(false);
    }
  }

  return (
    <Panel className="mb-6" id="cloud-backup">
      <h2 className="font-display text-xl">{t("cloudTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("cloudLead")}</p>
      <p className="mt-3 text-sm text-muted-foreground">{t("cloudLegal")}</p>
      <SignInGate
        fallback={
          <div className="mt-4">
            <p className="text-sm">{t("cloudNeedSignIn")}</p>
            <Button asChild className="mt-3">
              <Link to="/login">{t("cloudSignIn")}</Link>
            </Button>
          </div>
        }
      >
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!live("cloud") ? (
            <div className="sm:col-span-2">
              <PurposeConsentBox id="consent-cloud" label={t("consentCloudAsk")} checked={cloudOk} onChange={setCloudOk} />
            </div>
          ) : null}
          <Button
            className="h-auto min-h-11 whitespace-normal py-2"
            disabled={Boolean(busy) || (!live("cloud") && !cloudOk)}
            onClick={() => void save()}
          >
            {busy === "save" ? t("cloudBusy") : t("cloudSave")}
          </Button>
          <Button
            variant="outline"
            className="h-auto min-h-11 whitespace-normal py-2"
            disabled={Boolean(busy) || !meta.exists}
            onClick={() => void restore(false)}
          >
            {busy === "pull" ? t("cloudPulling") : t("cloudRestore")}
          </Button>
        </div>
        {meta.exists ? (
          <p className="mt-4 text-sm">
            {t("cloudLast")}
            {meta.updatedAt ? ` · ${relativeTime(meta.updatedAt, lang)}` : ""}
            {meta.fingerprint ? (
              <>
                {" · "}
                <span className="font-mono tracking-wide">{formatFingerprint(meta.fingerprint)}</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("cloudNone")}</p>
        )}
        {meta.exists ? (
          <Button variant="ghost" size="sm" className="mt-2" disabled={Boolean(busy)} onClick={() => setAskDelete(true)}>
            {t("cloudDelete")}
          </Button>
        ) : null}
      </SignInGate>
      <ConfirmDialog
        open={askOverwrite}
        title={t("cloudOverwriteTitle")}
        body={t("cloudOverwriteBody")}
        confirmLabel={t("cloudReplace")}
        onCancel={() => setAskOverwrite(false)}
        onConfirm={() => void restore(true)}
      />
      <ConfirmDialog
        open={askDelete}
        title={t("cloudDelete")}
        body={t("cloudLegal")}
        confirmLabel={t("cloudDelete")}
        onCancel={() => setAskDelete(false)}
        onConfirm={() => void drop()}
      />
    </Panel>
  );
}

export function CloudRestoreButton({ onRestored }: { onRestored?: () => void }) {
  const t = useT();
  const status = useVaultStore((s) => s.status);
  const importBlob = useVaultStore((s) => s.importBlob);
  const [meta, setMeta] = useState<CloudBackupMeta>(emptyCloudMeta);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    void getCloudBackupMeta()
      .then(setMeta)
      .catch(() => setMeta(emptyCloudMeta()));
  }, []);

  async function restore() {
    if (status === "locked") {
      setAsk(true);
      return;
    }
    await apply();
  }

  async function apply() {
    setBusy(true);
    try {
      const pulled = await pullCloudBackup();
      if (!pulled.blob) {
        toast(t("cloudNone"));
        return;
      }
      const ok = importBlob(pulled.blob);
      toast(ok ? t("cloudRestored") : t("cloudFail"));
      if (ok) onRestored?.();
    } catch {
      toast(t("cloudFail"));
    } finally {
      setBusy(false);
      setAsk(false);
    }
  }

  if (!meta.exists) return null;

  return (
    <>
      <Button size="lg" variant="outline" disabled={busy} onClick={() => void restore()}>
        {busy ? t("cloudPulling") : t("cloudRestore")}
      </Button>
      <ConfirmDialog
        open={ask}
        title={t("cloudOverwriteTitle")}
        body={t("cloudOverwriteBody")}
        confirmLabel={t("cloudReplace")}
        onCancel={() => setAsk(false)}
        onConfirm={() => void apply()}
      />
    </>
  );
}
