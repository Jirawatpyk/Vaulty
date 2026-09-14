import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/vault/chrome";
import { LawyerBrief } from "@/components/vault/lawyer-brief";
import { downloadText } from "@/lib/vault/download";
import { allFamilyPacksHtml } from "@/lib/vault/family-pack";
import { attestationHtml, checkInIcs, keyCardHtml } from "@/lib/vault/handoff";
import { evaluateHealth } from "@/lib/vault/health";
import { isEncryptedBlob } from "@/lib/vault/crypto";
import { lawyerBriefFileName, lawyerBriefHtml } from "@/lib/vault/lawyer-brief";
import { executorPortalHtml } from "@/lib/vault/portal";
import { useT, useVaultStore } from "@/lib/vault/store";

export function HandoffPanel() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const exportBlob = useVaultStore((s) => s.exportBlob);
  const flush = useVaultStore((s) => s.flush);
  const [briefOpen, setBriefOpen] = useState(false);

  async function buildPortal(): Promise<string | null> {
    await flush();
    const raw = await exportBlob();
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isEncryptedBlob(parsed)) return null;
    return executorPortalHtml(parsed, vault.profile.fullName, lang);
  }

  async function savePortal() {
    const html = await buildPortal();
    if (!html) return;
    downloadText("vaulty-executor-kit.html", html, "text/html;charset=utf-8");
    toast(t("kitSaved"));
  }

  async function openPortal() {
    const html = await buildPortal();
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }

  function savePacks() {
    downloadText("vaulty-family-packs.html", allFamilyPacksHtml(vault, lang), "text/html;charset=utf-8");
    toast(t("familyPackSaved"));
  }

  function saveCard() {
    downloadText("vaulty-key-card.html", keyCardHtml(vault, lang), "text/html;charset=utf-8");
    toast(t("keyCardSaved"));
  }

  function saveIcs() {
    downloadText("vaulty-checkin.ics", checkInIcs(vault, lang), "text/calendar;charset=utf-8");
    toast(t("calendarSaved"));
  }

  function saveAttestation() {
    const blobRaw = typeof window === "undefined" ? null : window.localStorage.getItem("vaulty.v1");
    const health = evaluateHealth({
      blobRaw,
      lockoutUntil: 0,
      failedAttempts: 0,
      lastUnlock: null,
    });
    downloadText("vaulty-attestation.html", attestationHtml(health, lang), "text/html;charset=utf-8");
    toast(t("attestationSaved"));
  }

  function saveLawyer() {
    downloadText(lawyerBriefFileName(lang), lawyerBriefHtml(vault, lang), "text/html;charset=utf-8");
    toast(t("lawyerBriefSaved"));
  }

  return (
    <Panel id="family-pack">
      <h2 className="font-display text-xl">{t("handoffTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("handoffLead")}</p>

      <div className="mt-6 grid gap-6">
        <section>
          <h3 className="font-display text-base">{t("handoffLawyerGroup")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("lawyerBriefLead")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button className="h-auto min-h-11 whitespace-normal py-2" onClick={saveLawyer}>
              {t("downloadLawyerBrief")}
            </Button>
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={() => setBriefOpen(true)}>
              {t("previewLawyerBrief")}
            </Button>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h3 className="font-display text-base">{t("handoffExecutorGroup")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("portalLead")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={() => void savePortal()}>
              {t("downloadExecutorKit")}
            </Button>
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={() => void openPortal()}>
              {t("openExecutorKit")}
            </Button>
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2 sm:col-span-2" onClick={saveCard}>
              {t("downloadKeyCard")}
            </Button>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h3 className="font-display text-base">{t("handoffFamilyGroup")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("packetSecretsOmitted")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={savePacks}>
              {t("downloadAllPacks")}
            </Button>
            <Button variant="outline" className="h-auto min-h-11 whitespace-normal py-2" onClick={saveIcs}>
              {t("downloadCheckIn")}
            </Button>
            <Button variant="ghost" className="h-auto min-h-11 whitespace-normal py-2 sm:col-span-2" onClick={saveAttestation}>
              {t("downloadAttestation")}
            </Button>
          </div>
        </section>
      </div>
      {briefOpen ? <LawyerBrief onClose={() => setBriefOpen(false)} /> : null}
    </Panel>
  );
}
