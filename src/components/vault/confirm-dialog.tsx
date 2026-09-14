import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/vault/focus-trap";
import { useT } from "@/lib/vault/store";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref, onCancel);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
    >
      <div className="w-full max-w-md rounded-xl bg-card p-6 hairline">
        <h2 id="confirm-title" className="font-display text-xl">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-sm text-muted-foreground">
          {body}
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {confirmLabel ?? t("confirmDelete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
