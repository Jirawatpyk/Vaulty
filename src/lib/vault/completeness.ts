import type { I18nKey } from "./i18n.ts";
import type { VaultData } from "./types.ts";
import { isOffsiteCustody, vaultCustody } from "./will-custody.ts";

export type Task = { key: I18nKey; done: boolean; weight: number };

export function vaultTasks(vault: VaultData): Task[] {
  const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
  return [
    {
      key: "taskProfile",
      done: Boolean(vault.profile.fullName && vault.profile.city && vault.profile.occupation),
      weight: 8,
    },
    { key: "taskAsset", done: vault.assets.length > 0, weight: 16 },
    { key: "taskHeir", done: vault.beneficiaries.length > 0, weight: 14 },
    {
      key: "taskShare",
      done: vault.beneficiaries.length > 0 && Math.abs(share - 100) < 0.5,
      weight: 10,
    },
    { key: "taskExecutor", done: Boolean(vault.access.executorName), weight: 12 },
    { key: "taskFuneral", done: Boolean(vault.wishes.funeral), weight: 12 },
    { key: "taskLetter", done: vault.letters.length > 0, weight: 10 },
    { key: "taskDoc", done: vault.documents.length > 0, weight: 8 },
    {
      key: "taskWillCustody",
      done: isOffsiteCustody(vaultCustody(vault)),
      weight: 8,
    },
    {
      key: "taskMarital",
      done:
        vault.assets.length === 0 ||
        vault.assets.filter((a) => a.valueThb > 0).every((a) => a.marital === "marital" || a.marital === "separate"),
      weight: 10,
    },
    { key: "taskCheckIn", done: vault.access.checkInDays > 0, weight: 8 },
  ];
}

export function completenessScore(vault: VaultData): number {
  const tasks = vaultTasks(vault);
  const total = tasks.reduce((s, t) => s + t.weight, 0);
  const got = tasks.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
  return Math.round((got / total) * 100);
}

export function totalValue(vault: VaultData): number {
  return vault.assets.reduce((s, a) => s + (Number.isFinite(a.valueThb) ? a.valueThb : 0), 0);
}

export function valueByCategory(vault: VaultData): { category: string; value: number }[] {
  const map = new Map<string, number>();
  for (const a of vault.assets) {
    map.set(a.category, (map.get(a.category) ?? 0) + a.valueThb);
  }
  return [...map.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

export function assignedValuesByHeir(vault: VaultData): Map<string, number> {
  const estate = totalValue(vault);
  const assigned = new Map<string, number>();
  for (const asset of vault.assets) {
    if (asset.beneficiaryIds.length === 0) continue;
    const each = asset.valueThb / asset.beneficiaryIds.length;
    for (const id of asset.beneficiaryIds) {
      assigned.set(id, (assigned.get(id) ?? 0) + each);
    }
  }
  const out = new Map<string, number>();
  for (const heir of vault.beneficiaries) {
    out.set(heir.id, assigned.has(heir.id) ? (assigned.get(heir.id) ?? 0) : (heir.sharePercent / 100) * estate);
  }
  return out;
}

export function heirValue(vault: VaultData, heirId: string): number {
  return assignedValuesByHeir(vault).get(heirId) ?? 0;
}
