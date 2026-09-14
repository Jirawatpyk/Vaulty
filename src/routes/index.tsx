import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/vault/chrome";
import { PinPad } from "@/components/vault/pin-pad";
import { VaultMark } from "@/components/vault/vault-mark";
import { CloudRestoreButton } from "@/components/vault/cloud-backup-panel";
import { LegalLinks } from "@/components/vault/consent-box";
import { remainingMs } from "@/lib/vault/lockout";
import { useFocusTrap } from "@/lib/vault/focus-trap";
import { DEMO_PIN } from "@/lib/vault/types";
import { useT, useVaultStore } from "@/lib/vault/store";
import { requiredName } from "@/lib/vault/validate";
import { isValidUnlockSecret } from "@/lib/vault/secret";

export const Route = createFileRoute("/")({ component: Gate });

type Mode = "welcome" | "pin" | "create-name" | "create-pin" | "create-confirm";

function Gate() {
  const t = useT();
  const navigate = useNavigate();
  const status = useVaultStore((s) => s.status);
  const busy = useVaultStore((s) => s.busy);
  const error = useVaultStore((s) => s.error);
  const isDemo = useVaultStore((s) => s.isDemo);
  const lang = useVaultStore((s) => s.lang);
  const setLang = useVaultStore((s) => s.setLang);
  const unlock = useVaultStore((s) => s.unlock);
  const create = useVaultStore((s) => s.create);
  const openDemo = useVaultStore((s) => s.openDemo);
  const wipe = useVaultStore((s) => s.wipe);
  const importBlob = useVaultStore((s) => s.importBlob);
  const lockoutUntil = useVaultStore((s) => s.lockoutUntil);
  const submitting = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("welcome");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [nameTried, setNameTried] = useState(false);
  const [shake, setShake] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [wipeAsk, setWipeAsk] = useState(false);
  const [demoAsk, setDemoAsk] = useState(false);
  const [openingDemo, setOpeningDemo] = useState(false);
  const [phraseMode, setPhraseMode] = useState(false);
  const [cool, setCool] = useState(0);
  const [ready, setReady] = useState(false);
  useFocusTrap(wipeAsk, wipeRef, () => setWipeAsk(false));
  useFocusTrap(demoAsk, demoRef, () => setDemoAsk(false));

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (status === "unlocked") {
      void navigate({ to: "/vault" });
    } else if (status === "locked") {
      setMode("pin");
    } else if (status === "empty") {
      setMode("welcome");
    }
  }, [status, navigate]);

  useEffect(() => {
    const tick = () => setCool(remainingMs({ fails: 0, until: lockoutUntil }));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [lockoutUntil]);

  const lockedOut = cool > 0;

  useEffect(() => {
    if (phraseMode || mode !== "pin" || pin.length !== 6 || submitting.current || lockedOut) return;
    submitting.current = true;
    void unlock(pin).then((ok) => {
      submitting.current = false;
      if (ok) {
        void navigate({ to: "/vault" });
      } else {
        setShake(true);
        setPin("");
        window.setTimeout(() => setShake(false), 400);
      }
    });
  }, [pin, mode, unlock, navigate, lockedOut, phraseMode]);

  useEffect(() => {
    if (phraseMode || mode !== "create-confirm" || confirm.length !== 6 || submitting.current) return;
    if (confirm !== pin) {
      setMismatch(true);
      setShake(true);
      setConfirm("");
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    setMismatch(false);
    submitting.current = true;
    void create(name, pin).then(() => {
      submitting.current = false;
      void navigate({ to: "/vault" });
    });
  }, [confirm, mode, pin, name, create, navigate, phraseMode]);

  async function runDemo() {
    if (openingDemo) return;
    submitting.current = true;
    setOpeningDemo(true);
    try {
      await openDemo();
      if (useVaultStore.getState().status === "unlocked") {
        void navigate({ to: "/vault" });
        return;
      }
    } finally {
      submitting.current = false;
      if (useVaultStore.getState().status !== "unlocked") setOpeningDemo(false);
    }
  }

  async function handleDemo() {
    if (openingDemo) return;
    if (status === "locked" && !isDemo) {
      setDemoAsk(true);
      return;
    }
    await runDemo();
  }

  async function confirmDemo() {
    setDemoAsk(false);
    await runDemo();
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importBlob(String(reader.result ?? ""));
      toast(ok ? t("importOk") : t("importFail"));
      if (ok) setMode("pin");
    };
    reader.readAsText(file);
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <VaultMark className="size-[min(80vw,32rem)]" title={t("vaultDoor")} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <VaultMark className="size-7" />
          <span className="font-display text-xl tracking-tight">Vaulty</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLang(lang === "th" ? "en" : "th")} aria-label={t("switchLang")}>
          {lang === "th" ? "EN" : "TH"}
        </Button>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
        {openingDemo ? (
          <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
            <VaultMark className="size-16" title={t("appName")} />
            <p className="font-display mt-6 text-2xl">{t("openingDemo")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("decrypting")}</p>
          </div>
        ) : null}

        {!openingDemo && mode === "welcome" ? (
          <div className="stagger-in flex flex-col items-center text-center">
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">{t("welcomeKicker")}</p>
            <h1 className="font-display mt-4 text-4xl tracking-tight md:text-5xl">{t("appName")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">{t("welcomeLead")}</p>
            <div className="mt-4 w-full rounded-md bg-secondary px-4 py-3 text-sm leading-relaxed text-pretty">
              {t("legalNotWill")}
            </div>
            <div className="mt-8 flex w-full flex-col gap-3">
              <Button size="lg" onClick={() => setMode("create-name")}>
                {t("createVault")}
              </Button>
              <Button size="lg" variant="outline" disabled={busy} onClick={() => void handleDemo()}>
                {busy ? t("decrypting") : t("openDemo")}
              </Button>
              <CloudRestoreButton onRestored={() => setMode("pin")} />
              <Button size="lg" variant="ghost" onClick={() => fileRef.current?.click()}>
                {t("restoreVault")}
              </Button>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{t("restoreFirst")}</p>
          </div>
        ) : null}

        {!openingDemo && mode === "create-name" ? (
          <div className="stagger-in">
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">{t("createVault")}</p>
            <h1 className="font-display mt-3 text-3xl">{t("yourName")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("createLead")}</p>
            <Field
              className="mt-6"
              label={t("namePlaceholder")}
              required
              error={nameTried && requiredName(name) ? t(requiredName(name)!) : undefined}
            >
              <Input
                autoFocus
                autoComplete="name"
                maxLength={80}
                placeholder={t("namePlaceholder")}
                value={name}
                aria-invalid={nameTried && Boolean(requiredName(name))}
                aria-required="true"
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setMode("welcome")}>
                {t("back")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setNameTried(true);
                  if (requiredName(name)) return;
                  setMode("create-pin");
                }}
              >
                {t("continue")}
              </Button>
            </div>
          </div>
        ) : null}

        {!openingDemo && mode === "create-pin" ? (
          <div className="flex flex-col items-center">
            <h1 className="font-display text-2xl">{phraseMode ? t("passphrase") : t("setPin")}</h1>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">{phraseMode ? t("passphraseHint") : t("createLead")}</p>
            {phraseMode ? (
              <div className="w-full max-w-xs">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={pin}
                  maxLength={64}
                  onChange={(e) => setPin(e.target.value)}
                  aria-label={t("passphrase")}
                />
                <Button
                  className="mt-4 w-full"
                  disabled={!isValidUnlockSecret(pin)}
                  onClick={() => {
                    setConfirm("");
                    setMode("create-confirm");
                  }}
                >
                  {t("continue")}
                </Button>
              </div>
            ) : (
              <PinPad
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (v.length === 6) setMode("create-confirm");
                }}
                disabled={busy}
              />
            )}
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setPin("");
                setPhraseMode(!phraseMode);
              }}
            >
              {phraseMode ? t("usePinPad") : t("usePassphrase")}
            </Button>
            <Button
              variant="ghost"
              className="mt-1"
              onClick={() => {
                setPin("");
                setMode("create-name");
              }}
            >
              {t("back")}
            </Button>
          </div>
        ) : null}

        {!openingDemo && mode === "create-confirm" ? (
          <div className="flex flex-col items-center">
            <h1 className="font-display text-2xl">{phraseMode ? t("confirmPassphrase") : t("confirmPin")}</h1>
            <p className="mt-2 mb-2 text-sm text-destructive" role="alert">
              {mismatch ? t("pinMismatch") : "\u00a0"}
            </p>
            {phraseMode ? (
              <div className="w-full max-w-xs">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  maxLength={64}
                  onChange={(e) => {
                    setMismatch(false);
                    setConfirm(e.target.value);
                  }}
                  aria-label={t("confirmPassphrase")}
                />
                <Button
                  className="mt-4 w-full"
                  disabled={busy || !confirm}
                  onClick={() => {
                    if (confirm !== pin) {
                      setMismatch(true);
                      setConfirm("");
                      return;
                    }
                    if (submitting.current) return;
                    submitting.current = true;
                    void create(name, pin).then(() => {
                      submitting.current = false;
                      void navigate({ to: "/vault" });
                    });
                  }}
                >
                  {t("createVault")}
                </Button>
              </div>
            ) : (
              <PinPad
                value={confirm}
                onChange={(v) => {
                  setMismatch(false);
                  setConfirm(v);
                }}
                disabled={busy}
                shake={shake}
              />
            )}
            {busy ? <p className="mt-4 text-sm text-muted-foreground">{t("creating")}</p> : null}
          </div>
        ) : null}

        {!openingDemo && mode === "pin" ? (
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">{t("existingVault")}</p>
            <h1 className="font-display mt-3 text-3xl">{t("enterPin")}</h1>
            {isDemo ? (
              <p className="mt-2 font-mono text-xs tracking-[0.35em] text-muted-foreground">
                {t("demoHint")} {DEMO_PIN.split("").join(" ")}
              </p>
            ) : error === "corrupt" ? (
              <p className="mt-2 text-sm text-destructive">{t("corruptVault")}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("sealed")}</p>
            )}
            <p className="mt-2 h-5 text-sm text-destructive" role="alert">
              {lockedOut
                ? `${t("tryAgainIn")} ${Math.ceil(cool / 1000)} ${t("seconds")}`
                : error === "pin"
                  ? t("wrongPin")
                  : error === "corrupt"
                    ? t("corruptVault")
                    : error === "persist"
                      ? t("persistFail")
                    : "\u00a0"}
            </p>
            {phraseMode ? (
              <div className="mt-4 w-full max-w-xs text-left">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pin}
                  maxLength={64}
                  disabled={busy || lockedOut || error === "corrupt"}
                  onChange={(e) => setPin(e.target.value)}
                  aria-label={t("passphrase")}
                />
                <Button
                  className="mt-4 w-full"
                  disabled={busy || lockedOut || !isValidUnlockSecret(pin)}
                  onClick={() => {
                    if (submitting.current) return;
                    submitting.current = true;
                    void unlock(pin).then((ok) => {
                      submitting.current = false;
                      if (ok) void navigate({ to: "/vault" });
                      else {
                        setShake(true);
                        setPin("");
                        window.setTimeout(() => setShake(false), 400);
                      }
                    });
                  }}
                >
                  {t("unlock")}
                </Button>
              </div>
            ) : (
              <PinPad value={pin} onChange={setPin} disabled={busy || lockedOut || error === "corrupt"} shake={shake} />
            )}
            {!isDemo ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setPin("");
                  setPhraseMode((v) => !v);
                }}
              >
                {phraseMode ? t("usePinPad") : t("usePassphrase")}
              </Button>
            ) : null}
            {busy ? (
              <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
                {t("decrypting")}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWipeAsk(true)}>
                {t("forgotPin")}
              </Button>
              <Button variant="link" size="sm" onClick={() => void handleDemo()}>
                {t("openDemo")}
              </Button>
              <Button variant="link" size="sm" onClick={() => fileRef.current?.click()}>
                {t("restoreVault")}
              </Button>
              <CloudRestoreButton onRestored={() => setMode("pin")} />
            </div>
          </div>
        ) : null}

        {ready ? (
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
        ) : null}

        {wipeAsk ? (
          <div
            ref={wipeRef}
            className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="wipe-title"
            aria-describedby="wipe-body"
          >
            <div className="w-full max-w-md rounded-xl bg-card p-6 hairline">
              <h2 id="wipe-title" className="font-display text-xl">
                {t("wipeConfirmTitle")}
              </h2>
              <p id="wipe-body" className="mt-2 text-sm text-muted-foreground">{t("wipeConfirmBody")}</p>
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setWipeAsk(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    wipe();
                    setWipeAsk(false);
                    setMode("welcome");
                    setPin("");
                    toast(t("deleted"));
                  }}
                >
                  {t("wipe")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {demoAsk ? (
          <div
            ref={demoRef}
            className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            aria-describedby="demo-body"
          >
            <div className="w-full max-w-md rounded-xl bg-card p-6 hairline">
              <h2 id="demo-title" className="font-display text-xl">
                {t("demoOverwriteTitle")}
              </h2>
              <p id="demo-body" className="mt-2 text-sm text-muted-foreground">{t("demoOverwriteBody")}</p>
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setDemoAsk(false)}>
                  {t("cancel")}
                </Button>
                <Button className="flex-1" onClick={() => void confirmDemo()}>
                  {t("replaceDemo")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-md px-6 py-8 text-center text-xs leading-relaxed text-muted-foreground md:py-10">
        <p>
          {t("trustLocal")}
          <span className="mx-2 text-border">·</span>
          {t("trustAes")}
          <span className="mx-2 text-border">·</span>
          {t("trustLock")}
        </p>
        <LegalLinks className="mt-3" />
      </footer>
    </main>
  );
}
