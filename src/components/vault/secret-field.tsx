import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/vault/store";

export function SecretField({ value }: { value: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!value) return <p className="text-sm text-muted-foreground">{t("none")}</p>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast(t("secretCopied"));
      window.setTimeout(() => {
        void navigator.clipboard.writeText("").catch(() => undefined);
      }, 30_000);
    } catch {
      toast(t("secretCopied"));
    }
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="font-mono text-sm leading-relaxed break-all text-foreground">
        {open ? value : "•".repeat(Math.min(22, Math.max(8, value.length)))}
      </p>
      <div className="flex shrink-0 gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={() => void copy()} aria-label={t("copySecret")}>
          <Copy />
          {t("copySecret")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? <EyeOff /> : <Eye />}
          {open ? t("hide") : t("reveal")}
        </Button>
      </div>
    </div>
  );
}
