import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileImage, Lock, ScanText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { saveDocument } from "@/lib/documents";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/jano/ocr")({
  head: () => ({ meta: [{ title: "OCR de imagem — Módulo Jano | Lire" }] }),
  component: OcrPage,
});

function OcrPage() {
  const { isPremium, showUpgrade } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectImage = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setReading(true);
    setProgress(0);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("por", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") setProgress(Math.round((message.progress ?? 0) * 100));
        },
      });
      let result;
      try {
        result = await worker.recognize(file);
      } finally {
        await worker.terminate();
      }
      const content = result.data.text.trim();
      if (!content) throw new Error("Nenhum texto foi encontrado na imagem.");

      const savedDocument = await saveDocument({ name: `${file.name} (OCR)`, type: "txt", content });
      sessionStorage.setItem("lire.pending-document", JSON.stringify({ id: savedDocument.id }));
      navigate({ to: "/jano/reader" });
    } catch (cause) {
      console.error("Erro ao executar OCR:", cause);
      setError("Não foi possível reconhecer o texto desta imagem. Tente uma imagem mais nítida.");
    } finally {
      setReading(false);
    }
  };

  return (
    <AppShell title="OCR de imagem">
      <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-accent">
            <FileImage className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">Transformar imagem em texto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPremium ? "Selecione uma imagem para reconhecer o texto e abrir no leitor Lire." : "Este recurso faz parte do plano Premium."}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void selectImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button type="button" className="mt-7 h-11 w-full text-base" onClick={() => isPremium ? inputRef.current?.click() : showUpgrade("OCR de imagem")} disabled={reading}>
            {isPremium ? <Upload className="h-4 w-4" /> : <Lock className="ocr-unlock-icon h-4 w-4" />}
            {reading ? `Reconhecendo texto... ${progress}%` : isPremium ? "Selecionar imagem" : "Desbloquear com Premium"}
          </Button>
          {reading && <ScanText className="mx-auto mt-6 h-7 w-7 animate-pulse text-secondary" aria-label="Reconhecendo texto" />}
          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
        </section>
      </div>
    </AppShell>
  );
}