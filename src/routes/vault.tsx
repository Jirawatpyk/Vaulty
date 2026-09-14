import { createFileRoute } from "@tanstack/react-router";
import { VaultLayout } from "@/components/vault/app-shell";

export const Route = createFileRoute("/vault")({
  component: VaultLayout,
});
