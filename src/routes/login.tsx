import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignInGate } from "@/lib/auth/gates";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/vault/chrome";
import { AccountConsentBox, LegalLinks } from "@/components/vault/consent-box";
import { VaultMark } from "@/components/vault/vault-mark";
import { useConsent } from "@/lib/vault/use-consent";
import { writeAccessTab } from "@/lib/vault/access-tab";
import { useT } from "@/lib/vault/store";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const t = useT();
  const navigate = useNavigate();
  const { grant } = useConsent();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [needConsent, setNeedConsent] = useState(false);

  async function submit(mode: "in" | "up") {
    if (!agreed) {
      setNeedConsent(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res =
        mode === "up"
          ? await authClient.signUp.email({
              email: email.trim(),
              password,
              name: email.trim().split("@")[0] ?? "Vaulty",
            })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (res.error) {
        setError(res.error.message || t("cloudFail"));
        return;
      }
      await grant({ terms: true, privacy: true, account: true });
      writeAccessTab("backup");
      await navigate({ to: "/vault/access" });
    } catch (err) {
      setError(String(err).slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-sm">
        <VaultMark className="size-12" title="Vaulty" />
        <h1 className="font-display mt-4 text-2xl">{t("cloudSignIn")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("cloudNeedSignIn")}</p>
        <SignInGate
          fallback={
            <div className="mt-6 flex flex-col gap-3">
              {authEnabled ? (
                <>
                  <AccountConsentBox
                    checked={agreed}
                    onChange={(v) => {
                      setAgreed(v);
                      if (v) setNeedConsent(false);
                    }}
                    error={needConsent}
                  />
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={!agreed}
                      onClick={() => {
                        if (!agreed) {
                          setNeedConsent(true);
                          return;
                        }
                        void grant({ terms: true, privacy: true, account: true }).then(() => {
                          writeAccessTab("backup");
                          return signIn(p.providerId, { callbackURL: "/vault/access" });
                        });
                      }}
                    >
                      Continue with {p.label}
                    </Button>
                  ))}
                  <Field label={t("emailLogin")} className="mt-4">
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label={t("emailPassword")}>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={busy || !email || password.length < 8 || !agreed}
                    onClick={() => void submit("in")}
                  >
                    {t("emailSignIn")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={busy || !email || password.length < 8 || !agreed}
                    onClick={() => void submit("up")}
                  >
                    {t("emailSignUp")}
                  </Button>
                  <p className="text-xs text-muted-foreground">{t("emailNeedAccount")}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
              )}
            </div>
          }
        >
          <p className="mt-6 text-sm">เข้าสู่ระบบแล้ว</p>
          <Button asChild className="mt-4 w-full">
            <Link to="/vault/access">ไปแผนส่งมอบ</Link>
          </Button>
        </SignInGate>
        <LegalLinks className="mt-8 text-muted-foreground" />
      </div>
    </main>
  );
}
