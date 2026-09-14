import type { VaultData } from "./types.ts";

export function redactVault(vault: VaultData): VaultData {
  return {
    ...vault,
    assets: vault.assets.map((a) => ({ ...a, secret: "" })),
    documents: vault.documents.map((d) => ({ ...d, secret: "" })),
  };
}
