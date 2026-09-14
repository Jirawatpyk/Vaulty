import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/vault/store";
import { cn } from "@/lib/utils";

export function LegalLinks({ className }: { className?: string }) {
  const t = useT();
  return (
    <p className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm", className)}>
      <Link to="/legal/terms" className="underline-offset-2 hover:underline">
        {t("termsLink")}
      </Link>
      <span className="text-border" aria-hidden="true">
        ·
      </span>
      <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
        {t("privacyLink")}
      </Link>
    </p>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed">
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function AccountConsentBox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: boolean;
}) {
  const t = useT();
  return (
    <div className={cn("rounded-md bg-secondary px-4 py-3", error && "ring-2 ring-destructive")}>
      <CheckRow id="consent-account" checked={checked} onChange={onChange}>
        {t("consentAccount")}{" "}
        <Link to="/legal/terms" className="underline-offset-2 hover:underline">
          {t("termsLink")}
        </Link>{" "}
        {t("consentAnd")}{" "}
        <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
          {t("privacyLink")}
        </Link>
      </CheckRow>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {t("consentNeed")}
        </p>
      ) : null}
    </div>
  );
}

export function PurposeConsentBox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="rounded-md bg-secondary px-4 py-3">
      <CheckRow id={id} checked={checked} onChange={onChange}>
        {label}
      </CheckRow>
    </div>
  );
}
