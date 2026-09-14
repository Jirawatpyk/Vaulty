import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/vault/download";
import { formatThb } from "@/lib/vault/format";
import { totalValue } from "@/lib/vault/completeness";
import { lawyerBriefFileName, lawyerBriefGaps, lawyerBriefHtml } from "@/lib/vault/lawyer-brief";
import { maritalSplit, maritalWarning } from "@/lib/vault/marital";
import { estimateInheritanceTax } from "@/lib/vault/inheritance-tax";
import { categoryLabel, documentLabel, maritalLabel, relationshipLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import { VaultMark } from "./vault-mark";
import { custodyPlainText, custodyStatus, vaultCustody } from "@/lib/vault/will-custody";

const paperInk =
  "border-paper-foreground/30 bg-transparent text-paper-foreground hover:bg-paper-foreground hover:text-paper focus-visible:ring-paper-foreground";
const paperSolid = "bg-paper-foreground text-paper hover:bg-paper-foreground/90 focus-visible:ring-paper-foreground";

export function LawyerBrief({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
  const split = maritalSplit(vault);
  const maritalWarn = maritalWarning(split, lang);
  const tax = estimateInheritanceTax(vault);
  const gaps = lawyerBriefGaps(vault);
  const willDocs = vault.documents.filter((d) => d.kind === "will");
  const otherDocs = vault.documents.filter((d) => d.kind !== "will");

  function save() {
    downloadText(lawyerBriefFileName(lang), lawyerBriefHtml(vault, lang), "text/html;charset=utf-8");
    toast(t("lawyerBriefSaved"));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/80 p-4 scrollbar-none md:p-10">
      <article className="print-sheet paper-grain relative mx-auto max-w-3xl rounded-xl p-6 text-paper-foreground shadow-soft md:p-10">
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
            <span className="text-xs tracking-[0.2em] uppercase">Vaulty · {t("lawyerBriefKicker")}</span>
          </div>
          <h2 className="font-display mt-4 text-3xl tracking-tight">{t("lawyerBriefTitle")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-muted">{t("lawyerBriefLead")}</p>
          <div className="no-print mt-5 flex flex-wrap gap-3">
            <Button className={paperSolid} onClick={() => window.print()}>
              {t("printPacket")}
            </Button>
            <Button variant="outline" className={paperInk} onClick={save}>
              {t("downloadLawyerBrief")}
            </Button>
          </div>
        </header>

        <div className="mt-5 rounded-md border border-[#8a3b2a]/40 bg-[#f7ebe4] px-4 py-3 text-sm leading-relaxed text-paper-foreground">
          <p className="font-medium">{t("lawyerNotWill")}</p>
          <p className="mt-1">{t("lawyerNotWillBody")}</p>
        </div>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerFormsTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{t("lawyerForms")}</p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerLimitsTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{t("lawyerLimits")}</p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("maritalPanel")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{t("maritalHint")}</p>
          {maritalWarn ? <p className="mt-2 text-sm text-[#8a3b2a]">{maritalWarn}</p> : null}
          <ul className="mt-3 grid gap-1 text-sm">
            <li>
              {t("maritalGross")} {formatThb(split.gross, lang)}
            </li>
            <li>
              {t("maritalPool")} {formatThb(split.marital, lang)}
            </li>
            <li>
              {t("maritalSpouseHalf")} {formatThb(split.spouseHalf, lang)}
              {split.spouseName ? ` · ${split.spouseName}` : ""}
            </li>
            <li>
              {t("maritalSeparate")} {formatThb(split.separate, lang)}
            </li>
            <li>
              {t("maritalUnknown")} {formatThb(split.unknown, lang)}
            </li>
            <li className="font-medium">
              {t("maritalEstate")} {formatThb(split.estate, lang)}
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <p className="text-xs tracking-wide text-paper-muted uppercase">{t("occupancy")}</p>
          <p className="font-display text-2xl">{vault.profile.fullName || "—"}</p>
          <p className="mt-1 text-sm text-paper-muted">
            {t("born")} {vault.profile.dateOfBirth || "—"} · {vault.profile.city || "—"} ·{" "}
            {vault.profile.occupation || "—"}
          </p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerGapsTitle")}</h3>
          {gaps.length === 0 ? (
            <p className="mt-2 text-sm">{t("lawyerGapsNone")}</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {gaps.map((g) => (
                <li key={g}>{t(g)}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("heirs")}</h3>
          <p className="mt-1 text-sm text-paper-muted">
            {t("share")} {share}% · {t("netWorth")} {formatThb(totalValue(vault), lang)}
          </p>
          <ul className="mt-3 grid gap-2">
            {vault.beneficiaries.map((b) => (
              <li key={b.id} className="text-sm">
                <span className="font-medium">{b.name}</span>
                <span className="text-paper-muted">
                  {" "}
                  · {relationshipLabel[lang][b.relationship]} · {b.sharePercent}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("assets")}</h3>
          <ul className="mt-3 grid gap-3">
            {vault.assets.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium">{a.name}</p>
                <p className="text-paper-muted">
                  {categoryLabel[lang][a.category]} · {a.identifier || "—"} · {formatThb(a.valueThb, lang)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("taxTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{t("taxLead")}</p>
          <p className="mt-2 text-sm">{tax.anyoneLiable ? formatThb(tax.totalTax, lang) : t("taxNone")}</p>
          <ul className="mt-3 grid gap-1 text-sm">
            {tax.rows.map((r) => (
              <li key={r.heirId}>
                {r.name} · {r.band === "exempt" || r.tax === 0 ? t("taxNone") : formatThb(r.tax, lang)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-paper-muted">{t("taxHint")}</p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("willCustodyTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed">{custodyPlainText(vaultCustody(vault), lang)}</p>
          {vaultCustody(vault).notes.trim() ? (
            <p className="mt-2 text-sm text-paper-muted">{vaultCustody(vault).notes}</p>
          ) : null}
          {custodyStatus(vaultCustody(vault)) === "home" ? (
            <p className="mt-2 text-sm">{t("willCustodyHomeWarn")}</p>
          ) : null}
          <p className="mt-2 text-sm text-paper-muted">{t("willCustodyLegal")}</p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerWillDocs")}</h3>
          {willDocs.length === 0 ? (
            <p className="mt-2 text-sm text-paper-muted">{t("none")}</p>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {willDocs.map((d) => (
                <li key={d.id}>
                  {d.title} — {documentLabel[lang][d.kind]}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("documents")}</h3>
          {otherDocs.length === 0 ? (
            <p className="mt-2 text-sm text-paper-muted">{t("none")}</p>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {otherDocs.map((d) => (
                <li key={d.id}>
                  {d.title} — {documentLabel[lang][d.kind]}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerHowTitle")}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>{t("lawyerCheck1")}</li>
            <li>{t("lawyerCheck2")}</li>
            <li>{t("lawyerCheck3")}</li>
            <li>{t("lawyerCheck4")}</li>
            <li>{t("lawyerCheck5")}</li>
          </ol>
        </section>

        <section className="mt-8">
          <h3 className="text-xs tracking-wide text-paper-muted uppercase">{t("lawyerSignTitle")}</h3>
          <p className="mt-2 text-sm text-paper-muted">{t("lawyerSignLead")}</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <p className="border-t border-paper-foreground/40 pt-2 text-sm">{t("lawyerSignOwner")}</p>
            <p className="border-t border-paper-foreground/40 pt-2 text-sm">{t("lawyerSignDate")}</p>
            <p className="border-t border-paper-foreground/40 pt-2 text-sm">{t("lawyerSignCounsel")}</p>
            <p className="border-t border-paper-foreground/40 pt-2 text-sm">{t("lawyerSignDate")}</p>
          </div>
        </section>

        <p className="mt-8 text-sm text-paper-muted">{t("packetSecretsOmitted")}</p>
      </article>
    </div>
  );
}
