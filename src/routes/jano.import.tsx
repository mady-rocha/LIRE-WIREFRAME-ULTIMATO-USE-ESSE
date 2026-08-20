import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { saveDocument } from "@/lib/documents";

type FileType = "pdf" | "txt";

export const Route = createFileRoute("/jano/import")({
  validateSearch: (search: Record<string, unknown>): { type: FileType } => ({
    type: search.type === "txt" ? "txt" : "pdf",
  }),
  head: () => ({ meta: [{ title: "Importar arquivo — Módulo Jano | Lire" }] }),
  component: ImportFile,
});

async function readPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const text = await page.getTextContent();
    pages.push(
      text.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" "),
    );
  }

  return pages.filter(Boolean).join("\n\n");
}

function ImportFile() {
  const { type } = Route.useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const extension = type === "pdf" ? ".pdf" : ".txt";

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    const isExpectedType = type === "pdf" ? file.name.toLowerCase().endsWith(".pdf") : file.name.toLowerCase().endsWith(".txt");
    if (!isExpectedType) {
      setError(`Selecione um arquivo ${extension} para continuar.`);
      return;
    }

    setError(null);
    setReading(true);

    try {
      const isPdf = type === "pdf";
      const content = isPdf ? await readPdf(file) : await file.text();
      if (!content.trim()) throw new Error("O arquivo não contém texto legível.");

      const savedDocument = await saveDocument({ name: file.name, type, content });
      sessionStorage.setItem("lire.pending-document", JSON.stringify({ id: savedDocument.id }));
      navigate({ to: "/jano/reader" });
    } catch (cause) {
      console.error("Erro ao importar arquivo:", cause);
      setError("Não foi possível ler este arquivo. Escolha outro arquivo e tente novamente.");
    } finally {
      setReading(false);
    }
  };

  return (
    <AppShell title="Importar arquivo">
      <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-accent">
            {type === "pdf" ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">
            Importar arquivo {type.toUpperCase()}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione um arquivo {extension} do seu computador para abrir no leitor Lire.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={type === "pdf" ? ".pdf,application/pdf" : ".txt,text/plain"}
            className="sr-only"
            onChange={(event) => {
              void selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button type="button" className="mt-7 h-11 w-full text-base" onClick={() => inputRef.current?.click()} disabled={reading}>
            <Upload className="h-4 w-4" />
            {reading ? "Lendo arquivo..." : "Selecionar arquivo"}
          </Button>
          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
        </section>
      </div>
    </AppShell>
  );
}