import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LegalArticle } from "@/components/vault/legal-chrome";
import { LEGAL_UPDATED_ISO, LEGAL_VERSION } from "@/lib/vault/legal";
import { useT } from "@/lib/vault/store";

export const Route = createFileRoute("/legal/")({ component: LegalIndex });

function LegalIndex() {
  const t = useT();
  return (
    <LegalArticle title={t("legalIndexTitle")} updated={LEGAL_UPDATED_ISO}>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("legalIndexLead")}</p>
      <p className="text-sm leading-relaxed">{t("pdpaBody")}</p>
      <p className="text-sm text-muted-foreground">
        {t("legalVersion")} {LEGAL_VERSION}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-auto min-h-11 whitespace-normal py-2">
          <Link to="/legal/terms">{t("termsLink")}</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal py-2">
          <Link to="/legal/privacy">{t("privacyLink")}</Link>
        </Button>
      </div>
    </LegalArticle>
  );
}
