import { useEffect } from "react";
import { useVaultStore } from "@/lib/vault/store";

export function VaultHydrator() {
  const hydrate = useVaultStore((s) => s.hydrate);
  const lang = useVaultStore((s) => s.lang);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const flush = () => {
      void useVaultStore.getState().flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);
  return null;
}
