import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/vault/chrome";
import { clamp } from "@/lib/vault/coerce";
import { readDocFile } from "@/lib/vault/files";
import { uid } from "@/lib/vault/format";
import { categoryLabel, documentLabel, maritalLabel, relationshipLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import {
  ASSET_CATEGORIES,
  DOCUMENT_KINDS,
  MARITAL_KINDS,
  RELATIONSHIPS,
  type Asset,
  type AssetCategory,
  type Beneficiary,
  type DocumentItem,
  type DocumentKind,
  type Letter,
  type MaritalKind,
  type Relationship,
} from "@/lib/vault/types";
import {
  hasErrors,
  letterBody,
  moneyValue,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredName,
  requiredRecipient,
  sharePercent,
  type FieldErrors,
} from "@/lib/vault/validate";

function validateAsset(draft: Partial<Asset>): FieldErrors {
  return {
    name: requiredName(draft.name ?? ""),
    valueThb: moneyValue(draft.valueThb ?? 0),
    institution: optionalText(draft.institution ?? "", 120),
    identifier: optionalText(draft.identifier ?? "", 80),
    location: optionalText(draft.location ?? "", 120),
    notes: optionalText(draft.notes ?? "", 2000),
    secret: optionalText(draft.secret ?? "", 500),
  };
}

function validateHeir(draft: Partial<Beneficiary>, otherShare: number): FieldErrors {
  const share = clamp(Number(draft.sharePercent) || 0, 0, 100);
  return {
    name: requiredName(draft.name ?? ""),
    sharePercent: sharePercent(draft.sharePercent ?? 0),
    email: optionalEmail(draft.email ?? ""),
    phone: optionalPhone(draft.phone ?? ""),
    notes: optionalText(draft.notes ?? "", 2000),
    shareOver: otherShare + share > 100 ? "errShareOver" : null,
  };
}

function blockingErrors(errors: FieldErrors): FieldErrors {
  const { shareOver: _warn, ...rest } = errors;
  return rest;
}

function validateLetter(draft: Partial<Letter>): FieldErrors {
  return {
    toBeneficiaryId: requiredRecipient(draft.toBeneficiaryId ?? ""),
    title: requiredName(draft.title ?? ""),
    body: letterBody(draft.body ?? ""),
  };
}

function validateDocument(draft: Partial<DocumentItem>): FieldErrors {
  return {
    title: requiredName(draft.title ?? ""),
    notes: optionalText(draft.notes ?? "", 2000),
    secret: optionalText(draft.secret ?? "", 500),
  };
}

export function AssetDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Asset | null;
}) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault);
  const patch = useVaultStore((s) => s.patch);
  const [draft, setDraft] = useState<Partial<Asset>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tried, setTried] = useState(false);

  function onOpen(v: boolean) {
    if (v) {
      setTried(false);
      setErrors({});
      setDraft(
        initial ?? {
          category: "banking",
          name: "",
          institution: "",
          identifier: "",
          valueThb: 0,
          location: "",
          notes: "",
          beneficiaryIds: [],
          secret: "",
          marital: "unknown",
        },
      );
    }
    onOpenChange(v);
  }

  function update(next: Partial<Asset>) {
    setDraft(next);
    if (tried) setErrors(validateAsset(next));
  }

  function save() {
    const next = validateAsset(draft);
    setTried(true);
    setErrors(next);
    if (hasErrors(next)) {
      toast(t("fixForm"));
      return;
    }
    const asset: Asset = {
      id: initial?.id ?? uid(),
      category: (draft.category as AssetCategory) ?? "other",
      name: (draft.name ?? "").trim(),
      institution: (draft.institution ?? "").trim(),
      identifier: (draft.identifier ?? "").trim(),
      valueThb: clamp(Number(draft.valueThb) || 0, 0, 1_000_000_000_000),
      location: (draft.location ?? "").trim(),
      notes: draft.notes ?? "",
      beneficiaryIds: draft.beneficiaryIds ?? [],
      secret: draft.secret ?? "",
      marital: (draft.marital as MaritalKind) ?? "unknown",
      updatedAt: new Date().toISOString(),
    };
    patch((v) => ({
      ...v,
      assets: initial ? v.assets.map((a) => (a.id === asset.id ? asset : a)) : [asset, ...v.assets],
    }), lang === "th" ? `บันทึกทรัพย์สิน: ${asset.name}` : `Saved asset: ${asset.name}`);
    toast(t("saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <form
          noValidate
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? t("editAsset") : t("addAsset")}</DialogTitle>
            <DialogDescription>{t("secretHint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={t("name")} required error={errors.name ? t(errors.name) : undefined}>
              <Input
                autoFocus={!initial}
                value={draft.name ?? ""}
                maxLength={80}
                placeholder={t("phAssetName")}
                aria-invalid={Boolean(errors.name)}
                aria-required="true"
                onChange={(e) => update({ ...draft, name: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("category")}>
                <Select
                  value={(draft.category as string) ?? "banking"}
                  onValueChange={(v) => update({ ...draft, category: v as AssetCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel[lang][c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("value")} error={errors.valueThb ? t(errors.valueThb) : undefined}>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  aria-invalid={Boolean(errors.valueThb)}
                  value={draft.valueThb ?? 0}
                  onChange={(e) => update({ ...draft, valueThb: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label={t("maritalKind")}>
              <Select
                value={(draft.marital as string) ?? "unknown"}
                onValueChange={(v) => update({ ...draft, marital: v as MaritalKind })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {maritalLabel[lang][k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{t("maritalHint")}</p>
            </Field>
            <Field label={t("institution")} error={errors.institution ? t(errors.institution) : undefined}>
              <Input
                value={draft.institution ?? ""}
                maxLength={120}
                placeholder={t("phInstitution")}
                aria-invalid={Boolean(errors.institution)}
                onChange={(e) => update({ ...draft, institution: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("identifier")} error={errors.identifier ? t(errors.identifier) : undefined}>
                <Input
                  value={draft.identifier ?? ""}
                  maxLength={80}
                  placeholder={t("phIdentifier")}
                  aria-invalid={Boolean(errors.identifier)}
                  onChange={(e) => update({ ...draft, identifier: e.target.value })}
                />
              </Field>
              <Field label={t("location")} error={errors.location ? t(errors.location) : undefined}>
                <Input
                  value={draft.location ?? ""}
                  maxLength={120}
                  placeholder={t("phLocation")}
                  aria-invalid={Boolean(errors.location)}
                  onChange={(e) => update({ ...draft, location: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("assignedHeirs")}>
              <div className="flex flex-wrap gap-2">
                {(vault?.beneficiaries ?? []).map((b) => {
                  const on = (draft.beneficiaryIds ?? []).includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const cur = draft.beneficiaryIds ?? [];
                        update({
                          ...draft,
                          beneficiaryIds: on ? cur.filter((id) => id !== b.id) : [...cur, b.id],
                        });
                      }}
                      className={
                        on
                          ? "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                          : "rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground"
                      }
                    >
                      {b.name}
                    </button>
                  );
                })}
                {(vault?.beneficiaries.length ?? 0) === 0 ? (
                  <span className="text-xs text-muted-foreground">{t("emptyHeirs")}</span>
                ) : null}
              </div>
            </Field>
            <Field label={t("notes")} error={errors.notes ? t(errors.notes) : undefined}>
              <Textarea
                value={draft.notes ?? ""}
                maxLength={2000}
                placeholder={t("phAssetNotes")}
                aria-invalid={Boolean(errors.notes)}
                onChange={(e) => update({ ...draft, notes: e.target.value })}
              />
            </Field>
            <Field label={t("secret")} error={errors.secret ? t(errors.secret) : undefined}>
              <Input
                type="password"
                autoComplete="off"
                value={draft.secret ?? ""}
                maxLength={500}
                placeholder={t("phAssetSecret")}
                aria-invalid={Boolean(errors.secret)}
                onChange={(e) => update({ ...draft, secret: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HeirDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Beneficiary | null;
}) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault);
  const patch = useVaultStore((s) => s.patch);
  const [draft, setDraft] = useState<Partial<Beneficiary>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tried, setTried] = useState(false);
  const otherShare = (vault?.beneficiaries ?? [])
    .filter((b) => b.id !== initial?.id)
    .reduce((sum, b) => sum + b.sharePercent, 0);

  function onOpen(v: boolean) {
    if (v) {
      setTried(false);
      setErrors({});
      setDraft(initial ?? { name: "", relationship: "child", sharePercent: 0, email: "", phone: "", notes: "" });
    }
    onOpenChange(v);
  }

  function update(next: Partial<Beneficiary>) {
    setDraft(next);
    if (tried) setErrors(validateHeir(next, otherShare));
  }

  function save() {
    const next = validateHeir(draft, otherShare);
    setTried(true);
    setErrors(next);
    if (hasErrors(blockingErrors(next))) {
      toast(t("fixForm"));
      return;
    }
    const heir: Beneficiary = {
      id: initial?.id ?? uid(),
      name: (draft.name ?? "").trim(),
      relationship: (draft.relationship as Relationship) ?? "other",
      sharePercent: clamp(Number(draft.sharePercent) || 0, 0, 100),
      email: (draft.email ?? "").trim(),
      phone: (draft.phone ?? "").trim(),
      notes: draft.notes ?? "",
    };
    patch((v) => ({
      ...v,
      beneficiaries: initial ? v.beneficiaries.map((b) => (b.id === heir.id ? heir : b)) : [...v.beneficiaries, heir],
    }), lang === "th" ? `บันทึกทายาท: ${heir.name}` : `Saved heir: ${heir.name}`);
    toast(t("saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <form
          noValidate
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? t("editHeir") : t("addHeir")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={t("name")} required error={errors.name ? t(errors.name) : undefined}>
              <Input
                autoFocus={!initial}
                value={draft.name ?? ""}
                maxLength={80}
                placeholder={t("phHeirName")}
                aria-invalid={Boolean(errors.name)}
                aria-required="true"
                onChange={(e) => update({ ...draft, name: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("relationship")}>
                <Select
                  value={(draft.relationship as string) ?? "child"}
                  onValueChange={(v) => update({ ...draft, relationship: v as Relationship })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {relationshipLabel[lang][r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label={`${t("share")} %`}
                error={errors.sharePercent ? t(errors.sharePercent) : errors.shareOver ? t(errors.shareOver) : undefined}
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  aria-invalid={Boolean(errors.sharePercent || errors.shareOver)}
                  value={draft.sharePercent ?? 0}
                  onChange={(e) => update({ ...draft, sharePercent: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("email")} error={errors.email ? t(errors.email) : undefined}>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={draft.email ?? ""}
                  maxLength={120}
                  placeholder={t("phEmail")}
                  aria-invalid={Boolean(errors.email)}
                  onChange={(e) => update({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label={t("phone")} error={errors.phone ? t(errors.phone) : undefined}>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={draft.phone ?? ""}
                  maxLength={20}
                  placeholder={t("phPhone")}
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(e) => update({ ...draft, phone: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("notes")} error={errors.notes ? t(errors.notes) : undefined}>
              <Textarea
                value={draft.notes ?? ""}
                maxLength={2000}
                placeholder={t("phHeirNotes")}
                aria-invalid={Boolean(errors.notes)}
                onChange={(e) => update({ ...draft, notes: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LetterDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Letter | null;
}) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault);
  const patch = useVaultStore((s) => s.patch);
  const [draft, setDraft] = useState<Partial<Letter>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setErrors({});
    setDraft(initial ?? { toBeneficiaryId: vault?.beneficiaries[0]?.id ?? "", title: "", body: "" });
  }, [open, initial, vault]);

  function onOpen(v: boolean) {
    if (v) {
      setTried(false);
      setErrors({});
      setDraft(initial ?? { toBeneficiaryId: vault?.beneficiaries[0]?.id ?? "", title: "", body: "" });
    }
    onOpenChange(v);
  }

  function update(next: Partial<Letter>) {
    setDraft(next);
    if (tried) setErrors(validateLetter(next));
  }

  function save() {
    const next = validateLetter(draft);
    setTried(true);
    setErrors(next);
    if (hasErrors(next)) {
      toast(t("fixForm"));
      return;
    }
    const letter: Letter = {
      id: initial?.id ?? uid(),
      toBeneficiaryId: draft.toBeneficiaryId ?? "",
      title: (draft.title ?? "").trim(),
      body: draft.body ?? "",
      updatedAt: new Date().toISOString(),
    };
    patch((v) => ({
      ...v,
      letters: initial ? v.letters.map((l) => (l.id === letter.id ? letter : l)) : [letter, ...v.letters],
    }), lang === "th" ? `เขียนจดหมาย: ${letter.title}` : `Wrote letter: ${letter.title}`);
    toast(t("saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <form
          noValidate
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("addLetter")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={t("to")} required error={errors.toBeneficiaryId ? t(errors.toBeneficiaryId) : undefined}>
              <Select
                value={draft.toBeneficiaryId ?? ""}
                onValueChange={(v) => update({ ...draft, toBeneficiaryId: v })}
              >
                <SelectTrigger aria-invalid={Boolean(errors.toBeneficiaryId)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(vault?.beneficiaries ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("letterTitle")} required error={errors.title ? t(errors.title) : undefined}>
              <Input
                autoFocus
                value={draft.title ?? ""}
                maxLength={80}
                placeholder={t("phLetterTitle")}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                onChange={(e) => update({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label={t("letterBody")} required error={errors.body ? t(errors.body) : undefined}>
              <Textarea
                className="min-h-40"
                value={draft.body ?? ""}
                maxLength={8000}
                placeholder={t("phLetterBody")}
                aria-invalid={Boolean(errors.body)}
                aria-required="true"
                onChange={(e) => update({ ...draft, body: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: DocumentItem | null;
}) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const patch = useVaultStore((s) => s.patch);
  const [draft, setDraft] = useState<Partial<DocumentItem>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tried, setTried] = useState(false);

  function onOpen(v: boolean) {
    if (v) {
      setTried(false);
      setErrors({});
      setDraft(initial ?? { title: "", kind: "other", notes: "", secret: "" });
    }
    onOpenChange(v);
  }

  function update(next: Partial<DocumentItem>) {
    setDraft(next);
    if (tried) setErrors(validateDocument(next));
  }

  function save() {
    const next = validateDocument(draft);
    setTried(true);
    setErrors(next);
    if (hasErrors(next)) {
      toast(t("fixForm"));
      return;
    }
    const doc: DocumentItem = {
      id: initial?.id ?? uid(),
      title: (draft.title ?? "").trim(),
      kind: (draft.kind as DocumentKind) ?? "other",
      notes: draft.notes ?? "",
      secret: draft.secret ?? "",
      fileName: draft.fileName || undefined,
      fileMime: draft.fileMime || undefined,
      fileData: draft.fileData || undefined,
    };
    patch((v) => ({
      ...v,
      documents: initial ? v.documents.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...v.documents],
    }), lang === "th" ? `เก็บเอกสาร: ${doc.title}` : `Filed document: ${doc.title}`);
    toast(t("saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <form
          noValidate
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("addDocument")}</DialogTitle>
            <DialogDescription>{t("fileHint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={t("name")} required error={errors.title ? t(errors.title) : undefined}>
              <Input
                autoFocus={!initial}
                value={draft.title ?? ""}
                maxLength={80}
                placeholder={t("phDocName")}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                onChange={(e) => update({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label={t("kind")}>
              <Select
                value={(draft.kind as string) ?? "other"}
                onValueChange={(v) => update({ ...draft, kind: v as DocumentKind })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {documentLabel[lang][k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("notes")} error={errors.notes ? t(errors.notes) : undefined}>
              <Textarea
                className="min-h-20"
                value={draft.notes ?? ""}
                maxLength={2000}
                placeholder={t("phDocNotes")}
                aria-invalid={Boolean(errors.notes)}
                onChange={(e) => update({ ...draft, notes: e.target.value })}
              />
            </Field>
            <Field label={t("secret")} error={errors.secret ? t(errors.secret) : undefined}>
              <Input
                type="password"
                autoComplete="off"
                value={draft.secret ?? ""}
                maxLength={500}
                placeholder={t("phDocSecret")}
                aria-invalid={Boolean(errors.secret)}
                onChange={(e) => update({ ...draft, secret: e.target.value })}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground">{t("attachFile")}</span>
              <div className="flex items-center gap-2">
                <label className="flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-secondary px-3 text-sm">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                  <span className={draft.fileName ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                    {draft.fileName || t("noFileChosen")}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                    {t("chooseFile")}
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,.pdf,.png,.jpg,.jpeg,.webp,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      void readDocFile(file)
                        .then((att) => update({ ...draft, ...att }))
                        .catch(() => toast(t("errFileType")));
                    }}
                  />
                </label>
                {draft.fileName ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => update({ ...draft, fileName: "", fileMime: "", fileData: "" })}
                  >
                    {t("removeFile")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
