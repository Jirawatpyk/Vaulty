import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { CompletenessRing } from "@/components/vault/completeness-ring";
import { categoryIcon } from "@/components/vault/icons";
import { PageHeader, Panel } from "@/components/vault/chrome";
import { NudgePanel } from "@/components/vault/nudge-panel";
import { completenessScore, totalValue, valueByCategory, vaultTasks } from "@/lib/vault/completeness";
import { estimateInheritanceTax } from "@/lib/vault/inheritance-tax";
import { maritalSplit, maritalWarning } from "@/lib/vault/marital";
import { CHART_COLORS } from "@/lib/vault/charts";
import { addDaysIso, formatCompactThb, formatThb, relativeTime } from "@/lib/vault/format";
import { categoryLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { AssetCategory } from "@/lib/vault/types";
import { custodyStatus, custodyStatusKey, vaultCustody } from "@/lib/vault/will-custody";

export const Route = createFileRoute("/vault/")({ component: OverviewPage });

function OverviewPage() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const checkIn = useVaultStore((s) => s.checkIn);
  const score = useMemo(() => completenessScore(vault), [vault]);
  const worth = useMemo(() => totalValue(vault), [vault]);
  const split = useMemo(() => maritalSplit(vault), [vault]);
  const maritalWarn = useMemo(() => maritalWarning(split, lang), [split, lang]);
  const tax = useMemo(() => estimateInheritanceTax(vault), [vault]);
  const tasks = useMemo(() => vaultTasks(vault), [vault]);
  const missing = tasks.filter((x) => !x.done);
  const mix = useMemo(() => valueByCategory(vault), [vault]);
  const next = addDaysIso(vault.access.lastCheckIn, vault.access.checkInDays);
  const overdue = new Date(next).getTime() < Date.now();

  const pieData = useMemo(
    () =>
      mix.map((m) => ({
        name: categoryLabel[lang][m.category as AssetCategory] ?? m.category,
        value: m.value,
      })),
    [mix, lang],
  );

  return (
    <div>
      <PageHeader
        title={vault.profile.fullName || t("overview")}
        description={`${vault.profile.occupation || t("none")} · ${vault.profile.city || t("none")}`}
        action={
          <Button variant={overdue ? "default" : "outline"} onClick={checkIn}>
            {t("checkInNow")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <p className="text-sm tracking-wide text-muted-foreground">{t("netWorth")}</p>
          <p className="font-display mt-2 text-4xl tracking-tight tabular-nums">{formatThb(worth, lang)}</p>
          {split.hasSpouse || split.marital > 0 || split.unknown > 0 ? (
            <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
              <p>{t("maritalPanel")}</p>
              <p>
                {t("maritalSpouseHalf")} {formatThb(split.spouseHalf, lang)}
                {split.spouseName ? ` · ${split.spouseName}` : ""}
              </p>
              <p className="text-foreground">
                {t("maritalEstate")} {formatThb(split.estate, lang)}
              </p>
              {maritalWarn ? <p className="text-warn">{maritalWarn}</p> : null}
            </div>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            {t("taxTitle")} · {tax.anyoneLiable ? formatThb(tax.totalTax, lang) : t("taxUnderShort")}
          </p>
          <p className={`mt-2 text-sm ${custodyStatus(vaultCustody(vault)) === "offsite" ? "text-muted-foreground" : "text-warn"}`}>
            {t("willCustodyTitle")} · {t(custodyStatusKey(vaultCustody(vault)))}
            {custodyStatus(vaultCustody(vault)) !== "offsite" ? (
              <>
                {" · "}
                <Link to="/vault/access" className="underline-offset-2 hover:underline">
                  {t("willCustodyGo")}
                </Link>
              </>
            ) : null}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label={t("assets")} value={String(vault.assets.length)} />
            <Stat label={t("totalHeirs")} value={String(vault.beneficiaries.length)} />
            <Stat label={t("totalDocs")} value={String(vault.documents.length)} />
          </div>
        </Panel>
        <Panel className="flex items-center gap-5">
          <CompletenessRing value={score} label={t("completeness")} />
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("completeness")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {missing.length === 0 ? t("markComplete") : `${missing.length} · ${t("pendingTasks")}`}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <NudgePanel />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">{t("allocation")}</h2>
            <Link to="/vault/assets" className="text-xs text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </div>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("emptyAssets")}</p>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="h-52 min-w-0 overflow-hidden" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={2}
                      stroke="none"
                      label={false}
                      isAnimationActive={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCompactThb(Number(v ?? 0), lang)}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        color: "var(--color-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {mix.slice(0, 5).map((m, i) => {
                  const Icon = categoryIcon[m.category as AssetCategory];
                  return (
                    <li key={m.category} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        {Icon ? <Icon className="size-3.5" /> : null}
                        {categoryLabel[lang][m.category as AssetCategory]}
                      </span>
                      <span className="tabular-nums">{formatCompactThb(m.value, lang)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-xl">{overdue ? t("checkInOverdue") : t("checkInOk")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("overdueHint")}</p>
          <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">{t("lastCheckIn")}</p>
          <p className="text-sm">{relativeTime(vault.access.lastCheckIn, lang)}</p>
          <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">{t("nextCheckIn")}</p>
          <p className="text-sm">{relativeTime(next, lang)}</p>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-xl">{t("handoffTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("handoffLead")}</p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link to="/vault/access">{t("access")}</Link>
          </Button>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-xl">{t("pendingTasks")}</h2>
          <ul className="mt-4 space-y-2">
            {missing.length === 0 ? (
              <li className="text-sm text-success">{t("markComplete")}</li>
            ) : (
              missing.map((task) => (
                <li key={task.key} className="flex items-center gap-3 text-sm">
                  <span className="size-1.5 rounded-full bg-warn" />
                  {t(task.key)}
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl">{t("recentActivity")}</h2>
          <ul className="mt-4 space-y-3">
            {vault.activity.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span>{a.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.at, lang)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary px-3 py-3">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
