import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileText, FileType, ScanText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PremiumBadge } from "@/components/PremiumBadge";
import { deleteDocument, listDocuments, type SavedDocument } from "@/lib/documents";

export const Route = createFileRoute("/jano/files")({
  head: () => ({ meta: [{ title: "Meus arquivos — Módulo Jano | Lire" }] }),
  component: JanoArticles,
});

function JanoArticles() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, []);

  const openDocument = (document: SavedDocument) => {
    sessionStorage.setItem("lire.pending-document", JSON.stringify({ id: document.id }));
    navigate({ to: "/jano/reader" });
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>, document: SavedDocument) => {
    event.stopPropagation();
    await deleteDocument(document.id);
    setDocuments((current) => current.filter((item) => item.id !== document.id));
  };

  return (
    <AppShell title="Meus arquivos">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div>
          <h2 className="text-left font-display text-3xl font-bold">Meus arquivos</h2>
          <p className="mt-1 text-left text-muted-foreground">Seus arquivos ficam salvos no banco e no navegador para leitura contínua.</p>
        </div>

        <div className="mt-8 space-y-3">
          {loading && <p className="py-10 text-center text-sm text-muted-foreground">Carregando arquivos...</p>}
          {!loading && documents.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhum arquivo salvo ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">Importe um PDF ou TXT para encontrá-lo aqui.</p>
            </div>
          )}
          {documents.map((article) => {
            return (
              <div
                key={article.id}
                className="group flex w-full items-center gap-4 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50"
              >
                <button
                  type="button"
                  onClick={() => openDocument(article)}
                  className="flex w-full min-w-0 items-center gap-4 text-left"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{article.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Arquivo {article.type.toUpperCase()} · {formatUpdated(article.updatedAt)}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Progresso: {Math.max(0, Math.min(100, article.progress ?? 0))}%
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={(event) => void handleDelete(event, article)}
                  aria-label={`Deletar ${article.name}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/40 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ImportActionCard icon={FileText} label="Importar PDF" onClick={() => navigate({ to: "/jano/import", search: { type: "pdf" } })} />
            <ImportActionCard icon={FileType} label="Importar TXT" onClick={() => navigate({ to: "/jano/import", search: { type: "txt" } })} />
            <ImportActionCard icon={ScanText} label="Capturar imagem (OCR)" premium onClick={() => navigate({ to: "/jano/ocr" })} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ImportActionCard({
  icon: Icon,
  label,
  premium,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  premium?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50"
    >
      {premium && <PremiumBadge className="absolute right-3 top-3" />}
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function formatUpdated(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}