import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Panel } from "@/components/vault/chrome";
import { SignInGate } from "@/lib/auth/gates";
import { armDeadman, disarmDeadman, getDeadman, testDeadman } from "@/lib/vault/deadman-fn";
import type { DeadmanPublic } from "@/lib/vault/deadman";
import { extractEmail } from "@/lib/vault/nudge";
import { EMAIL_RE } from "@/lib/vault/validate";
import { useT, useVaultStore } from "@/lib/vault/store";
import { PurposeConsentBox } from "@/components/vault/consent-box";
import { useConsent } from "@/lib/vault/use-consent";

type OutboxRow = { channel: string; dest: string; ok: boolean; at: string; detail: string | null };

export function DeadmanPanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const [email, setEmail] = useState(() => extractEmail(vault.access.executorContact) ?? "");
  const [lineToken, setLineToken] = useState("");
  const [lineTo, setLineTo] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [state, setState] = useState<DeadmanPublic | null>(null);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [notifyOk, setNotifyOk] = useState(false);
  const { live, grant } = useConsent();

  useEffect(() => {
    setNotifyOk(live("notify"));
  }, [live]);

  async function refresh() {
    try {
      const data = await getDeadman();
      setState(data.switchState);
      setOutbox(data.outbox);
    } catch {
      setState(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function arm() {
    const dest = email.trim();
    if (!EMAIL_RE.test(dest)) {
      toast(t("errEmail"));
      return;
    }
    if (!live("notify") && !notifyOk) {
      toast(t("consentNeed"));
      return;
    }
    setBusy(true);
    try {
      if (!live("notify")) {
        await grant({ terms: true, privacy: true, account: true, notify: true });
      }
      const next = await armDeadman({
        data: {
          email: dest,
          lineToken,
          lineTo,
          webhookUrl,
          ownerLabel: vault.profile.fullName,
          lang,
          intervalDays: vault.access.checkInDays,
        },
      });
      setState(next);
      toast(t("deadmanArmed"));
      await refresh();
    } catch (err) {
      toast(String(err).includes("consent") ? t("consentNeed") : String(err).slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  async function disarm() {
    setBusy(true);
    try {
      const next = await disarmDeadman();
      setState(next);
      toast(t("deadmanDisarmed"));
    } catch (err) {
      toast(String(err).slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const result = await testDeadman();
      const ok = result.deliveries.some((d) => d.ok);
      toast(ok ? t("deadmanTestOk") : t("deadmanTestFail"));
      await refresh();
    } catch (err) {
      toast(String(err).slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel id="deadman">
      <h2 className="font-display text-xl">{t("deadmanTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("deadmanLead")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("deadmanLegal")}</p>
      <SignInGate
        fallback={
          <div className="mt-4">
            <p className="text-sm">{t("deadmanNeedSignIn")}</p>
            <Button asChild className="mt-3">
              <Link to="/login">{t("deadmanSignIn")}</Link>
            </Button>
          </div>
        }
      >
        <div className="mt-4 grid gap-4">
          {state?.armed ? (
            <p className="text-sm text-success">
              {t("deadmanOn")} · {t("deadmanDue")} {new Date(state.dueAt).toLocaleString(lang === "th" ? "th-TH" : "en-GB")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("deadmanOff")}</p>
          )}
          <Field label={t("deadmanEmail")} required>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              maxLength={120}
              placeholder="executor@email.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={t("deadmanLineToken")}>
            <Input
              type="password"
              autoComplete="off"
              value={lineToken}
              maxLength={256}
              placeholder={t("deadmanLineTokenPh")}
              onChange={(e) => setLineToken(e.target.value)}
            />
          </Field>
          <Field label={t("deadmanLineTo")}>
            <Input value={lineTo} maxLength={64} placeholder={t("deadmanLineToPh")} onChange={(e) => setLineTo(e.target.value)} />
          </Field>
          <Field label={t("deadmanWebhook")}>
            <Input value={webhookUrl} maxLength={300} placeholder="https://" onChange={(e) => setWebhookUrl(e.target.value)} />
          </Field>
          {!live("notify") ? (
            <PurposeConsentBox id="consent-notify" label={t("consentNotifyAsk")} checked={notifyOk} onChange={setNotifyOk} />
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button className="h-auto min-h-11 whitespace-normal py-2" disabled={busy || (!live("notify") && !notifyOk)} onClick={() => void arm()}>
              {t("deadmanArm")}
            </Button>
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" disabled={busy || !state?.armed} onClick={() => void test()}>
              {t("deadmanTest")}
            </Button>
            <Button variant="ghost" className="sm:col-span-2" disabled={busy || !state?.armed} onClick={() => void disarm()}>
              {t("deadmanDisarm")}
            </Button>
          </div>
          {state?.lastStatus ? (
            <p className="text-xs text-muted-foreground">
              {t("deadmanLastStatus")} · {state.lastStatus}
            </p>
          ) : null}
          {outbox.length > 0 ? (
            <ul className="text-xs text-muted-foreground">
              {outbox.map((row, i) => (
                <li key={`${row.at}-${i}`}>
                  {row.channel} · {row.dest} · {row.ok ? t("deadmanSent") : t("deadmanFailed")}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SignInGate>
    </Panel>
  );
}
