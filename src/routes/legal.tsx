import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/vault/legal-chrome";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});
