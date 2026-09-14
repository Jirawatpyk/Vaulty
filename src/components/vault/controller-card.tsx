import { controllerFacts } from "@/lib/vault/operator";
import { useVaultStore } from "@/lib/vault/store";

export function ControllerCard() {
  const lang = useVaultStore((s) => s.lang);
  const facts = controllerFacts(lang);
  return (
    <dl className="grid gap-3 rounded-lg bg-secondary/40 p-4 hairline">
      {facts.map((fact) => (
        <div key={fact.label} className="grid gap-0.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">{fact.label}</dt>
          <dd className="text-sm break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
