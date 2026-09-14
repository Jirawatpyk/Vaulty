import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/vault/confirm-dialog";
import { Panel } from "@/components/vault/chrome";
import { SignInGate } from "@/lib/auth/gates";
import { LEGAL_VERSION } from "@/lib/vault/legal";
import { useConsent } from "@/lib/vault/use-consent";
import { useT } from "@/lib/vault/store";

export function RightsPanel() {
  const t = useT();
  const { record, live, withdraw } = useConsent();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await withdraw();
      toast(t("consentWithdrawn"));
    } catch {
      toast(t("cloudFail"));
    } finally {
      setBusy(false);
      setAsk(false);
    }
  }

  return (
    <Panel className="mb-6" id="legal-rights">
      <h2 className="font-display text-xl">{t("rightsTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("rightsLead")}</p>
      <p className="mt-3 text-sm">
        <Link to="/legal/terms" className="underline-offset-2 hover:underline">
          {t("termsLink")}
        </Link>
        {" · "}
        <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
          {t("privacyLink")}
        </Link>
      </p>
      <SignInGate
        fallback={
          <p className="mt-4 text-sm text-muted-foreground">{t("rightsLocalOnly")}</p>
        }
      >
        <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
          <li>
            {t("rightsVersion")} {record.version || "—"} {record.version === LEGAL_VERSION ? "" : `· ${t("rightsStale")}`}
          </li>
          <li>
            {t("consentCloud")} — {live("cloud") ? t("consentYes") : t("consentNo")}
          </li>
          <li>
            {t("consentNotify")} — {live("notify") ? t("consentYes") : t("consentNo")}
          </li>
          {record.withdrawnAt ? (
            <li>
              {t("consentWithdrawn")} · {record.withdrawnAt.slice(0, 10)}
            </li>
          ) : null}
        </ul>
        <Button
          variant="outline"
          className="mt-4"
          disabled={busy || Boolean(record.withdrawnAt && !live("account"))}
          onClick={() => setAsk(true)}
        >
          {t("consentWithdraw")}
        </Button>
      </SignInGate>
      <ConfirmDialog
        open={ask}
        title={t("consentWithdrawTitle")}
        body={t("consentWithdrawBody")}
        confirmLabel={t("consentWithdraw")}
        onCancel={() => setAsk(false)}
        onConfirm={() => void confirm()}
      />
    </Panel>
  );
}
