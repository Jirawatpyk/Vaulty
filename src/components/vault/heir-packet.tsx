import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heirValue, totalValue } from "@/lib/vault/completeness";
import { downloadText } from "@/lib/vault/download";
import { familyPackHtml, familyPackFileName } from "@/lib/vault/family-pack";
import { formatThb } from "@/lib/vault/format";
import { relationshipLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { Beneficiary } from "@/lib/vault/types";
import { toast } from "sonner";
import { VaultMark } from "./vault-mark";

const paperInk =
  "border-paper-foreground/30 bg-transparent text-paper-foreground hover:bg-paper-foreground hover:text-paper focus-visible:ring-paper-foreground";
const paperSolid = "bg-paper-foreground text-paper hover:bg-paper-foreground/90 focus-visible:ring-paper-foreground";

export function HeirPacket({ heir, onClose }: { heir: Beneficiary; onClose: () => void }) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const assigned = vault.assets.filter((a) => a.beneficiaryIds.includes(heir.id));
  const letters = vault.letters.filter((l) => l.toBeneficiaryId === heir.id);
  const value = heirValue(vault, heir.id);

  function savePack() {
    downloadText(familyPackFileName(heir), familyPackHtml(vault, heir, lang), "text/html;charset=utf-8");
    toast(t("familyPackSaved"));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/80 p-4 scrollbar-none md:p-10">
      <article className="print-sheet paper-grain relative mx-auto max-w-2xl rounded-xl p-6 text-paper-foreground shadow-soft md:p-10">
        <Button
          variant="ghost"
          size="icon"
          className={`no-print absolute top-3 right-3 ${paperInk}`}
          onClick={onClose}
          aria-label={t("closePreview")}
        >
          <X />
        </Button>

        <header className="border-b border-paper-foreground/10 pr-12 pb-6">
          <div className="flex items-center gap-2 text-paper-muted">
            <VaultMark className="size-6 text-paper-foreground" />
            <span className="text-xs tracking-[0.2em] uppercase">Vaulty</span>
          </div>
          <h2 className="font-display mt-4 text-3xl tracking-tight">{t("packetTitle")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-muted">{t("packetLead")}</p>
          <div className="no-print mt-5 flex flex-wrap gap-3">
            <Button className={paperSolid} onClick={() => window.print()}>
              {t("printPacket")}
            </Button>
            <Button variant="outline" className={paperInk} onClick={savePack}>
              {t("downloadFamilyPack")}
            </Button>
          </div>
        </header>

        <p className="mt-5 rounded-md border border-paper-foreground/15 px-3 py-3 text-sm leading-relaxed">
          {t("packetLegal")}
        </p>
        <p className="mt-2 text-sm text-paper-muted">{t("packetSecretsOmitted")}</p>
        <p className="no-print mt-2 text-sm text-paper-muted">{t("printPdfHint")}</p>

        <section className="mt-8">
          <p className="text-xs tracking-wide text-paper-muted uppercase">{t("to")}</p>
          <p className="font-display text-2xl">{heir.name}</p>
          <p className="mt-1 text-sm text-paper-muted">
            {relationshipLabel[lang][heir.relationship]} · {heir.sharePercent}% ·{" "}
            {formatThb(value || (heir.sharePercent / 100) * totalValue(vault), lang)}
          </p>
          {heir.email || heir.phone ? (
            <p className="mt-1 text-sm text-paper-muted">{[heir.email, heir.phone].filter(Boolean).join(" · ")}</p>
          ) : null}
          {heir.notes ? <p className="mt-2 text-sm">{heir.notes}</p> : null}
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("packetAssets")}</h3>
          <ul className="mt-3 divide-y divide-paper-foreground/10">
            {assigned.length === 0 ? (
              <li className="py-3 text-sm text-paper-muted">{t("packetEmpty")}</li>
            ) : (
              assigned.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm">{a.name}</span>
                    <span className="font-mono text-sm tabular-nums">{formatThb(a.valueThb, lang)}</span>
                  </div>
                  <p className="mt-1 text-xs text-paper-muted">
                    {[a.institution, a.identifier, a.location].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        {letters.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("packetLetters")}</h3>
            {letters.map((l) => (
              <div key={l.id} className="mt-3 border border-paper-foreground/10 p-4">
                <p className="font-display text-lg">{l.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{l.body}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("packetWishes")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{vault.wishes.funeral || t("none")}</p>
          {vault.wishes.restingPlace ? (
            <p className="mt-2 text-sm leading-relaxed">{vault.wishes.restingPlace}</p>
          ) : null}
          {vault.wishes.digitalAfterlife ? (
            <p className="mt-2 text-sm leading-relaxed">{vault.wishes.digitalAfterlife}</p>
          ) : null}
          {vault.wishes.other ? <p className="mt-2 text-sm leading-relaxed">{vault.wishes.other}</p> : null}
          <p className="mt-2 text-sm text-paper-muted">
            {t("organDonation")}: {vault.wishes.organDonation ? (lang === "th" ? "ใช่" : "Yes") : lang === "th" ? "ไม่" : "No"}
          </p>
        </section>

        <section className="mt-8 border-t border-paper-foreground/10 pt-6">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("packetExecutor")}</h3>
          <p className="mt-2 text-sm">{vault.access.executorName || t("none")}</p>
          <p className="text-sm text-paper-muted">{vault.access.executorContact}</p>
          <p className="mt-4 text-xs tracking-wide text-paper-muted uppercase">{t("packetHowToRestore")}</p>
          <p className="mt-2 text-sm leading-relaxed text-paper-muted">{t("packetRestoreBody")}</p>
        </section>
      </article>
    </div>
  );
}
