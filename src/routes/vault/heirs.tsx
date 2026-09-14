import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/vault/chrome";
import { HeirDialog } from "@/components/vault/editors";
import { ConfirmDialog } from "@/components/vault/confirm-dialog";
import { HeirPacket } from "@/components/vault/heir-packet";
import { TaxEstimate } from "@/components/vault/tax-estimate";
import { downloadText } from "@/lib/vault/download";
import { allFamilyPacksHtml } from "@/lib/vault/family-pack";
import { CHART_COLORS } from "@/lib/vault/charts";
import { assignedValuesByHeir, totalValue } from "@/lib/vault/completeness";
import { estimateInheritanceTax } from "@/lib/vault/inheritance-tax";
import { formatPercent, formatThb, initials } from "@/lib/vault/format";
import { relationshipLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { Beneficiary } from "@/lib/vault/types";

export const Route = createFileRoute("/vault/heirs")({ component: HeirsPage });

function HeirsPage() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const peerView = useVaultStore((s) => s.peerView);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [packet, setPacket] = useState<Beneficiary | null>(null);
  const [pending, setPending] = useState<Beneficiary | null>(null);
  const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
  const estate = totalValue(vault);
  const values = assignedValuesByHeir(vault);
  const tax = estimateInheritanceTax(vault);
  const pie = vault.beneficiaries.map((b) => ({ name: b.name, value: b.sharePercent }));
  if (share < 100) pie.push({ name: t("remainder"), value: 100 - share });

  return (
    <div>
      <PageHeader
        title={t("heirs")}
        description={t("shareWarn")}
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            {vault.beneficiaries.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  downloadText("vaulty-family-packs.html", allFamilyPacksHtml(vault, lang), "text/html;charset=utf-8");
                  toast(t("familyPackSaved"));
                }}
              >
                {t("downloadAllPacks")}
              </Button>
            ) : null}
            <Button
              disabled={peerView}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus />
              {t("addHeir")}
            </Button>
          </div>
        }
      />

      <Panel className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("shareTotal")}</p>
          <p className="font-display text-3xl tabular-nums">{formatPercent(share)}</p>
        </div>
        {pie.length > 0 ? (
          <div className="h-28 w-28" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={28} outerRadius={46} paddingAngle={2} stroke="none" label={false} isAnimationActive={false}>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </Panel>

      <div className="mb-5">
        <TaxEstimate />
      </div>

      {vault.beneficiaries.length === 0 ? (
        <EmptyState
          title={t("emptyHeirs")}
          hint={t("emptyHeirsHint")}
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("addHeir")}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {vault.beneficiaries.map((heir) => {
            const value = values.get(heir.id) || (heir.sharePercent / 100) * estate;
            const row = tax.rows.find((r) => r.heirId === heir.id);
            return (
              <li key={heir.id} className="rounded-xl bg-card p-5 hairline">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-secondary font-display text-sm">
                    {initials(heir.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{heir.name}</p>
                    <p className="text-sm text-muted-foreground">{relationshipLabel[lang][heir.relationship]}</p>
                  </div>
                  <Badge variant="solid">{formatPercent(heir.sharePercent)}</Badge>
                </div>
                <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">{t("assignedValue")}</p>
                <p className="font-display text-2xl tabular-nums">{formatThb(value, lang)}</p>
                {row && row.tax > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("taxDue")} {formatThb(row.tax, lang)}
                  </p>
                ) : null}
                {heir.notes ? <p className="mt-2 text-sm text-muted-foreground">{heir.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(heir);
                      setOpen(true);
                    }}
                  >
                    {t("edit")}
                  </Button>
                  <Button size="sm" variant="paper" onClick={() => setPacket(heir)}>
                    {t("previewPacket")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPending(heir)}>
                    <Trash2 />
                    {t("delete")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <HeirDialog open={open} onOpenChange={setOpen} initial={editing} />
      {packet ? <HeirPacket heir={packet} onClose={() => setPacket(null)} /> : null}
      <ConfirmDialog
        open={Boolean(pending)}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          patch(
            (v) => ({
              ...v,
              beneficiaries: v.beneficiaries.filter((b) => b.id !== pending.id),
              assets: v.assets.map((a) => ({
                ...a,
                beneficiaryIds: a.beneficiaryIds.filter((id) => id !== pending.id),
              })),
            }),
            lang === "th" ? `ลบทายาท: ${pending.name}` : `Deleted heir: ${pending.name}`,
          );
          toast(t("deleted"));
          setPending(null);
        }}
      />
    </div>
  );
}
