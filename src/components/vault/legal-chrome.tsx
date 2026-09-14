import type { ReactNode } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/vault/consent-box";
import { Wordmark } from "@/components/vault/vault-mark";
import { LEGAL_VERSION } from "@/lib/vault/legal";
import { useT, useVaultStore } from "@/lib/vault/store";

export function LegalLayout() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const setLang = useVaultStore((s) => s.setLang);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Link to="/" aria-label={t("appName")}>
          <Wordmark />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "th" ? "en" : "th")} aria-label={t("switchLang")}>
            {lang === "th" ? "EN" : "TH"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">{t("back")}</Link>
          </Button>
        </div>
      </header>
      <Outlet />
      <footer className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-muted-foreground">
        <LegalLinks />
        <p className="mt-3">{t("legalNotAdvice")}</p>
      </footer>
    </div>
  );
}

export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{t("legalKicker")}</p>
      <h1 className="font-display mt-3 text-3xl tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legalUpdated")} {updated} · {t("legalVersion")} {LEGAL_VERSION}
      </p>
      <div className="mt-8 grid gap-8">{children}</div>
    </main>
  );
}
