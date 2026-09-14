import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Panel } from "@/components/vault/chrome";
import { optionalContact, optionalDob, optionalText, requiredName, type FieldErrors } from "@/lib/vault/validate";
import { useT, useVaultStore } from "@/lib/vault/store";
import { WILL_CUSTODY_PLACES, type WillCustody, type WillCustodyPlace } from "@/lib/vault/types";
import {
  custodyNeedsHolder,
  custodyPlaceKey,
  custodyStatus,
  custodyStatusKey,
  vaultCustody,
} from "@/lib/vault/will-custody";

export function WillCustodyPanel() {
  const t = useT();
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const custody = vaultCustody(vault);
  const status = custodyStatus(custody);
  const [errors, setErrors] = useState<FieldErrors>({});

  function save(next: Partial<WillCustody>) {
    patch((v) => ({ ...v, willCustody: { ...vaultCustody(v), ...next } }));
  }

  function setPlace(place: WillCustodyPlace) {
    setErrors((prev) => ({ ...prev, holderName: null }));
    save({ place });
  }

  function setHolder(value: string) {
    const tooLong = optionalText(value, 120);
    const err = custodyNeedsHolder(custody.place) ? requiredName(value, 120) : tooLong;
    setErrors((prev) => ({ ...prev, holderName: err }));
    if (!tooLong) save({ holderName: value });
  }

  return (
    <Panel className="mb-6" id="will-custody">
      <h2 className="font-display text-xl">{t("willCustodyTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("willCustodyLead")}</p>
      <p className="mt-3 text-sm text-muted-foreground">{t("willCustodyLegal")}</p>
      <p
        className={`mt-4 text-sm ${status === "offsite" ? "text-foreground" : "text-warn"}`}
        role="status"
      >
        {t(custodyStatusKey(custody))}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t("willCustodyPlace")} className="sm:col-span-2">
          <Select value={custody.place} onValueChange={(v) => setPlace(v as WillCustodyPlace)}>
            <SelectTrigger aria-label={t("willCustodyPlace")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WILL_CUSTODY_PLACES.map((place) => (
                <SelectItem key={place} value={place}>
                  {t(custodyPlaceKey(place))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {custody.place !== "none" ? (
          <>
            <Field
              label={t("willCustodyHolder")}
              required={custodyNeedsHolder(custody.place)}
              error={errors.holderName ? t(errors.holderName) : undefined}
            >
              <Input
                value={custody.holderName}
                maxLength={120}
                placeholder={t("willCustodyPhHolder")}
                aria-invalid={Boolean(errors.holderName)}
                onChange={(e) => setHolder(e.target.value)}
              />
            </Field>
            <Field
              label={t("willCustodyContact")}
              error={errors.holderContact ? t(errors.holderContact) : undefined}
            >
              <Input
                value={custody.holderContact}
                maxLength={120}
                placeholder={t("willCustodyPhContact")}
                aria-invalid={Boolean(errors.holderContact)}
                onChange={(e) => {
                  const err = optionalContact(e.target.value);
                  setErrors((prev) => ({ ...prev, holderContact: err }));
                  if (!optionalText(e.target.value, 120)) save({ holderContact: e.target.value });
                }}
              />
            </Field>
            <Field
              label={t("willCustodyLocation")}
              error={errors.location ? t(errors.location) : undefined}
            >
              <Input
                value={custody.location}
                maxLength={200}
                placeholder={t("willCustodyPhLocation")}
                onChange={(e) => {
                  const err = optionalText(e.target.value, 200);
                  setErrors((prev) => ({ ...prev, location: err }));
                  if (!err) save({ location: e.target.value });
                }}
              />
            </Field>
            <Field label={t("willCustodyDate")} error={errors.depositedAt ? t(errors.depositedAt) : undefined}>
              <Input
                value={custody.depositedAt}
                maxLength={10}
                placeholder={t("phDob")}
                aria-invalid={Boolean(errors.depositedAt)}
                onChange={(e) => {
                  const value = e.target.value;
                  setErrors((prev) => ({ ...prev, depositedAt: optionalDob(value) }));
                  save({ depositedAt: value });
                }}
              />
            </Field>
            <Field label={t("willCustodyRef")}>
              <Input
                value={custody.reference}
                maxLength={80}
                placeholder={t("willCustodyPhRef")}
                onChange={(e) => save({ reference: e.target.value })}
              />
            </Field>
            <Field label={t("willCustodyCopies")}>
              <Input
                value={custody.copiesWhere}
                maxLength={200}
                placeholder={t("willCustodyPhCopies")}
                onChange={(e) => save({ copiesWhere: e.target.value })}
              />
            </Field>
            <Field label={t("willCustodyNotes")} className="sm:col-span-2">
              <Textarea
                value={custody.notes}
                maxLength={500}
                rows={3}
                onChange={(e) => save({ notes: e.target.value })}
              />
            </Field>
          </>
        ) : null}
      </div>

      {status === "home" ? <p className="mt-4 text-sm text-warn">{t("willCustodyHomeWarn")}</p> : null}
      {custody.place === "bank" ? <p className="mt-4 text-sm text-muted-foreground">{t("willCustodyBankNote")}</p> : null}
    </Panel>
  );
}
