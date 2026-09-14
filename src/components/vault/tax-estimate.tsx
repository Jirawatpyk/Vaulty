import { formatCompactThb, formatThb } from "@/lib/vault/format";
import { estimateInheritanceTax } from "@/lib/vault/inheritance-tax";
import { relationshipLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import { Panel } from "./chrome";

export function TaxEstimate({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const est = estimateInheritanceTax(vault);

  return (
    <Panel>
      <h2 className="font-display text-xl">{t("taxTitle")}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("taxLead")}</p>
      {est.anyoneLiable ? (
        <p className="font-display mt-4 text-3xl tracking-tight tabular-nums">{formatThb(est.totalTax, lang)}</p>
      ) : (
        <p className="font-display mt-4 text-2xl tracking-tight">{t("taxUnderShort")}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{est.anyoneLiable ? t("taxDue") : t("taxNone")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("taxAllowance")} {formatCompactThb(est.allowance, lang)}
      </p>
      {!compact && est.rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-border">
          {est.rows.map((row) => (
            <li key={row.heirId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 text-sm">
              <span className="min-w-0">
                {row.name}
                <span className="text-muted-foreground"> · {relationshipLabel[lang][row.relationship]}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {row.band === "exempt"
                  ? t("taxExemptShort")
                  : row.tax > 0
                    ? formatThb(row.tax, lang)
                    : t("taxUnderShort")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("taxHint")}</p>
    </Panel>
  );
}
