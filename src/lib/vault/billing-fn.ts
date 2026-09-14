import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isPlanCode, parseProfile, type PlanCode } from "./billing.ts";

function parseActivate(input: unknown): { plan: PlanCode; lang: "th" | "en" } {
  const o = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  if (!isPlanCode(o.plan) || o.plan === "free") throw new Error("plan");
  return { plan: o.plan, lang: o.lang === "en" ? "en" : "th" };
}

export const getBilling = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadSnapshot } = await import("./billing.server");
    return loadSnapshot(context.userId);
  });

export const startBillingTrial = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { startTrial } = await import("./billing.server");
    return startTrial(context.userId);
  });

export const activateBillingPlan = createServerFn({ method: "POST" })
  .validator(parseActivate)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { activateTestPlan } = await import("./billing.server");
    return activateTestPlan(context.userId, data.plan, data.lang);
  });

export const cancelBillingPlan = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { cancelTestPlan } = await import("./billing.server");
    return cancelTestPlan(context.userId);
  });

export const saveBillingProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseProfile(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { saveProfile } = await import("./billing.server");
    return saveProfile(context.userId, data);
  });
