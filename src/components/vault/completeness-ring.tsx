export function CompletenessRing({ value, label }: { value: number; label?: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;
  return (
    <div
      className="relative size-28"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth="4" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-display text-2xl tabular-nums tracking-tight">{clamped}</span>
        <span className="text-[10px] tracking-wide text-muted-foreground">%</span>
      </div>
    </div>
  );
}
