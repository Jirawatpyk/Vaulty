import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { EMAIL_RE } from "./validate.ts";
import { isSafeWebhookUrl, sanitizeInterval, sanitizeNoticeLabel, type ArmInput, type SwitchLang } from "./deadman.ts";

function parseArm(input: unknown): ArmInput {
  const o = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = String(o.email ?? "").trim().toLowerCase();
  if (!email || email.length > 120 || !EMAIL_RE.test(email)) throw new Error("invalid email");
  const webhookUrl = String(o.webhookUrl ?? "").trim().slice(0, 300);
  if (webhookUrl && !isSafeWebhookUrl(webhookUrl)) throw new Error("webhook host not allowed");
  const lang: SwitchLang = o.lang === "en" ? "en" : "th";
  return {
    email,
    lineToken: String(o.lineToken ?? "").trim().slice(0, 256) || undefined,
    lineTo: String(o.lineTo ?? "").trim().slice(0, 64) || undefined,
    webhookUrl: webhookUrl || undefined,
    ownerLabel: sanitizeNoticeLabel(String(o.ownerLabel ?? "")),
    lang,
    intervalDays: sanitizeInterval(o.intervalDays),
  };
}

export const getDeadman = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { readSwitch, recentOutbox } = await import("./deadman.server");
    const switchState = await readSwitch(context.userId);
    const outbox = switchState ? await recentOutbox(context.userId) : [];
    return { switchState, outbox };
  });

export const armDeadman = createServerFn({ method: "POST" })
  .validator(parseArm)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { readConsent } = await import("./consent.server");
    const { isConsentLive } = await import("./legal.ts");
    const { requireFeature } = await import("./billing.server");
    const { armSwitch } = await import("./deadman.server");
    if (!isConsentLive(await readConsent(context.userId), "notify")) throw new Error("consent");
    await requireFeature(context.userId, data.lineToken ? "deadman_line" : "deadman_arm");
    return armSwitch(context.userId, data);
  });

export const pingDeadman = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = input && typeof input === "object" ? (input as { intervalDays?: unknown }) : {};
    return { intervalDays: sanitizeInterval(o.intervalDays) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { pingSwitch } = await import("./deadman.server");
    return pingSwitch(context.userId, data.intervalDays);
  });

export const disarmDeadman = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { disarmSwitch } = await import("./deadman.server");
    return disarmSwitch(context.userId);
  });

export const testDeadman = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fireOne } = await import("./deadman.server");
    return fireOne(context.userId, { force: true });
  });
