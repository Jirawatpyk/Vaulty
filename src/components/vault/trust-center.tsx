import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/vault/chrome";
import { formatDate, relativeTime } from "@/lib/vault/format";
import { evaluateHealth, formatBytes } from "@/lib/vault/health";
import { readSec, remainingMs, type SecKind } from "@/lib/vault/lockout";
import type { I18nKey } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import { cn } from "@/lib/utils";

const EVENT_KEY: Record<SecKind, I18nKey> = {
  unlock: "eventUnlock",
  lock: "eventLock",
  fail: "eventFail",
  export: "eventExport",
  import: "eventImport",
  wipe: "eventWipe",
  pin: "eventPin",
  hide: "eventHide",
  checkin: "eventCheckin",
  idle: "eventIdle",
};

export function TrustCenter() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault);
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const importBlob = useVaultStore((s) => s.importBlob);
  const lockoutUntil = useVaultStore((s) => s.lockoutUntil);
  const failedAttempts = useVaultStore((s) => s.failedAttempts);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tick] = useState(() => Date.now());

  const events = useMemo(() => readSec(), [tick, lockoutUntil, failedAttempts]);
  const lastUnlock = events.find((e) => e.kind === "unlock")?.at ?? null;
  const blobRaw = typeof window === "undefined" ? null : window.localStorage.getItem("vaulty.v1");
  const health = evaluateHealth({
    blobRaw,
    lockoutUntil,
    failedAttempts,
    lastUnlock,
  });

  function download(name: string, body: string, type: string) {
    const file = new Blob([body], { type });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAudit() {
    const payload = {
      exportedAt: new Date().toISOString(),
      locale: lang,
      completenessNote: "secrets omitted",
      activity: vault?.activity ?? [],
      security: events,
      controls: health.controls.map((c) => ({
        control: t(c.key),
        status: c.ok ? (c.warn ? "watch" : "pass") : "fail",
      })),
      counts: vault
        ? {
            assets: vault.assets.length,
            heirs: vault.beneficiaries.length,
            documents: vault.documents.length,
            letters: vault.letters.length,
          }
        : {},
    };
    download("vaulty-audit.json", JSON.stringify(payload, null, 2), "application/json");
    toast(t("auditSaved"));
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importBlob(String(reader.result ?? ""));
      toast(ok ? t("importOk") : t("importFail"));
    };
    reader.readAsText(file);
  }

  const cooldown = remainingMs({ fails: failedAttempts, until: lockoutUntil });

  return (
    <Panel>
      <h2 className="font-display text-xl">{t("trustCenter")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("trustLead")}</p>

      <ul className="mt-5 divide-y divide-border">
        {health.controls.map((c) => (
          <li key={c.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span>{t(c.key)}</span>
            <span
              className={cn(
                "text-[11px] tracking-[0.14em] uppercase",
                !c.ok ? "text-destructive" : c.warn ? "text-warn" : "text-success",
              )}
            >
              {!c.ok ? t("fail") : c.warn ? t("warn") : t("pass")}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Spec label={t("encryptionDetail")} />
        <Spec label={t("pbkdfDetail")} />
        <Spec label={`${t("vaultVersion")} ${health.version ?? "—"}`} />
        <Spec label={`${t("blobSize")} ${formatBytes(health.blobBytes)}`} />
        <Spec
          label={`${t("lastUnlock")} ${lastUnlock ? relativeTime(lastUnlock, lang) : t("none")}`}
        />
        <Spec label={`${t("failedUnlocks")} ${failedAttempts}`} />
      </dl>
      {cooldown > 0 ? (
        <p className="mt-3 text-sm text-warn">
          {t("lockedOut")} · {t("tryAgainIn")} {Math.ceil(cooldown / 1000)} {t("seconds")}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{t("pinPolicy")}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{t("hideLockHint")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("sessionAuthPin")}</p>

      <div className="mt-5">
        <h3 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{t("secEvents")}</h3>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noSecurityEvents")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {events.slice(0, 8).map((e) => (
              <li key={e.at + e.kind} className="flex justify-between gap-3 text-sm">
                <span>{t(EVENT_KEY[e.kind])}</span>
                <span className="text-muted-foreground tabular-nums">{formatDate(e.at, lang)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{t("pdpaTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("pdpaBody")}</p>
        <p className="mt-2 text-sm">
          <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
            {t("privacyLink")}
          </Link>
          {" · "}
          <Link to="/legal/terms" className="underline-offset-2 hover:underline">
            {t("termsLink")}
          </Link>
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{t("kbShortcuts")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("shortcutHelp")} — {t("shortcutLock")}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            void exportBlob().then((blob) => {
              if (!blob) return;
              download("vaulty-sealed.json", blob, "application/json");
            });
          }}
        >
          {t("exportVault")}
        </Button>
        <Button variant="outline" onClick={exportAudit}>
          {t("auditExport")}
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          {t("restoreVault")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            onImport(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </Panel>
  );
}

function Spec({ label }: { label: string }) {
  return <p className="text-muted-foreground">{label}</p>;
}
