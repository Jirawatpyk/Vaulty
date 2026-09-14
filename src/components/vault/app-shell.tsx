import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lock,
  Menu,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecoveryGate } from "@/components/vault/recovery-gate";
import { Wordmark } from "@/components/vault/vault-mark";
import { backupReason } from "@/lib/vault/backup";
import { t as translate, type I18nKey } from "@/lib/vault/i18n";
import { startTabGuard } from "@/lib/vault/tabs";
import { useT, useVaultStore } from "@/lib/vault/store";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const NAV: { to: string; icon: typeof LayoutDashboard; key: I18nKey }[] = [
  { to: "/vault", icon: LayoutDashboard, key: "overview" },
  { to: "/vault/assets", icon: Landmark, key: "assets" },
  { to: "/vault/heirs", icon: Users, key: "heirs" },
  { to: "/vault/wishes", icon: Heart, key: "wishes" },
  { to: "/vault/access", icon: KeyRound, key: "access" },
  { to: "/vault/docs", icon: ScrollText, key: "documents" },
];

const MOBILE_NAV = NAV.slice(0, 4);
const MORE_NAV = NAV.slice(4);

function isActivePath(pathname: string, to: string) {
  if (to === "/vault") return pathname === "/vault" || pathname === "/vault/";
  return pathname.startsWith(to);
}

function formatMmSs(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function useSessionGuard(
  minutes: number,
  onExpire: (kind: "idle" | "hide") => void,
  onWarn: () => void,
) {
  const [left, setLeft] = useState(minutes * 60_000);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onWarnRef = useRef(onWarn);
  onWarnRef.current = onWarn;
  const hiddenAt = useRef<number | null>(null);
  const last = useRef(Date.now());
  const warned = useRef(false);

  useEffect(() => {
    last.current = Date.now();
    warned.current = false;
    const bump = () => {
      last.current = Date.now();
      warned.current = false;
    };
    const onVis = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      if (hiddenAt.current && Date.now() - hiddenAt.current > 20_000) {
        onExpireRef.current("hide");
      }
      hiddenAt.current = null;
    };
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      const remain = minutes * 60_000 - (Date.now() - last.current);
      setLeft(remain);
      if (remain <= 30_000 && remain > 0 && !warned.current) {
        warned.current = true;
        onWarnRef.current();
      }
      if (remain <= 0) onExpireRef.current("idle");
    }, 1000);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, [minutes]);

  return left;
}

export function VaultLayout() {
  const status = useVaultStore((s) => s.status);
  const vault = useVaultStore((s) => s.vault);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "booting" || status === "unlocked") return;
    void navigate({ to: "/" });
  }, [status, navigate]);

  if (status !== "unlocked" || !vault) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Vaulty
      </div>
    );
  }

  return <AppShell />;
}

function AppShell() {
  const t = useT();
  const vault = useVaultStore((s) => s.vault)!;
  const isDemo = useVaultStore((s) => s.isDemo);
  const lock = useVaultStore((s) => s.lock);
  const lang = useVaultStore((s) => s.lang);
  const setLang = useVaultStore((s) => s.setLang);
  const minutes = useVaultStore((s) => s.autoLockMinutes);
  const persistError = useVaultStore((s) => s.error);
  const flush = useVaultStore((s) => s.flush);
  const backupDue = useVaultStore((s) => s.backupDue);
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const yieldToPeer = useVaultStore((s) => s.yieldToPeer);
  const peerView = useVaultStore((s) => s.peerView);
  const takeover = useVaultStore((s) => s.takeover);
  const recoveryReady = useVaultStore((s) => s.recoveryReady);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const left = useSessionGuard(
    minutes,
    (kind) => {
      lock(kind);
      toast(kind === "idle" || kind === "hide" ? translate(lang, "idleLock") : translate(lang, "locked"));
      void navigate({ to: "/" });
    },
    () => toast(translate(lang, "sessionWarn")),
  );

  useEffect(() => {
    return startTabGuard(() => {
      void flush().finally(() => {
        yieldToPeer();
        toast(translate(lang, "peerReadonly"));
      });
    });
  }, [flush, yieldToPeer, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "L" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doLock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function doLock() {
    lock("lock");
    toast(t("locked"));
    void navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#vault-main"
        className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("skipToContent")}
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <Wordmark className="px-2" />
        {isDemo ? (
          <p className="mt-2 px-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("demoBadge")}</p>
        ) : (
          <p className="mt-2 px-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("realVault")}</p>
        )}
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label={t("primaryNav")}>
          {NAV.map((item) => (
            <NavLink key={item.to} item={item} pathname={pathname} />
          ))}
        </nav>
        <Button variant="ghost" className="justify-start" onClick={doLock}>
          <Lock />
          {t("lock")}
        </Button>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 pt-safe pb-3 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Wordmark />
          </div>
          <p className="hidden truncate font-display text-lg md:block">{vault.profile.fullName}</p>
          <p
            className="tabular-nums text-xs text-muted-foreground md:text-sm"
            aria-live="polite"
            aria-label={`${t("sessionRemaining")} ${formatMmSs(left)}`}
          >
            <span className="md:hidden">{formatMmSs(left)}</span>
            <span className="hidden md:inline">
              {t("session")} · {t("sessionRemaining")} {formatMmSs(left)}
            </span>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <AuthChip />
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "th" ? "en" : "th")} aria-label={t("switchLang")}>
              {lang === "th" ? "EN" : "TH"}
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={doLock} aria-label={t("lock")}>
              <Lock />
            </Button>
          </div>
        </header>

        {peerView ? (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-border bg-secondary px-4 py-2 text-sm md:px-8"
          >
            <p>{t("peerReadonly")}</p>
            <Button size="sm" variant="outline" onClick={() => takeover()}>
              {t("editHere")}
            </Button>
          </div>
        ) : null}

        {left <= 60_000 ? (
          <div role="status" className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm md:hidden">
            {t("sessionWarn")} · {formatMmSs(left)}
          </div>
        ) : null}

        {backupDue ? (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm md:px-8"
          >
            <p>
              {translate(
                lang,
                backupReason() === "pin" ? "backupDuePin" : backupReason() === "stale" ? "backupDue" : "backupDueNever",
              )}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void exportBlob().then((blob) => {
                  if (!blob) return;
                  const file = new Blob([blob], { type: "application/json" });
                  const url = URL.createObjectURL(file);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "vaulty-sealed.json";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast(t("backupSaved"));
                });
              }}
            >
              {t("backupNow")}
            </Button>
          </div>
        ) : null}

        {persistError === "persist" ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm md:px-8"
          >
            <p>{t("persistFail")}</p>
            <Button size="sm" variant="outline" onClick={() => void flush()}>
              {t("retrySave")}
            </Button>
          </div>
        ) : null}

        <main id="vault-main" className="mx-auto max-w-5xl px-4 py-6 pb-nav md:px-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 overflow-hidden border-t border-border bg-card pb-safe md:hidden"
        aria-label={t("mobileNav")}
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-xs leading-tight",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={1.5} />
              <span className="max-w-full truncate">{t(item.key)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-xs leading-tight",
            more || MORE_NAV.some((item) => isActivePath(pathname, item.to))
              ? "text-foreground"
              : "text-muted-foreground",
          )}
          aria-label={t("more")}
          aria-expanded={more}
          onClick={() => setMore(true)}
        >
          <Menu className="size-5" strokeWidth={1.5} />
          <span className="max-w-full truncate">{t("more")}</span>
        </button>
      </nav>

      {more ? (
        <div className="fixed inset-0 z-40 bg-ink/70 md:hidden" onClick={() => setMore(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg">{t("moreTitle")}</p>
              <Button variant="ghost" size="icon" onClick={() => setMore(false)} aria-label={t("close")}>
                <X />
              </Button>
            </div>
            <div className="grid gap-1">
              {MORE_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMore(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                    isActivePath(pathname, item.to)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.5} />
                  {t(item.key)}
                </Link>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={doLock}>
              <Lock />
              {t("lock")}
            </Button>
          </div>
        </div>
      ) : null}

      {!isDemo && !recoveryReady ? <RecoveryGate /> : null}
    </div>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { to: string; icon: typeof LayoutDashboard; key: I18nKey };
  pathname: string;
}) {
  const t = useT();
  const Icon = item.icon;
  const active = isActivePath(pathname, item.to);
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} />
      {t(item.key)}
    </Link>
  );
}

function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-secondary" aria-hidden="true" />;
  if (!user) return null;
  return (
    <div className="hidden max-w-[11rem] truncate md:block">
      <UserButton />
    </div>
  );
}
