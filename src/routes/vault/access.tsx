import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, PageHeader, Panel } from "@/components/vault/chrome";
import { PinPad } from "@/components/vault/pin-pad";
import { TrustCenter } from "@/components/vault/trust-center";
import { HandoffPanel } from "@/components/vault/handoff-panel";
import { BackupPanel } from "@/components/vault/backup-panel";
import { CloudBackupPanel } from "@/components/vault/cloud-backup-panel";
import { NudgePanel } from "@/components/vault/nudge-panel";
import { DeadmanPanel } from "@/components/vault/deadman-panel";
import { WillCustodyPanel } from "@/components/vault/will-custody-panel";
import { RightsPanel } from "@/components/vault/rights-panel";
import { BillingPanel } from "@/components/vault/billing-panel";
import { clamp } from "@/lib/vault/coerce";
import { isValidUnlockSecret } from "@/lib/vault/secret";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { I18nKey } from "@/lib/vault/i18n";
import { readAccessTab, writeAccessTab, type AccessTab } from "@/lib/vault/access-tab";
import { cn } from "@/lib/utils";
import {
  checkInDays,
  optionalContact,
  optionalDob,
  optionalPhone,
  optionalText,
  requiredName,
  type FieldErrors,
} from "@/lib/vault/validate";

export const Route = createFileRoute("/vault/access")({ component: AccessPage });

const TABS: { id: AccessTab; key: I18nKey; hint: I18nKey }[] = [
  { id: "handoff", key: "accessTabHandoff", hint: "handoffLead" },
  { id: "backup", key: "accessTabBackup", hint: "cloudLead" },
  { id: "security", key: "accessTabSecurity", hint: "rightsLead" },
];

function AccessPage() {
  const t = useT();
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const changePin = useVaultStore((s) => s.changePin);
  const autoLock = useVaultStore((s) => s.autoLockMinutes);
  const setAutoLock = useVaultStore((s) => s.setAutoLockMinutes);
  const wipe = useVaultStore((s) => s.wipe);
  const peerView = useVaultStore((s) => s.peerView);
  const [tab, setTab] = useState<AccessTab>(readAccessTab);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [phraseMode, setPhraseMode] = useState(false);
  const [wipeAsk, setWipeAsk] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const pinLock = useRef(false);
  const lastDob = useRef(vault.profile.dateOfBirth);

  function selectTab(next: AccessTab) {
    setTab(next);
    writeAccessTab(next);
  }

  function setError(key: string, err: FieldErrors[string]) {
    setErrors((prev) => ({ ...prev, [key]: err }));
  }

  function saveAccess<K extends keyof typeof vault.access>(key: K, value: (typeof vault.access)[K]) {
    patch((v) => ({ ...v, access: { ...v.access, [key]: value } }));
  }

  function saveProfile<K extends keyof typeof vault.profile>(key: K, value: (typeof vault.profile)[K]) {
    patch((v) => ({ ...v, profile: { ...v.profile, [key]: value } }));
  }

  const active = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div>
      <PageHeader title={t("access")} description={t(active.hint)} />
      <p className="mb-4 text-sm text-muted-foreground">{t("legalNotWill")}</p>
      <div
        role="tablist"
        aria-label={t("access")}
        className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1"
      >
        {TABS.map((item) => {
          const on = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`access-tab-${item.id}`}
              aria-selected={on}
              aria-controls={`access-panel-${item.id}`}
              className={cn(
                "min-h-11 rounded-md px-2 text-sm",
                on ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => selectTab(item.id)}
            >
              {t(item.key)}
            </button>
          );
        })}
      </div>

      {tab === "backup" ? (
        <div id="access-panel-backup" role="tabpanel" aria-labelledby="access-tab-backup" className="flex flex-col gap-6 pb-10">
          <CloudBackupPanel />
          <BackupPanel />
        </div>
      ) : null}

      {tab === "handoff" ? (
        <div id="access-panel-handoff" role="tabpanel" aria-labelledby="access-tab-handoff" className="flex flex-col gap-6 pb-10">
          <WillCustodyPanel />
          <DeadmanPanel />
          <NudgePanel />
          <HandoffPanel />

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="grid min-w-0 gap-4">
              <h2 className="font-display text-xl">{t("executor")}</h2>
              <Field label={t("name")} error={errors.executorName ? t(errors.executorName) : undefined}>
                <Input
                  value={vault.access.executorName}
                  maxLength={80}
                  placeholder={t("phExecutorName")}
                  aria-invalid={Boolean(errors.executorName)}
                  onChange={(e) => {
                    const err = optionalText(e.target.value, 80);
                    setError("executorName", err);
                    if (!err) saveAccess("executorName", e.target.value);
                  }}
                />
              </Field>
              <Field label={t("executorRole")} error={errors.executorRole ? t(errors.executorRole) : undefined}>
                <Input
                  value={vault.access.executorRole}
                  maxLength={80}
                  placeholder={t("phExecutorRole")}
                  aria-invalid={Boolean(errors.executorRole)}
                  onChange={(e) => {
                    const err = optionalText(e.target.value, 80);
                    setError("executorRole", err);
                    if (!err) saveAccess("executorRole", e.target.value);
                  }}
                />
              </Field>
              <Field label={t("executorContact")} error={errors.executorContact ? t(errors.executorContact) : undefined}>
                <Input
                  value={vault.access.executorContact}
                  maxLength={120}
                  placeholder={t("phExecutorContact")}
                  aria-invalid={Boolean(errors.executorContact)}
                  onChange={(e) => saveAccess("executorContact", e.target.value)}
                  onBlur={(e) => setError("executorContact", optionalContact(e.target.value))}
                />
              </Field>
            </Panel>
            <Panel className="grid min-w-0 gap-4">
              <h2 className="font-display text-xl">{t("emergency")}</h2>
              <Field label={t("name")} error={errors.emergencyName ? t(errors.emergencyName) : undefined}>
                <Input
                  value={vault.access.emergencyName}
                  maxLength={80}
                  placeholder={t("phEmergencyName")}
                  aria-invalid={Boolean(errors.emergencyName)}
                  onChange={(e) => {
                    const err = optionalText(e.target.value, 80);
                    setError("emergencyName", err);
                    if (!err) saveAccess("emergencyName", e.target.value);
                  }}
                />
              </Field>
              <Field label={t("phone")} error={errors.emergencyContact ? t(errors.emergencyContact) : undefined}>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={vault.access.emergencyContact}
                  maxLength={20}
                  placeholder={t("phPhone")}
                  aria-invalid={Boolean(errors.emergencyContact)}
                  onChange={(e) => saveAccess("emergencyContact", e.target.value)}
                  onBlur={(e) => setError("emergencyContact", optionalPhone(e.target.value))}
                />
              </Field>
            </Panel>
          </div>

          <Panel className="grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              label={`${t("checkInEvery")} (${t("days")})`}
              error={errors.checkInDays ? t(errors.checkInDays) : undefined}
            >
              <Input
                type="number"
                min={1}
                max={365}
                value={vault.access.checkInDays}
                aria-invalid={Boolean(errors.checkInDays)}
                onChange={(e) => {
                  const err = checkInDays(e.target.value);
                  setError("checkInDays", err);
                  if (!err) saveAccess("checkInDays", clamp(Number(e.target.value), 1, 365));
                }}
              />
              <p className="text-xs text-muted-foreground">{t("releaseDisclaimer")}</p>
            </Field>
            <Field className="sm:col-span-2" label={t("releaseNote")} error={errors.releaseNote ? t(errors.releaseNote) : undefined}>
              <Textarea
                value={vault.access.releaseNote}
                placeholder={t("phReleaseNote")}
                maxLength={2000}
                aria-invalid={Boolean(errors.releaseNote)}
                onChange={(e) => {
                  const err = optionalText(e.target.value, 2000);
                  setError("releaseNote", err);
                  if (!err) saveAccess("releaseNote", e.target.value);
                }}
              />
            </Field>
          </Panel>
        </div>
      ) : null}

      {tab === "security" ? (
        <div id="access-panel-security" role="tabpanel" aria-labelledby="access-tab-security" className="flex flex-col gap-6 pb-10">
          <BillingPanel />
          <RightsPanel />
          <Panel className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-display text-xl sm:col-span-2">{t("profile")}</h2>
            <Field label={t("name")} required error={errors.fullName ? t(errors.fullName) : undefined}>
              <Input
                value={nameDraft ?? vault.profile.fullName}
                maxLength={80}
                aria-invalid={Boolean(errors.fullName)}
                aria-required="true"
                onChange={(e) => {
                  const value = e.target.value;
                  setNameDraft(value);
                  const err = requiredName(value);
                  setError("fullName", err);
                  if (!err) {
                    saveProfile("fullName", value.trim());
                    setNameDraft(null);
                  }
                }}
                onBlur={() => {
                  const current = nameDraft ?? vault.profile.fullName;
                  const err = requiredName(current);
                  setError("fullName", err);
                  if (!err) {
                    saveProfile("fullName", current.trim());
                  }
                  setNameDraft(null);
                }}
              />
            </Field>
            <Field label={t("occupation")} error={errors.occupation ? t(errors.occupation) : undefined}>
              <Input
                value={vault.profile.occupation}
                maxLength={80}
                placeholder={t("phOccupation")}
                aria-invalid={Boolean(errors.occupation)}
                onChange={(e) => {
                  const err = optionalText(e.target.value, 80);
                  setError("occupation", err);
                  if (!err) saveProfile("occupation", e.target.value);
                }}
              />
            </Field>
            <Field label={t("city")} error={errors.city ? t(errors.city) : undefined}>
              <Input
                value={vault.profile.city}
                maxLength={80}
                placeholder={t("phCity")}
                aria-invalid={Boolean(errors.city)}
                onChange={(e) => {
                  const err = optionalText(e.target.value, 80);
                  setError("city", err);
                  if (!err) saveProfile("city", e.target.value);
                }}
              />
            </Field>
            <Field label={t("born")} error={errors.dateOfBirth ? t(errors.dateOfBirth) : undefined}>
              <Input
                placeholder={t("phDob")}
                value={vault.profile.dateOfBirth}
                maxLength={10}
                aria-invalid={Boolean(errors.dateOfBirth)}
                onChange={(e) => saveProfile("dateOfBirth", e.target.value)}
                onBlur={(e) => {
                  const err = optionalDob(e.target.value);
                  setError("dateOfBirth", err);
                  if (err) saveProfile("dateOfBirth", lastDob.current);
                  else lastDob.current = e.target.value.trim();
                }}
              />
            </Field>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <h2 className="font-display text-xl">{t("autoLock")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {autoLock} {t("minutes")}
              </p>
              <input
                type="range"
                min={1}
                max={30}
                value={autoLock}
                aria-label={t("autoLock")}
                onChange={(e) => setAutoLock(Number(e.target.value))}
                className="mt-4 w-full accent-primary"
              />
            </Panel>
            <Panel>
              <h2 className="font-display text-xl">{t("changePin")}</h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                {phraseMode
                  ? confirmPin
                    ? t("confirmPassphrase")
                    : t("passphraseHint")
                  : confirmPin.length || pin.length === 6
                    ? t("confirmNewPin")
                    : t("newPin")}
              </p>
              {peerView ? (
                <p className="text-sm text-muted-foreground">{t("peerReadonly")}</p>
              ) : phraseMode ? (
                <div className="grid gap-3">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={pin}
                    maxLength={64}
                    onChange={(e) => setPin(e.target.value)}
                    aria-label={t("passphrase")}
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPin}
                    maxLength={64}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    aria-label={t("confirmPassphrase")}
                  />
                  <Button
                    disabled={!isValidUnlockSecret(pin) || pinLock.current}
                    onClick={() => {
                      if (pin !== confirmPin) {
                        toast(t("pinMismatch"));
                        setConfirmPin("");
                        return;
                      }
                      pinLock.current = true;
                      void changePin(pin).then(() => {
                        setPin("");
                        setConfirmPin("");
                        pinLock.current = false;
                        toast(t("pinChanged"));
                        toast(t("backupDuePin"));
                      });
                    }}
                  >
                    {t("changePin")}
                  </Button>
                </div>
              ) : (
                <PinPad
                  value={pin.length === 6 ? confirmPin : pin}
                  onChange={(v) => {
                    if (pin.length < 6) {
                      setPin(v);
                      return;
                    }
                    setConfirmPin(v);
                    if (v.length === 6 && !pinLock.current) {
                      if (v !== pin) {
                        setConfirmPin("");
                        toast(t("pinMismatch"));
                        return;
                      }
                      pinLock.current = true;
                      void changePin(v).then(() => {
                        setPin("");
                        setConfirmPin("");
                        pinLock.current = false;
                        toast(t("pinChanged"));
                        toast(t("backupDuePin"));
                      });
                    }
                  }}
                />
              )}
              {!peerView ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setPin("");
                    setConfirmPin("");
                    setPhraseMode((v) => !v);
                  }}
                >
                  {phraseMode ? t("usePinPad") : t("usePassphrase")}
                </Button>
              ) : null}
            </Panel>
          </div>

          <TrustCenter />

          <Panel className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={() => setWipeAsk(true)}>
              {t("wipe")}
            </Button>
          </Panel>
        </div>
      ) : null}

      {wipeAsk ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/70 p-4 md:items-center">
          <div className="w-full max-w-md rounded-xl bg-card p-6 hairline">
            <h2 className="font-display text-xl">{t("wipeConfirmTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("wipeConfirmBody")}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setWipeAsk(false)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  wipe();
                  window.location.assign("/");
                }}
              >
                {t("wipe")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
