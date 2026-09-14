import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { CLOUD_MAX_CHARS } from "./cloud-backup.ts";

function parsePut(input: unknown): { blob: string; ownerLabel: string } {
  const o = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const blob = typeof o.blob === "string" ? o.blob : "";
  if (!blob || blob.length > CLOUD_MAX_CHARS) throw new Error("size");
  return { blob, ownerLabel: String(o.ownerLabel ?? "").slice(0, 80) };
}

export const getCloudBackupMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { readCloudMeta } = await import("./cloud-backup.server");
    return readCloudMeta(context.userId);
  });

export const pullCloudBackup = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireFeature } = await import("./billing.server");
    const { pullCloudBackup: pull } = await import("./cloud-backup.server");
    await requireFeature(context.userId, "cloud_read");
    return pull(context.userId);
  });

export const putCloudBackup = createServerFn({ method: "POST" })
  .validator(parsePut)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { readConsent } = await import("./consent.server");
    const { isConsentLive } = await import("./legal.ts");
    const { requireFeature } = await import("./billing.server");
    const { putCloudBackup: put } = await import("./cloud-backup.server");
    if (!isConsentLive(await readConsent(context.userId), "cloud")) throw new Error("consent");
    await requireFeature(context.userId, "cloud_write");
    return put(context.userId, data.blob, data.ownerLabel);
  });

export const deleteCloudBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { deleteCloudBackup: drop } = await import("./cloud-backup.server");
    return drop(context.userId);
  });
