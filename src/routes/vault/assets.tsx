import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/vault/chrome";
import { AssetDialog } from "@/components/vault/editors";
import { ConfirmDialog } from "@/components/vault/confirm-dialog";
import { categoryIcon } from "@/components/vault/icons";
import { SecretField } from "@/components/vault/secret-field";
import { formatThb, relativeTime } from "@/lib/vault/format";
import { categoryLabel, maritalLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import { ASSET_CATEGORIES, type Asset, type AssetCategory } from "@/lib/vault/types";

export const Route = createFileRoute("/vault/assets")({ component: AssetsPage });

function AssetsPage() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AssetCategory | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);
  const [pending, setPending] = useState<Asset | null>(null);
  const [shown, setShown] = useState(40);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return vault.assets.filter((a) => {
      if (cat !== "all" && a.category !== cat) return false;
      if (!query) return true;
      return `${a.name} ${a.institution} ${a.location}`.toLowerCase().includes(query);
    });
  }, [vault.assets, cat, q]);

  const visible = list.slice(0, shown);

  return (
    <div>
      <PageHeader
        title={t("assets")}
        description={`${vault.assets.length} ${t("itemCount")}`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            {t("addAsset")}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <Input
          className="max-w-md"
          placeholder={t("search")}
          aria-label={t("search")}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(40);
          }}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("allCategories")}>
          <FilterChip
            active={cat === "all"}
            onClick={() => {
              setCat("all");
              setShown(40);
            }}
          >
            {t("allCategories")}
          </FilterChip>
          {ASSET_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={cat === c}
              onClick={() => {
                setCat(c);
                setShown(40);
              }}
            >
              {categoryLabel[lang][c]}
            </FilterChip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={vault.assets.length === 0 ? t("emptyAssets") : t("noResults")}
          hint={vault.assets.length === 0 ? t("emptyAssetsHint") : t("noResultsHint")}
          action={
            vault.assets.length === 0 ? (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("addAsset")}
            </Button>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((asset) => {
            const Icon = categoryIcon[asset.category];
            const heirs = vault.beneficiaries.filter((b) => asset.beneficiaryIds.includes(b.id));
            return (
              <li key={asset.id} className="rounded-xl bg-card p-4 hairline sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.institution}
                          {asset.identifier ? ` · ${asset.identifier}` : ""}
                        </p>
                      </div>
                      <p className="font-display text-xl tabular-nums">{formatThb(asset.valueThb, lang)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge>{categoryLabel[lang][asset.category]}</Badge>
                      <Badge variant={asset.marital === "unknown" ? "warn" : "outline"}>
                        {maritalLabel[lang][asset.marital ?? "unknown"]}
                      </Badge>
                      {asset.location ? <Badge variant="outline">{asset.location}</Badge> : null}
                      {heirs.length === 0 ? (
                        <Badge variant="warn">{t("unassigned")}</Badge>
                      ) : (
                        heirs.map((h) => (
                          <Badge key={h.id} variant="outline">
                            {h.name}
                          </Badge>
                        ))
                      )}
                    </div>
                    {asset.notes ? <p className="mt-3 text-sm text-muted-foreground">{asset.notes}</p> : null}
                    {reveal === asset.id && asset.secret ? (
                      <div className="mt-3 rounded-md bg-secondary p-3">
                        <SecretField value={asset.secret} />
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(asset);
                          setOpen(true);
                        }}
                      >
                        {t("edit")}
                      </Button>
                      {asset.secret ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReveal((id) => (id === asset.id ? null : asset.id))}
                        >
                          {reveal === asset.id ? t("hide") : t("reveal")}
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => setPending(asset)}>
                        <Trash2 />
                        {t("delete")}
                      </Button>
                      <span className="ml-auto self-center text-xs text-muted-foreground">
                        {t("lastUpdated")} {relativeTime(asset.updatedAt, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > 0 && shown < list.length ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setShown((n) => n + 40)}>
            {t("showMore")} · {list.length - shown}
          </Button>
        </div>
      ) : null}

      <AssetDialog open={open} onOpenChange={setOpen} initial={editing} />
      <ConfirmDialog
        open={Boolean(pending)}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          patch(
            (v) => ({ ...v, assets: v.assets.filter((a) => a.id !== pending.id) }),
            lang === "th" ? `ลบทรัพย์สิน: ${pending.name}` : `Deleted asset: ${pending.name}`,
          );
          toast(t("deleted"));
          setPending(null);
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "h-10 shrink-0 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground"
          : "h-10 shrink-0 rounded-full bg-secondary px-3.5 text-xs font-medium text-muted-foreground"
      }
    >
      {children}
    </button>
  );
}
