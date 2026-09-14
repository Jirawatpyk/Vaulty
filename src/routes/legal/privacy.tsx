import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle } from "@/components/vault/legal-chrome";
import { legalDoc } from "@/lib/vault/legal";
import { useVaultStore } from "@/lib/vault/store";

export const Route = createFileRoute("/legal/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  const lang = useVaultStore((s) => s.lang);
  const doc = legalDoc("privacy", lang);
  return (
    <LegalArticle title={doc.title} updated={doc.updated}>
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="font-display text-xl">{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-pretty">
              {p}
            </p>
          ))}
        </section>
      ))}
    </LegalArticle>
  );
}
