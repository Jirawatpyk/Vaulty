import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/deadman/tick")({
  server: {
    handlers: {
      GET: async () => {
        const { fireDueSwitches } = await import("@/lib/vault/deadman.server");
        const result = await fireDueSwitches();
        return Response.json(result);
      },
      POST: async () => {
        const { fireDueSwitches } = await import("@/lib/vault/deadman.server");
        const result = await fireDueSwitches();
        return Response.json(result);
      },
    },
  },
});
