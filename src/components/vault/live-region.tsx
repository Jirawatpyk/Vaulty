import { useVaultStore } from "@/lib/vault/store";

export function LiveRegion() {
  const announce = useVaultStore((s) => s.announce);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announce}
    </div>
  );
}
