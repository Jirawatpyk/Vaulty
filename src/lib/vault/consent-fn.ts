import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { grantConsent, isConsentLive, parseConsent, type ConsentRecord } from "./legal.ts";

function parseGrant(input: unknown): ConsentRecord {
  const parsed = parseConsent(input);
  const next = grantConsent(parsed, parsed);
  if (!isConsentLive(next, "account")) throw new Error("consent");
  return next;
}

export const getConsent = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { readConsent } = await import("./consent.server");
    return readConsent(context.userId);
  });

export const putConsent = createServerFn({ method: "POST" })
  .validator(parseGrant)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { saveConsent } = await import("./consent.server");
    return saveConsent(context.userId, data);
  });

export const eraseMyData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { eraseServerPersonalData } = await import("./consent.server");
    return eraseServerPersonalData(context.userId);
  });
