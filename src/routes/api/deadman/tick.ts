import { createFileRoute } from "@tanstack/react-router";
import { bearerMatches } from "@/lib/vault/deadman";

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export const Route = createFileRoute("/api/deadman/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { env } = await import("@/lib/env.server");
        if (!bearerMatches(request.headers.get("authorization"), env("CRON_SECRET"))) {
          return unauthorized();
        }
        const { fireDueSwitches } = await import("@/lib/vault/deadman.server");
        const result = await fireDueSwitches();
        return Response.json(result);
      },
    },
  },
});
