import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, PageHeader, Panel } from "@/components/vault/chrome";
import { LetterDialog } from "@/components/vault/editors";
import { useT, useVaultStore } from "@/lib/vault/store";

export const Route = createFileRoute("/vault/wishes")({ component: WishesPage });

function WishesPage() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title={t("wishes")} description={t("packetWishes")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="grid gap-4">
          <Field label={t("funeral")}>
            <Textarea
              value={vault.wishes.funeral}
              maxLength={4000}
              placeholder={t("phFuneral")}
              onChange={(e) =>
                patch((v) => ({ ...v, wishes: { ...v.wishes, funeral: e.target.value } }))
              }
            />
          </Field>
          <Field label={t("restingPlace")}>
            <Textarea
              className="min-h-20"
              maxLength={4000}
              value={vault.wishes.restingPlace}
              placeholder={t("phResting")}
              onChange={(e) =>
                patch((v) => ({ ...v, wishes: { ...v.wishes, restingPlace: e.target.value } }))
              }
            />
          </Field>
          <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-3">
            <span className="text-sm">{t("organDonation")}</span>
            <Switch
              checked={vault.wishes.organDonation}
              onCheckedChange={(c) =>
                patch((v) => ({ ...v, wishes: { ...v.wishes, organDonation: c } }))
              }
            />
          </div>
        </Panel>
        <Panel className="grid gap-4">
          <Field label={t("digitalAfterlife")}>
            <Textarea
              value={vault.wishes.digitalAfterlife}
              maxLength={4000}
              placeholder={t("phDigital")}
              onChange={(e) =>
                patch((v) => ({ ...v, wishes: { ...v.wishes, digitalAfterlife: e.target.value } }))
              }
            />
          </Field>
          <Field label={t("otherWishes")}>
            <Textarea
              value={vault.wishes.other}
              maxLength={4000}
              placeholder={t("phOtherWishes")}
              onChange={(e) => patch((v) => ({ ...v, wishes: { ...v.wishes, other: e.target.value } }))}
            />
          </Field>
        </Panel>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl">{t("letters")}</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          {t("addLetter")}
        </Button>
      </div>

      {vault.letters.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t("emptyLetters")} hint={t("emptyLettersHint")} />
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {vault.letters.map((letter) => {
            const to = vault.beneficiaries.find((b) => b.id === letter.toBeneficiaryId);
            const openLetter = reading === letter.id;
            return (
              <li key={letter.id} className="rounded-xl bg-card p-5 hairline">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{letter.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("to")} {to?.name ?? t("none")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="paper" onClick={() => setReading(openLetter ? null : letter.id)}>
                      {openLetter ? t("hide") : t("openLetter")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        patch(
                          (v) => ({ ...v, letters: v.letters.filter((l) => l.id !== letter.id) }),
                          lang === "th" ? `ลบจดหมาย: ${letter.title}` : `Deleted letter: ${letter.title}`,
                        );
                        toast(t("deleted"));
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {openLetter ? (
                  <div className="paper-grain mt-4 rounded-lg p-5 text-paper-foreground">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{letter.body}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <LetterDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
