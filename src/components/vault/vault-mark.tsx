import { cn } from "@/lib/utils";

export function VaultMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-primary", className)}
      fill="none"
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.25" opacity="0.45" />
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="32" cy="32" r="13" stroke="currentColor" strokeWidth="1.25" opacity="0.7" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x = 32 + Math.cos(a) * 22;
        const y = 32 + Math.sin(a) * 22;
        return <circle key={i} cx={x} cy={y} r="2.1" fill="currentColor" />;
      })}
      <circle cx="32" cy="32" r="4.2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <VaultMark className="size-7" />
      <span className="font-display text-xl tracking-tight text-foreground">Vaulty</span>
    </div>
  );
}
