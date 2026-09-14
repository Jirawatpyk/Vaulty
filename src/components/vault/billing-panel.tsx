import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, Panel } from "@/components/vault/chrome";
import { SignInGate, SignedIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  activateBillingPlan,
  cancelBillingPlan,
  getBilling,
  saveBillingProfile,
  startBillingTrial,
} from "@/lib/vault/billing-fn";
import { PAID_PLANS, PLANS, SELLER, formatSatang, isThaiTaxId, type BillingSnapshot, type PlanCode } from "@/lib/vault/billing";
import { downloadText } from "@/lib/vault/download";
import { formatDate } from "@/lib/vault/format";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { I18nKey } from "@/lib/vault/i18n";

const PLAN_COPY: Record<Exclude<PlanCode, "free">, { name: I18nKey; lead: I18nKey }> = {
  care: { name: "billCare", lead: "billCareLead" },
  estate: { name: "billEstate", lead: "billEstateLead" },
  counsel: { name: "billCounsel", lead: "billCounselLead" },
};

const STATUS_KEY: Record<string, I18nKey> = {
  none: "billStatusNone",
  trialing: "billStatusTrial",
  active: "billStatusActive",
  past_due: "billStatusPastDue",
  grace: "billStatusGrace",
  paused: "billStatusPaused",
  revoked: "billStatusPaused",
};

export function BillingPanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const { user } = useCurrentUserState();
  const [snap, setSnap] = useState<BillingSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branch, setBranch] = useState("");
  const [email, setEmail] = useState("");
  const [taxErr, setTaxErr] = useState(false);

  function apply(next: BillingSnapshot) {
    setSnap(next);
    setName(next.profile.legalName);
    setAddress(next.profile.address);
    setTaxId(next.profile.taxId);
    setBranch(next.profile.branch);
    setEmail(next.profile.email);
  }

  async function refresh() {
    try {
      apply(await getBilling());
    } catch {
      setSnap(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  async function run(key: string, fn: () => Promise<BillingSnapshot>, ok: I18nKey) {
    setBusy(key);
    try {
      apply(await fn());
      toast(t(ok));
    } catch (err) {
      toast(String(err).includes("tax_id") ? t("billTaxIdErr") : t("billFail"));
    } finally {
      setBusy(null);
    }
  }

  const current = snap?.subscription.planCode ?? "free";
  const resolved = snap?.resolved ?? "none";
  const sellerName = lang === "th" ? SELLER.nameTh : SELLER.nameEn;

  return (
    <Panel id="billing">
      <h2 className="font-display text-xl">{t("billTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("billLead")}</p>
      <p className="mt-3 text-sm text-warn" role="note">
        {t("billTestBanner")}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("billCompany")}: {sellerName} · {t("billCompanyNote")}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PAID_PLANS.map((code) => {
          const on = current === code && (resolved === "active" || resolved === "past_due");
          return (
            <div key={code} className="flex min-w-0 flex-col gap-3 rounded-lg bg-secondary/40 p-4 hairline">
              <h3 className="font-display text-base">{t(PLAN_COPY[code].name)}</h3>
              <p className="text-sm text-muted-foreground">{t(PLAN_COPY[code].lead)}</p>
              <p className="text-sm">
                {formatSatang(PLANS[code].grossSatang, lang)}
                <span className="mt-1 block text-xs text-muted-foreground">{t("billInclVat")}</span>
              </p>
              <SignedIn>
                <Button
                  variant={on ? "secondary" : "default"}
                  className="mt-auto h-auto min-h-11 w-full whitespace-normal py-2"
                  disabled={Boolean(busy) || on}
                  onClick={() => void run(code, () => activateBillingPlan({ data: { plan: code, lang } }), "billActivated")}
                >
                  {on ? `${t("billStatusActive")} · ${t(PLAN_COPY[code].name)}` : `${t("billActivate")} · ${t(PLAN_COPY[code].name)}`}
                </Button>
              </SignedIn>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("billNoCharge")}</p>
      <SignInGate
        fallback={
          <div className="mt-4">
            <p className="text-sm">{t("billNeedSignIn")}</p>
            <Button asChild className="mt-3 min-h-11">
              <Link to="/login">{t("cloudSignIn")}</Link>
            </Button>
          </div>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={resolved === "active" || resolved === "trialing" ? "success" : "outline"}>
            {t(STATUS_KEY[resolved] ?? "billStatusNone")}
          </Badge>
          <span>
            {t("billCurrent")}: {current === "free" ? t("billFree") : t(PLAN_COPY[current as Exclude<PlanCode, "free">].name)}
          </span>
          {resolved === "trialing" && snap?.subscription.trialEndsAt ? (
            <span className="text-muted-foreground">
              {t("billTrialUntil")} {formatDate(snap.subscription.trialEndsAt, lang)}
            </span>
          ) : null}
          {resolved === "active" && snap?.subscription.endsAt ? (
            <span className="text-muted-foreground">
              {t("billUntil")} {formatDate(snap.subscription.endsAt, lang)}
            </span>
          ) : null}
        </div>

        {snap?.trialEligible ? (
          <div className="mt-4">
            <Button disabled={Boolean(busy)} onClick={() => void run("trial", () => startBillingTrial({ data: {} }), "billTrialStarted")}>
              {t("billStartTrial")}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">{t("billTrialHint")}</p>
          </div>
        ) : null}

        {resolved === "active" || resolved === "trialing" ? (
          <Button
            variant="ghost"
            className="mt-2 min-h-11"
            disabled={Boolean(busy)}
            onClick={() => void run("cancel", () => cancelBillingPlan({ data: {} }), "billCancelled")}
          >
            {t("billCancel")}
          </Button>
        ) : null}

        <h3 className="mt-8 font-display text-base">{t("billProfile")}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={t("billLegalName")}>
            <Input
              value={name}
              maxLength={120}
              autoComplete="organization"
              onChange={(e) => setName(e.target.value)}
              placeholder={t("billLegalNamePh")}
            />
          </Field>
          <Field label={t("billTaxId")} error={taxErr ? t("billTaxIdErr") : undefined}>
            <Input
              value={taxId}
              inputMode="numeric"
              maxLength={13}
              autoComplete="off"
              aria-invalid={taxErr}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                setTaxId(v);
                setTaxErr(Boolean(v) && !isThaiTaxId(v));
              }}
              placeholder="0105551234567"
            />
          </Field>
          <Field className="sm:col-span-2" label={t("billAddress")}>
            <Textarea
              value={address}
              maxLength={240}
              autoComplete="street-address"
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("billAddressPh")}
            />
          </Field>
          <Field label={t("billBranch")}>
            <Input value={branch} maxLength={80} onChange={(e) => setBranch(e.target.value)} placeholder={t("billBranchPh")} />
          </Field>
          <Field label={t("email")}>
            <Input
              type="email"
              value={email}
              maxLength={120}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("phEmail")}
            />
          </Field>
        </div>
        <Button
          variant="outline"
          className="mt-4"
          disabled={Boolean(busy) || taxErr}
          onClick={() =>
            void run(
              "profile",
              () => saveBillingProfile({ data: { legalName: name, address, taxId, branch, email } }),
              "billProfileSaved",
            )
          }
        >
          {t("billSaveProfile")}
        </Button>

        <h3 className="mt-8 font-display text-base">{t("billDocs")}</h3>
        {snap?.documents.length ? (
          <ul className="mt-3 grid gap-2">
            {snap.documents.map((doc) => {
              const kind = doc.kind === "tax_invoice" ? t("billTaxInvoice") : t("billReceipt");
              return (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2">
                  <span className="text-sm">
                    {kind} · {doc.docNo}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    aria-label={`${t("billDownloadDoc")} ${kind} ${doc.docNo}`}
                    onClick={() => downloadText(`${doc.docNo}.html`, doc.html, "text/html;charset=utf-8")}
                  >
                    {t("billDownloadDoc")}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("billNone")}</p>
        )}
      </SignInGate>
    </Panel>
  );
}
