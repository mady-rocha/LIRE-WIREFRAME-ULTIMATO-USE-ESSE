import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listDocuments, type SavedDocument } from "@/lib/documents";

export const Route = createFileRoute("/jano/articles")({
  head: () => ({ meta: [{ title: "Meus artigos — Módulo Jano | Lire" }] }),
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

  return (
    <AppShell title="Meus artigos">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div>
          <h2 className="text-left font-display text-3xl font-bold">Meus artigos</h2>
          <p className="mt-1 text-left text-muted-foreground">Seus arquivos ficam salvos neste dispositivo.</p>
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
              <button
                key={article.id}
                type="button"
                onClick={() => openDocument(article)}
                className="group flex w-full items-center gap-4 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{article.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Arquivo {article.type.toUpperCase()} · {formatUpdated(article.updatedAt)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function formatUpdated(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}