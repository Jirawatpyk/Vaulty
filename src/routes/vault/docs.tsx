import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/vault/chrome";
import { DocumentDialog } from "@/components/vault/editors";
import { ConfirmDialog } from "@/components/vault/confirm-dialog";
import { SecretField } from "@/components/vault/secret-field";
import { downloadDocFile } from "@/lib/vault/files";
import { documentLabel } from "@/lib/vault/i18n";
import { useT, useVaultStore } from "@/lib/vault/store";
import type { DocumentItem } from "@/lib/vault/types";
import { custodyStatus, vaultCustody } from "@/lib/vault/will-custody";

export const Route = createFileRoute("/vault/docs")({ component: DocsPage });

function DocsPage() {
  const t = useT();
  const lang = useVaultStore((s) => s.lang);
  const vault = useVaultStore((s) => s.vault)!;
  const patch = useVaultStore((s) => s.patch);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [pending, setPending] = useState<DocumentItem | null>(null);
  const custody = vaultCustody(vault);
  const status = custodyStatus(custody);

  return (
    <div>
      <PageHeader
        title={t("documents")}
        description={`${vault.documents.length} ${t("itemCount")}`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            {t("addDocument")}
          </Button>
        }
      />

      {status !== "offsite" ? (
        <div className="mb-4 rounded-xl bg-card p-4 hairline">
          <p className="text-sm text-warn">{t(status === "home" ? "willCustodyHomeWarn" : "willCustodyMissing")}</p>
          <Link to="/vault/access" className="mt-2 inline-block text-sm underline-offset-2 hover:underline">
            {t("willCustodyGo")}
          </Link>
        </div>
      ) : null}

      {vault.documents.length === 0 ? (
        <EmptyState
          title={t("emptyDocs")}
          hint={t("taskDoc")}
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("addDocument")}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {vault.documents.map((doc) => (
            <li key={doc.id} className="rounded-xl bg-card p-5 hairline">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <ScrollText className="size-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{doc.title}</p>
                    <Badge>{documentLabel[lang][doc.kind]}</Badge>
                  </div>
                  {doc.notes ? <p className="mt-2 text-sm text-muted-foreground">{doc.notes}</p> : null}
                  {doc.secret ? (
                    <div className="mt-3 rounded-md bg-secondary p-3">
                      <SecretField value={doc.secret} />
                    </div>
                  ) : null}
                  {doc.fileName && doc.fileData ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() =>
                        downloadDocFile({
                          fileName: doc.fileName!,
                          fileMime: doc.fileMime || "application/octet-stream",
                          fileData: doc.fileData!,
                        })
                      }
                    >
                      {t("downloadFile")} · {doc.fileName}
                    </Button>
                  ) : null}
                  <div className="mt-4 flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(doc);
                        setOpen(true);
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPending(doc)}>
                      <Trash2 />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DocumentDialog open={open} onOpenChange={setOpen} initial={editing} />
      <ConfirmDialog
        open={Boolean(pending)}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          patch(
            (v) => ({ ...v, documents: v.documents.filter((d) => d.id !== pending.id) }),
            lang === "th" ? `ลบเอกสาร: ${pending.title}` : `Deleted document: ${pending.title}`,
          );
          toast(t("deleted"));
          setPending(null);
        }}
      />
    </div>
  );
}
