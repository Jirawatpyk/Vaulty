import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-card px-6 py-16 text-center hairline">
      <p className="font-display text-xl text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{hint}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  className,
  error,
  required,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
        {required ? (
          <span className="text-destructive">
            {" "}
            *
            <span className="sr-only"> required</span>
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Panel({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("rounded-xl bg-card p-5 hairline", className)}>
      {children}
    </section>
  );
}
