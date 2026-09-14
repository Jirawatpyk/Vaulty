import { useEffect } from "react";
import { Delete, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/vault/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  value,
  onChange,
  disabled,
  shake,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  shake?: boolean;
  length?: number;
}) {
  const t = useT();

  function press(key: string) {
    if (disabled) return;
    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (!key || value.length >= length) return;
    onChange(value + key);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (document.querySelector("[role=alertdialog]")) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("del");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, value, length, onChange]);

  return (
    <div className="flex flex-col items-center gap-6" role="group" aria-label={t("enterPin")}>
      <div
        className={cn("flex gap-2.5", shake && "shake")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${t("pinProgress")} ${value.length} / ${length}`}
      >
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3 rounded-full transition-[background-color,transform] duration-150 ease-out",
              i < value.length ? "scale-110 bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        {KEYS.map((key, i) => {
          if (key === "") {
            return (
              <div
                key="blank"
                aria-hidden
                className="flex size-16 items-center justify-center text-muted-foreground/50 sm:size-[4.5rem]"
              >
                <Fingerprint className="size-5" strokeWidth={1.25} />
              </div>
            );
          }
          const isDel = key === "del";
          return (
            <button
              key={`${key}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              aria-label={isDel ? t("pinDelete") : `${t("pinDigit")} ${key}`}
              className={cn(
                "flex size-16 items-center justify-center rounded-lg text-xl font-medium text-foreground transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] sm:size-[4.5rem]",
                "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40",
              )}
            >
              {isDel ? <Delete className="size-5" strokeWidth={1.5} /> : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
