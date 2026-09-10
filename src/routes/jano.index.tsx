import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, FileType, ScanText, Lightbulb, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";
import { listDocuments, type SavedDocument } from "@/lib/documents";

export const Route = createFileRoute("/jano/")({
  head: () => ({ meta: [{ title: "Início — Módulo Jano | Lire" }] }),
  component: JanoHome,
});

function JanoHome() {
  const { isPremium, showUpgrade, userName } = useApp();
  const navigate = useNavigate();
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

  useEffect(() => {
    void listDocuments().then(setSavedDocuments).catch(() => setSavedDocuments([]));
  }, []);

  const recentDocuments = savedDocuments;

  return (
    <AppShell title="Início">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="font-display text-3xl font-bold">Olá, {userName} 👋</h2>
        <p className="mt-1 text-muted-foreground">O que você quer ler hoje?</p>

        {/* Quick actions */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <ActionCard icon={FileText} label="Importar PDF" onClick={() => navigate({ to: "/jano/import", search: { type: "pdf" } })} />
          <ActionCard icon={FileType} label="Importar TXT" onClick={() => navigate({ to: "/jano/import", search: { type: "txt" } })} />
          <ActionCard
            icon={ScanText}
            label="Capturar imagem (OCR)"
            premium
            locked={!isPremium}
            onClick={() => navigate({ to: "/jano/ocr" })}
          />
        </section>

        {/* Continue reading */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Continue onde parou</h3>
            <Button asChild variant="link" className="text-accent">
              <Link to="/jano/files">Ver todos</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentDocuments.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Nenhum documento salvo ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">Importe um PDF ou TXT para ver itens aqui.</p>
              </div>
            ) : (
              recentDocuments.map((document) => {
                const name = document.name;
                const progress = document.progress ?? 0;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem("lire.pending-document", JSON.stringify({ id: document.id }));
                      navigate({ to: "/jano/reader" });
                    }}
                    className="flex min-h-[76px] w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}% lido</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Tip of the day */}
        <section className="mt-10 flex items-start gap-4 rounded-xl border border-secondary/30 bg-secondary/5 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Dica do dia</p>
            <p className="text-sm text-muted-foreground">
              Faça pausas a cada 20 minutos e olhe para um ponto distante por 20 segundos para
              reduzir a fadiga visual.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ActionCard({
  icon: Icon,
  label,
  premium,
  locked,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  premium?: boolean;
  locked?: boolean;
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
