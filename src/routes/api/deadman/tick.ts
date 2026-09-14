import { createFileRoute } from "@tanstack/react-router";
import { bearerMatches, cronSecretAccepted } from "@/lib/vault/deadman";
import { clientIp, tickGuard } from "@/lib/vault/tick-guard";

function json(status: number, body: Record<string, unknown>, extra?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...(extra ?? {}) },
  });
}

export const Route = createFileRoute("/api/deadman/tick")({
  server: {
    handlers: {
      GET: () => json(405, { error: "method" }, { allow: "POST" }),
      POST: async ({ request }) => {
        const { env, isWorkspacePreview } = await import("@/lib/env.server");
        const secret = env("CRON_SECRET");
        const preview = isWorkspacePreview();
        if (!cronSecretAccepted(secret, preview)) {
          return json(401, { error: "secret" });
        }
        const authorized = bearerMatches(request.headers.get("authorization"), secret);
        const gate = tickGuard.decide({ ip: clientIp(request), authorized });
        if (!gate.ok) {
          const headers: HeadersInit = { "cache-control": "no-store" };
          if (gate.retryAfterSec > 0) headers["retry-after"] = String(gate.retryAfterSec);
          return json(gate.status, { error: gate.error }, headers);
        }
        const { fireDueSwitches } = await import("@/lib/vault/deadman.server");
        const result = await fireDueSwitches();
        return json(200, result);
      },
    },
  },
});
